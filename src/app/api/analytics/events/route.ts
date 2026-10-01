import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAnalyticsEvent } from "@/features/analytics/server";
import { analyticsEventNames } from "@/features/analytics/taxonomy";
import { recordSecurityEvent } from "@/lib/security/events";
import { checkPublicRateLimit } from "@/lib/security/rate-limit-server";
import { isTrustedMutationRequest } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const safeProperties = z
  .object({
    location: z.string().trim().max(120).optional(),
    step: z.number().int().min(0).max(20).optional(),
    step_name: z.string().trim().max(80).optional(),
    service_slug: z.string().trim().max(120).optional(),
    case_study_slug: z.string().trim().max(160).optional(),
    channel: z.string().trim().max(80).optional(),
    booking_type: z.string().trim().max(120).optional(),
    cta_href: z.string().trim().max(120).optional(),
    result: z.string().trim().max(80).optional(),
  })
  .strict();

const attribution = z
  .object({
    utm_source: z.string().trim().max(240).optional(),
    utm_medium: z.string().trim().max(240).optional(),
    utm_campaign: z.string().trim().max(240).optional(),
    utm_term: z.string().trim().max(240).optional(),
    utm_content: z.string().trim().max(240).optional(),
    landing_path: z.string().trim().max(500).optional(),
    referrer_host: z.string().trim().max(255).optional(),
  })
  .strict();

const schema = z.object({
  eventKey: z.string().trim().min(8).max(240),
  eventName: z.enum(analyticsEventNames),
  sessionId: z.string().uuid(),
  path: z.string().trim().max(500).optional(),
  attribution: attribution.default({}),
  properties: safeProperties.default({}),
});

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "info", request, source: "analytics" });
    return NextResponse.json({ ok: false, error: "invalid_origin" }, { status: 403 });
  }

  const rate = await checkPublicRateLimit({ request, bucket: "analytics", limit: 120, windowSeconds: 10 * 60 });

  if (!rate.allowed) {
    await recordSecurityEvent({ eventType: "rate_limit.analytics", severity: "info", request, source: "analytics" });
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 422 });
  }

  try {
    await recordAnalyticsEvent({
      eventKey: parsed.data.eventKey,
      eventName: parsed.data.eventName,
      source: "browser",
      sessionId: parsed.data.sessionId,
      path: parsed.data.path,
      attribution: parsed.data.attribution,
      properties: parsed.data.properties,
    });

    return NextResponse.json({ ok: true }, { status: 202 });
  } catch {
    return NextResponse.json({ ok: false, error: "analytics_write_failed" }, { status: 500 });
  }
}
