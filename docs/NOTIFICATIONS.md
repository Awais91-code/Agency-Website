# M12 Email & Notification System

M12 centralizes outbound transactional communication and provider delivery visibility.

## Provider

The initial adapter is Resend. Provider secrets are read only on the server.

Required for live sending:

```env
RESEND_API_KEY="re_..."
EMAIL_FROM="Agency <hello@your-verified-domain.com>"
```

Optional:

```env
EMAIL_REPLY_TO="hello@your-domain.com"
```

## Development / staging safety

M12 blocks accidental real-client email by default outside production.

Recommended local/staging setup:

```env
EMAIL_DEV_REDIRECT_TO="your-own-test-inbox@example.com"
EMAIL_ALLOW_EXTERNAL_IN_NON_PROD="false"
```

Every outbound message is then redirected to that controlled inbox. The subject records the original intended recipient.

Alternative: allow only explicit test addresses:

```env
EMAIL_DEV_ALLOWLIST="developer@example.com,qa@example.com"
EMAIL_ALLOW_EXTERNAL_IN_NON_PROD="false"
```

Only if you explicitly intend to send to real external recipients in a non-production environment:

```env
EMAIL_ALLOW_EXTERNAL_IN_NON_PROD="true"
```

Do not enable that casually.

## Admin UI

`/admin/notifications`

Administrator/super-admin only.

It provides:

- provider/configuration visibility;
- internal recipient/rule configuration;
- reusable template preview;
- safe test send;
- email event log;
- retry for failed/skipped events;
- verified provider webhook event visibility.

## Template catalogue

M12 includes:

- enquiry confirmation;
- booking notification;
- account invitation;
- password reset;
- onboarding;
- project update;
- new-lead admin alert;
- booking admin alert;
- generic operational admin alert.

M14 can reuse onboarding/project-update templates. Auth-specific custom delivery can later use the invite/reset templates without duplicating branding.

## Critical idempotency

Every canonical email has a unique application `idempotency_key`.

The send adapter also derives a stable provider idempotency key and passes it to Resend. A repeated lead-submit or webhook delivery therefore does not intentionally generate another copy of a critical email.

Provider documentation confirms that the email API supports an `Idempotency-Key` and returns the same email operation for a duplicate request with the same key.

## Retry behavior

Provider/API failures are stored as `failed`, including:

- last error;
- retry count;
- calculated next retry timestamp;
- provider response where available.

M12 offers manual retry from Admin → Notifications. M13 automation can later consume `next_retry_at` for scheduled retry orchestration.

A failed email does not roll back the canonical lead or booking.

## Resend webhook

Endpoint:

```text
POST /api/webhooks/email
```

Configure the Resend webhook signing secret:

```env
RESEND_WEBHOOK_SECRET="whsec_..."
```

The endpoint verifies the raw payload with the official Resend SDK and the standard:

- `svix-id`
- `svix-timestamp`
- `svix-signature`

headers.

Recommended delivery events:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.bounced`
- `email.complained`
- `email.failed`
- `email.suppressed`

Webhook deliveries are deduplicated in `email_provider_events`.

## Current automatic triggers

M12 is connected to the existing funnel:

1. M08/M09 project submission
   - client enquiry confirmation
   - optional internal new-lead alert

2. M10 booking webhook
   - client scheduled/cancelled booking notification
   - optional internal booking alert

Future M13/M14 workflows should call `sendTransactionalEmail()` or a higher-level M12 workflow instead of calling Resend directly.

## Local apply

Do not reset the database if you want to preserve your working local admin user:

```powershell
npx supabase migration up --local
npm install
npm run notifications:check
npm run dev
```
