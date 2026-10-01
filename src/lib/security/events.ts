import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { requestId, requesterFingerprint } from "@/lib/security/request";
import type { Database, Json } from "@/types/database";

type Severity = Database["public"]["Enums"]["security_severity"];

export async function recordSecurityEvent({
  eventType,
  severity = "info",
  request,
  actorUserId = null,
  source = "application",
  metadata = {},
}: {
  eventType: string;
  severity?: Severity;
  request?: Request | null;
  actorUserId?: string | null;
  source?: string;
  metadata?: Record<string, Json | undefined>;
}) {
  const admin = getSupabaseAdminClient();
  const fingerprint = request
    ? requesterFingerprint(request)
    : { requesterHash: null, userAgentHash: null };

  const route = request
    ? (() => {
        try {
          return new URL(request.url).pathname.slice(0, 500);
        } catch {
          return null;
        }
      })()
    : null;

  const { error } = await admin.from("security_events").insert({
    event_type: eventType,
    severity,
    actor_user_id: actorUserId,
    request_id: request ? requestId(request) : null,
    route,
    source,
    requester_hash: fingerprint.requesterHash,
    user_agent_hash: fingerprint.userAgentHash,
    metadata: metadata as Json,
  });

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[security] event write failed", {
      eventType,
      severity,
      error: error.message,
    });
  }
}
