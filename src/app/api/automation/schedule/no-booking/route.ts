import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { enqueueNoBookingFollowups } from "@/features/automation/schedulers";
import { timingSafeSecretEqual } from "@/lib/security/crypto";
import { recordSecurityEvent } from "@/lib/security/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  if (!env.AUTOMATION_DISPATCH_SECRET) return env.NODE_ENV !== "production";
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  return (
    timingSafeSecretEqual(bearer, env.AUTOMATION_DISPATCH_SECRET) ||
    timingSafeSecretEqual(request.headers.get("x-agency-dispatch-secret"), env.AUTOMATION_DISPATCH_SECRET)
  );
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    await recordSecurityEvent({ eventType: "automation.schedule_unauthorized", severity: "warning", request, source: "automation" });
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const raw = Number(new URL(request.url).searchParams.get("delayHours") ?? 48);
    const delayHours = Number.isFinite(raw) ? Math.max(1, Math.min(Math.trunc(raw), 720)) : 48;
    const rows = await enqueueNoBookingFollowups(delayHours);
    return NextResponse.json({ ok: true, queued: rows.length });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "schedule_failed" }, { status: 500 });
  }
}
