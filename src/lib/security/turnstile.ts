import "server-only";

import { env } from "@/config/env";

type TurnstileResponse = {
  success?: boolean;
  "error-codes"?: string[];
  hostname?: string;
  action?: string;
};

export function turnstileConfigured() {
  return Boolean(
    env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY,
  );
}

export async function verifyTurnstile({
  token,
  remoteIp,
}: {
  token: string | null | undefined;
  remoteIp?: string | null;
}) {
  if (!turnstileConfigured()) {
    return {
      ok: !env.TURNSTILE_REQUIRED,
      configured: false,
      errors: env.TURNSTILE_REQUIRED ? ["turnstile_not_configured"] : [],
    };
  }

  if (!token) {
    return {
      ok: false,
      configured: true,
      errors: ["missing-input-response"],
    };
  }

  const body = new URLSearchParams({
    secret: env.TURNSTILE_SECRET_KEY!,
    response: token,
  });

  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        configured: true,
        errors: [`http_${response.status}`],
      };
    }

    const payload = (await response.json()) as TurnstileResponse;

    return {
      ok: payload.success === true,
      configured: true,
      errors: payload["error-codes"] ?? [],
      hostname: payload.hostname ?? null,
      action: payload.action ?? null,
    };
  } catch {
    return {
      ok: false,
      configured: true,
      errors: ["verification_unavailable"],
    };
  }
}
