import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { processAutomationCallback } from "@/features/automation/callback";
import { timingSafeSecretEqual } from "@/lib/security/crypto";
import { recordSecurityEvent } from "@/lib/security/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!env.N8N_CALLBACK_SECRET) {
    return NextResponse.json({ ok: false, error: "callback_secret_not_configured" }, { status: 503 });
  }

  if (!timingSafeSecretEqual(request.headers.get("x-agency-callback-secret"), env.N8N_CALLBACK_SECRET)) {
    await recordSecurityEvent({ eventType: "webhook.automation_callback_invalid_secret", severity: "warning", request, source: "automation" });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ ok: true, ...(await processAutomationCallback(await request.json())) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "callback_failed" }, { status: 400 });
  }
}
