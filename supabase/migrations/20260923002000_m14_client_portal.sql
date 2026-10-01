begin;

do $$ begin
  create type public.project_member_role as enum ('client', 'collaborator');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.milestone_status as enum ('planned','in_progress','waiting_client','approved','completed','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_request_type as enum ('revision','question','change_request','feedback');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.client_request_status as enum ('open','in_review','waiting_client','completed','declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status as enum ('pending','approved','rejected','withdrawn');
exception when duplicate_object then null; end $$;

alter table public.projects
  add column if not exists summary text,
  add column if not exists client_status_label text,
  add column if not exists start_date date,
  add column if not exists target_date date,
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_role public.project_member_role not null default 'client',
  is_active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint project_members_unique unique(project_id, user_id)
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.milestone_status not null default 'planned',
  due_at timestamptz,
  completed_at timestamptz,
  sort_order integer not null default 100,
  client_visible boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_title_length check (char_length(title) between 2 and 220)
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  category text not null default 'deliverable',
  description text not null default '',
  client_visible boolean not null default true,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint project_files_unique unique(project_id, media_asset_id),
  constraint project_files_category_length check (char_length(category) between 2 and 80)
);

create table if not exists public.client_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  request_type public.client_request_type not null default 'feedback',
  title text not null,
  description text not null,
  status public.client_request_status not null default 'open',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  staff_response text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_requests_title_length check (char_length(title) between 2 and 220),
  constraint client_requests_description_length check (char_length(description) between 2 and 10000)
);

create table if not exists public.client_request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.client_requests(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete restrict,
  body text not null,
  is_internal boolean not null default false,
  created_at timestamptz not null default now(),
  constraint client_request_comments_body_length check (char_length(body) between 1 and 8000)
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.approval_status not null default 'pending',
  client_visible boolean not null default true,
  requested_by uuid references auth.users(id) on delete set null,
  decided_by uuid references auth.users(id) on delete set null,
  due_at timestamptz,
  decided_at timestamptz,
  decision_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approvals_title_length check (char_length(title) between 2 and 220)
);

create table if not exists public.project_activities (
  id bigint generated by default as identity primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  event_type text not null,
  summary text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  client_visible boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint project_activities_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create trigger milestones_set_updated_at before update on public.milestones for each row execute function public.set_updated_at();
create trigger client_requests_set_updated_at before update on public.client_requests for each row execute function public.set_updated_at();
create trigger approvals_set_updated_at before update on public.approvals for each row execute function public.set_updated_at();

create index if not exists project_members_user_idx on public.project_members(user_id, is_active, project_id);
create index if not exists milestones_project_idx on public.milestones(project_id, sort_order, due_at);
create index if not exists project_files_project_idx on public.project_files(project_id, created_at desc);
create index if not exists client_requests_project_idx on public.client_requests(project_id, status, created_at desc);
create index if not exists client_request_comments_request_idx on public.client_request_comments(request_id, created_at);
create index if not exists approvals_project_idx on public.approvals(project_id, status, created_at desc);
create index if not exists project_activities_project_idx on public.project_activities(project_id, created_at desc);

create or replace function public.user_is_project_member(project_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = project_uuid
      and pm.user_id = auth.uid()
      and pm.is_active = true
  );
$$;

grant execute on function public.user_is_project_member(uuid) to authenticated;

-- Extend M04's centralized media authorization with project membership.
create or replace function public.user_can_access_media(asset_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.media_assets asset
    where asset.id = asset_id
      and asset.archived_at is null
      and (
        asset.visibility = 'public'::public.media_visibility
        or asset.uploaded_by = auth.uid()
        or public.current_user_is_staff()
        or exists (
          select 1 from public.file_access_grants grant_row
          where grant_row.media_asset_id = asset.id
            and grant_row.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.project_files pf
          join public.project_members pm on pm.project_id = pf.project_id
          where pf.media_asset_id = asset.id
            and pf.client_visible = true
            and pm.user_id = auth.uid()
            and pm.is_active = true
        )
      )
  );
$$;

grant execute on function public.user_can_access_media(uuid) to anon, authenticated;

alter table public.project_members enable row level security;
alter table public.milestones enable row level security;
alter table public.project_files enable row level security;
alter table public.client_requests enable row level security;
alter table public.client_request_comments enable row level security;
alter table public.approvals enable row level security;
alter table public.project_activities enable row level security;

grant select on public.project_members, public.milestones, public.project_files, public.client_requests, public.client_request_comments, public.approvals, public.project_activities to authenticated;
grant insert on public.client_requests, public.client_request_comments to authenticated;
grant all on public.project_members, public.milestones, public.project_files, public.client_requests, public.client_request_comments, public.approvals, public.project_activities to service_role;
grant usage, select on sequence public.project_activities_id_seq to service_role;

-- Projects were staff-only in M03. M14 adds read-only membership access for clients.
drop policy if exists projects_client_select_m14 on public.projects;
create policy projects_client_select_m14 on public.projects
for select to authenticated
using (archived_at is null and public.user_is_project_member(id));

create policy project_members_select_m14 on public.project_members
for select to authenticated
using (user_id = auth.uid() or public.current_user_is_staff());

create policy milestones_select_m14 on public.milestones
for select to authenticated
using (public.current_user_is_staff() or (client_visible = true and public.user_is_project_member(project_id)));

create policy project_files_select_m14 on public.project_files
for select to authenticated
using (public.current_user_is_staff() or (client_visible = true and public.user_is_project_member(project_id)));

create policy client_requests_select_m14 on public.client_requests
for select to authenticated
using (public.current_user_is_staff() or public.user_is_project_member(project_id));

create policy client_requests_insert_m14 on public.client_requests
for insert to authenticated
with check (created_by = auth.uid() and public.user_is_project_member(project_id));

create policy client_request_comments_select_m14 on public.client_request_comments
for select to authenticated
using (
  public.current_user_is_staff()
  or (
    is_internal = false
    and exists (
      select 1 from public.client_requests cr
      where cr.id = request_id
        and public.user_is_project_member(cr.project_id)
    )
  )
);

create policy client_request_comments_insert_m14 on public.client_request_comments
for insert to authenticated
with check (
  author_user_id = auth.uid()
  and (
    public.current_user_is_staff()
    or (
      is_internal = false
      and exists (
        select 1 from public.client_requests cr
        where cr.id = request_id
          and public.user_is_project_member(cr.project_id)
      )
    )
  )
);

create policy approvals_select_m14 on public.approvals
for select to authenticated
using (public.current_user_is_staff() or (client_visible = true and public.user_is_project_member(project_id)));

create policy project_activities_select_m14 on public.project_activities
for select to authenticated
using (public.current_user_is_staff() or (client_visible = true and public.user_is_project_member(project_id)));

-- Existing meetings are related to leads. Members may see meetings for a lead attached to their project.
drop policy if exists meetings_client_select_m14 on public.meetings;
create policy meetings_client_select_m14 on public.meetings
for select to authenticated
using (
  lead_id is not null
  and exists (
    select 1
    from public.projects p
    where p.lead_id = meetings.lead_id
      and p.archived_at is null
      and public.user_is_project_member(p.id)
  )
);

comment on function public.user_is_project_member(uuid) is 'Central project membership check used by portal RLS and secure file access.';
comment on table public.project_members is 'Explicit client/project membership; clients never receive broad project-table access.';
comment on table public.project_files is 'Private/public media assets linked to a project; client visibility is explicit.';
comment on table public.project_activities is 'Traceable client/staff project timeline. Client visibility is explicit per event.';

commit;
