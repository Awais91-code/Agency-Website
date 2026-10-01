"use server";

import crypto from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/config/env";
import { recordAuditLog } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { retryEmailEvent, sendTransactionalEmail } from "@/features/notifications/service";
import { emailTemplateKeys, type EmailTemplateKey } from "@/features/notifications/types";
import { sampleTemplateData } from "@/features/notifications/templates";

function parseRecipients(raw: string) {
  const entries = [...new Set(
    raw
      .split(/[,\n;]/)
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )];

  const email = z.email();
  for (const entry of entries) {
    if (!email.safeParse(entry).success) {
      throw new Error(`Invalid internal recipient: ${entry}`);
    }
  }

  return entries.slice(0, 30);
}

export async function saveNotificationSettingsAction(formData: FormData) {
  const auth = await requireAdmin();

  let recipients: string[];
  try {
    recipients = parseRecipients(String(formData.get("adminRecipients") ?? ""));
  } catch (error) {
    redirect(`/admin/notifications?error=${encodeURIComponent(error instanceof Error ? error.message : "Invalid recipients.")}`);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("notification_settings")
    .update({
      admin_recipients: recipients,
      send_enquiry_confirmations: formData.get("sendEnquiryConfirmations") === "on",
      send_new_lead_alerts: formData.get("sendNewLeadAlerts") === "on",
      send_booking_notifications: formData.get("sendBookingNotifications") === "on",
      send_booking_admin_alerts: formData.get("sendBookingAdminAlerts") === "on",
      updated_by: auth.userId,
    })
    .eq("id", "default");

  if (error) redirect(`/admin/notifications?error=${encodeURIComponent(error.message)}`);

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "notification_settings.updated",
    objectType: "notification_settings",
    objectId: "default",
    metadata: {
      admin_recipient_count: recipients.length,
    },
  });

  revalidatePath("/admin/notifications");
  redirect("/admin/notifications?saved=settings");
}

export async function sendTestEmailAction(formData: FormData) {
  const auth = await requireAdmin();
  const parsed = z.object({
    recipient: z.email(),
    templateKey: z.enum(emailTemplateKeys),
  }).safeParse({
    recipient: String(formData.get("recipient") ?? "").trim().toLowerCase(),
    templateKey: String(formData.get("templateKey") ?? ""),
  });

  if (!parsed.success) {
    redirect(`/admin/notifications?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid test email.")}`);
  }

  const templateKey = parsed.data.templateKey as EmailTemplateKey;
  const result = await sendTransactionalEmail({
    templateKey,
    to: parsed.data.recipient,
    data: {
      ...sampleTemplateData(templateKey),
      agencyName: env.NEXT_PUBLIC_APP_NAME,
      appUrl: env.NEXT_PUBLIC_APP_URL,
    },
    idempotencyKey: `admin-test/${auth.userId}/${templateKey}/${crypto.randomUUID()}`,
    contextType: "admin_test",
    contextId: auth.userId,
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "notification.test_send",
    objectType: "email_event",
    objectId: result.eventId,
    metadata: {
      template_key: templateKey,
      status: result.status,
    },
  });

  revalidatePath("/admin/notifications");
  const message = result.error
    ? `${result.status}: ${result.error}`
    : `Test email ${result.status}.`;
  redirect(`/admin/notifications?saved=${encodeURIComponent(message)}&template=${encodeURIComponent(templateKey)}`);
}

export async function retryEmailAction(formData: FormData) {
  const auth = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) {
    redirect("/admin/notifications?error=Invalid%20email%20event");
  }

  const result = await retryEmailEvent(id);

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "notification.retry",
    objectType: "email_event",
    objectId: id,
    metadata: {
      status: result.status,
    },
  });

  revalidatePath("/admin/notifications");
  const message = result.error
    ? `${result.status}: ${result.error}`
    : `Retry ${result.status}.`;
  redirect(`/admin/notifications?saved=${encodeURIComponent(message)}`);
}
