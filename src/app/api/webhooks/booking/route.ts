import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { markBookingHandoffUsed } from "@/features/booking/server";
import { notifyBookingChanged } from "@/features/notifications/workflows";
import { enqueueMeetingScheduledAutomation } from "@/features/automation/queue";
import { recordServerConversion } from "@/features/analytics/server";
import { parseCalBookingWebhook, verifyWebhookSignature } from "@/features/booking/webhook";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { recordSecurityEvent } from "@/lib/security/events";
import type { Json } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function statusForTrigger(trigger: string) {
  const normalized = trigger.toUpperCase();
  if (normalized.includes("CANCEL")) return "cancelled" as const;
  if (normalized.includes("NO_SHOW")) return "no_show" as const;
  if (normalized.includes("COMPLETED") || normalized.includes("MEETING_ENDED")) return "completed" as const;
  return "scheduled" as const;
}

function normalizeEmail(value: string | null) {
  return value?.trim().toLowerCase() || null;
}

async function findLeadId(contextToken: string | null, attendeeEmail: string | null) {
  const admin = getSupabaseAdminClient();

  if (contextToken && /^[0-9a-f-]{36}$/i.test(contextToken)) {
    const { data } = await admin
      .from("booking_handoffs")
      .select("lead_id")
      .eq("token", contextToken)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (data?.lead_id) return data.lead_id;
  }

  const normalized = normalizeEmail(attendeeEmail);
  if (!normalized) return null;

  const { data } = await admin
    .from("leads")
    .select("id")
    .eq("normalized_email", normalized)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

async function resolveBookingTypeId(hint: string | null) {
  if (!hint) return null;
  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from("booking_types")
    .select("id")
    .eq("slug", hint)
    .is("archived_at", null)
    .maybeSingle();
  return data?.id ?? null;
}

async function appendLeadActivity(
  leadId: string,
  eventType: string,
  metadata: Record<string, unknown>,
) {
  const admin = getSupabaseAdminClient();
  await admin.from("activity_events").insert({
    entity_type: "lead",
    entity_id: leadId,
    event_type: eventType,
    source: "booking_webhook",
    metadata: metadata as Json,
  });
}

async function setLeadConsultationBooked(leadId: string, triggerEvent: string) {
  const admin = getSupabaseAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return;
  if (["won", "lost", "nurture"].includes(lead.status)) return;
  if (lead.status === "consultation_booked") return;

  const { error } = await admin
    .from("leads")
    .update({
      status: "consultation_booked",
      last_contacted_at: new Date().toISOString(),
      next_action: "Prepare for consultation",
      next_action_at: null,
    })
    .eq("id", leadId);

  if (error) throw new Error(error.message);

  await admin.from("lead_stage_history").insert({
    lead_id: leadId,
    from_status: lead.status,
    to_status: "consultation_booked",
    reason: `Booking provider event: ${triggerEvent}`,
  });
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const configuredSecret = env.CALCOM_WEBHOOK_SECRET;

  if (configuredSecret) {
    const signature =
      request.headers.get("x-cal-signature-256") ||
      request.headers.get("x-cal-signature") ||
      request.headers.get("x-webhook-signature");

    if (!verifyWebhookSignature(rawBody, signature, configuredSecret)) {
      await recordSecurityEvent({ eventType: "webhook.booking_invalid_signature", severity: "warning", request, source: "booking_webhook" });
      return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
    }
  } else if (env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "webhook_secret_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  try {
    const parsed = parseCalBookingWebhook(body);
    const eventHash = crypto.createHash("sha256").update(rawBody).digest("hex");
    const eventKey = parsed.eventKey || eventHash;

    const { data: existing } = await admin
      .from("booking_webhook_events")
      .select("id,processed_at")
      .eq("provider", "calcom")
      .eq("event_key", eventKey)
      .maybeSingle();

    if (existing?.processed_at) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const { data: eventRow, error: eventInsertError } = await admin
      .from("booking_webhook_events")
      .upsert(
        {
          provider: "calcom",
          event_key: eventKey,
          trigger_event: parsed.triggerEvent,
          provider_booking_id: parsed.bookingId,
          payload: body as Json,
          processing_error: null,
        },
        { onConflict: "provider,event_key" },
      )
      .select("id")
      .single();

    if (eventInsertError || !eventRow) {
      throw new Error(eventInsertError?.message ?? "Could not log booking webhook.");
    }

    const leadId = await findLeadId(parsed.bookingContextToken, parsed.attendeeEmail);
    const bookingTypeId = await resolveBookingTypeId(parsed.bookingTypeHint);
    const meetingStatus = statusForTrigger(parsed.triggerEvent);

    const { data: meeting, error: meetingError } = await admin
      .from("meetings")
      .upsert(
        {
          lead_id: leadId,
          booking_type_id: bookingTypeId,
          provider: "calcom",
          provider_booking_id: parsed.bookingId,
          provider_event_type: parsed.bookingTypeHint,
          title: parsed.title,
          attendee_name: parsed.attendeeName,
          attendee_email: parsed.attendeeEmail,
          starts_at: parsed.startsAt,
          ends_at: parsed.endsAt,
          timezone: parsed.timezone,
          meeting_url: parsed.meetingUrl,
          location_text: parsed.locationText,
          status: meetingStatus,
          rescheduled_from_provider_id: parsed.rescheduledFromProviderId,
          cancelled_at: meetingStatus === "cancelled" ? new Date().toISOString() : null,
          safe_metadata: parsed.safeMetadata as Json,
        },
        { onConflict: "provider,provider_booking_id" },
      )
      .select("id,lead_id,status")
      .single();

    if (meetingError || !meeting) {
      throw new Error(meetingError?.message ?? "Could not synchronize meeting.");
    }

    if (leadId) {
      const trigger = parsed.triggerEvent.toUpperCase();

      if (meetingStatus === "scheduled") {
        await setLeadConsultationBooked(leadId, parsed.triggerEvent);
      } else if (meetingStatus === "cancelled") {
        await admin
          .from("leads")
          .update({
            next_action: "Rebook consultation",
            next_action_at: null,
          })
          .eq("id", leadId)
          .eq("status", "consultation_booked");
      }

      await appendLeadActivity(leadId, `booking.${trigger.toLowerCase()}`, {
        meeting_id: meeting.id,
        provider_booking_id: parsed.bookingId,
        status: meetingStatus,
        starts_at: parsed.startsAt,
        timezone: parsed.timezone,
      });
    }

    await markBookingHandoffUsed(parsed.bookingContextToken);

    await notifyBookingChanged({
      meetingId: meeting.id,
      leadId,
    });
    if (meetingStatus === "scheduled") {
      await enqueueMeetingScheduledAutomation({
        meetingId: meeting.id,
        leadId,
        startsAt: parsed.startsAt,
      });
      await recordServerConversion({
        eventKey: `booking-complete:${meeting.id}`,
        eventName: "booking_complete",
        leadId,
        entityType: "meeting",
        entityId: meeting.id,
        properties: {
          booking_type: parsed.bookingTypeHint || undefined,
          result: "scheduled",
        },
      });
    }

    const { error: processedError } = await admin
      .from("booking_webhook_events")
      .update({
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", eventRow.id);

    if (processedError) throw new Error(processedError.message);

    return NextResponse.json({
      ok: true,
      duplicate: false,
      leadMatched: Boolean(leadId),
      meetingId: meeting.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "booking_webhook_failed",
      },
      { status: 500 },
    );
  }
}
