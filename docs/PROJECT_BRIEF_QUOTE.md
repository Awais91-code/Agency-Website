# Project Brief & Quote Engine

## Public flow

1. Visitor opens `/start-a-project`.
2. A random browser session token is created and kept in `sessionStorage`.
3. Form progress is saved locally and, when Supabase is available, synchronized through `/api/project-briefs/draft`.
4. Estimate requests call `/api/project-briefs/estimate`.
5. The server reads active `estimate_rules`; no price arithmetic is trusted from browser values.
6. On final submit, the server saves the current brief, records an estimate snapshot, scores the lead, then calls the PostgreSQL `submit_project_brief` function.
7. The function creates one lead and marks the brief submitted in the same database transaction.
8. Repeated submissions with the same brief/idempotency key return the existing result instead of creating another lead.

## Estimate formula

The engine currently uses:

```text
base project range
+ selected feature ranges
× complexity multiplier
× urgency multiplier
+ support range
= indicative final range
```

Values live in `estimate_rules`, not in the client component. Staff can edit active rule values from `/admin/quote-rules`.

## Quote-rule categories

- `base`
- `feature`
- `complexity`
- `urgency`
- `support`

Seed values are development defaults only. Replace them with approved agency commercial guidance before production.

## Lead scoring

M08 stores an explainable lead score and textual reasons in `leads.metadata`. It prioritizes structured context, budget band, company information, timing detail, requirements clarity, and business-domain email where present. M09 owns the CRM presentation and future scoring controls.

## Privacy and abuse controls

M08 includes a baseline honeypot, minimum completion time and process-local rate limiter. These reduce obvious abuse but are not the final production anti-abuse system. M18 must add the production-grade policy such as Turnstile, shared/distributed rate limiting, retention review, headers and final security testing.

Marketing consent is optional and separate from consent required to respond to the project enquiry.

## Failure behavior

- A draft failure does not erase browser session progress.
- Estimate failure does not block final project submission.
- Final submission errors remain visible and the browser draft is retained.
- Email and n8n failures cannot affect M08 yet because those integrations are intentionally deferred to M12/M13.

## Production checklist

Before launch, verify:

- Approved currency and estimate ranges.
- Final service/project types and feature labels.
- Privacy policy wording.
- Production anti-bot/rate-limit configuration from M18.
- M12 confirmation email.
- M13 internal notifications/follow-up.
- M09 staff CRM visibility of lead score, score reasons and project-brief detail.
