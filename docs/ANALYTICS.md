# M17 Analytics & Conversion Tracking

M17 measures whether the public site moves visitors toward qualified enquiries while minimizing collected data.

## Event taxonomy

The approved event map is:

```text
tests/analytics/m17-event-map.json
```

Events:

- `primary_cta_click`
- `project_brief_start`
- `project_brief_step`
- `project_brief_submit`
- `contact_submit`
- `booking_click`
- `booking_complete`
- `case_study_view`
- `case_study_cta_click`

Browser events are sent only after analytics consent when `ANALYTICS_CONSENT_REQUIRED=true`.

Server lifecycle events (`project_brief_submit`, `booking_complete`) are written idempotently from the
authoritative application flow. They contain only identifiers and safe structured metadata.

## Data minimization

The public analytics endpoint accepts a strict property allowlist.

It does **not** accept:

- names
- email addresses
- phone numbers
- contact messages
- project objectives/requirements
- free-text project answers
- private project files
- credentials or secrets

The analytics table stores event metadata, safe attribution values, page paths and optional entity IDs.

## Lead attribution

M17 adds first-touch attribution fields to `leads`:

```text
attribution_source
utm_source
utm_medium
utm_campaign
utm_term
utm_content
landing_path
initial_referrer_host
attribution_captured_at
```

The browser keeps first-touch UTM/referrer data only for the current tab/session in `sessionStorage`.
When a structured project brief or explicit AI handoff becomes a CRM lead, the available attribution
is copied into the lead record.

Existing M08 lead metadata is backfilled where possible by the M17 migration.

## Environment separation

Every analytics event stores an environment label:

```env
ANALYTICS_ENVIRONMENT="development"
```

If omitted, `NODE_ENV` is used.

This keeps development/staging/production data separable in the internal admin summary.

External browser providers are disabled outside production unless:

```env
ANALYTICS_ENABLE_IN_NON_PRODUCTION="true"
```

## Provider configuration

First-party event storage is always the primary conversion source when analytics is enabled.

Available browser-provider modes:

```env
ANALYTICS_PROVIDER="internal"
ANALYTICS_PROVIDER="plausible"
ANALYTICS_PROVIDER="ga4"
ANALYTICS_PROVIDER="none"
```

Optional provider settings:

```env
PLAUSIBLE_DOMAIN=""
GA_MEASUREMENT_ID=""
ANALYTICS_EXTERNAL_DASHBOARD_URL=""
```

`internal` records only the first-party event taxonomy.

`plausible` or `ga4` keep the first-party event log and can additionally load the selected external
browser provider after consent. No sensitive free-text values are passed through the documented event map.

## Consent

Default:

```env
ANALYTICS_CONSENT_REQUIRED="true"
```

The marketing site shows a small allow/decline preference prompt.

Declining prevents browser analytics events and external analytics scripts.

Lead attribution can still be attached to a user-submitted CRM enquiry because those UTM/referrer
fields are part of the enquiry source context, not an exported analytics payload.

## Lifecycle idempotency

The events that represent authoritative state transitions use deterministic keys:

- project brief submit → project brief ID
- booking complete → meeting ID

Browser start/step/view events use `sessionStorage` once-keys.

Click events are intentionally recorded per click.

## Admin

```text
/admin/analytics
```

Shows:

- environment/provider status
- primary CTA clicks
- project brief starts/submits
- booking completions
- funnel conversion percentages
- attributed lead rate
- top lead sources
- data-quality counters
- recent safe events
- optional external analytics dashboard link

## Validation

```powershell
npm run analytics:check
```

The checker verifies:

- full taxonomy presence
- no approved sensitive payloads
- strict public endpoint fields
- lead attribution migration
- server submit/booking hooks
- consent/session behavior

## Apply

```powershell
npx supabase migration up --local
npm run analytics:check
npm run dev
```

Do not reset the local database unless you intentionally want to recreate local Auth and data.
