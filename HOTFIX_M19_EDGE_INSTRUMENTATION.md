# RC1 Hotfix — Edge Instrumentation Logger

## Symptom

Next.js 16.3.5 warned that `node:crypto` was imported by `src/lib/observability/log.ts`
through `src/instrumentation.ts` while compiling Edge Instrumentation.

## Root cause

M19 used Node's `crypto.createHash()` only to generate a short stack fingerprint.
Next instrumentation can also be compiled for the Edge runtime, where Node core modules are not available.

## Fix

- Removed the `node:crypto` import from the shared observability logger.
- Replaced SHA-256 stack grouping with a deterministic, non-cryptographic pure-JavaScript fingerprint.
- Preserved the existing `stackHash` field and structured log/redaction behavior.
- Bumped package version to `0.19.1`.

The fingerprint is for error grouping only; it is not used for authentication, signatures, secrets or other security decisions.

## Verify

```powershell
npm run release:check
npm run dev
```

Open `/` and confirm the previous `node:crypto ... Edge Runtime` warning is gone.
Then continue the RC checks:

```powershell
npm run typecheck
npm run build
```
