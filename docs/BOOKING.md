# M10 Consultation Booking

M10 adds the public booking flow and synchronizes scheduler events back to M09 CRM leads.

## Public route

`/book`

The public booking page:

- lists active meeting types;
- preserves an opaque booking context after M08 project submission;
- pre-fills supported Cal.com fields such as name/email through query parameters;
- keeps the CRM lead ID private;
- provides `/contact` fallback if a scheduler URL is unavailable.

## Admin route

`/admin/bookings`

Use this page to paste the Cal.com event URL for each meeting type.

Examples:

```text
https://cal.com/your-account/discovery
https://cal.com/your-team/website-consultation
```

## Webhook endpoint

```text
POST /api/webhooks/booking
```

Configure your scheduling provider to send booking create/reschedule/cancel events to this URL.

For local testing through a public tunnel, use the tunnel URL plus:

```text
/api/webhooks/booking
```

## Webhook secret

Set the same secret in `.env.local`:

```env
CALCOM_WEBHOOK_SECRET="your-long-random-secret"
```

Production rejects booking webhooks when the secret is not configured.

The handler accepts the common Cal.com HMAC-SHA256 signature headers:

- `x-cal-signature-256`
- `x-cal-signature`
- `x-webhook-signature`

## Lead matching

The handler tries to link the booking in this order:

1. `booking_context` token returned by the scheduling provider/custom booking field.
2. Exact attendee email against `leads.normalized_email`.

For best deterministic matching, configure a Cal.com custom booking field named `booking_context` so the prefilled opaque token is included in webhook payload responses/metadata.

## CRM behavior

A scheduled booking:

- upserts one canonical meeting by provider booking ID;
- moves an open lead to `consultation_booked`;
- writes stage history;
- appends a booking activity event.

Cancellation:

- updates the meeting to `cancelled`;
- keeps the original lead/brief;
- marks the lead next action as `Rebook consultation`.

Webhook deliveries are idempotent through `booking_webhook_events`.

## Reminder emails

M10 records the meeting. Branded reminder and confirmation email orchestration is intentionally completed in M12/M13, matching the project build order.
