import "server-only";

import crypto from "node:crypto";

import { env } from "@/config/env";

export function timingSafeSecretEqual(
  supplied: string | null | undefined,
  expected: string | null | undefined,
) {
  if (!supplied || !expected) return false;

  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(expected, "utf8");

  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function securityHash(value: string) {
  const secret =
    env.SECURITY_HASH_SECRET ||
    env.AI_REQUEST_HASH_SECRET ||
    env.SUPABASE_SECRET_KEY ||
    "agency-local-security-hash";

  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}
