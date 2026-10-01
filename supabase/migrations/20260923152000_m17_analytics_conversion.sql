begin;

do $$
begin
  create type public.analytics_event_name as enum (
    'primary_cta_click',
    'project_brief_start',
    'project_brief_step',
    'project_brief_submit',
    'contact_submit',
    'booking_click',
    'booking_complete',
    'case_study_view',
    'case_study_cta_click'
  );
exception when duplicate_object then null;
end
$$;

alter table public.leads
  add column if not exists attribution_source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term text,
  add column if not exists utm_content text,
  add column if not exists landing_path text,
  add column if not exists initial_referrer_host text,
  add column if not exists attribution_captured_at timestamptz;

update public.leads
set
  utm_source = coalesce(utm_source, nullif(metadata #>> '{attribution,utm_source}', '')),
  utm_medium = coalesce(utm_medium, nullif(metadata #>> '{attribution,utm_medium}', '')),
  utm_campaign = coalesce(utm_campaign, nullif(metadata #>> '{attribution,utm_campaign}', '')),
  utm_term = coalesce(utm_term, nullif(metadata #>> '{attribution,utm_term}', '')),
  utm_content = coalesce(utm_content, nullif(metadata #>> '{attribution,utm_content}', '')),
  landing_path = coalesce(landing_path, nullif(metadata #>> '{attribution,landing_path}', '')),
  initial_referrer_host = coalesce(initial_referrer_host, nullif(metadata #>> '{attribution,referrer_host}', '')),
  attribution_source = coalesce(
    attribution_source,
    nullif(metadata #>> '{attribution,utm_source}', ''),
    nullif(metadata #>> '{attribution,referrer_host}', '')
  ),
  attribution_captured_at = case
    when attribution_captured_at is not null then attribution_captured_at
    when metadata ? 'attribution' then created_at
    else null
  end
where metadata ? 'attribution';

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_name public.analytics_event_name not null,
  environment text not null,
  source text not null default 'browser',
  session_id uuid,
  lead_id uuid references public.leads(id) on delete set null,
  entity_type text,
  entity_id text,
  path text,
  referrer_host text,
  attribution jsonb not null default '{}'::jsonb,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint analytics_events_environment_length check (char_length(environment) between 2 and 40),
  constraint analytics_events_source check (source in ('browser','server')),
  constraint analytics_events_event_key_length check (char_length(event_key) between 8 and 240),
  constraint analytics_events_path_length check (path is null or char_length(path) <= 500),
  constraint analytics_events_referrer_length check (referrer_host is null or char_length(referrer_host) <= 255),
  constraint analytics_events_attribution_object check (jsonb_typeof(attribution) = 'object'),
  constraint analytics_events_properties_object check (jsonb_typeof(properties) = 'object')
);

create index if not exists analytics_events_name_time_idx
  on public.analytics_events(event_name, occurred_at desc);

create index if not exists analytics_events_environment_time_idx
  on public.analytics_events(environment, occurred_at desc);

create index if not exists analytics_events_lead_idx
  on public.analytics_events(lead_id, occurred_at desc)
  where lead_id is not null;

create index if not exists analytics_events_session_idx
  on public.analytics_events(session_id, occurred_at desc)
  where session_id is not null;

alter table public.analytics_events enable row level security;

grant select on public.analytics_events to authenticated;
grant all on public.analytics_events to service_role;

create policy analytics_events_staff_read_m17
on public.analytics_events
for select
to authenticated
using (public.current_user_is_staff());

comment on table public.analytics_events is
  'M17 conversion events. Payloads are intentionally restricted to non-sensitive taxonomy fields; do not store contact messages, project free text, private files or credentials.';
comment on column public.leads.attribution_source is
  'Best available first-touch source derived from UTM source or referrer host when present.';

commit;
