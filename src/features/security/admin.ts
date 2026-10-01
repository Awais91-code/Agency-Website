import "server-only";

import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function getSecurityAdminData() {
  const admin = getSupabaseAdminClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [eventsResult, retentionResult, auditResult] = await Promise.all([
    admin
      .from("security_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(150),
    admin
      .from("data_retention_policies")
      .select("*")
      .order("policy_key"),
    admin
      .from("audit_logs")
      .select("id,actor_user_id,action,object_type,object_id,request_id,created_at")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  for (const result of [eventsResult, retentionResult, auditResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const events = eventsResult.data ?? [];
  const recentEvents = events.filter((event) => event.created_at >= since24h);

  return {
    events,
    retention: retentionResult.data ?? [],
    recentAuditCount: (auditResult.data ?? []).length,
    summary: {
      last24h: recentEvents.length,
      warnings24h: recentEvents.filter((event) => event.severity === "warning").length,
      critical24h: recentEvents.filter((event) => event.severity === "critical").length,
      rateLimits24h: recentEvents.filter((event) => event.event_type.startsWith("rate_limit.")).length,
    },
    configuration: {
      productionHttps:
        env.NODE_ENV !== "production" || env.NEXT_PUBLIC_APP_URL.startsWith("https://"),
      turnstileConfigured: Boolean(
        env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY,
      ),
      turnstileRequired: env.TURNSTILE_REQUIRED,
      securityHashConfigured: Boolean(env.SECURITY_HASH_SECRET),
      bookingWebhookSigned: Boolean(env.CALCOM_WEBHOOK_SECRET),
      emailWebhookSigned: Boolean(env.RESEND_WEBHOOK_SECRET),
      automationCallbackSigned: Boolean(env.N8N_CALLBACK_SECRET),
      automationDispatchSigned: Boolean(env.AUTOMATION_DISPATCH_SECRET),
      trustedExtraOriginsConfigured: Boolean(env.TRUSTED_APP_ORIGINS),
    },
  };
}
