# Development Conventions

## Branches

- `main`: production-ready accepted modules
- `develop`: optional integration branch
- Feature/module branch: `module/MXX-short-name`
- Fix branch: `fix/short-description`

## Commits

Prefer concise conventional prefixes:

- `feat(m01): ...`
- `fix(m01): ...`
- `docs(m01): ...`
- `chore(m01): ...`

## Module boundaries

A later module may extend an earlier contract but should not silently rewrite completed behavior. If an earlier file must change, the patch includes that changed file and explains why in `PATCH_NOTES.md`.

## Required checks

Before accepting a module:

```bash
npm run lint
npm run typecheck
npm run format:check
npm run build
```

Database migrations introduced after M02 are append-only once applied to a shared environment.
