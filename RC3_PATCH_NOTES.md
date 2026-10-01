# RC3 — Windows Backup CLI Hotfix

Apply over M01–M19 + RC1 + RC2.

## Fixes

- Handles the Windows npm `supabase.cmd` shim safely.
- Prefers the native Supabase executable when available.
- Reports `spawnSync`/launch errors instead of an empty dump failure.
- Honors a positional backup output path when npm consumes `--local --output`
  but still forwards the path value.
- Extends `backup:test` with CLI argument compatibility tests.

## No database changes

No migration is included.

## Delete / rename

None.

## Verify

```powershell
npm run backup:test
npx supabase status

npm run backup:create -- --local --output .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```

If npm still strips the named options, use:

```powershell
npm run backup:create -- .\backups\m19-drill
npm run backup:verify -- .\backups\m19-drill
```
