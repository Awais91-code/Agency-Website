# M18 — Security, Privacy, Audit & Abuse Prevention

## Goal

Apply a consistent security/privacy baseline across public, admin, automation and client-facing functionality.

## Delivered

- admin-only audit-log RLS hardening
- admin-only security event telemetry
- HMAC-hashed abuse fingerprints
- database-backed shared rate limiting
- Turnstile integration for lead-creating public actions
- same-origin mutation validation
- CSP/HSTS/referrer/permissions/cross-origin response headers
- timing-safe application-secret comparison
- webhook/callback failure telemetry
- secret-like audit metadata redaction
- additional privileged invitation/media audit events
- retention-policy metadata and cleanup RPC
- `/admin/security`
- cross-client/admin-boundary RLS test
- source/secret scanner
- dependency-audit command
- incident-response basics
- production security release checklist

## Migration

`supabase/migrations/20260923165000_m18_security_privacy.sql`
