import "server-only";

import crypto from "node:crypto";

import { env } from "@/config/env";
import { securityHash } from "@/lib/security/crypto";

export function requestId(request: Request) {
  return request.headers.get("x-request-id")?.slice(0, 120) || crypto.randomUUID();
}

export function requesterFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return {
    requesterHash: securityHash(address),
    userAgentHash: securityHash(userAgent),
  };
}

function trustedOrigins() {
  const origins = new Set<string>();

  try {
    origins.add(new URL(env.NEXT_PUBLIC_APP_URL).origin);
  } catch {
    // Environment validation normally prevents this.
  }

  for (const item of (env.TRUSTED_APP_ORIGINS || "").split(",")) {
    const candidate = item.trim();
    if (!candidate) continue;

    try {
      origins.add(new URL(candidate).origin);
    } catch {
      // Invalid optional entries do not widen the trust boundary.
    }
  }

  return origins;
}

export function isTrustedMutationRequest(request: Request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const fetchSite = request.headers.get("sec-fetch-site");
  const allowed = trustedOrigins();

  if (origin) {
    try {
      return allowed.has(new URL(origin).origin);
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  if (fetchSite === "cross-site") return false;

  return env.NODE_ENV !== "production";
}
