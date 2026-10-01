# M19 — QA, Deployment, Monitoring & Release Operations

## Goal

Make the completed platform reproducible to test, deploy, observe, back up and recover after launch.

## Depends on

All release modules M01–M18.

## Delivered

- full CI regression plus production build
- fresh-Supabase critical E2E job
- conversion lifecycle E2E
- RLS/permission E2E integration
- provider-neutral preview/staging/production release workflow
- optional forward-only Supabase migration step
- post-deploy smoke test
- lightweight performance regression budget
- sanitized `/api/health`
- structured server error logging with release/digest/stack fingerprints
- scheduled uptime workflow
- scheduled dependency/security maintenance workflow
- logical database + Storage backup bundle tooling
- checksum backup verification
- guarded Storage restore drill tooling
- scheduled backup-verification workflow
- deployment/database rollback procedure
- operations/incident runbook
- production release checklist
- final handover checklist

## Database migration

None. M19 owns operational configuration and release artifacts rather than new business tables.
