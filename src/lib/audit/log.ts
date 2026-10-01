import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

const secretKey = /(password|secret|token|authorization|cookie|api[_-]?key|private[_-]?key)/i;

function sanitize(value: Json | undefined, depth = 0): Json | undefined {
  if (depth > 6 || value === undefined) return value;
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1) ?? null);
  }

  const next: Record<string, Json> = {};
  for (const [key, item] of Object.entries(value)) {
    next[key] = secretKey.test(key)
      ? "[REDACTED]"
      : (sanitize(item, depth + 1) ?? null);
  }
  return next;
}

export async function recordAuditLog({
  actorUserId,
  action,
  objectType,
  objectId,
  requestId = null,
  metadata = {},
}: {
  actorUserId: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  requestId?: string | null;
  metadata?: Record<string, Json | undefined>;
}) {
  const sanitized = sanitize(metadata as Json) ?? {};
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("audit_logs").insert({
    actor_user_id: actorUserId,
    action,
    object_type: objectType,
    object_id: objectId ?? null,
    request_id: requestId,
    metadata: sanitized,
  });

  if (error && process.env.NODE_ENV !== "production") {
    console.error("[audit] write failed", {
      action,
      objectType,
      objectId,
      error: error.message,
    });
  }
}
