begin;

do $$
begin
  create type public.email_delivery_status as enum (
    'queued',
    'sending',
    'sent',
    'delivered',
    'delivery_delayed',
    'bounced',
    'complained',
    'failed',
    'suppressed',
    'skipped'
  );
exception when duplicate_object then null;
end
$$;

create table if not exists public.notification_settings (
  id text primary key default 'default',
  admin_recipients text[] not null default '{}',
  send_enquiry_confirmations boolean not null default true,
  send_new_lead_alerts boolean not null default true,
  send_booking_notifications boolean not null default true,
  send_booking_admin_alerts boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_settings_singleton check (id = 'default')
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  provider text not null default 'resend',
  provider_message_id text,
  template_key text not null,
  original_recipient text not null,
  recipient text not null,
  sender text,
  reply_to text,
  subject text not null,
  status public.email_delivery_status not null default 'queued',
  context_type text,
  context_id text,
  template_data jsonb not null default '{}'::jsonb,
  provider_response jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0,
  next_retry_at timestamptz,
  last_error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_events_idempotency_length check (char_length(idempotency_key) between 4 and 256),
  constraint email_events_retry_count_nonnegative check (retry_count >= 0)
);

create table if not exists public.email_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'resend',
  provider_event_id text not null,
  event_type text not null,
  provider_message_id text,
  recipient text,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  constraint email_provider_events_unique unique(provider, provider_event_id)
);

create trigger notification_settings_set_updated_at
before update on public.notification_settings
for each row execute function public.set_updated_at();

create trigger email_events_set_updated_at
before update on public.email_events
for each row execute function public.set_updated_at();

create index if not exists email_events_provider_message_idx
  on public.email_events(provider, provider_message_id)
  where provider_message_id is not null;

create index if not exists email_events_status_created_idx
  on public.email_events(status, created_at desc);

create index if not exists email_events_context_idx
  on public.email_events(context_type, context_id, created_at desc);

create index if not exists email_events_retry_idx
  on public.email_events(next_retry_at)
  where status = 'failed'::public.email_delivery_status;

create index if not exists email_provider_events_message_idx
  on public.email_provider_events(provider, provider_message_id, created_at desc);

alter table public.notification_settings enable row level security;
alter table public.email_events enable row level security;
alter table public.email_provider_events enable row level security;

grant select, update on table public.notification_settings to authenticated;
grant select on table public.email_events to authenticated;
grant select on table public.email_provider_events to authenticated;

grant all on table public.notification_settings to service_role;
grant all on table public.email_events to service_role;
grant all on table public.email_provider_events to service_role;

drop policy if exists notification_settings_admin_read_m12 on public.notification_settings;
create policy notification_settings_admin_read_m12
on public.notification_settings
for select
to authenticated
using (public.current_user_can_manage_users());

drop policy if exists notification_settings_admin_update_m12 on public.notification_settings;
create policy notification_settings_admin_update_m12
on public.notification_settings
for update
to authenticated
using (public.current_user_can_manage_users())
with check (public.current_user_can_manage_users());

drop policy if exists email_events_staff_read_m12 on public.email_events;
create policy email_events_staff_read_m12
on public.email_events
for select
to authenticated
using (public.current_user_is_staff());

drop policy if exists email_provider_events_staff_read_m12 on public.email_provider_events;
create policy email_provider_events_staff_read_m12
on public.email_provider_events
for select
to authenticated
using (public.current_user_is_staff());

insert into public.notification_settings (
  id,
  admin_recipients,
  send_enquiry_confirmations,
  send_new_lead_alerts,
  send_booking_notifications,
  send_booking_admin_alerts
)
values ('default', '{}', true, true, true, true)
on conflict (id) do nothing;

comment on table public.email_events is
  'Canonical outbound transactional email log. Critical messages use a unique idempotency_key to prevent duplicate sends.';
comment on table public.email_provider_events is
  'Verified provider webhook deliveries for email status visibility and deduplication.';
comment on table public.notification_settings is
  'Administrator-managed notification rules and internal recipient list; provider secrets remain environment-only.';

commit;
