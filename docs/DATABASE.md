# Database Workflow — M02

M02 establishes Supabase/PostgreSQL as the canonical data platform. The application database is the source of truth; later n8n workflows orchestrate external actions but do not replace database integrity.

## Local development

Prerequisites:

1. Node.js 22+
2. Docker Desktop (or another Docker-compatible runtime)
3. Project dependencies installed with `npm install`

Start the local Supabase stack:

```bash
npm run db:start
```

The first start downloads containers and may take several minutes. Check the printed output for the local Project URL, publishable key and secret key. Put those values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_SECRET_KEY="sb_secret_..."
```

Then reset the local database so every migration and the seed file are applied from scratch:

```bash
npm run db:reset
```

Supabase Studio is available on the local Studio URL printed by `npm run db:start` (normally port 54323).

## Core M02 schema

- `profiles` — base application profile linked to `auth.users`; M03 adds role and access rules.
- `leads` — minimal canonical enquiry record; M08/M09 extend brief, scoring and CRM fields.
- `projects` — minimal project record; M14 expands client workspace data.
- `content_records` — common publishing/reference metadata for later CMS modules.
- `activity_events` — append-oriented event trail shared by operational modules.
- Enums: `lead_status`, `project_status`, `content_status`.

Every mutable core table uses UTC timestamps and an `updated_at` trigger. Public-facing UUIDs are non-sequential. RLS is enabled immediately and M02 grants no table access to `anon` or `authenticated`; M03 introduces explicit policies.

## Migration rules

Migration files live in `supabase/migrations/` and use:

```text
YYYYMMDDHHMMSS_description.sql
```

After a migration has reached a shared staging/production environment, treat it as append-only. Never edit migration history to fix a later problem; create a new migration.

Create a migration:

```bash
npx supabase migration new short_description
```

Static patch validation:

```bash
npm run db:check
```

Validate the live local schema once Supabase is running:

```bash
npm run db:lint
```

Rebuild the local DB from migration history:

```bash
npm run db:reset
```

## Generate TypeScript types

After schema changes:

```bash
npm run db:types
```

M02 ships a checked-in type file so the project has types before the first local generation. Once a local/linked project is authoritative, regenerate types after each schema change and include the changed type file in the same patch.

## Remote staging/production

Use separate Supabase projects for staging and production. Never share production keys with local or staging environments.

Typical remote workflow after review:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list
npx supabase db push
```

Do not run destructive reset commands against a production project. Apply migrations forward and keep backups/rollback planning for release modules.

## Security boundary

`SUPABASE_SECRET_KEY` bypasses Row Level Security. It is used only by server-side admin code after application authorization/validation. Never prefix it with `NEXT_PUBLIC_`, expose it in browser code, log it, or commit it.
