# M19 Production Release Checklist

## Code and QA

- [ ] Release commit/tag is identified.
- [ ] `npm run check` passes from a clean checkout.
- [ ] Fresh local database migration reset passes in a disposable environment.
- [ ] `npm run e2e:critical` passes.
- [ ] Staging smoke test passes.
- [ ] Staging performance budget passes.
- [ ] M18 security release checklist is complete.

## Database and backup

- [ ] Pending migration SQL has been reviewed.
- [ ] Destructive/backfill/lock risk has been reviewed.
- [ ] Production backup/PITR status is confirmed.
- [ ] Database rollback/forward-fix strategy is written down.
- [ ] A restore drill has been completed at least once before final handover.

## Environment and secrets

- [ ] Production `NEXT_PUBLIC_APP_URL` is canonical HTTPS domain.
- [ ] Production Supabase project is not shared with staging/local.
- [ ] `APP_RELEASE` is set to the deployed tag/SHA.
- [ ] Secret keys are server-only.
- [ ] Turnstile/security settings match M18 release policy.
- [ ] Provider webhook secrets/signatures are configured.
- [ ] Analytics consent/provider settings are intentional.

## Deployment and operations

- [ ] Production GitHub Environment requires approval where appropriate.
- [ ] Production deploy hook is configured.
- [ ] `PRODUCTION_APP_URL` uptime secret is configured.
- [ ] Backup verification workflow secrets are configured or an equivalent provider process is documented.
- [ ] Operational owner/on-call contact is known.
- [ ] Domain/DNS/TLS status is healthy.

## Post-deploy

- [ ] `/api/health` reports `ok`.
- [ ] `npm run smoke` passes against production.
- [ ] `npm run perf:check` passes against production budget.
- [ ] Login/admin/client portal routes behave correctly.
- [ ] Project intake can be tested safely according to production test policy.
- [ ] Error logs show the correct `APP_RELEASE`.
- [ ] No unexpected security/automation/email failures appear after release.
