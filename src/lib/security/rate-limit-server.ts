import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { requesterFingerprint } from "@/lib/security/request";

export async function checkPublicRateLimit({
  request,
  bucket,
  limit,
  windowSeconds,
}: {
  request: Request;
  bucket: string;
  limit: number;
  windowSeconds: number;
}) {
  const fingerprint = requesterFingerprint(request);

  if (!isSupabaseConfigured()) {
    const fallback = checkRateLimit(
      `${bucket}:${fingerprint.requesterHash}`,
      limit,
      windowSeconds * 1000,
    );

    return {
      ...fallback,
      requesterHash: fingerprint.requesterHash,
      distributed: false,
    };
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_security_rate_limit", {
    p_key_hash: fingerprint.requesterHash,
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || !data?.length) {
    const fallback = checkRateLimit(
      `${bucket}:${fingerprint.requesterHash}`,
      limit,
      windowSeconds * 1000,
    );

    return {
      ...fallback,
      requesterHash: fingerprint.requesterHash,
      distributed: false,
    };
  }

  const row = data[0];

  return {
    allowed: row.allowed,
    remaining: row.remaining,
    resetAt: new Date(row.reset_at).getTime(),
    requesterHash: fingerprint.requesterHash,
    distributed: true,
  };
}
