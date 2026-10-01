import crypto from "node:crypto";
import { NextResponse } from "next/server";

import { env } from "@/config/env";
import { checkDatabaseHealth } from "@/lib/db/health";
import { structuredLog } from "@/lib/observability/log";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = crypto.randomUUID();
  const database = await checkDatabaseHealth();
  const productionNeedsDatabase =
    env.NODE_ENV === "production" && database.status === "unconfigured";
  const unhealthy = database.status === "error" || productionNeedsDatabase;

  if (unhealthy) {
    structuredLog("warn", "health.degraded", {
      requestId,
      databaseStatus: database.status,
      databaseLatencyMs: database.latencyMs,
    });
  }

  return NextResponse.json(
    {
      status: unhealthy ? "degraded" : "ok",
      service: env.NEXT_PUBLIC_APP_NAME,
      environment: env.NODE_ENV,
      release: env.APP_RELEASE ?? null,
      checks: {
        database: {
          status: database.status,
          latencyMs: database.latencyMs,
        },
      },
    },
    {
      status: unhealthy ? 503 : 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
      },
    },
  );
}
