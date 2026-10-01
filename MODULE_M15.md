# M15 — AI Website Assistant

## Goal

Answer common agency questions and collect qualified project context without allowing the assistant
to invent binding commercial promises.

## Depends on

M05, M06, M07, M08 and M09. The cumulative platform also reuses M11 admin controls and M12 internal
new-lead notifications.

## Delivered

- public floating AI chat widget with explicit AI disclosure
- approved-public-content-only retrieval
- OpenAI Responses API adapter with `store: false`
- moderation endpoint use
- deterministic provider-free fallback
- conversation/message/event model with retention
- explicit visitor consent for raw message logging
- prompt/model/version settings
- rate limiting and conversation limits
- prompt-injection/private-data guardrails
- deterministic commercial post-guardrail
- human contact path always visible
- explicit lead handoff form
- CRM lead create/enrich flow using only user-supplied contact/project data
- admin AI settings/knowledge/review page
- adversarial evaluation set
- retention cleanup command

## Routes

- public widget on marketing routes
- `POST /api/assistant`
- `POST /api/assistant/handoff`
- `/admin/ai`

## Migration

`supabase/migrations/20260923133000_m15_ai_assistant.sql`
