import { NextResponse } from "next/server";
import { z } from "zod";

import { createAssistantLeadHandoff } from "@/features/ai/handoff";
import { recordSecurityEvent } from "@/lib/security/events";
import { getRequestAddress } from "@/lib/security/rate-limit";
import { checkPublicRateLimit } from "@/lib/security/rate-limit-server";
import { isTrustedMutationRequest } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  conversationId: z.string().uuid(),
  sessionToken: z.string().min(20).max(200),
  name: z.string().trim().min(2).max(160),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  company: z.string().trim().max(200).nullable().optional(),
  projectSummary: z.string().trim().min(20).max(4000),
  serviceType: z.string().trim().max(160).nullable().optional(),
  privacyAccepted: z.literal(true),
  attribution: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
  turnstileToken: z.string().trim().max(4096).optional().default(""),
});

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "ai_handoff" });
    return NextResponse.json({ ok: false, error: "invalid_origin", detail: "Request origin was rejected." }, { status: 403 });
  }

  const rate = await checkPublicRateLimit({ request, bucket: "assistant-handoff", limit: 5, windowSeconds: 15 * 60 });
  if (!rate.allowed) {
    await recordSecurityEvent({ eventType: "rate_limit.assistant_handoff", severity: "warning", request, source: "ai_handoff" });
    return NextResponse.json({ ok: false, error: "rate_limited", detail: "Too many handoff attempts. Please wait and retry." }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_handoff", detail: parsed.error.issues[0]?.message ?? "Invalid handoff data." }, { status: 400 });
  }

  const challenge = await verifyTurnstile({
    token: parsed.data.turnstileToken,
    remoteIp: getRequestAddress(request.headers),
  });

  if (!challenge.ok) {
    await recordSecurityEvent({
      eventType: "bot.turnstile_failed",
      severity: "warning",
      request,
      source: "ai_handoff",
      metadata: { errors: challenge.errors, configured: challenge.configured },
    });
    return NextResponse.json({ ok: false, error: "bot_verification_failed", detail: "Bot verification could not be completed. Please retry." }, { status: 403 });
  }

  try {
    const result = await createAssistantLeadHandoff({
      conversationId: parsed.data.conversationId,
      sessionToken: parsed.data.sessionToken,
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company || null,
      projectSummary: parsed.data.projectSummary,
      serviceType: parsed.data.serviceType || null,
      attribution: parsed.data.attribution,
    });

    return NextResponse.json({
      ok: true,
      leadId: result.leadId,
      existingLeadEnriched: result.alreadyCreated,
      message: "Thanks — your contact and project details were handed to the agency team. A human can continue from here.",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "handoff_failed", detail: error instanceof Error ? error.message : "Handoff failed." }, { status: 500 });
  }
}
