# M18 Security, Privacy, Audit & Abuse Prevention

M18 hardens the cumulative platform rather than replacing earlier module controls.

## Authorization and RLS

Server routes continue to use authenticated role checks. Supabase RLS remains the database boundary.
M18 tightens `audit_logs` from staff-readable to admin/super-admin-readable and adds the same admin-only
RLS boundary for `security_events` and retention-policy metadata.

Run the local isolation suite after applying the migration:

```powershell
npm run security:rls
```

This re-runs the M14 cross-client isolation test and additionally verifies that staff cannot read
admin-only audit/security telemetry while administrators can.

## Public abuse controls

The primary project brief now combines:

- strict Zod validation;
- honeypot field;
- minimum completion time;
- shared database-backed rate limiting with hashed requester identifiers;
- same-origin mutation validation;
- optional Cloudflare Turnstile verification.

The explicit AI-to-CRM handoff also uses same-origin checks, shared rate limiting and Turnstile.
Project-brief draft/estimate and analytics writes use same-origin checks and shared rate limiting.

Turnstile configuration:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
TURNSTILE_REQUIRED="false"
```

For production, configure both keys and set `TURNSTILE_REQUIRED=true` after validating the widget on the
production hostname. Leaving the keys blank locally keeps development usable.

## CSRF / origin controls

Browser mutation APIs reject requests whose `Origin`/`Referer` is outside `NEXT_PUBLIC_APP_URL` and the
optional comma-separated `TRUSTED_APP_ORIGINS` list. Authenticated profile/file/admin-media/invitation
mutation APIs use the same guard. Next.js Server Actions keep their framework origin checks.

Signed webhook/callback endpoints are intentionally exempt from same-origin rules and instead require
provider/application secrets.

## Webhooks and secrets

- Cal.com webhook: HMAC verification.
- Resend webhook: provider signature verification.
- n8n callback/dispatch scheduler secrets: timing-safe equality.
- Browser code receives only `NEXT_PUBLIC_*` values.
- Audit metadata redacts secret-like keys before storage.

Run:

```powershell
npm run security:scan
```

The scan checks common secret patterns and prevents server-only secret environment names from being
referenced in client modules.

## Response headers

`next.config.ts` now sets a baseline including:

- Content Security Policy;
- HSTS in production;
- frame denial / `frame-ancestors 'none'`;
- MIME sniffing protection;
- strict referrer policy;
- permissions policy;
- cross-origin opener/resource policy.

The CSP explicitly permits the integrations used by this project (Supabase, Cal.com, Turnstile and the
optional analytics providers). Re-test CSP whenever a new external browser integration is added.

## Security events

`security_events` stores metadata-only events such as:

- rejected origins;
- rate-limit activation;
- honeypot/too-fast submissions;
- Turnstile failures;
- invalid webhook/callback secrets.

Network address and user-agent values are HMAC-hashed before persistence. Raw passwords, secrets, form
messages and private file contents must never be written to this table.

Admin view:

```text
/admin/security
```

## Audit logs

Critical privileged actions use `recordAuditLog`. M18 adds invitation/media audit coverage and changes
DB read access to admin/super-admin only. The logger redacts metadata keys that look like passwords,
tokens, secrets, authorization values, cookies or private/API keys.

## Retention

Operational defaults:

- security events: 180 days;
- audit logs: 365 days;
- analytics events: 180 days;
- processed booking webhook payloads: 90 days;
- AI conversations: managed by M15's own consent-aware retention lifecycle.

Administrators can review/update policy metadata at `/admin/security`.

Run operational cleanup with:

```powershell
npm run security:retention
```

This cleanup intentionally does not delete CRM leads, client projects or project files.

## Dependency scanning

After dependencies/lockfile are installed and before production release:

```powershell
npm run security:deps
```

Review high-severity findings before release rather than automatically applying major-version upgrades.
