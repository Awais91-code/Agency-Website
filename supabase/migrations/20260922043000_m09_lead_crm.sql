begin;

do $$
begin
  create type public.lead_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null;
end
$$;

alter table public.leads
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null,
  add column if not exists priority public.lead_priority not null default 'normal',
  add column if not exists lead_score integer not null default 0,
  add column if not exists score_reasons jsonb not null default '[]'::jsonb,
  add column if not exists next_action text,
  add column if not exists next_action_at timestamptz,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists lost_reason text;

do $$
begin
  alter table public.leads
    add constraint leads_score_range check (lead_score between 0 and 100);
exception when duplicate_object then null;
end
$$;

do $$
begin
  alter table public.leads
    add constraint leads_score_reasons_array check (jsonb_typeof(score_reasons) = 'array');
exception when duplicate_object then null;
end
$$;

update public.leads
set
  lead_score = greatest(0, least(100, coalesce(nullif(metadata ->> 'lead_score', '')::integer, 0))),
  score_reasons = case
    when jsonb_typeof(metadata -> 'lead_score_reasons') = 'array' then metadata -> 'lead_score_reasons'
    else '[]'::jsonb
  end
where lead_score = 0
  and metadata ? 'lead_score';

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint lead_notes_body_length check (char_length(body) between 1 and 6000)
);

create table if not exists public.lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  from_status public.lead_status,
  to_status public.lead_status not null,
  changed_by uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now(),
  constraint lead_stage_history_reason_length check (reason is null or char_length(reason) <= 1000)
);

create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lead_tasks_title_length check (char_length(title) between 1 and 300)
);

create table if not exists public.lead_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint lead_tags_name_length check (char_length(name) between 1 and 60),
  constraint lead_tags_normalized_name_unique unique (normalized_name)
);

create table if not exists public.lead_tag_links (
  lead_id uuid not null references public.leads(id) on delete cascade,
  tag_id uuid not null references public.lead_tags(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (lead_id, tag_id)
);

create trigger lead_notes_set_updated_at
before update on public.lead_notes
for each row execute function public.set_updated_at();

create trigger lead_tasks_set_updated_at
before update on public.lead_tasks
for each row execute function public.set_updated_at();

create index if not exists leads_owner_status_idx on public.leads(owner_user_id, status, created_at desc);
create index if not exists leads_priority_score_idx on public.leads(priority, lead_score desc, created_at desc);
create index if not exists leads_next_action_idx on public.leads(next_action_at) where archived_at is null;
create index if not exists lead_notes_lead_created_idx on public.lead_notes(lead_id, created_at desc);
create index if not exists lead_stage_history_lead_created_idx on public.lead_stage_history(lead_id, created_at desc);
create index if not exists lead_tasks_lead_due_idx on public.lead_tasks(lead_id, completed_at, due_at);
create index if not exists lead_tag_links_lead_idx on public.lead_tag_links(lead_id);
create index if not exists lead_tag_links_tag_idx on public.lead_tag_links(tag_id);

alter table public.lead_notes enable row level security;
alter table public.lead_stage_history enable row level security;
alter table public.lead_tasks enable row level security;
alter table public.lead_tags enable row level security;
alter table public.lead_tag_links enable row level security;

grant select, insert, update, delete on table public.lead_notes to authenticated;
grant select, insert, update, delete on table public.lead_stage_history to authenticated;
grant select, insert, update, delete on table public.lead_tasks to authenticated;
grant select, insert, update, delete on table public.lead_tags to authenticated;
grant select, insert, update, delete on table public.lead_tag_links to authenticated;

grant all on table public.lead_notes to service_role;
grant all on table public.lead_stage_history to service_role;
grant all on table public.lead_tasks to service_role;
grant all on table public.lead_tags to service_role;
grant all on table public.lead_tag_links to service_role;

drop policy if exists lead_notes_staff_all_m09 on public.lead_notes;
create policy lead_notes_staff_all_m09
on public.lead_notes for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists lead_stage_history_staff_all_m09 on public.lead_stage_history;
create policy lead_stage_history_staff_all_m09
on public.lead_stage_history for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists lead_tasks_staff_all_m09 on public.lead_tasks;
create policy lead_tasks_staff_all_m09
on public.lead_tasks for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists lead_tags_staff_all_m09 on public.lead_tags;
create policy lead_tags_staff_all_m09
on public.lead_tags for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

drop policy if exists lead_tag_links_staff_all_m09 on public.lead_tag_links;
create policy lead_tag_links_staff_all_m09
on public.lead_tag_links for all to authenticated
using (public.current_user_is_staff())
with check (public.current_user_is_staff());

-- Future M08 submissions write the structured M09 score columns as well as the
-- metadata snapshot retained for backward compatibility and traceability.
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
    lead_score,
    score_reasons,
    metadata
  ) values (
    v_brief.contact_name,
    v_brief.contact_email,
    v_brief.company_name,
    coalesce(v_brief.source, 'project_brief'),
    case when p_lead_score >= 60 then 'qualified'::public.lead_status else 'new'::public.lead_status end,
    greatest(0, least(100, p_lead_score)),
    coalesce(p_score_reasons, '[]'::jsonb),
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

create or replace function public.merge_leads(
  p_source_id uuid,
  p_target_id uuid,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.leads%rowtype;
  v_target public.leads%rowtype;
begin
  if p_source_id = p_target_id then
    raise exception 'Source and target leads must be different';
  end if;

  select * into v_source from public.leads where id = p_source_id for update;
  if not found then raise exception 'Source lead not found'; end if;

  select * into v_target from public.leads where id = p_target_id for update;
  if not found then raise exception 'Target lead not found'; end if;

  if v_source.normalized_email is null
     or v_target.normalized_email is null
     or v_source.normalized_email <> v_target.normalized_email then
    raise exception 'Leads can only be merged automatically when normalized email matches';
  end if;

  update public.project_briefs set lead_id = p_target_id where lead_id = p_source_id;
  update public.projects set lead_id = p_target_id where lead_id = p_source_id;
  update public.lead_notes set lead_id = p_target_id where lead_id = p_source_id;
  update public.lead_tasks set lead_id = p_target_id where lead_id = p_source_id;
  update public.lead_stage_history set lead_id = p_target_id where lead_id = p_source_id;

  insert into public.lead_tag_links (lead_id, tag_id, created_by, created_at)
  select p_target_id, tag_id, created_by, created_at
  from public.lead_tag_links
  where lead_id = p_source_id
  on conflict (lead_id, tag_id) do nothing;

  delete from public.lead_tag_links where lead_id = p_source_id;

  update public.activity_events
  set entity_id = p_target_id,
      metadata = metadata || jsonb_build_object('merged_from_lead_id', p_source_id)
  where entity_type = 'lead' and entity_id = p_source_id;

  update public.leads
  set
    archived_at = now(),
    next_action = null,
    next_action_at = null,
    metadata = metadata || jsonb_build_object(
      'merged_into_lead_id', p_target_id,
      'merged_at', now(),
      'merged_by', p_actor_id
    )
  where id = p_source_id;

  insert into public.activity_events (
    entity_type, entity_id, event_type, actor_user_id, source, metadata
  ) values (
    'lead', p_target_id, 'lead.merged', p_actor_id, 'admin',
    jsonb_build_object('source_lead_id', p_source_id)
  );

  return jsonb_build_object('source_id', p_source_id, 'target_id', p_target_id);
end;
$$;

revoke all on function public.merge_leads(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.merge_leads(uuid, uuid, uuid) to service_role;

comment on table public.lead_notes is 'Staff-only CRM notes. Never exposed to clients.';
comment on table public.lead_stage_history is 'Auditable CRM pipeline status history.';
comment on table public.lead_tasks is 'Lightweight manual follow-up actions for the sales team.';
comment on table public.lead_tags is 'Reusable normalized CRM tags.';
comment on table public.lead_tag_links is 'Many-to-many lead/tag membership.';
comment on function public.merge_leads is 'Safely consolidates exact-email duplicate leads while archiving, not deleting, the source record.';

commit;
