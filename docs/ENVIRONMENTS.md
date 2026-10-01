# Environment Strategy

The project uses the same codebase in three environments with separate configuration and credentials.

## Local

Purpose: individual development.

- Configuration file: `.env.local` copied from `.env.example`.
- Data: synthetic/demo only.
- Supabase: local Docker stack is recommended for database/auth/storage development.
- External providers: development/test accounts only.
- Never commit `.env.local`.

## Staging

Purpose: integration testing, QA and stakeholder review.

- Separate Supabase project from production.
- Separate storage/auth data, webhook URLs and provider credentials.
- Test or anonymized data only.
- Preview/staging domain must be clearly identifiable.

## Production

Purpose: live visitors, leads and clients.

- Production-only database, storage and provider credentials.
- Secrets live in hosting/provider secret stores, never in source code.
- Backups, monitoring and restricted access are required before launch.
- `/api/health` returns a degraded/503 state if the production database is not configured or cannot be reached.

## Variables

| Variable | Visibility | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Browser-safe | Display/product name |
| `NEXT_PUBLIC_APP_URL` | Browser-safe | Canonical application URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-safe | Supabase API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe | Low-privilege key used with RLS |
| `SUPABASE_SECRET_KEY` | **Server-only** | Elevated backend key; bypasses RLS |

## Variable rules

- `NEXT_PUBLIC_*` variables are browser-visible. Never place secrets in them.
- `SUPABASE_SECRET_KEY` must only be imported through server-only modules.
- Supabase variables are optional as a complete group during UI-only local work, but partial configuration is rejected.
- Every new variable must be added to `.env.example` with a safe placeholder and documented in that module's patch notes.
- Staging and production must use different keys/projects.
