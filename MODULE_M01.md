# M01 — Project Foundation, Environments and Design System

## Goal

Create the technical and visual base every later module can build on without re-bootstrapping the project.

## Acceptance checklist

- [x] Next.js + TypeScript application bootstrap
- [x] Tailwind CSS + shadcn-style local UI component base
- [x] Typography, spacing, radius, color and responsive design tokens
- [x] Header/footer application shell
- [x] Loading, empty, error and not-found state patterns
- [x] Local/staging/production-friendly environment convention
- [x] Shared site configuration and feature flags
- [x] Linting, formatting and type-checking configuration
- [x] CI baseline
- [x] Health/config check endpoint without sensitive diagnostics
- [x] Run and patch handoff documentation

## Interfaces reserved for later modules

- `src/config/feature-flags.ts` — later modules enable only their feature flag.
- `src/config/env.ts` — later modules extend the schema for their server/public variables.
- `src/components/ui/*` — reusable design primitives; later modules should compose rather than duplicate.
- `src/components/layout/*` — public shell; M05 may replace/extend navigation and footer content.
- `src/app/api/health/route.ts` — remains minimal and must not expose secrets or infrastructure details.

## Handoff

M02 can now add Supabase/Postgres configuration, migrations, seed strategy, database clients and shared backend conventions.
