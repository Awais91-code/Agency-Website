import { NextResponse } from "next/server";

import { verifyResendWebhook } from "@/features/notifications/providers/resend";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { recordSecurityEvent } from "@/lib/security/events";
import type { Database, Json } from "@/types/database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EmailDeliveryStatus = Database["public"]["Enums"]["email_delivery_status"];

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function firstRecipient(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value.find((item): item is string => typeof item === "string") ?? null;
}

function statusForEvent(type: string): EmailDeliveryStatus | null {
  const map: Record<string, EmailDeliveryStatus> = {
    "email.sent": "sent",
    "email.delivered": "delivered",
    "email.delivery_delayed": "delivery_delayed",
    "email.bounced": "bounced",
    "email.complained": "complained",
    "email.failed": "failed",
    "email.suppressed": "suppressed",
  };
  return map[type] ?? null;
}

function failureMessage(type: string, data: Record<string, unknown>) {
  if (!["email.bounced", "email.complained", "email.failed", "email.suppressed"].includes(type)) {
    return null;
  }

  const bounce = object(data.bounce);
  const failed = object(data.failed);
  return (
    text(bounce.message) ||
    text(failed.reason) ||
    text(data.reason) ||
    `${type} reported by Resend.`
  );
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookId = request.headers.get("svix-id");
  const webhookTimestamp = request.headers.get("svix-timestamp");
  const webhookSignature = request.headers.get("svix-signature");

  let event: unknown;
  try {
    event = await verifyResendWebhook(rawBody, {
      id: webhookId,
      timestamp: webhookTimestamp,
      signature: webhookSignature,
    });
  } catch {
    await recordSecurityEvent({ eventType: "webhook.email_invalid_signature", severity: "warning", request, source: "email_webhook" });
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  const root = object(event);
  const type = text(root.type) ?? "unknown";
  const data = object(root.data);
  const providerMessageId = text(data.email_id) || text(data.id);
  const providerEventId = webhookId || text(root.id);

  if (!providerEventId) {
    return NextResponse.json({ ok: false, error: "missing_event_id" }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("email_provider_events")
    .select("id,processed_at")
    .eq("provider", "resend")
    .eq("provider_event_id", providerEventId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ ok: false, error: existingError.message }, { status: 500 });
  }

  if (existing?.processed_at) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  const { data: providerEvent, error: insertError } = await admin
    .from("email_provider_events")
    .upsert(
      {
        provider: "resend",
        provider_event_id: providerEventId,
        event_type: type,
        provider_message_id: providerMessageId,
        recipient: firstRecipient(data.to),
        payload: event as Json,
        processing_error: null,
      },
      { onConflict: "provider,provider_event_id" },
    )
    .select("id")
    .single();

  if (insertError || !providerEvent) {
    return NextResponse.json(
      { ok: false, error: insertError?.message ?? "Could not persist email webhook." },
      { status: 500 },
    );
  }

  try {
    if (providerMessageId) {
      const { data: emailEvent } = await admin
        .from("email_events")
        .select("id,status,context_type,context_id")
        .eq("provider", "resend")
        .eq("provider_message_id", providerMessageId)
        .maybeSingle();

      const nextStatus = statusForEvent(type);

      if (emailEvent && nextStatus) {
        const update: Database["public"]["Tables"]["email_events"]["Update"] = {
          status: nextStatus,
          last_error: failureMessage(type, data),
        };

        if (nextStatus === "delivered") update.delivered_at = new Date().toISOString();
        if (["failed", "bounced", "complained", "suppressed"].includes(nextStatus)) {
          update.failed_at = new Date().toISOString();
          update.next_retry_at = null;
        }

        const { error: updateError } = await admin
          .from("email_events")
          .update(update)
          .eq("id", emailEvent.id);

        if (updateError) throw new Error(updateError.message);

        if (emailEvent.context_type === "lead" && emailEvent.context_id) {
          await admin.from("activity_events").insert({
            entity_type: "lead",
            entity_id: emailEvent.context_id,
            event_type: type,
            source: "email_webhook",
            metadata: {
              email_event_id: emailEvent.id,
              provider_message_id: providerMessageId,
              delivery_status: nextStatus,
            },
          });
        }
      }
    }

    const { error: processedError } = await admin
      .from("email_provider_events")
      .update({
        processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq("id", providerEvent.id);

    if (processedError) throw new Error(processedError.message);

    return NextResponse.json({ ok: true, duplicate: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "email_webhook_processing_failed";
    await admin
      .from("email_provider_events")
      .update({ processing_error: message })
      .eq("id", providerEvent.id);

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
