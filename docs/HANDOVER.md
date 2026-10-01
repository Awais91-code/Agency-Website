# M19 Handover Notes

## System status

The project is organized as modules M01–M19. M19 is the release/operations layer and intentionally does not introduce a new business-table migration.

## Handover package

The repository should include:

- all Supabase migrations and seed data;
- `.env.example` only (never real secrets);
- module documentation M01–M19;
- GitHub Actions CI/release/uptime/backup-maintenance workflows;
- static/regression checks;
- critical conversion/permission E2E script;
- post-deploy smoke/performance scripts;
- security/privacy release checklist;
- deployment procedure;
- backup/restore procedure;
- incident/operations runbook.

## Access ownership to transfer

Record named owners outside this repository for:

- GitHub organization/repository;
- deployment/hosting provider;
- production/staging Supabase projects;
- domain registrar and DNS;
- email provider;
- booking provider;
- n8n/automation host;
- OpenAI/AI provider account;
- analytics/monitoring services;
- backup/PITR controls.

Do not put passwords/API secrets into this handover document.

## Final handover validation

- [ ] Clean clone/install succeeds.
- [ ] CI is green on the handover commit.
- [ ] Staging release workflow succeeds.
- [ ] Production release process has an approved owner.
- [ ] Production uptime check is enabled.
- [ ] Backup verification workflow/provider backup is enabled.
- [ ] A real restore drill has been completed and recorded.
- [ ] Critical E2E passes in disposable local/staging environment.
- [ ] Security release checklist is signed off.
- [ ] Current production release/tag is recorded.

## Restore drill record

Complete this after the actual drill:

```text
Date:
Operator:
Backup source/timestamp:
Restore target:
Database restore: PASS / FAIL
Storage restore: PASS / FAIL
Security/RLS E2E: PASS / FAIL
Smoke test: PASS / FAIL
Notes:
```

## Known operational principle

Database migrations are forward-only in shared environments. Application rollback is allowed only when the earlier application remains compatible with the already-applied schema. Database recovery uses a tested forward-fix or an approved provider backup/PITR procedure.
