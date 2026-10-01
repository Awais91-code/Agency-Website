# M19 QA & Test Strategy

M19 turns the completed modules into a releaseable system with repeatable static, integration, end-to-end and post-deploy checks.

## Test layers

### 1. Static regression

Run on every pull request and push to `main` / `develop`:

```bash
npm run check
```

This includes linting, type checking, formatting checks, migration validation, every module structural checker, AI guardrails, analytics/security checks and a production Next.js build.

### 2. Local database integration

CI starts a fresh local Supabase stack and rebuilds it from all checked-in migrations plus `supabase/seed.sql`.

The CI environment file is generated from `supabase status -o env` without printing credentials:

```bash
npm run ci:env
```

### 3. Critical E2E flow

```bash
npm run e2e:critical
```

This is an HTTP + database end-to-end test, not a mocked unit test. It verifies:

- `/api/health` is ready;
- unauthenticated `/admin` redirects to login;
- project brief draft is accepted;
- estimate is calculated from seeded pricing rules;
- project brief submit creates the canonical CRM lead;
- UTM attribution is preserved on the lead;
- submitted brief is linked to that lead;
- booking handoff is created;
- server-side `project_brief_submit` analytics event is created;
- the M18 cross-client/admin RLS permission suite passes.

The generated E2E lead/brief records are removed after the run.

### 4. Post-deploy smoke

```bash
M19_SMOKE_BASE_URL=https://example.com npm run smoke
```

The smoke suite retries while a deployment warms up and checks:

- public health;
- home;
- services;
- work;
- blog;
- project brief entry page;
- robots.txt;
- sitemap.xml.

The public health payload is also checked for obvious secret-like diagnostic keys.

### 5. Performance regression budget

```bash
M19_SMOKE_BASE_URL=https://example.com npm run perf:check
```

Default lightweight budgets:

- maximum response time: 2500 ms per checked public page;
- maximum HTML response size: 700 KB.

CI/release workflows can override these using:

```text
PERF_MAX_RESPONSE_MS
PERF_MAX_HTML_KB
```

This is intentionally a stable server/page-weight gate. Browser Core Web Vitals should also be monitored in the selected production analytics/observability provider after launch.

## Required pre-release sequence

1. `npm install`
2. `npm run check`
3. Fresh local Supabase migration reset in a disposable environment
4. `npm run smoke`
5. `npm run e2e:critical`
6. `npm run perf:check`
7. Staging deployment
8. Post-deploy smoke/performance checks
9. Production approval and deployment

## Test data rules

- Automated identities use the reserved `.test` domain.
- CI must never use production credentials.
- E2E tests may create temporary local/staging rows and must clean them up.
- Production E2E must not submit synthetic leads unless a separately approved production test account/process exists.
