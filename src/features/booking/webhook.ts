import crypto from "node:crypto";

import type { ParsedBookingWebhook } from "@/features/booking/types";

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function firstAttendee(payload: Record<string, unknown>) {
  const attendees = Array.isArray(payload.attendees) ? payload.attendees : [];
  return object(attendees[0]);
}

function extractMeetingUrl(payload: Record<string, unknown>) {
  const metadata = object(payload.metadata);
  const location = object(payload.location);
  return (
    text(payload.meetingUrl) ||
    text(payload.videoCallUrl) ||
    text(metadata.videoCallUrl) ||
    text(location.link) ||
    null
  );
}

function extractLocation(payload: Record<string, unknown>) {
  if (typeof payload.location === "string") return text(payload.location);
  const location = object(payload.location);
  return text(location.value) || text(location.address) || text(location.type) || null;
}

function extractContextToken(payload: Record<string, unknown>) {
  const metadata = object(payload.metadata);
  const responses = object(payload.responses);

  const direct = text(metadata.booking_context) || text(metadata.bookingContext);
  if (direct) return direct;

  const responseValue = responses.booking_context;
  if (typeof responseValue === "string") return text(responseValue);
  const responseObject = object(responseValue);
  return text(responseObject.value);
}

export function verifyWebhookSignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const supplied = signature.replace(/^sha256=/i, "").trim();
  if (expected.length != supplied.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

export function parseCalBookingWebhook(raw: unknown): ParsedBookingWebhook {
  const root = object(raw);
  const payload = object(root.payload);
  const attendee = firstAttendee(payload);

  const triggerEvent =
    text(root.triggerEvent) ||
    text(root.type) ||
    text(root.event) ||
    "UNKNOWN";

  const bookingId =
    text(payload.uid) ||
    text(payload.bookingUid) ||
    (payload.id !== undefined ? String(payload.id) : null) ||
    text(root.bookingUid);

  if (!bookingId) throw new Error("Webhook payload does not include a booking identifier.");

  const start = text(payload.startTime) || text(payload.start) || text(payload.startAt);
  const end = text(payload.endTime) || text(payload.end) || text(payload.endAt);
  const eventType = object(payload.eventType);

  const stableEventId =
    text(root.id) ||
    text(root.webhookId) ||
    `${triggerEvent}:${bookingId}:${start ?? ""}:${text(payload.status) ?? ""}`;

  return {
    eventKey: stableEventId,
    triggerEvent,
    bookingId,
    bookingTypeHint: text(eventType.slug) || text(payload.eventTypeSlug) || null,
    attendeeName: text(attendee.name) || text(payload.name),
    attendeeEmail: text(attendee.email) || text(payload.email),
    startsAt: start,
    endsAt: end,
    timezone: text(attendee.timeZone) || text(attendee.timezone) || text(payload.timezone),
    title: text(payload.title),
    meetingUrl: extractMeetingUrl(payload),
    locationText: extractLocation(payload),
    rescheduledFromProviderId:
      text(payload.rescheduleUid) ||
      text(payload.rescheduledFromUid) ||
      text(payload.previousBookingUid),
    bookingContextToken: extractContextToken(payload),
    safeMetadata: {
      triggerEvent,
      status: text(payload.status),
      eventTypeSlug: text(eventType.slug) || text(payload.eventTypeSlug),
      organizerEmail: text(object(payload.organizer).email),
    },
  };
}
