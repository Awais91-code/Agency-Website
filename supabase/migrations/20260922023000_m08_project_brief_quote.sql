begin;

create table if not exists public.project_briefs (
  id uuid primary key default gen_random_uuid(),
  session_token uuid not null unique,
  idempotency_key text,
  status text not null default 'draft' check (status in ('draft','submitted','abandoned')),
  service_type text,
  service_id uuid references public.services(id) on delete set null,
  company_name text,
  industry text,
  current_url text,
  objective text,
  timeline text,
  desired_start date,
  deadline date,
  urgency text,
  budget_band text,
  contact_name text,
  contact_email text,
  contact_phone text,
  timezone_country text,
  requirements text,
  marketing_consent boolean not null default false,
  privacy_accepted boolean not null default false,
  source text not null default 'project_brief',
  attribution jsonb not null default '{}'::jsonb,
  lead_id uuid references public.leads(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_briefs_idempotency_unique unique (idempotency_key),
  constraint project_briefs_attribution_object check (jsonb_typeof(attribution) = 'object'),
  constraint project_briefs_email_length check (contact_email is null or char_length(contact_email) <= 320),
  constraint project_briefs_requirements_length check (requirements is null or char_length(requirements) <= 6000),
  constraint project_briefs_submit_state check (
    status <> 'submitted'
    or (
      submitted_at is not null
      and lead_id is not null
      and contact_name is not null
      and contact_email is not null
      and privacy_accepted
    )
  )
);

create table if not exists public.brief_answers (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.project_briefs(id) on delete cascade,
  answer_key text not null,
  answer_value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brief_id, answer_key),
  constraint brief_answers_key_format check (answer_key ~ '^[a-z0-9_]{2,80}$')
);

create table if not exists public.estimate_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  label text not null,
  rule_type text not null check (rule_type in ('base','feature','complexity','urgency','support')),
  service_type text,
  match_key text not null,
  amount_min integer not null default 0 check (amount_min >= 0),
  amount_max integer not null default 0 check (amount_max >= amount_min),
  multiplier numeric(8,4) not null default 1 check (multiplier > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimate_rules_config_object check (jsonb_typeof(config) = 'object')
);

create table if not exists public.estimate_results (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references public.project_briefs(id) on delete cascade,
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  subtotal_min integer not null check (subtotal_min >= 0),
  subtotal_max integer not null check (subtotal_max >= subtotal_min),
  final_min integer not null check (final_min >= 0),
  final_max integer not null check (final_max >= final_min),
  inputs jsonb not null default '{}'::jsonb,
  adjustments jsonb not null default '[]'::jsonb,
  rule_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint estimate_results_inputs_object check (jsonb_typeof(inputs) = 'object'),
  constraint estimate_results_adjustments_array check (jsonb_typeof(adjustments) = 'array'),
  constraint estimate_results_rule_snapshot_array check (jsonb_typeof(rule_snapshot) = 'array')
);

create index if not exists project_briefs_status_created_idx on public.project_briefs(status, created_at desc);
create index if not exists project_briefs_email_idx on public.project_briefs(lower(contact_email)) where contact_email is not null;
create index if not exists project_briefs_lead_idx on public.project_briefs(lead_id);
create index if not exists brief_answers_brief_idx on public.brief_answers(brief_id, answer_key);
create index if not exists estimate_rules_active_lookup_idx on public.estimate_rules(is_active, rule_type, service_type, match_key, sort_order);
create index if not exists estimate_results_brief_idx on public.estimate_results(brief_id, created_at desc);

create trigger project_briefs_set_updated_at
before update on public.project_briefs
for each row execute function public.set_updated_at();

create trigger brief_answers_set_updated_at
before update on public.brief_answers
for each row execute function public.set_updated_at();

create trigger estimate_rules_set_updated_at
before update on public.estimate_rules
for each row execute function public.set_updated_at();

-- Production-safe rule templates. They are intentionally inactive until staff approves values.
insert into public.estimate_rules (
  id, rule_key, label, rule_type, service_type, match_key,
  amount_min, amount_max, multiplier, currency, is_active, sort_order
)
values
('81000000-0000-4000-8000-000000000001','base.website','Marketing / company website','base','website','base',0,0,1,'USD',false,10),
('81000000-0000-4000-8000-000000000002','base.ecommerce','Ecommerce website','base','ecommerce','base',0,0,1,'USD',false,20),
('81000000-0000-4000-8000-000000000003','base.web-app','Custom web application','base','web-app','base',0,0,1,'USD',false,30),
('81000000-0000-4000-8000-000000000004','base.mobile-app','Mobile application','base','mobile-app','base',0,0,1,'USD',false,40),
('81000000-0000-4000-8000-000000000005','base.ui-ux','UI/UX engagement','base','ui-ux','base',0,0,1,'USD',false,50),
('81000000-0000-4000-8000-000000000006','base.automation','Automation project','base','automation','base',0,0,1,'USD',false,60),
('81000000-0000-4000-8000-000000000007','base.ai-solution','AI solution','base','ai-solution','base',0,0,1,'USD',false,70),
('81000000-0000-4000-8000-000000000008','base.other','Other / needs discovery','base','other','base',0,0,1,'USD',false,80),
('81000000-0000-4000-8000-000000000101','feature.auth','User accounts / authentication','feature',null,'auth',0,0,1,'USD',false,110),
('81000000-0000-4000-8000-000000000102','feature.payments','Online payments','feature',null,'payments',0,0,1,'USD',false,120),
('81000000-0000-4000-8000-000000000103','feature.admin-dashboard','Admin dashboard','feature',null,'admin-dashboard',0,0,1,'USD',false,130),
('81000000-0000-4000-8000-000000000104','feature.booking','Booking / scheduling','feature',null,'booking',0,0,1,'USD',false,140),
('81000000-0000-4000-8000-000000000105','feature.multilingual','Multiple languages','feature',null,'multilingual',0,0,1,'USD',false,150),
('81000000-0000-4000-8000-000000000106','feature.integrations','External API integrations','feature',null,'integrations',0,0,1,'USD',false,160),
('81000000-0000-4000-8000-000000000107','feature.ai-assistant','AI assistant / RAG','feature',null,'ai-assistant',0,0,1,'USD',false,170),
('81000000-0000-4000-8000-000000000108','feature.workflow-automation','Workflow automation','feature',null,'workflow-automation',0,0,1,'USD',false,180),
('81000000-0000-4000-8000-000000000109','feature.data-migration','Data/content migration','feature',null,'data-migration',0,0,1,'USD',false,190),
('81000000-0000-4000-8000-000000000201','complexity.standard','Standard complexity','complexity',null,'standard',0,0,1,'USD',false,210),
('81000000-0000-4000-8000-000000000202','complexity.advanced','Advanced complexity','complexity',null,'advanced',0,0,1,'USD',false,220),
('81000000-0000-4000-8000-000000000203','complexity.enterprise','High integration / enterprise complexity','complexity',null,'enterprise',0,0,1,'USD',false,230),
('81000000-0000-4000-8000-000000000301','urgency.flexible','Flexible timing','urgency',null,'flexible',0,0,1,'USD',false,310),
('81000000-0000-4000-8000-000000000302','urgency.standard','Standard timeline','urgency',null,'standard',0,0,1,'USD',false,320),
('81000000-0000-4000-8000-000000000303','urgency.urgent','Urgent / compressed timeline','urgency',null,'urgent',0,0,1,'USD',false,330),
('81000000-0000-4000-8000-000000000401','support.none','No ongoing support selected','support',null,'none',0,0,1,'USD',false,410),
('81000000-0000-4000-8000-000000000402','support.launch','Launch support package','support',null,'launch-support',0,0,1,'USD',false,420),
('81000000-0000-4000-8000-000000000403','support.retainer','Initial monthly support / retainer','support',null,'monthly-retainer',0,0,1,'USD',false,430)
on conflict (id) do nothing;

alter table public.project_briefs enable row level security;
alter table public.brief_answers enable row level security;
alter table public.estimate_rules enable row level security;
alter table public.estimate_results enable row level security;

-- Public project intake is intentionally server-mediated. The browser never receives service_role credentials.
revoke all on table public.project_briefs from anon, authenticated;
revoke all on table public.brief_answers from anon, authenticated;
revoke all on table public.estimate_results from anon, authenticated;
grant all on table public.project_briefs to service_role;
grant all on table public.brief_answers to service_role;
grant all on table public.estimate_results to service_role;

-- Staff can maintain quote rules. Public calculations are performed server-side from these rules.
grant select, insert, update, delete on table public.estimate_rules to authenticated;
grant all on table public.estimate_rules to service_role;

drop policy if exists estimate_rules_staff_manage_m08 on public.estimate_rules;
create policy estimate_rules_staff_manage_m08
on public.estimate_rules for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

create or replace function public.submit_project_brief(
  p_brief_id uuid,
  p_idempotency_key text,
  p_lead_score integer,
  p_score_reasons jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_brief public.project_briefs%rowtype;
  v_lead_id uuid;
  v_existing_id uuid;
begin
  select * into v_brief
  from public.project_briefs
  where id = p_brief_id
  for update;

  if not found then
    raise exception 'Project brief not found';
  end if;

  if v_brief.status = 'submitted' and v_brief.lead_id is not null then
    return jsonb_build_object('lead_id', v_brief.lead_id, 'brief_id', v_brief.id, 'already_submitted', true);
  end if;

  if v_brief.contact_name is null or btrim(v_brief.contact_name) = ''
     or v_brief.contact_email is null or btrim(v_brief.contact_email) = ''
     or not v_brief.privacy_accepted then
    raise exception 'Contact name, email and privacy acceptance are required';
  end if;

  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) < 12 then
    raise exception 'A valid idempotency key is required';
  end if;

  select id into v_existing_id
  from public.project_briefs
  where idempotency_key = p_idempotency_key
    and status = 'submitted'
    and lead_id is not null
  limit 1;

  if v_existing_id is not null and v_existing_id <> v_brief.id then
    select lead_id into v_lead_id from public.project_briefs where id = v_existing_id;
    return jsonb_build_object('lead_id', v_lead_id, 'brief_id', v_existing_id, 'already_submitted', true);
  end if;

  insert into public.leads (
    full_name,
    email,
    company_name,
    source,
    status,
    metadata
  ) values (
    v_brief.contact_name,
    v_brief.contact_email,
    v_brief.company_name,
    coalesce(v_brief.source, 'project_brief'),
    case when p_lead_score >= 60 then 'qualified'::public.lead_status else 'new'::public.lead_status end,
    jsonb_build_object(
      'project_brief_id', v_brief.id,
      'service_type', v_brief.service_type,
      'budget_band', v_brief.budget_band,
      'urgency', v_brief.urgency,
      'lead_score', greatest(0, least(100, p_lead_score)),
      'lead_score_reasons', coalesce(p_score_reasons, '[]'::jsonb),
      'attribution', v_brief.attribution
    )
  ) returning id into v_lead_id;

  update public.project_briefs
  set status = 'submitted',
      idempotency_key = p_idempotency_key,
      lead_id = v_lead_id,
      submitted_at = now()
  where id = v_brief.id;

  insert into public.activity_events (
    entity_type,
    entity_id,
    event_type,
    source,
    metadata
  ) values (
    'lead',
    v_lead_id,
    'project_brief.submitted',
    'public_form',
    jsonb_build_object(
      'brief_id', v_brief.id,
      'lead_score', greatest(0, least(100, p_lead_score)),
      'confirmation_pending_m12', true,
      'automation_pending_m13', true
    )
  );

  return jsonb_build_object('lead_id', v_lead_id, 'brief_id', v_brief.id, 'already_submitted', false);
end;
$$;

revoke all on function public.submit_project_brief(uuid, text, integer, jsonb) from public, anon, authenticated;
grant execute on function public.submit_project_brief(uuid, text, integer, jsonb) to service_role;

comment on table public.project_briefs is 'Structured M08 project-intake records. Public writes are mediated by server routes using an unguessable session token.';
comment on table public.brief_answers is 'Flexible conditional answers associated with a project brief.';
comment on table public.estimate_rules is 'Staff-managed pricing guidance rules used only for non-binding estimate ranges.';
comment on table public.estimate_results is 'Immutable estimate snapshots produced from server-side rules for traceability.';
comment on function public.submit_project_brief is 'Atomically creates one lead for a finalized project brief and protects repeated submissions with an idempotency key.';

commit;
