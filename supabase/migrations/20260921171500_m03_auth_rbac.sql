begin;

do $$
begin
  create type public.app_role as enum ('super_admin', 'admin', 'staff', 'client');
exception when duplicate_object then null;
end
$$;

do $$
begin
  create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');
exception when duplicate_object then null;
end
$$;

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'client',
  assigned_by uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now()
);

create table if not exists public.user_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  normalized_email text generated always as (lower(btrim(email))) stored,
  role public.app_role not null,
  invited_by uuid references auth.users(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  status public.invitation_status not null default 'pending',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_invitations_email_length check (char_length(email) between 3 and 320),
  constraint user_invitations_normalized_email_unique unique (normalized_email)
);

create trigger user_invitations_set_updated_at
before update on public.user_invitations
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select ur.role from public.user_roles ur where ur.user_id = auth.uid()),
    'client'::public.app_role
  );
$$;

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() in ('super_admin'::public.app_role, 'admin'::public.app_role, 'staff'::public.app_role);
$$;

create or replace function public.current_user_can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_app_role() in ('super_admin'::public.app_role, 'admin'::public.app_role);
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''), '')
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client'::public.app_role)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_m03 on auth.users;
create trigger on_auth_user_created_m03
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, display_name)
select
  u.id,
  nullif(coalesce(u.raw_user_meta_data ->> 'display_name', u.raw_user_meta_data ->> 'full_name', ''), '')
from auth.users u
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select u.id, 'client'::public.app_role
from auth.users u
on conflict (user_id) do nothing;

alter table public.user_roles enable row level security;
alter table public.user_invitations enable row level security;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, timezone, locale) on table public.profiles to authenticated;
grant select on table public.user_roles to authenticated;
grant select on table public.user_invitations to authenticated;
grant select, insert, update, delete on table public.leads to authenticated;
grant select, insert, update, delete on table public.projects to authenticated;
grant select, insert, update, delete on table public.content_records to authenticated;
grant select on table public.activity_events to authenticated;

grant all on table public.user_roles to service_role;
grant all on table public.user_invitations to service_role;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.current_user_is_staff() to authenticated;
grant execute on function public.current_user_can_manage_users() to authenticated;

drop policy if exists profiles_select_m03 on public.profiles;
create policy profiles_select_m03
on public.profiles for select to authenticated
using (id = auth.uid() or public.current_user_is_staff());

drop policy if exists profiles_update_self_m03 on public.profiles;
create policy profiles_update_self_m03
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists user_roles_select_m03 on public.user_roles;
create policy user_roles_select_m03
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.current_user_is_staff());

drop policy if exists user_invitations_select_m03 on public.user_invitations;
create policy user_invitations_select_m03
on public.user_invitations for select to authenticated
using (public.current_user_can_manage_users());

drop policy if exists leads_staff_all_m03 on public.leads;
create policy leads_staff_all_m03
on public.leads for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists projects_staff_all_m03 on public.projects;
create policy projects_staff_all_m03
on public.projects for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists content_records_staff_all_m03 on public.content_records;
create policy content_records_staff_all_m03
on public.content_records for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists activity_events_staff_select_m03 on public.activity_events;
create policy activity_events_staff_select_m03
on public.activity_events for select to authenticated
using (public.current_user_is_staff());

comment on table public.user_roles is 'Single application role per auth user. Mutations are server/admin controlled.';
comment on table public.user_invitations is 'Traceable application invitation metadata; Auth remains managed by Supabase.';
comment on function public.current_app_role() is 'Returns the signed-in application role; defaults to client for authenticated users without a role row.';

commit;
