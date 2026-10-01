# M09 Lead CRM & Sales Pipeline

M09 turns the M08 project-intake lead into a staff-operated CRM record.

## Routes

- `/admin/leads` — searchable lead list
- `/admin/leads/[id]` — canonical lead record
- `/admin/pipeline` — stage-based board

## Lead data

M09 adds structured fields for:

- owner
- priority
- lead score and score reasons
- next action and due date
- last contacted time
- lost reason
- tags

The M08 metadata snapshot remains for backward compatibility and audit context.

## Internal-only records

The following tables are staff-only through RLS:

- `lead_notes`
- `lead_stage_history`
- `lead_tasks`
- `lead_tags`
- `lead_tag_links`

Internal notes must never be rendered in the client portal.

## Stage history

Status is stored on `leads.status`. Every UI-driven stage change also appends:

1. `lead_stage_history`
2. an `activity_events` item

Do not bypass the server action for normal staff workflows.

## Duplicate handling

The detail screen detects exact normalized-email duplicates.

The merge action is deliberately conservative:
- source and target must have the same normalized email;
- the source is archived, not deleted;
- linked project briefs, projects, notes, tasks, stage history, tags and lead activity are moved;
- the merge event is added to the target timeline.

This gives staff a recoverable audit trail rather than destructive deletion.

## Future module integrations

M10 bookings, M12 email events and M13 automation events should append to the existing lead activity timeline instead of creating parallel histories.
