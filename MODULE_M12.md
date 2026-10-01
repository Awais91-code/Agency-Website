# M12 — Email & Notification System

## Goal

Centralize transactional communication and internal alerts with delivery visibility.

## Depends on

M02 and M09. This implementation also connects to the already-completed M08 lead intake and M10 booking flow.

## Delivered

- Resend provider adapter
- Server-only provider credentials
- Reusable branded HTML/text email layout
- Template catalogue for enquiry, booking, invite/reset, onboarding, project updates and admin alerts
- Administrator notification-rule/recipient configuration
- Canonical `email_events` log
- Verified `email_provider_events` webhook log
- Provider message ID/status tracking
- Application + provider idempotency protection
- Safe retry metadata and manual retry UI
- Non-production redirect/allowlist protections
- Admin preview and safe test-send tools
- Automatic lead enquiry confirmation
- Automatic new-lead internal alert
- Automatic booking/cancellation notification
- Automatic booking internal alert
- Delivery events appended to lead activity when linked

## Routes

- `/admin/notifications`
- `POST /api/webhooks/email`

## Migration

`supabase/migrations/20260922072000_m12_email_notifications.sql`

## Safe local apply

```powershell
npx supabase migration up --local
npm install
npm run notifications:check
npm run dev
```

Do not run `npm run db:reset` unless you intentionally want to wipe local database/Auth data.
