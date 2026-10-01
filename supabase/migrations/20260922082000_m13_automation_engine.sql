begin;
do $$ begin
  create type public.automation_event_status as enum ('pending','dispatching','dispatched','completed','failed','dead_letter','cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.automation_run_status as enum ('queued','running','succeeded','failed','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.automation_workflows (
  workflow_key text primary key,
  display_name text not null,
  version int not null default 1,
  trigger_event text not null,
  description text not null default '',
  n8n_workflow_name text,
  is_enabled boolean not null default true,
  retry_limit int not null default 4 check (retry_limit between 0 and 12),
  timeout_seconds int not null default 30 check (timeout_seconds between 5 and 300),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.automation_event_status not null default 'pending',
  attempt_count int not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,
  last_error text,
  n8n_execution_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  automation_event_id uuid references public.automation_events(id) on delete set null,
  workflow_key text references public.automation_workflows(workflow_key) on update cascade on delete set null,
  workflow_version int not null default 1,
  external_run_id text,
  status public.automation_run_status not null default 'queued',
  started_at timestamptz,
  finished_at timestamptz,
  result jsonb not null default '{}'::jsonb,
  error_message text,
  retryable boolean not null default true,
  created_at timestamptz not null default now(),
  unique(workflow_key, external_run_id)
);
create table if not exists public.automation_dead_letters (
  id uuid primary key default gen_random_uuid(),
  automation_event_id uuid not null unique references public.automation_events(id) on delete cascade,
  workflow_key text references public.automation_workflows(workflow_key) on update cascade on delete set null,
  reason text not null,
  payload_snapshot jsonb not null default '{}'::jsonb,
  manual_review_status text not null default 'open' check (manual_review_status in ('open','resolved','ignored')),
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now()
);

create trigger automation_workflows_set_updated_at before update on public.automation_workflows for each row execute function public.set_updated_at();
create trigger automation_events_set_updated_at before update on public.automation_events for each row execute function public.set_updated_at();

create index if not exists automation_events_dispatch_idx on public.automation_events(status,next_attempt_at,created_at) where status in ('pending','failed');
create index if not exists automation_events_entity_idx on public.automation_events(entity_type,entity_id,created_at desc);
create index if not exists automation_runs_event_idx on public.automation_runs(automation_event_id,created_at desc);
create index if not exists automation_dead_letters_open_idx on public.automation_dead_letters(created_at desc) where manual_review_status='open';

alter table public.automation_workflows enable row level security;
alter table public.automation_events enable row level security;
alter table public.automation_runs enable row level security;
alter table public.automation_dead_letters enable row level security;

grant select on public.automation_workflows, public.automation_events, public.automation_runs, public.automation_dead_letters to authenticated;
grant all on public.automation_workflows, public.automation_events, public.automation_runs, public.automation_dead_letters to service_role;

create policy automation_workflows_staff_read_m13 on public.automation_workflows for select to authenticated using (public.current_user_is_staff());
create policy automation_events_staff_read_m13 on public.automation_events for select to authenticated using (public.current_user_is_staff());
create policy automation_runs_staff_read_m13 on public.automation_runs for select to authenticated using (public.current_user_is_staff());
create policy automation_dead_letters_staff_read_m13 on public.automation_dead_letters for select to authenticated using (public.current_user_is_staff());

insert into public.automation_workflows(workflow_key,display_name,version,trigger_event,description,n8n_workflow_name,retry_limit,timeout_seconds) values
('lead.new-project-enquiry','New project enquiry',1,'lead.created','Post-enquiry cross-system orchestration.','Agency - New Project Enquiry - v1',4,30),
('lead.no-booking-followup','No booking follow-up',1,'lead.no_booking_due','Reminder/task workflow after configured delay if still eligible.','Agency - No Booking Follow-up - v1',4,30),
('meeting.booked','Meeting booked',1,'meeting.scheduled','Post-booking orchestration after canonical booking sync.','Agency - Meeting Booked - v1',4,30),
('automation.failure','Automation failure escalation',1,'automation.dead_letter','Escalate high-value failures to manual review/admin channels.','Agency - Automation Failure - v1',2,20)
on conflict(workflow_key) do update set display_name=excluded.display_name,version=excluded.version,trigger_event=excluded.trigger_event,description=excluded.description,n8n_workflow_name=excluded.n8n_workflow_name,retry_limit=excluded.retry_limit,timeout_seconds=excluded.timeout_seconds,updated_at=now();

comment on table public.automation_events is 'Durable transactional outbox; application business data remains authoritative when n8n is unavailable.';
comment on table public.automation_dead_letters is 'Manual-review path for exhausted or non-retryable automation failures.';
commit;
