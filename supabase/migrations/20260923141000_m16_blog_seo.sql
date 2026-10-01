begin;

create table if not exists public.blog_authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  bio text not null default '',
  job_title text,
  avatar_media_id uuid references public.media_assets(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_authors_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_authors_name_length check (char_length(display_name) between 2 and 160),
  constraint blog_authors_bio_length check (char_length(bio) <= 5000)
);

create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  seo_title text,
  seo_description text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_categories_name_length check (char_length(name) between 2 and 120),
  constraint blog_categories_description_length check (char_length(description) <= 2000)
);

create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_tags_name_length check (char_length(name) between 2 and 120),
  constraint blog_tags_description_length check (char_length(description) <= 2000)
);

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body_markdown text not null,
  author_id uuid references public.blog_authors(id) on delete set null,
  category_id uuid references public.blog_categories(id) on delete set null,
  cover_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_title text,
  og_description text,
  social_image_media_id uuid references public.media_assets(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint blog_posts_title_length check (char_length(title) between 4 and 220),
  constraint blog_posts_excerpt_length check (char_length(excerpt) between 30 and 500),
  constraint blog_posts_body_length check (char_length(body_markdown) between 50 and 120000),
  constraint blog_posts_publish_state check (status <> 'published' or published_at is not null),
  constraint blog_posts_seo_title_length check (seo_title is null or char_length(seo_title) <= 80),
  constraint blog_posts_seo_description_length check (seo_description is null or char_length(seo_description) <= 220),
  constraint blog_posts_og_title_length check (og_title is null or char_length(og_title) <= 120),
  constraint blog_posts_og_description_length check (og_description is null or char_length(og_description) <= 300)
);

create table if not exists public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.blog_tags(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (post_id, tag_id)
);

create table if not exists public.blog_post_services (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (post_id, service_id)
);

create table if not exists public.blog_post_case_studies (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  primary key (post_id, case_study_id)
);

create table if not exists public.seo_redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  status_code integer not null default 308,
  is_active boolean not null default true,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seo_redirects_status_code check (status_code in (307, 308)),
  constraint seo_redirects_source_path check (
    source_path ~ '^/[^[:space:]]*$' and source_path !~ '^//'
  ),
  constraint seo_redirects_destination_path check (
    destination_path ~ '^/[^[:space:]]*$' and destination_path !~ '^//'
  ),
  constraint seo_redirects_not_self check (source_path <> destination_path)
);

create trigger blog_authors_set_updated_at before update on public.blog_authors
for each row execute function public.set_updated_at();
create trigger blog_categories_set_updated_at before update on public.blog_categories
for each row execute function public.set_updated_at();
create trigger blog_tags_set_updated_at before update on public.blog_tags
for each row execute function public.set_updated_at();
create trigger blog_posts_set_updated_at before update on public.blog_posts
for each row execute function public.set_updated_at();
create trigger seo_redirects_set_updated_at before update on public.seo_redirects
for each row execute function public.set_updated_at();

create or replace function public.capture_blog_post_url_change_m16()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_path text;
  v_new_path text;
begin
  if old.slug is distinct from new.slug then
    v_old_path := '/blog/' || old.slug;
    v_new_path := '/blog/' || new.slug;

    if exists (
      select 1
      from public.seo_redirects
      where source_path = v_new_path
        and destination_path = v_old_path
        and is_active = true
    ) then
      raise exception 'Blog slug change would create a redirect loop.';
    end if;

    insert into public.seo_redirects(
      source_path,
      destination_path,
      status_code,
      is_active,
      reason,
      created_by,
      updated_by
    )
    values (
      v_old_path,
      v_new_path,
      308,
      true,
      'Automatic redirect created after blog slug change.',
      new.updated_by,
      new.updated_by
    )
    on conflict (source_path) do update set
      destination_path = excluded.destination_path,
      status_code = 308,
      is_active = true,
      reason = excluded.reason,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  if old.status is distinct from new.status
     and new.status = 'archived'::public.content_status then
    insert into public.seo_redirects(
      source_path,
      destination_path,
      status_code,
      is_active,
      reason,
      created_by,
      updated_by
    )
    values (
      '/blog/' || new.slug,
      '/blog',
      308,
      true,
      'Automatic fallback redirect created when blog post was archived.',
      new.updated_by,
      new.updated_by
    )
    on conflict (source_path) do update set
      destination_path = '/blog',
      status_code = 308,
      is_active = true,
      reason = excluded.reason,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  return new;
end;
$$;

create trigger blog_posts_capture_url_change_m16
after update of slug, status on public.blog_posts
for each row execute function public.capture_blog_post_url_change_m16();

create or replace function public.capture_blog_category_slug_change_m16()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_path text;
  v_new_path text;
begin
  if old.slug is distinct from new.slug then
    v_old_path := '/blog/category/' || old.slug;
    v_new_path := '/blog/category/' || new.slug;

    if exists (
      select 1 from public.seo_redirects
      where source_path = v_new_path
        and destination_path = v_old_path
        and is_active = true
    ) then
      raise exception 'Blog category slug change would create a redirect loop.';
    end if;

    insert into public.seo_redirects(
      source_path,destination_path,status_code,is_active,reason,created_by,updated_by
    )
    values (
      v_old_path,v_new_path,308,true,
      'Automatic redirect created after blog category slug change.',
      new.updated_by,new.updated_by
    )
    on conflict (source_path) do update set
      destination_path = excluded.destination_path,
      status_code = 308,
      is_active = true,
      reason = excluded.reason,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  return new;
end;
$$;

create trigger blog_categories_capture_slug_change_m16
after update of slug on public.blog_categories
for each row execute function public.capture_blog_category_slug_change_m16();

create or replace function public.capture_blog_tag_slug_change_m16()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_path text;
  v_new_path text;
begin
  if old.slug is distinct from new.slug then
    v_old_path := '/blog/tag/' || old.slug;
    v_new_path := '/blog/tag/' || new.slug;

    if exists (
      select 1 from public.seo_redirects
      where source_path = v_new_path
        and destination_path = v_old_path
        and is_active = true
    ) then
      raise exception 'Blog tag slug change would create a redirect loop.';
    end if;

    insert into public.seo_redirects(
      source_path,destination_path,status_code,is_active,reason,created_by,updated_by
    )
    values (
      v_old_path,v_new_path,308,true,
      'Automatic redirect created after blog tag slug change.',
      new.updated_by,new.updated_by
    )
    on conflict (source_path) do update set
      destination_path = excluded.destination_path,
      status_code = 308,
      is_active = true,
      reason = excluded.reason,
      updated_by = excluded.updated_by,
      updated_at = now();
  end if;

  return new;
end;
$$;

create trigger blog_tags_capture_slug_change_m16
after update of slug on public.blog_tags
for each row execute function public.capture_blog_tag_slug_change_m16();

create index if not exists blog_posts_public_idx
  on public.blog_posts(status, published_at desc, is_featured desc)
  where archived_at is null;
create index if not exists blog_posts_category_idx
  on public.blog_posts(category_id, published_at desc)
  where archived_at is null;
create index if not exists blog_posts_author_idx
  on public.blog_posts(author_id, published_at desc)
  where archived_at is null;
create index if not exists blog_post_tags_tag_idx on public.blog_post_tags(tag_id, post_id);
create index if not exists blog_post_services_service_idx on public.blog_post_services(service_id, post_id);
create index if not exists blog_post_case_studies_case_idx on public.blog_post_case_studies(case_study_id, post_id);
create index if not exists seo_redirects_active_idx on public.seo_redirects(source_path) where is_active = true;

alter table public.blog_authors enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_posts enable row level security;
alter table public.blog_post_tags enable row level security;
alter table public.blog_post_services enable row level security;
alter table public.blog_post_case_studies enable row level security;
alter table public.seo_redirects enable row level security;

grant select on public.blog_authors, public.blog_categories, public.blog_tags,
  public.blog_posts, public.blog_post_tags, public.blog_post_services,
  public.blog_post_case_studies to anon, authenticated;
grant select on public.seo_redirects to authenticated;

grant insert, update, delete on public.blog_authors, public.blog_categories,
  public.blog_tags, public.blog_posts, public.blog_post_tags,
  public.blog_post_services, public.blog_post_case_studies,
  public.seo_redirects to authenticated;

grant all on public.blog_authors, public.blog_categories, public.blog_tags,
  public.blog_posts, public.blog_post_tags, public.blog_post_services,
  public.blog_post_case_studies, public.seo_redirects to service_role;

create policy blog_authors_public_read_m16 on public.blog_authors
for select to anon, authenticated
using (is_active = true or public.current_user_is_staff());
create policy blog_authors_staff_manage_m16 on public.blog_authors
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_categories_public_read_m16 on public.blog_categories
for select to anon, authenticated
using (is_active = true or public.current_user_is_staff());
create policy blog_categories_staff_manage_m16 on public.blog_categories
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_tags_public_read_m16 on public.blog_tags
for select to anon, authenticated
using (is_active = true or public.current_user_is_staff());
create policy blog_tags_staff_manage_m16 on public.blog_tags
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_posts_public_read_m16 on public.blog_posts
for select to anon, authenticated
using (
  (
    status = 'published'::public.content_status
    and archived_at is null
    and published_at is not null
    and published_at <= now()
  )
  or public.current_user_is_staff()
);
create policy blog_posts_staff_manage_m16 on public.blog_posts
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_post_tags_public_read_m16 on public.blog_post_tags
for select to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts p
    where p.id = post_id
      and p.status = 'published'::public.content_status
      and p.archived_at is null
      and p.published_at is not null
      and p.published_at <= now()
  )
  or public.current_user_is_staff()
);
create policy blog_post_tags_staff_manage_m16 on public.blog_post_tags
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_post_services_public_read_m16 on public.blog_post_services
for select to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts p
    where p.id = post_id
      and p.status = 'published'::public.content_status
      and p.archived_at is null
      and p.published_at is not null
      and p.published_at <= now()
  )
  or public.current_user_is_staff()
);
create policy blog_post_services_staff_manage_m16 on public.blog_post_services
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy blog_post_case_studies_public_read_m16 on public.blog_post_case_studies
for select to anon, authenticated
using (
  exists (
    select 1 from public.blog_posts p
    where p.id = post_id
      and p.status = 'published'::public.content_status
      and p.archived_at is null
      and p.published_at is not null
      and p.published_at <= now()
  )
  or public.current_user_is_staff()
);
create policy blog_post_case_studies_staff_manage_m16 on public.blog_post_case_studies
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create policy seo_redirects_staff_read_m16 on public.seo_redirects
for select to authenticated using (public.current_user_is_staff());
create policy seo_redirects_staff_manage_m16 on public.seo_redirects
for all to authenticated using (public.current_user_is_staff())
with check (public.current_user_is_staff());

comment on table public.blog_posts is
  'CMS-managed articles. Public access is restricted to published, non-archived posts whose publish time has arrived.';
comment on table public.seo_redirects is
  'Internal-path redirect registry. Blog slug changes create permanent redirects automatically.';

commit;
