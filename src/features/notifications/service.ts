import "server-only";

import crypto from "node:crypto";

import { env } from "@/config/env";
import { sendWithResend, isResendConfigured } from "@/features/notifications/providers/resend";
import { renderEmailTemplate } from "@/features/notifications/templates";
import type {
  EmailDeliveryStatus,
  SendTransactionalEmailInput,
  SendTransactionalEmailResult,
} from "@/features/notifications/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

const terminalSuccess = new Set<EmailDeliveryStatus>(["sent", "delivered"]);
const inFlight = new Set<EmailDeliveryStatus>(["queued", "sending"]);

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function splitEmails(value: string | undefined) {
  return (value ?? "")
    .split(/[,\n;]/)
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

function providerPayloadToJson(value: unknown): Json {
  if (value == null) return {};

  try {
    return JSON.parse(JSON.stringify(value)) as Json;
  } catch {
    return {};
  }
}

function nonProductionRecipient(originalRecipient: string) {
  if (env.NODE_ENV === "production") {
    return {
      recipient: originalRecipient,
      allowed: true,
      reason: null,
      redirected: false,
    };
  }

  if (env.EMAIL_DEV_REDIRECT_TO) {
    return {
      recipient: normalizeEmail(env.EMAIL_DEV_REDIRECT_TO),
      allowed: true,
      reason: `Redirected from ${originalRecipient} by EMAIL_DEV_REDIRECT_TO.`,
      redirected: true,
    };
  }

  if (env.EMAIL_ALLOW_EXTERNAL_IN_NON_PROD) {
    return {
      recipient: originalRecipient,
      allowed: true,
      reason: "External non-production email explicitly allowed.",
      redirected: false,
    };
  }

  const allowlist = new Set(splitEmails(env.EMAIL_DEV_ALLOWLIST));
  if (allowlist.has(originalRecipient)) {
    return {
      recipient: originalRecipient,
      allowed: true,
      reason: "Recipient is in EMAIL_DEV_ALLOWLIST.",
      redirected: false,
    };
  }

  return {
    recipient: originalRecipient,
    allowed: false,
    reason:
      "Non-production delivery blocked. Configure EMAIL_DEV_REDIRECT_TO, EMAIL_DEV_ALLOWLIST, or explicitly set EMAIL_ALLOW_EXTERNAL_IN_NON_PROD=true.",
    redirected: false,
  };
}

function providerIdempotencyKey(input: string) {
  const hash = crypto.createHash("sha256").update(input).digest("hex");
  return `agency/${hash}`;
}

function nextRetryTime(retryCount: number) {
  const minutes = Math.min(15 * 2 ** Math.max(0, retryCount), 12 * 60);
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

async function findExisting(idempotencyKey: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("email_events")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (error) throw new Error(`Could not inspect email idempotency record: ${error.message}`);
  return data;
}

async function createOrClaimEvent({
  input,
  originalRecipient,
  recipient,
  subject,
  safetyNote,
}: {
  input: SendTransactionalEmailInput;
  originalRecipient: string;
  recipient: string;
  subject: string;
  safetyNote: string | null;
}) {
  const admin = getSupabaseAdminClient();
  const existing = await findExisting(input.idempotencyKey);

  if (existing) {
    if (terminalSuccess.has(existing.status) || inFlight.has(existing.status)) {
      return { event: existing, send: false, duplicate: true };
    }

    const { data, error } = await admin
      .from("email_events")
      .update({
        status: "sending",
        recipient,
        subject,
        sender: env.EMAIL_FROM ?? null,
        reply_to: env.EMAIL_REPLY_TO ?? null,
        retry_count: existing.retry_count + 1,
        next_retry_at: null,
        last_error: safetyNote,
        failed_at: null,
      })
      .eq("id", existing.id)
      .select("*")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Could not claim existing email event.");
    }

    return { event: data, send: true, duplicate: false };
  }

  const { data, error } = await admin
    .from("email_events")
    .insert({
      idempotency_key: input.idempotencyKey,
      provider: "resend",
      template_key: input.templateKey,
      original_recipient: originalRecipient,
      recipient,
      sender: env.EMAIL_FROM ?? null,
      reply_to: env.EMAIL_REPLY_TO ?? null,
      subject,
      status: "sending",
      context_type: input.contextType ?? null,
      context_id: input.contextId ?? null,
      template_data: input.data as Json,
      last_error: safetyNote,
    })
    .select("*")
    .single();

  if (!error && data) {
    return { event: data, send: true, duplicate: false };
  }

  if (error?.code === "23505") {
    const raced = await findExisting(input.idempotencyKey);
    if (raced) return { event: raced, send: false, duplicate: true };
  }

  throw new Error(error?.message ?? "Could not create email event.");
}

async function markSkipped(eventId: string, reason: string) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("email_events")
    .update({
      status: "skipped",
      last_error: reason,
      failed_at: new Date().toISOString(),
      next_retry_at: null,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

async function markFailed(eventId: string, errorMessage: string, retryCount: number, providerResponse: Json) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("email_events")
    .update({
      status: "failed",
      last_error: errorMessage,
      failed_at: new Date().toISOString(),
      next_retry_at: nextRetryTime(retryCount),
      provider_response: providerResponse,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

async function markSent(eventId: string, providerMessageId: string, providerResponse: Json) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("email_events")
    .update({
      status: "sent",
      provider_message_id: providerMessageId,
      provider_response: providerResponse,
      sent_at: new Date().toISOString(),
      last_error: null,
      next_retry_at: null,
    })
    .eq("id", eventId);

  if (error) throw new Error(error.message);
}

export async function sendTransactionalEmail(
  input: SendTransactionalEmailInput,
): Promise<SendTransactionalEmailResult> {
  const originalRecipient = normalizeEmail(input.to);
  const rendered = renderEmailTemplate(input.templateKey, input.data);
  const safety = nonProductionRecipient(originalRecipient);
  const subject =
    safety.redirected && safety.recipient !== originalRecipient
      ? `[NON-PROD → ${originalRecipient}] ${rendered.subject}`
      : rendered.subject;

  const claimed = await createOrClaimEvent({
    input,
    originalRecipient,
    recipient: safety.recipient,
    subject,
    safetyNote: safety.reason,
  });

  if (!claimed.send) {
    return {
      eventId: claimed.event.id,
      status: claimed.event.status,
      duplicate: true,
      providerMessageId: claimed.event.provider_message_id,
      recipient: claimed.event.recipient,
      originalRecipient: claimed.event.original_recipient,
      error: claimed.event.last_error,
    };
  }

  if (!safety.allowed) {
    await markSkipped(claimed.event.id, safety.reason ?? "Non-production delivery blocked.");
    return {
      eventId: claimed.event.id,
      status: "skipped",
      duplicate: false,
      providerMessageId: null,
      recipient: safety.recipient,
      originalRecipient,
      error: safety.reason,
    };
  }

  if (!isResendConfigured()) {
    const reason = "Email provider is not configured. Set RESEND_API_KEY and EMAIL_FROM.";
    await markSkipped(claimed.event.id, reason);
    return {
      eventId: claimed.event.id,
      status: "skipped",
      duplicate: false,
      providerMessageId: null,
      recipient: safety.recipient,
      originalRecipient,
      error: reason,
    };
  }

  const providerResult = await sendWithResend({
    to: safety.recipient,
    subject,
    html: rendered.html,
    text: rendered.text,
    idempotencyKey: providerIdempotencyKey(input.idempotencyKey),
  });

  if (providerResult.error || !providerResult.id) {
    const errorMessage = providerResult.error ?? "Provider did not return a message ID.";
    await markFailed(
      claimed.event.id,
      errorMessage,
      claimed.event.retry_count,
      providerPayloadToJson(providerResult.raw),
    );

    return {
      eventId: claimed.event.id,
      status: "failed",
      duplicate: false,
      providerMessageId: null,
      recipient: safety.recipient,
      originalRecipient,
      error: errorMessage,
    };
  }

  await markSent(
    claimed.event.id,
    providerResult.id,
    providerPayloadToJson(providerResult.raw),
  );

  return {
    eventId: claimed.event.id,
    status: "sent",
    duplicate: false,
    providerMessageId: providerResult.id,
    recipient: safety.recipient,
    originalRecipient,
    error: null,
  };
}

export async function retryEmailEvent(id: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("email_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Email event not found.");

  if (!["failed", "skipped"].includes(data.status)) {
    return {
      eventId: data.id,
      status: data.status,
      duplicate: true,
      providerMessageId: data.provider_message_id,
      recipient: data.recipient,
      originalRecipient: data.original_recipient,
      error: "Only failed or skipped email events can be retried manually.",
    } satisfies SendTransactionalEmailResult;
  }

  return sendTransactionalEmail({
    templateKey: data.template_key as SendTransactionalEmailInput["templateKey"],
    to: data.original_recipient,
    data: (data.template_data ?? {}) as SendTransactionalEmailInput["data"],
    idempotencyKey: data.idempotency_key,
    contextType: data.context_type,
    contextId: data.context_id,
  });
}

export async function getNotificationPreferences() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("notification_settings")
    .select("*")
    .eq("id", "default")
    .single();

  if (error) throw new Error(`Could not load notification settings: ${error.message}`);

  const recipients = new Set([
    ...data.admin_recipients.map(normalizeEmail),
    ...splitEmails(env.NOTIFICATION_ADMIN_EMAILS),
  ]);

  return {
    ...data,
    adminRecipients: [...recipients].filter(Boolean),
  };
}
