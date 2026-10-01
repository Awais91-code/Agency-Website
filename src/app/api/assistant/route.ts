import { NextResponse } from "next/server";
import { z } from "zod";

import { runAssistantTurn } from "@/features/ai/service";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const historyItem = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

const requestSchema = z.object({
  message: z.string().trim().min(1).max(1500),
  history: z.array(historyItem).max(8).default([]),
  conversationId: z.string().uuid().nullable().optional(),
  sessionToken: z.string().min(20).max(200).nullable().optional(),
  consentToLogging: z.boolean().default(false),
  sourcePage: z.string().trim().max(500).nullable().optional(),
});

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "ai_assistant" });
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  let raw: unknown;

  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_request",
        detail: parsed.error.issues[0]?.message ?? "Invalid assistant request.",
      },
      { status: 400 },
    );
  }

  if (
    Boolean(parsed.data.conversationId) !==
    Boolean(parsed.data.sessionToken)
  ) {
    return NextResponse.json(
      { ok: false, error: "invalid_session_pair" },
      { status: 400 },
    );
  }

  try {
    const result = await runAssistantTurn({
      request,
      message: parsed.data.message,
      history: parsed.data.history,
      conversationId: parsed.data.conversationId ?? null,
      sessionToken: parsed.data.sessionToken ?? null,
      consentToLogging: parsed.data.consentToLogging,
      sourcePage: parsed.data.sourcePage ?? null,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[ai] assistant route failed", error);
    }

    return NextResponse.json(
      {
        ok: false,
        error: "assistant_failed",
        answer:
          "The assistant could not complete that request. Please use the contact page if you need immediate help.",
      },
      { status: 500 },
    );
  }
}
