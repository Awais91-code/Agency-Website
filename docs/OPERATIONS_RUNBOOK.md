# M19 Operations Runbook

## Public status

```text
GET /api/health
```

The endpoint returns only high-level state:

- service name;
- environment;
- release identifier;
- database status;
- database latency.

Raw database/provider error messages are deliberately excluded.

## Structured server logs

M19 emits JSON log records containing fields such as:

```text
timestamp
level
event
service
environment
release
path
routePath
error.digest
error.stackHash
```

Sensitive-looking keys are redacted. Production error details use a digest/stack hash instead of returning raw stack/message data to visitors.

Set:

```env
LOG_LEVEL="info"
APP_RELEASE="release-id"
```

Hosting log drains can forward these JSON lines to the approved monitoring platform without code changes.

## Uptime monitoring

`.github/workflows/uptime.yml` checks production `/api/health` every 15 minutes when `PRODUCTION_APP_URL` is configured as a repository secret.

For higher reliability, configure an independent external uptime provider as well; GitHub scheduled workflows are a secondary check and are not an SLA-grade scheduler.

## Incident priorities

### P1 — Security or data exposure

1. Restrict/disable affected public endpoint or integration.
2. Rotate compromised credentials immediately.
3. Preserve relevant audit/security logs.
4. Identify release and request/error reference.
5. Determine affected records/time window.
6. Follow notification/legal obligations applicable to the organization.
7. Patch in staging, verify, then release.

See `docs/INCIDENT_RESPONSE.md` for the M18 security-focused procedure.

### P1 — Site unavailable / database unavailable

1. Check `/api/health` and hosting status.
2. Check Supabase project/database status.
3. Identify the latest release ID.
4. Stop additional production migrations/deployments.
5. If application regression: redeploy previous compatible release.
6. If database incident: use provider recovery/PITR procedures; do not reset production.
7. Run post-recovery smoke tests.

### P2 — Conversion flow degraded

Check in order:

- project brief API/errors;
- CRM lead creation;
- booking handoff/webhook status;
- notification failures;
- automation logs;
- analytics conversion counts.

Do not repeatedly resubmit real customer enquiries while diagnosing.

## Credential routine

Maintain an owner and rotation process for:

- Supabase secret/service credentials;
- deployment provider credentials/hooks;
- email provider API/webhook secrets;
- booking webhook secret;
- n8n secrets;
- OpenAI/API provider secrets;
- Turnstile secret;
- GitHub Actions deployment/backup secrets.

Never paste secrets into tickets, screenshots, commits or public logs.

## Domain/DNS routine

Record and periodically verify:

- registrar owner/access;
- DNS provider owner/access;
- canonical production domain;
- TLS status;
- required verification/MX/TXT records;
- redirects from retired domains;
- `NEXT_PUBLIC_APP_URL` canonical value.

## Weekly maintenance

- Review failed GitHub Actions runs.
- Review admin security events/audit logs.
- Review automation/email failures.
- Confirm uptime checks are running.
- Review dependency vulnerability workflow results.

## Monthly maintenance

- Confirm provider backup/PITR status.
- Review backup verification workflow.
- Review storage growth and private/public bucket policy.
- Review stale admin/staff/client access.
- Review analytics retention/security retention jobs.
- Confirm production release/runbook contacts remain current.
