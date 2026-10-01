# Run / Verify M08

Apply the patch on top of M01–M07, then from the project root:

```powershell
npm install
npm run dev
```

Public project brief:

```text
http://localhost:3000/start-a-project
```

Estimate-rule admin:

```text
http://localhost:3000/admin/quote-rules
```

## Database

M08 requires Supabase for server draft sync, estimate rules and final lead creation.

When Docker Desktop / local Supabase is healthy:

```powershell
npm run db:start
npm run db:reset
```

Then start the app:

```powershell
npm run dev
```

`db:reset` reapplies all append-only migrations and loads development estimate rules.

## M08 verification

```powershell
npm run quote:check
npm run db:check
npm run auth:check
npm run media:check
npm run marketing:check
npm run services:check
npm run work:check
npm run typecheck
npm run build
```

## Manual test

1. Open `/start-a-project`.
2. Select a project type and at least one optional feature.
3. Enter a business objective, timing and budget.
4. Enter contact details and requirements.
5. Confirm that the review step displays an indicative range.
6. Accept the privacy notice and submit.
7. Verify the browser redirects to `/quote/success`.
8. In Supabase, confirm one `project_briefs` row is submitted, one `leads` row references the brief in metadata, and one `estimate_results` snapshot exists.
9. Retry the final request/browser action and confirm it does not create a second lead for the same submitted brief.

## Docker note

If `supabase start` reports Docker Desktop `meta.db` input/output errors or Docker engine 500 errors, fix Docker/WSL first. Those are local container-runtime failures rather than M08 application errors.


## M09 CRM verification

After the M09 migration is applied:

```powershell
npm run crm:check
npm run typecheck
npm run build
```

Open:

```text
http://localhost:3000/admin/leads
http://localhost:3000/admin/pipeline
```


## M10 booking verification

Apply the new migration without resetting local Auth:

```powershell
npx supabase migration up --local
npm run booking:check
npm run dev
```

Open:

```text
http://localhost:3000/book
http://localhost:3000/admin/bookings
```

Then configure the event URLs in Admin → Bookings.


## M11 CMS verification

Apply the new migration without resetting local Auth:

```powershell
npx supabase migration up --local
npm run cms:check
npm run dev
```

Open:

```text
http://localhost:3000/admin
http://localhost:3000/admin/content
http://localhost:3000/admin/settings
http://localhost:3000/admin/audit
```


## M12 notification verification

Apply the new migration without resetting local Auth, then install the new provider dependency:

```powershell
npx supabase migration up --local
npm install
npm run notifications:check
npm run dev
```

Open:

```text
http://localhost:3000/admin/notifications
```

For safe local email testing, configure `EMAIL_DEV_REDIRECT_TO` before adding a Resend API key.


## M13 automation verification
```powershell
npx supabase migration up --local
npm run automation:check
npm run dev
```
Open `/admin/automation-logs` and `/api/automation/health`. Import workflows from `automation/n8n/workflows/v1/`.


## M14 client portal verification

```powershell
npx supabase migration up --local
npm run portal:check
npm run portal:isolation
npm run dev
```

Open:
```text
http://localhost:3000/admin/projects
http://localhost:3000/portal
http://localhost:3000/portal/files
```


## M15 AI assistant verification

Apply without resetting local Auth:

```powershell
npx supabase migration up --local
npm run ai:check
npm run ai:guardrails
npm run dev
```

Open a public page and use the **Ask AI** button.

Admin:

```text
http://localhost:3000/admin/ai
```

Provider configuration:

```env
OPENAI_API_KEY=""
AI_REQUEST_HASH_SECRET=""
```

If `OPENAI_API_KEY` is blank, the assistant uses approved-content fallback mode.

Retention cleanup:

```powershell
npm run ai:cleanup
```


## M16 blog verification

```powershell
npx supabase migration up --local
npm run blog:check
npm run dev
```

Open:

```text
http://localhost:3000/blog
http://localhost:3000/admin/blog
http://localhost:3000/sitemap.xml
http://localhost:3000/robots.txt
http://localhost:3000/blog/rss.xml
```

Before production, make sure `NEXT_PUBLIC_APP_URL` is the real canonical production origin.


## M17 analytics verification

Apply the migration without resetting local Auth:

```powershell
npx supabase migration up --local
npm run analytics:check
npm run dev
```

Open:

```text
http://localhost:3000/admin/analytics
```

Recommended local settings:

```env
ANALYTICS_PROVIDER="internal"
ANALYTICS_ENVIRONMENT="development"
ANALYTICS_CONSENT_REQUIRED="true"
ANALYTICS_ENABLE_IN_NON_PRODUCTION="true"
```

For production, set `ANALYTICS_ENVIRONMENT="production"` and configure an optional provider only if desired.


## M18 security verification

```powershell
npx supabase migration up --local
npm run security:check
npm run security:scan
npm run dev
```

Admin:

```text
http://localhost:3000/admin/security
http://localhost:3000/admin/audit
```

Optional local RLS/isolation test:

```powershell
npm run security:rls
```

Operational retention cleanup:

```powershell
npm run security:retention
```

Recommended production configuration:

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY="<production-site-key>"
TURNSTILE_SECRET_KEY="<server-only-secret>"
TURNSTILE_REQUIRED="true"
SECURITY_HASH_SECRET="<long-random-server-secret>"
TRUSTED_APP_ORIGINS=""
```

Do not run `db:reset` unless you intentionally want to recreate local Auth/data.


## M19 final release verification

M19 has no database migration.

Static/release regression:

```powershell
npm run release:check
npm run check
```

Critical local E2E requires local Supabase plus the app:

```powershell
npm run db:start
npm run db:reset
# Only on a clean clone with no .env.local: npm run ci:env
npm run dev
```

In a second terminal:

```powershell
npm run smoke
npm run e2e:critical
npm run perf:check
```

Local backup/recovery-drill bundle:

```powershell
npm run backup:create -- --local --output .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

Public health:

```text
http://localhost:3000/api/health
```

Before production, complete:

```text
docs/SECURITY_RELEASE_CHECKLIST.md
docs/RELEASE_CHECKLIST.md
docs/BACKUP_RESTORE.md
docs/HANDOVER.md
```

The restore-drill checkbox must not be marked complete until an actual disposable-target restore has been performed.


## RC3 Windows backup compatibility

If the normal M19 command is altered by npm on Windows, the backup script also accepts
the output directory positionally:

```powershell
npm run backup:create -- .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

Before creating a local bundle, confirm the local stack is running:

```powershell
npx supabase status
```


## RC4 Windows backup runner

After applying RC4:

```powershell
npm run backup:test
npx supabase status
npm run backup:create -- --local --output .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

RC4 uses a static PowerShell runner for the Windows `supabase.cmd` npm shim.
