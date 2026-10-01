# M10 — Consultation Booking

## Goal

Allow prospects/leads to book a consultation while keeping provider bookings tied to the correct CRM record.

## Depends on

M05 and M09. The M08 submission flow is enhanced with a safe booking handoff token.

## Delivered

- `/book` public booking experience
- service-aware meeting types
- opaque lead-context handoff
- scheduler fallback route
- `/admin/bookings` booking configuration
- canonical meetings table
- booking webhook event log
- HMAC webhook verification support
- webhook idempotency
- attendee-email fallback lead matching
- lead stage synchronization
- reschedule/cancel-ready meeting upserts
- meeting cards on lead detail
- quote-success booking CTA

## Migration

`supabase/migrations/20260922052000_m10_consultation_booking.sql`

## Apply without deleting your local admin

```powershell
npx supabase migration up --local
npm run booking:check
npm run dev
```

Do not use `npm run db:reset` unless you intentionally want to wipe/reseed local data and recreate local Auth users.
