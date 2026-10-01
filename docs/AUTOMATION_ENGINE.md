# M13 Automation Engine & n8n Workflows

The application remains authoritative for validation, lead/brief transactions, booking synchronization,
email idempotency and permissions. n8n handles cross-system orchestration.

Core tables: `automation_workflows`, `automation_events`, `automation_runs`, `automation_dead_letters`.

Current triggers:
- `lead.created` → `lead.new-project-enquiry`
- `meeting.scheduled` → `meeting.booked`
- `lead.no_booking_due` → `lead.no-booking-followup`
- `automation.dead_letter` → `automation.failure`

Endpoints:
- `POST /api/automation/dispatch`
- `POST /api/automation/callback`
- `GET /api/automation/health`
- `POST /api/automation/schedule/no-booking?delayHours=48`

Production dispatch/scheduler calls require `AUTOMATION_DISPATCH_SECRET`.
n8n receives `x-agency-automation-secret`; callbacks require `x-agency-callback-secret`.
Retries use exponential backoff. Exhausted/non-retryable failures go to the dead-letter/manual-review
path and can trigger M12 admin alerts.

Import versioned starter workflows from `automation/n8n/workflows/v1/`.

Apply:
```powershell
npx supabase migration up --local
npm run automation:check
npm run dev
```
