import "server-only";

import { Resend } from "resend";

import { env } from "@/config/env";

export function isResendConfigured() {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

function getResend() {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  return new Resend(env.RESEND_API_KEY);
}

export async function sendWithResend({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}) {
  if (!env.EMAIL_FROM) {
    return {
      id: null,
      error: "EMAIL_FROM is not configured.",
      raw: null,
    };
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send(
      {
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        html,
        text,
        replyTo: env.EMAIL_REPLY_TO,
      },
      { idempotencyKey },
    );

    if (error) {
      return {
        id: null,
        error: error.message || "Resend rejected the email.",
        raw: error,
      };
    }

    return {
      id: data?.id ?? null,
      error: null,
      raw: data ?? null,
    };
  } catch (error) {
    return {
      id: null,
      error: error instanceof Error ? error.message : "Resend request failed.",
      raw: null,
    };
  }
}

export async function verifyResendWebhook(
  payload: string,
  headers: {
    id: string | null;
    timestamp: string | null;
    signature: string | null;
  },
) {
  if (!env.RESEND_WEBHOOK_SECRET) {
    throw new Error("RESEND_WEBHOOK_SECRET is not configured.");
  }

  if (!headers.id || !headers.timestamp || !headers.signature) {
    throw new Error("Missing Resend webhook signature headers.");
  }

  const resend = new Resend(env.RESEND_API_KEY ?? "re_webhook_verification_only");

  return await resend.webhooks.verify({
    payload,
    headers: {
      id: headers.id,
      timestamp: headers.timestamp,
      signature: headers.signature,
    },
    webhookSecret: env.RESEND_WEBHOOK_SECRET,
  });
}
