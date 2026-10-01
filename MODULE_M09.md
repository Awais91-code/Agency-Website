# M09 — Lead CRM & Sales Pipeline

## Goal

Provide staff with one source of truth for enquiries, qualification, ownership, status and follow-up activity.

## Depends on

M02, M03 and M08.

## Delivered

- Lead search/filter list
- Status/priority/owner/source filtering
- Pipeline board
- Lead detail with M08 brief and estimate
- Structured lead score and score reasons
- Owner assignment
- Priority
- Next action and due date
- Lost reason
- Internal notes
- Follow-up tasks
- Reusable tags
- Stage-change history
- Activity timeline
- Exact-email duplicate detection
- Non-destructive duplicate merge
- Archive/restore
- Staff-only RLS for CRM support tables
- M08 submit function upgraded to populate M09 score fields

## Routes

- `/admin/leads`
- `/admin/leads/[id]`
- `/admin/pipeline`

## Migration

`supabase/migrations/20260922043000_m09_lead_crm.sql`

## Acceptance

Run:

```powershell
npm run db:reset
npm run crm:check
npm run typecheck
npm run build
```

Then submit a new project brief and verify it appears in `/admin/leads`.
