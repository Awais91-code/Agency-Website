# M19 Deployment & Release Procedure

## Environments

The same repository supports:

- `preview` — pull-request/review validation;
- `staging` — integration and acceptance;
- `production` — live traffic.

Use separate Supabase projects, provider credentials and domains for staging and production.

## GitHub Actions

### CI

`.github/workflows/ci.yml`

Every PR/push performs a clean dependency install, full static regression/build, starts a fresh local Supabase stack, rebuilds all migrations/seed data, runs critical conversion/permission E2E and checks a lightweight performance budget.

### Release

`.github/workflows/release.yml`

Manual release workflow inputs:

```text
environment: preview | staging | production
apply_migrations: true | false
```

Create GitHub Environments named `preview`, `staging`, and `production`. Configure these environment secrets:

```text
APP_URL
DEPLOY_HOOK_URL
SUPABASE_ACCESS_TOKEN        # needed only when workflow applies migrations
SUPABASE_PROJECT_REF         # needed only when workflow applies migrations
SUPABASE_DB_PASSWORD         # needed only when workflow applies migrations
```

`DEPLOY_HOOK_URL` is intentionally provider-neutral. It can point to an approved Vercel/Netlify/Cloudflare/other deployment hook.

Production should use GitHub Environment protection/required reviewers.

## Application release metadata

Set at deployment time:

```env
APP_RELEASE="git-sha-or-release-tag"
LOG_LEVEL="info"
```

`APP_RELEASE` is returned by `/api/health` and included in structured server logs, allowing a failing request to be correlated to a deployed revision without exposing application secrets.

## Database release procedure

Migrations are forward-only after they reach shared staging/production.

Before a production schema release:

1. Verify provider backup/PITR status.
2. Run staging migration from the same commit.
3. Run staging smoke/E2E acceptance.
4. Review migration SQL for locks, destructive statements and data backfills.
5. Record the expected forward-fix/rollback approach.
6. Apply with the release workflow only after approval.

The workflow uses:

```bash
npx supabase link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
npx supabase migration list
npx supabase db push
```

Never run `supabase db reset` against staging/production.

### Rollback principle

Application rollback and database rollback are different:

- Application: redeploy the previous known-good commit when schema remains backward-compatible.
- Database: prefer a new forward migration that restores compatibility/data shape.
- Destructive reverse SQL is a last resort and must be tested against a restored backup first.

Design migrations with an expand/migrate/contract sequence when removing or renaming important columns.

## Post-deploy gates

The release workflow automatically runs:

```bash
npm run smoke
npm run perf:check
```

A release is not accepted if public health stays degraded, required public routes fail, or the agreed performance budget is exceeded.

## Production environment variables

Hosting/provider secret stores remain authoritative. `.env.local` is never deployed or committed.

At minimum verify:

- canonical application URL;
- Supabase URL/publishable/secret keys;
- email/webhook/provider secrets used by enabled modules;
- M18 security hash/Turnstile configuration;
- M19 release metadata;
- selected analytics configuration.

Use `docs/RELEASE_CHECKLIST.md` before each production release.
