# M15 AI Website Assistant

M15 adds a public assistant that is deliberately narrower than the authenticated admin/client systems.

## Grounding boundary

The public assistant retrieves only:

- published Services;
- visible Service FAQs;
- published Case Studies;
- published general FAQs;
- selected published content sections;
- explicitly approved `ai_knowledge_items`.

The grounding service does **not** query client projects, project files, client requests, profiles,
lead notes or other private portal/admin data.

## OpenAI provider

The server calls the OpenAI Responses API when `OPENAI_API_KEY` is configured.

The request uses:

```text
store: false
```

so the application does not ask the Responses API to persist response state. OpenAI API data controls
and abuse-monitoring policies still apply to the API account and should be reviewed before production.

Input moderation uses `omni-moderation-latest`.

Default model in `ai_settings`:

```text
gpt-5.6-luna
```

Administrators can change the model without changing code.

If the API key is not configured, the widget falls back to deterministic approved-content retrieval
instead of inventing an answer.

## Commercial guardrails

The assistant must not autonomously provide:

- final/binding pricing;
- binding quotes;
- contract terms;
- legal commitments;
- guaranteed delivery dates.

Published pricing notes can be explained only as non-binding context. Commercial requests receive a
human-approval disclaimer. Deterministic post-processing rejects model output that states direct
guarantees/promises.

Evaluation cases live in:

```text
tests/ai/m15-evaluation-cases.json
```

Run:

```powershell
npm run ai:guardrails
```

## Human handoff

The chat widget always keeps a human path visible.

A visitor may explicitly submit:

- name;
- email;
- optional company;
- optional service area;
- project summary;
- privacy/follow-up acceptance.

Only that explicit form creates/enriches a CRM lead. Ordinary chat content never creates a lead by
itself.

The handoff writes:

- `leads` create/enrichment;
- `lead_notes`;
- `lead_stage_history` for a new lead;
- `activity_events`;
- `ai_conversations.lead_id`;
- `ai_events` handoff metadata.

## Consent and retention

Before the first message, the visitor can opt into temporary website message logging.

When consent is **off**:

- the website does not save raw user/assistant message bodies;
- conversation metadata is kept briefly for abuse/session controls;
- operational events remain metadata-only.

When consent is **on** and admin logging is enabled:

- message text is stored in `ai_messages`;
- the default retention period is 30 days;
- admin review can show those consented messages.

Cleanup:

```powershell
npm run ai:cleanup
```

## Abuse controls

- 1,500-character public message limit;
- per-requester hashed rate limit;
- maximum messages per conversation;
- OpenAI moderation when the provider key is configured;
- prompt-injection/private-data guardrail detection;
- no anonymous direct database access to AI tables;
- random session token + hash for continuing a conversation.

## Admin

```text
/admin/ai
```

Administrator/super-admin only.

Provides:

- enable/disable;
- provider configuration visibility;
- model/prompt version;
- retention/message/rate limits;
- human handoff URL;
- approved process/policy snippets;
- consented conversation review;
- metadata-only event visibility.

## Environment

```env
OPENAI_API_KEY=""
AI_REQUEST_HASH_SECRET=""
```

Keep both server-only.

## Apply

```powershell
npx supabase migration up --local
npm run ai:check
npm run ai:guardrails
npm run dev
```

Do not reset the local database unless you intentionally want to recreate local Auth/data.
