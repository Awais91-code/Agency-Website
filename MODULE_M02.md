# M02 — Data Platform and Core Backend

## Goal

Establish the Supabase/PostgreSQL data layer, migration workflow, backend client conventions, validation helpers and baseline domain schema before feature modules add business-specific data.

## Dependencies

- M01 — Project Foundation, Environments and Design System

## Included

- Supabase CLI project configuration
- Timestamped core SQL migration
- Safe local seed data
- Base tables for profiles, leads, projects, content references and activity events
- Shared lifecycle enums and indexes
- RLS enabled from day one with closed-by-default access
- Server-only Supabase admin client
- Database connectivity health check
- Shared API response contract
- Shared Zod validation helpers
- Checked-in TypeScript database types
- Migration filename/static safety validation in CI
- Local/staging/production database workflow documentation

## Deliberately deferred

- User login, invitation, password reset and session clients → M03
- Role tables and explicit client/staff RLS policies → M03
- Storage/media buckets → M04
- Detailed project brief and quote schema → M08
- Full lead CRM/assignment/scoring → M09
- Full client/project workspace → M14
- n8n orchestration → M13

## Security posture

M02 enables RLS on every application table and removes direct `anon`/`authenticated` table privileges. The server secret key is allowed only in `server-only` code. This means later modules must add explicit access policies rather than inheriting accidental public access.

## Acceptance criteria mapping

1. **Fresh DB reproducible:** `npm run db:reset` applies migration + seed.
2. **Safe demo data:** seed uses reserved `.test` email data only.
3. **Secrets server-only:** `SUPABASE_SECRET_KEY` has no public prefix and admin client imports `server-only`.
4. **Reusable DB patterns:** `src/lib/db/*`, `src/lib/api/*`, `src/lib/validation/*` are the shared baseline.
5. **CI baseline:** `npm run db:check` validates migration structure without requiring Docker.
6. **Runtime observability:** `/api/health` reports database `ok`, `unconfigured` or `error` without leaking credentials.
