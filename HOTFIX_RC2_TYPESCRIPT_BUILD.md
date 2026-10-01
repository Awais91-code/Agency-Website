# RC2 — TypeScript / Production Build Hotfix

Version: `0.19.2`

This patch resolves the 25 TypeScript errors reported after RC1.

## Fixed

- AI admin settings are narrowed to a guaranteed non-null settings row before rendering.
- AI message grouping uses an explicit `ai_messages` database row type instead of an inferred `never[]`.
- Admin project loading guarantees a non-null project row before returning project data.
- Project activity metadata uses the generated database `Json` type.
- Blog archive action uses a supported Button variant with destructive visual styling.
- Resend provider responses are normalized to JSON-safe plain values before being stored in `email_events`.

## Database

No migration is required.

## Files deleted / renamed

None.

## Verify

```powershell
npm run typecheck
npm run build
```
