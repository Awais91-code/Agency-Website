# M17 — Analytics & Conversion Tracking

## Goal

Measure whether the site converts visitors into qualified leads without collecting unnecessary data.

## Depends on

M05, M08, M09 and M10.

## Delivered

- first-party conversion event store
- environment-scoped analytics
- optional Plausible / GA4 browser provider loading
- consent-aware browser tracking
- primary CTA taxonomy
- project brief start/step/submit tracking
- contact submit tracking
- booking click/complete tracking
- case-study view/CTA tracking
- first-touch UTM/referrer capture
- attribution fields on CRM leads
- M08 attribution backfill
- project-brief and AI handoff attribution
- idempotent authoritative server conversion events
- `/admin/analytics` conversion summary
- optional external dashboard link
- strict public analytics payload allowlist
- documented event map and structural/data-minimization checker

## Migration

`supabase/migrations/20260923152000_m17_analytics_conversion.sql`
