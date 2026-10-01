# M13 n8n workflow exports

Import JSON files from `workflows/v1/`. Before activation set:
- `N8N_AGENCY_WEBHOOK_SECRET` = app `N8N_WEBHOOK_SECRET`
- `N8N_AGENCY_CALLBACK_SECRET` = app `N8N_CALLBACK_SECRET`

Keep core data integrity in the Next.js/Supabase application. Extend these workflows only for
cross-system orchestration while preserving the versioned event/callback contracts.
