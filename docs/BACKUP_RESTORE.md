# M19 Backup & Restore Verification

## Backup responsibilities

Production recovery should use two layers:

1. **Primary:** managed Supabase/database backup/PITR and the hosting/provider recovery features available on the production plan.
2. **Verification/logical copy:** M19 logical database + Storage bundle used for periodic recovery drills and independent checksum verification.

The M19 bundle is not a substitute for provider-level WAL/PITR or infrastructure snapshots.

## Create a local/disposable backup bundle

With local Supabase running and `.env.local` configured:

```powershell
npm run backup:create -- --local --output .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill

# Windows fallback if npm forwards only positional arguments:
npm run backup:create -- .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

The bundle contains:

```text
database.schema.sql
database.data.sql
database.sql
manifest.json
storage/<bucket>/<object...>
```

`manifest.json` records SHA-256 hashes and byte sizes for the database and each copied Storage object.

The backup directory can contain private customer data. It is gitignored and must be stored only in encrypted, access-controlled backup storage.

## Remote verification

Set a server-only database connection string and Supabase service credentials, then run:

```text
BACKUP_DATABASE_URL
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SECRET_KEY
```

```bash
node scripts/create-backup-bundle.mjs --output ./backups/remote-drill
node scripts/verify-backup-bundle.mjs ./backups/remote-drill
```

`.github/workflows/backup-verify.yml` performs the same checksum exercise on a temporary GitHub runner when these secrets are configured:

```text
BACKUP_DATABASE_URL
BACKUP_SUPABASE_URL
BACKUP_SUPABASE_SECRET_KEY
```

The workflow deletes the sensitive temporary bundle after verification and does not upload it as a GitHub artifact.

## Database restore drill

Perform restore tests only into a new disposable/local/staging database unless an approved production recovery incident explicitly requires production restore.

For a clean PostgreSQL target, use the approved PostgreSQL client and the combined logical SQL dump:

```bash
psql "$RESTORE_DATABASE_URL" -v ON_ERROR_STOP=1 -f ./backups/m19-drill/database.sql
```

Then regenerate/check application types and run migration state checks. Provider-managed backup restores may use a different Supabase dashboard/PITR procedure; follow the provider's current documented recovery process.

## Storage restore drill

Configure a disposable target:

```powershell
$env:RESTORE_SUPABASE_URL="https://your-disposable-project.supabase.co"
$env:RESTORE_SUPABASE_SECRET_KEY="server-secret"
$env:RESTORE_TARGET_ENVIRONMENT="staging"
node scripts/restore-storage-bundle.mjs .\backups\m19-drill --confirm restore-storage
```

The script recreates missing buckets from manifest settings and uploads objects with overwrite enabled.

Production storage restore is blocked by the script unless `ALLOW_PRODUCTION_RESTORE=true`, which should only be used during an approved recovery procedure.

## Recovery verification checklist

After restoring into the disposable target:

- [ ] Public/content database rows are present.
- [ ] Auth recovery approach is confirmed through the provider-level backup process.
- [ ] Public and private Storage objects open under the expected authorization rules.
- [ ] RLS/security tests pass.
- [ ] Project brief submission creates a lead.
- [ ] Admin/client permission boundaries pass.
- [ ] `/api/health` is OK.
- [ ] Post-deploy smoke test passes.

## Required handover evidence

Before final handover, record one completed restore drill in the release/handover notes with:

```text
Date:
Operator:
Source backup timestamp:
Disposable restore target:
Database restore result:
Storage restore result:
RLS/E2E result:
Smoke result:
Issues/actions:
```

Do not mark the restore requirement complete until the drill has actually been run.


## RC3 Windows CLI compatibility

On Windows, the local Supabase executable may be exposed through the npm-generated
`node_modules\.bin\supabase.cmd` shim. Node's direct `spawnSync()` cannot reliably
launch that shim, which previously produced a blank `Supabase database dump failed`
message.

RC3 now:

- prefers the real `supabase.exe` when installed;
- safely invokes `.cmd`/`.bat` shims through Windows PowerShell when necessary;
- reports process-launch errors explicitly;
- accepts the backup output directory as a positional fallback when npm consumes
  named flags but forwards their path value.

If the backup still fails after RC3, first verify local Supabase itself:

```powershell
npx supabase status
npx supabase db dump --local --file .\backups\manual-test.sql
```

A failure from those commands is a Supabase/Docker/local-database issue rather than
the backup wrapper.


## RC4 PowerShell runner

RC3 revealed a Windows PowerShell 5.1 binding issue in the inline `-Command`
shim invocation. RC4 uses a static `scripts/lib/run-command.ps1` helper instead.

The Supabase CLI argument array is transported as base64-encoded JSON and then
safely splatted into the `.cmd` shim. This avoids shell-string interpolation and
prevents `--local`, `--file`, paths, or database URL values from being consumed
by PowerShell itself.
