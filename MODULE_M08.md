# M08 — Smart Project Brief & Quote Engine

## Goal

Collect structured project requirements, calculate a controlled indicative estimate range, and create one canonical lead per completed submission.

## Depends on

- M02 — Data Platform & Core Backend
- M05 — Public Marketing Website

M06/M07 improve service/work context but are not required by the core M08 data contract.

## Delivered

- `/start-a-project` six-step project brief.
- `/quote` alias and `/quote/success` confirmation page.
- Browser session autosave plus server draft sync.
- Conditional feature options by project type.
- Server-side estimate engine using database-managed rules.
- Staff rule editor at `/admin/quote-rules`.
- Preliminary/non-binding estimate disclaimer.
- Lead scoring reasons stored in lead metadata for M09.
- Atomic `submit_project_brief` database function.
- Idempotency protection against duplicate final submission.
- Public API routes for draft, estimate and final submit.
- Honeypot, minimum-completion-time and baseline in-memory rate limiting.
- UTM capture into project brief attribution.
- Separate marketing consent and project-service privacy acceptance.

## Data ownership

- `project_briefs`
- `brief_answers`
- `estimate_rules`
- `estimate_results`
- Existing `leads` table is populated only when a brief is finalized.
- Existing `activity_events` receives a traceable `project_brief.submitted` event.

## Important commercial rule

The displayed range is guidance only. M08 must never create a binding custom quote, promise a delivery date, accept contract terms, or bypass human review.

## Deferred integrations

- Confirmation email: M12
- Internal workflow/follow-up automation: M13
- Full CRM management UI: M09
- Distributed production rate limiting / Turnstile hardening: M18
