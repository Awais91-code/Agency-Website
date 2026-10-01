begin;

do $$
begin
  create type public.media_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end
$$;

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  object_path text not null,
  original_name text not null,
  display_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  alt_text text,
  caption text,
  visibility public.media_visibility not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint media_assets_object_unique unique (bucket, object_path),
  constraint media_assets_bucket_visibility check (
    (visibility = 'public' and bucket = 'public-media') or
    (visibility = 'private' and bucket = 'private-files')
  )
);

create table if not exists public.file_references (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  relation_key text not null default 'attachment',
  is_client_visible boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint file_references_entity_type_length check (char_length(entity_type) between 1 and 80),
  constraint file_references_relation_key_length check (char_length(relation_key) between 1 and 80),
  constraint file_references_unique unique (media_asset_id, entity_type, entity_id, relation_key)
);

create table if not exists public.file_access_grants (
  id uuid primary key default gen_random_uuid(),
  media_asset_id uuid not null references public.media_assets(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint file_access_grants_unique unique (media_asset_id, user_id)
);

create index if not exists media_assets_uploaded_by_idx on public.media_assets(uploaded_by);
create index if not exists media_assets_visibility_created_idx on public.media_assets(visibility, created_at desc);
create index if not exists file_references_entity_idx on public.file_references(entity_type, entity_id);
create index if not exists file_access_grants_user_idx on public.file_access_grants(user_id, media_asset_id);

create trigger media_assets_set_updated_at
before update on public.media_assets
for each row execute function public.set_updated_at();

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
          select 1
          from public.file_access_grants grant_row
          where grant_row.media_asset_id = asset.id
            and grant_row.user_id = auth.uid()
        )
      )
  );
$$;

alter table public.media_assets enable row level security;
alter table public.file_references enable row level security;
alter table public.file_access_grants enable row level security;

grant select on table public.media_assets to anon, authenticated;
grant insert, update, delete on table public.media_assets to authenticated;
grant select, insert, update, delete on table public.file_references to authenticated;
grant select on table public.file_access_grants to authenticated;
grant execute on function public.user_can_access_media(uuid) to anon, authenticated;

grant all on table public.media_assets to service_role;
grant all on table public.file_references to service_role;
grant all on table public.file_access_grants to service_role;

drop policy if exists media_assets_public_select_m04 on public.media_assets;
create policy media_assets_public_select_m04
on public.media_assets for select to anon
using (visibility = 'public'::public.media_visibility and archived_at is null);

drop policy if exists media_assets_authenticated_select_m04 on public.media_assets;
create policy media_assets_authenticated_select_m04
on public.media_assets for select to authenticated
using (public.user_can_access_media(id));

drop policy if exists media_assets_staff_mutation_m04 on public.media_assets;
create policy media_assets_staff_mutation_m04
on public.media_assets for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists file_references_select_m04 on public.file_references;
create policy file_references_select_m04
on public.file_references for select to authenticated
using (public.user_can_access_media(media_asset_id));

drop policy if exists file_references_staff_mutation_m04 on public.file_references;
create policy file_references_staff_mutation_m04
on public.file_references for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists file_access_grants_select_m04 on public.file_access_grants;
create policy file_access_grants_select_m04
on public.file_access_grants for select to authenticated
using (user_id = auth.uid() or public.current_user_is_staff());

drop policy if exists file_access_grants_staff_mutation_m04 on public.file_access_grants;
create policy file_access_grants_staff_mutation_m04
on public.file_access_grants for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-files',
  'private-files',
  false,
  20971520,
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists public_media_read_m04 on storage.objects;
create policy public_media_read_m04
on storage.objects for select to anon, authenticated
using (bucket_id = 'public-media');

drop policy if exists private_files_read_m04 on storage.objects;
create policy private_files_read_m04
on storage.objects for select to authenticated
using (
  bucket_id = 'private-files'
  and exists (
    select 1
    from public.media_assets asset
    where asset.bucket = storage.objects.bucket_id
      and asset.object_path = storage.objects.name
      and public.user_can_access_media(asset.id)
  )
);

comment on table public.media_assets is 'Canonical metadata for public CMS media and private authenticated files.';
comment on table public.file_references is 'Links media assets to business entities without embedding storage paths in feature tables.';
comment on table public.file_access_grants is 'Explicit per-user private file access grants; M14 may extend access through project membership.';
comment on function public.user_can_access_media(uuid) is 'Central read authorization for media metadata and private storage objects.';

commit;
