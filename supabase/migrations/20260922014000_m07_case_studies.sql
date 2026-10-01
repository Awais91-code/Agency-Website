begin;

create table if not exists public.case_studies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  project_label text not null default 'Case study',
  client_name text,
  industry text,
  short_description text not null,
  hero_title text not null,
  hero_description text not null,
  problem text not null,
  approach text not null,
  solution text not null,
  result_summary text not null,
  technologies text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  testimonial_quote text,
  testimonial_attribution text,
  testimonial_approved boolean not null default false,
  cta_label text not null default 'Start a similar project',
  cta_href text not null default '/contact',
  seo_title text,
  seo_description text,
  hero_media_id uuid references public.media_assets(id) on delete set null,
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint case_studies_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint case_studies_title_length check (char_length(title) between 1 and 140),
  constraint case_studies_short_description_length check (char_length(short_description) between 20 and 360),
  constraint case_studies_hero_title_length check (char_length(hero_title) between 1 and 180),
  constraint case_studies_hero_description_length check (char_length(hero_description) between 20 and 700),
  constraint case_studies_problem_length check (char_length(problem) between 20 and 6000),
  constraint case_studies_approach_length check (char_length(approach) between 20 and 6000),
  constraint case_studies_solution_length check (char_length(solution) between 20 and 6000),
  constraint case_studies_result_length check (char_length(result_summary) between 20 and 4000),
  constraint case_studies_publish_state check (status <> 'published' or published_at is not null),
  constraint case_studies_testimonial_state check (
    testimonial_approved = false
    or (testimonial_quote is not null and char_length(testimonial_quote) >= 8)
  )
);

create table if not exists public.case_study_services (
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (case_study_id, service_id)
);

create table if not exists public.case_study_media (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  media_asset_id uuid not null references public.media_assets(id) on delete restrict,
  alt_text_override text,
  caption text,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  unique (case_study_id, media_asset_id)
);

create table if not exists public.case_study_metrics (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies(id) on delete cascade,
  value text not null,
  label text not null,
  context text,
  is_approved boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint case_study_metrics_value_length check (char_length(value) between 1 and 80),
  constraint case_study_metrics_label_length check (char_length(label) between 1 and 140),
  constraint case_study_metrics_context_length check (context is null or char_length(context) <= 500)
);

create index if not exists case_studies_public_order_idx on public.case_studies(status, is_featured desc, sort_order, title);
create index if not exists case_studies_industry_idx on public.case_studies(industry);
create index if not exists case_studies_hero_media_idx on public.case_studies(hero_media_id);
create index if not exists case_study_services_service_idx on public.case_study_services(service_id, sort_order);
create index if not exists case_study_media_order_idx on public.case_study_media(case_study_id, sort_order);
create index if not exists case_study_metrics_order_idx on public.case_study_metrics(case_study_id, sort_order);

create trigger case_studies_set_updated_at
before update on public.case_studies
for each row execute function public.set_updated_at();

create trigger case_study_metrics_set_updated_at
before update on public.case_study_metrics
for each row execute function public.set_updated_at();

alter table public.case_studies enable row level security;
alter table public.case_study_services enable row level security;
alter table public.case_study_media enable row level security;
alter table public.case_study_metrics enable row level security;

grant select on table public.case_studies to anon, authenticated;
grant select on table public.case_study_services to anon, authenticated;
grant select on table public.case_study_media to anon, authenticated;
grant select on table public.case_study_metrics to anon, authenticated;
grant insert, update, delete on table public.case_studies to authenticated;
grant insert, update, delete on table public.case_study_services to authenticated;
grant insert, update, delete on table public.case_study_media to authenticated;
grant insert, update, delete on table public.case_study_metrics to authenticated;

grant all on table public.case_studies to service_role;
grant all on table public.case_study_services to service_role;
grant all on table public.case_study_media to service_role;
grant all on table public.case_study_metrics to service_role;

drop policy if exists case_studies_public_read_m07 on public.case_studies;
create policy case_studies_public_read_m07
on public.case_studies for select to anon, authenticated
using (
  status = 'published'::public.content_status
  and archived_at is null
  and published_at is not null
);

drop policy if exists case_studies_staff_manage_m07 on public.case_studies;
create policy case_studies_staff_manage_m07
on public.case_studies for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists case_study_services_public_read_m07 on public.case_study_services;
create policy case_study_services_public_read_m07
on public.case_study_services for select to anon, authenticated
using (
  exists (
    select 1 from public.case_studies c
    where c.id = case_study_services.case_study_id
      and c.status = 'published'::public.content_status
      and c.archived_at is null
      and c.published_at is not null
  )
);

drop policy if exists case_study_services_staff_manage_m07 on public.case_study_services;
create policy case_study_services_staff_manage_m07
on public.case_study_services for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists case_study_media_public_read_m07 on public.case_study_media;
create policy case_study_media_public_read_m07
on public.case_study_media for select to anon, authenticated
using (
  visible
  and exists (
    select 1 from public.case_studies c
    where c.id = case_study_media.case_study_id
      and c.status = 'published'::public.content_status
      and c.archived_at is null
      and c.published_at is not null
  )
  and exists (
    select 1 from public.media_assets m
    where m.id = case_study_media.media_asset_id
      and m.visibility = 'public'::public.media_visibility
      and m.archived_at is null
  )
);

drop policy if exists case_study_media_staff_manage_m07 on public.case_study_media;
create policy case_study_media_staff_manage_m07
on public.case_study_media for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists case_study_metrics_public_read_m07 on public.case_study_metrics;
create policy case_study_metrics_public_read_m07
on public.case_study_metrics for select to anon, authenticated
using (
  is_approved
  and exists (
    select 1 from public.case_studies c
    where c.id = case_study_metrics.case_study_id
      and c.status = 'published'::public.content_status
      and c.archived_at is null
      and c.published_at is not null
  )
);

drop policy if exists case_study_metrics_staff_manage_m07 on public.case_study_metrics;
create policy case_study_metrics_staff_manage_m07
on public.case_study_metrics for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

comment on table public.case_studies is 'CMS-managed portfolio case studies. Public access is limited to published, non-archived records.';
comment on table public.case_study_services is 'Many-to-many service relationships used for filtering and related-work surfaces.';
comment on table public.case_study_media is 'Ordered public gallery media for a case study.';
comment on table public.case_study_metrics is 'Outcome metrics. Only rows explicitly approved by staff are public.';
comment on column public.case_studies.testimonial_approved is 'Only approved testimonials may be rendered publicly.';

commit;
