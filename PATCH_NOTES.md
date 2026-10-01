# Patch Notes — RC2 TypeScript / Production Build Hotfix

Apply over **M01–M19 + RC1 Edge Instrumentation Hotfix**.

This patch fixes the 25 TypeScript errors reported by `npm run typecheck` / `npm run build` in:

- AI admin settings nullability
- project admin nullability
- project activity JSON metadata typing
- blog archive Button variant typing
- AI message array inference
- Resend provider payload JSON persistence

Package version: `0.19.2`.

No database migration. No deleted or renamed files.

After copy/replace:

```powershell
npm run typecheck
npm run build
```
