begin;

do $$
begin
  create type public.meeting_status as enum ('scheduled', 'cancelled', 'completed', 'no_show');
exception when duplicate_object then null;
end
$$;

create table if not exists public.booking_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text not null default '',
  duration_minutes integer not null default 30 check (duration_minutes between 10 and 240),
  service_type text,
  provider text not null default 'calcom',
  provider_url text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.booking_handoffs (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  booking_type_slug text references public.booking_types(slug) on update cascade on delete set null,
  attribution jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  booking_type_id uuid references public.booking_types(id) on delete set null,
  provider text not null default 'calcom',
  provider_booking_id text not null,
  provider_event_type text,
  title text,
  attendee_name text,
  attendee_email text,
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text,
  meeting_url text,
  location_text text,
  status public.meeting_status not null default 'scheduled',
  rescheduled_from_provider_id text,
  cancelled_at timestamptz,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetings_provider_booking_unique unique (provider, provider_booking_id)
);

create table if not exists public.booking_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'calcom',
  event_key text not null,
  trigger_event text not null,
  provider_booking_id text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  constraint booking_webhook_events_provider_key_unique unique(provider, event_key)
);

create trigger booking_types_set_updated_at
before update on public.booking_types
for each row execute function public.set_updated_at();

create trigger meetings_set_updated_at
before update on public.meetings
for each row execute function public.set_updated_at();

create index if not exists booking_types_public_idx
  on public.booking_types(is_active, sort_order)
  where archived_at is null;

create index if not exists booking_handoffs_token_idx
  on public.booking_handoffs(token, expires_at);

create index if not exists booking_handoffs_lead_idx
  on public.booking_handoffs(lead_id, created_at desc);

create index if not exists meetings_lead_start_idx
  on public.meetings(lead_id, starts_at desc);

create index if not exists meetings_status_start_idx
  on public.meetings(status, starts_at);

create index if not exists booking_webhook_events_created_idx
  on public.booking_webhook_events(created_at desc);

alter table public.booking_types enable row level security;
alter table public.booking_handoffs enable row level security;
alter table public.meetings enable row level security;
alter table public.booking_webhook_events enable row level security;

grant select on table public.booking_types to anon, authenticated;
grant select, insert, update, delete on table public.booking_types to authenticated;
grant select, insert, update, delete on table public.booking_handoffs to authenticated;
grant select, insert, update, delete on table public.meetings to authenticated;
grant select, insert, update, delete on table public.booking_webhook_events to authenticated;

grant all on table public.booking_types to service_role;
grant all on table public.booking_handoffs to service_role;
grant all on table public.meetings to service_role;
grant all on table public.booking_webhook_events to service_role;

drop policy if exists booking_types_public_read_m10 on public.booking_types;
create policy booking_types_public_read_m10
on public.booking_types
for select
to anon, authenticated
using (is_active = true and archived_at is null);

drop policy if exists booking_types_staff_all_m10 on public.booking_types;
create policy booking_types_staff_all_m10
on public.booking_types
for all
to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists booking_handoffs_staff_all_m10 on public.booking_handoffs;
create policy booking_handoffs_staff_all_m10
on public.booking_handoffs
for all
to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists meetings_staff_all_m10 on public.meetings;
create policy meetings_staff_all_m10
on public.meetings
for all
to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists booking_webhook_events_staff_all_m10 on public.booking_webhook_events;
create policy booking_webhook_events_staff_all_m10
on public.booking_webhook_events
for all
to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

insert into public.booking_types (
  slug, label, description, duration_minutes, service_type, provider, sort_order
) values
  ('discovery-call', 'Discovery call', 'A focused consultation to understand goals, scope, timing and the best next step.', 30, null, 'calcom', 10),
  ('website-consultation', 'Website consultation', 'For marketing sites, ecommerce and web applications.', 30, 'website', 'calcom', 20),
  ('automation-ai-consultation', 'Automation & AI consultation', 'For workflow automation, integrations, AI assistants and data-enabled systems.', 45, 'automation', 'calcom', 30)
on conflict (slug) do nothing;

comment on table public.booking_handoffs is
  'Opaque public booking context tokens. They carry lead context without exposing lead identifiers in URLs.';
comment on table public.meetings is
  'Canonical application-side meeting record synchronized from the scheduling provider.';
comment on table public.booking_webhook_events is
  'Idempotency and observability log for provider webhook deliveries.';

commit;
