begin;

create extension if not exists pgcrypto with schema extensions;

-- Shared lifecycle enums. Later modules may extend them through new migrations.
do $$
begin
  create type public.lead_status as enum (
    'new',
    'qualified',
    'contacted',
    'consultation_booked',
    'discovery_complete',
    'proposal_sent',
    'negotiation',
    'won',
    'lost',
    'nurture'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.project_status as enum (
    'planned',
    'active',
    'on_hold',
    'completed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  timezone text,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_locale_length check (char_length(locale) between 2 and 16)
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  normalized_email text generated always as (lower(btrim(email))) stored,
  company_name text,
  source text,
  status public.lead_status not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint leads_email_length check (email is null or char_length(email) <= 320),
  constraint leads_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  name text not null,
  status public.project_status not null default 'planned',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint projects_name_length check (char_length(name) between 1 and 200),
  constraint projects_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create table if not exists public.content_records (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,
  slug text not null,
  title text not null,
  status public.content_status not null default 'draft',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint content_records_identity_unique unique (content_type, slug),
  constraint content_records_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint content_records_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint content_records_publish_state check (
    status <> 'published' or published_at is not null
  )
);

create table if not exists public.activity_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  entity_type text not null,
  entity_id uuid not null,
  event_type text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  source text not null default 'app',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  constraint activity_events_metadata_object check (jsonb_typeof(metadata) = 'object')
);

create index if not exists leads_normalized_email_idx on public.leads (normalized_email);
create index if not exists leads_status_created_at_idx on public.leads (status, created_at desc);
create index if not exists projects_lead_id_idx on public.projects (lead_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists content_records_type_status_idx on public.content_records (content_type, status);
create index if not exists activity_events_entity_idx on public.activity_events (entity_type, entity_id, occurred_at desc);
create index if not exists activity_events_actor_idx on public.activity_events (actor_user_id, occurred_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger content_records_set_updated_at
before update on public.content_records
for each row execute function public.set_updated_at();

-- M02 is closed by default. M03 introduces authenticated/client policies.
alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.projects enable row level security;
alter table public.content_records enable row level security;
alter table public.activity_events enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.leads from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.content_records from anon, authenticated;
revoke all on table public.activity_events from anon, authenticated;

grant all on table public.profiles to service_role;
grant all on table public.leads to service_role;
grant all on table public.projects to service_role;
grant all on table public.content_records to service_role;
grant all on table public.activity_events to service_role;
grant usage, select on sequence public.activity_events_id_seq to service_role;

comment on table public.profiles is 'Base application profile. Authentication and role policies are completed in M03.';
comment on table public.leads is 'Base lead record. Project brief and CRM fields are expanded in M08/M09.';
comment on table public.projects is 'Base project record. Client workspace fields are expanded in M14.';
comment on table public.content_records is 'Shared content publishing reference used by later CMS modules.';
comment on table public.activity_events is 'Append-oriented cross-domain event timeline for traceability.';

commit;
