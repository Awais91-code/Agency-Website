import "server-only";

import { env } from "@/config/env";
import { normalizeAttribution } from "@/features/analytics/attribution";
import type {
  AnalyticsEventName,
  AnalyticsSafeProperties,
} from "@/features/analytics/taxonomy";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

function environmentName() {
  return env.ANALYTICS_ENVIRONMENT || env.NODE_ENV;
}

function cleanPath(value: string | null | undefined) {
  if (!value) return null;

  try {
    const parsed = new URL(value, env.NEXT_PUBLIC_APP_URL);
    return parsed.pathname.slice(0, 500);
  } catch {
    return value.startsWith("/") ? value.slice(0, 500) : null;
  }
}

export async function recordAnalyticsEvent(input: {
  eventKey: string;
  eventName: AnalyticsEventName;
  source: "browser" | "server";
  sessionId?: string | null;
  leadId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  path?: string | null;
  attribution?: unknown;
  properties?: AnalyticsSafeProperties;
}) {
  const admin = getSupabaseAdminClient();
  const attribution = normalizeAttribution(input.attribution);

  const { data, error } = await admin
    .from("analytics_events")
    .upsert(
      {
        event_key: input.eventKey.slice(0, 240),
        event_name: input.eventName,
        environment: environmentName(),
        source: input.source,
        session_id: input.sessionId ?? null,
        lead_id: input.leadId ?? null,
        entity_type: input.entityType?.slice(0, 80) ?? null,
        entity_id: input.entityId?.slice(0, 160) ?? null,
        path: cleanPath(input.path),
        referrer_host: attribution.referrer_host ?? null,
        attribution: attribution as Json,
        properties: (input.properties ?? {}) as Json,
      },
      { onConflict: "event_key", ignoreDuplicates: true },
    )
    .select("id,event_key,event_name")
    .maybeSingle();

  if (error) throw new Error(`Analytics event failed: ${error.message}`);
  return data;
}

export async function recordServerConversion(input: {
  eventKey: string;
  eventName: AnalyticsEventName;
  leadId?: string | null;
  entityType: string;
  entityId: string;
  attribution?: unknown;
  properties?: AnalyticsSafeProperties;
}) {
  return recordAnalyticsEvent({
    ...input,
    source: "server",
  });
}
