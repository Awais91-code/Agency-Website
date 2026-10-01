# RC4 — Windows Backup PowerShell Runner Hotfix

Apply over M01–M19 + RC1 + RC2 + RC3.

## Root cause

RC3 correctly detected the Windows npm Supabase shim (`supabase.cmd`), but used
an inline `powershell.exe -Command` wrapper. On Windows PowerShell 5.1 the
remaining process arguments were not bound as expected, so `$cmd` was not a
valid invokable command object and backup creation stopped before the first dump.

## Fix

RC4 replaces the inline `-Command` wrapper with a static script:

```text
scripts/lib/run-command.ps1
```

Node passes only:

1. the exact Supabase shim path; and
2. a base64-encoded JSON array containing the Supabase CLI arguments.

The PowerShell script decodes the array and invokes the shim with PowerShell's
argument splatting. Supabase flags such as `--local`, `--file`, database URLs
and Windows paths are therefore not re-parsed as PowerShell command parameters.

The native `supabase.exe` path is still preferred whenever it exists.

## Version

`0.19.4`

## Database changes

None.

## Delete / rename

None.

## Verify

```powershell
npm run backup:test
npx supabase status

npm run backup:create -- --local --output .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

Because some npm/Windows combinations forward only the output path, this remains
supported too:

```powershell
npm run backup:create -- .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```
