import "server-only";

import { env } from "@/config/env";
import { emailTemplateKeys } from "@/features/notifications/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function getNotificationAdminData() {
  const admin = getSupabaseAdminClient();

  const [
    settingsResult,
    eventsResult,
    providerEventsResult,
  ] = await Promise.all([
    admin.from("notification_settings").select("*").eq("id", "default").single(),
    admin.from("email_events").select("*").order("created_at", { ascending: false }).limit(150),
    admin
      .from("email_provider_events")
      .select("id,event_type,provider_message_id,recipient,processed_at,processing_error,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (settingsResult.error) throw new Error(settingsResult.error.message);
  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (providerEventsResult.error) throw new Error(providerEventsResult.error.message);

  const events = eventsResult.data ?? [];

  return {
    settings: settingsResult.data,
    events,
    providerEvents: providerEventsResult.data ?? [],
    templates: emailTemplateKeys,
    providerConfigured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    webhookConfigured: Boolean(env.RESEND_WEBHOOK_SECRET),
    safety: {
      environment: env.NODE_ENV,
      redirectTo: env.EMAIL_DEV_REDIRECT_TO ?? null,
      allowlist: env.EMAIL_DEV_ALLOWLIST ?? null,
      externalAllowed: env.EMAIL_ALLOW_EXTERNAL_IN_NON_PROD,
    },
    summary: {
      sent: events.filter((item) => ["sent", "delivered"].includes(item.status)).length,
      failed: events.filter((item) => ["failed", "bounced", "complained", "suppressed"].includes(item.status)).length,
      skipped: events.filter((item) => item.status === "skipped").length,
      pending: events.filter((item) => ["queued", "sending", "delivery_delayed"].includes(item.status)).length,
    },
  };
}
