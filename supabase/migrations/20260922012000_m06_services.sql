begin;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  eyebrow text,
  short_description text not null,
  hero_title text not null,
  hero_description text not null,
  problems text[] not null default '{}'::text[],
  deliverables text[] not null default '{}'::text[],
  outcomes text[] not null default '{}'::text[],
  process_steps jsonb not null default '[]'::jsonb,
  technologies text[] not null default '{}'::text[],
  pricing_note text,
  cta_label text not null default 'Start a project',
  cta_href text not null default '/contact',
  seo_title text,
  seo_description text,
  hero_media_id uuid references public.media_assets(id) on delete set null,
  related_case_study_slugs text[] not null default '{}'::text[],
  status public.content_status not null default 'draft',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint services_title_length check (char_length(title) between 1 and 120),
  constraint services_short_description_length check (char_length(short_description) between 20 and 320),
  constraint services_hero_title_length check (char_length(hero_title) between 1 and 180),
  constraint services_hero_description_length check (char_length(hero_description) between 20 and 600),
  constraint services_process_steps_array check (jsonb_typeof(process_steps) = 'array'),
  constraint services_publish_state check (status <> 'published' or published_at is not null)
);

create table if not exists public.service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_faqs_question_length check (char_length(question) between 4 and 240),
  constraint service_faqs_answer_length check (char_length(answer) between 10 and 2000)
);

create table if not exists public.service_relations (
  service_id uuid not null references public.services(id) on delete cascade,
  related_service_id uuid not null references public.services(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (service_id, related_service_id),
  constraint service_relations_not_self check (service_id <> related_service_id)
);

create index if not exists services_public_order_idx on public.services(status, is_featured desc, sort_order, title);
create index if not exists services_hero_media_idx on public.services(hero_media_id);
create index if not exists service_faqs_service_order_idx on public.service_faqs(service_id, sort_order);
create index if not exists service_relations_service_order_idx on public.service_relations(service_id, sort_order);

create trigger services_set_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create trigger service_faqs_set_updated_at
before update on public.service_faqs
for each row execute function public.set_updated_at();

alter table public.services enable row level security;
alter table public.service_faqs enable row level security;
alter table public.service_relations enable row level security;

grant select on table public.services to anon, authenticated;
grant select on table public.service_faqs to anon, authenticated;
grant select on table public.service_relations to anon, authenticated;
grant insert, update, delete on table public.services to authenticated;
grant insert, update, delete on table public.service_faqs to authenticated;
grant insert, update, delete on table public.service_relations to authenticated;

grant all on table public.services to service_role;
grant all on table public.service_faqs to service_role;
grant all on table public.service_relations to service_role;

drop policy if exists services_public_read_m06 on public.services;
create policy services_public_read_m06
on public.services for select to anon, authenticated
using (
  status = 'published'::public.content_status
  and archived_at is null
  and published_at is not null
);

drop policy if exists services_staff_manage_m06 on public.services;
create policy services_staff_manage_m06
on public.services for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists service_faqs_public_read_m06 on public.service_faqs;
create policy service_faqs_public_read_m06
on public.service_faqs for select to anon, authenticated
using (
  visible
  and exists (
    select 1 from public.services s
    where s.id = service_faqs.service_id
      and s.status = 'published'::public.content_status
      and s.archived_at is null
      and s.published_at is not null
  )
);

drop policy if exists service_faqs_staff_manage_m06 on public.service_faqs;
create policy service_faqs_staff_manage_m06
on public.service_faqs for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists service_relations_public_read_m06 on public.service_relations;
create policy service_relations_public_read_m06
on public.service_relations for select to anon, authenticated
using (
  exists (
    select 1 from public.services source_service
    where source_service.id = service_relations.service_id
      and source_service.status = 'published'::public.content_status
      and source_service.archived_at is null
  )
  and exists (
    select 1 from public.services related_service
    where related_service.id = service_relations.related_service_id
      and related_service.status = 'published'::public.content_status
      and related_service.archived_at is null
  )
);

drop policy if exists service_relations_staff_manage_m06 on public.service_relations;
create policy service_relations_staff_manage_m06
on public.service_relations for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

comment on table public.services is 'CMS-managed agency service pages. Public access is limited to published, non-archived rows.';
comment on table public.service_faqs is 'Ordered service-specific FAQ items managed with the service page.';
comment on table public.service_relations is 'Explicit related-service links for public cross-navigation.';
comment on column public.services.related_case_study_slugs is 'Forward-compatible references resolved by M07 when the case-study model is introduced.';

commit;
