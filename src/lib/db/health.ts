import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export type DatabaseHealth =
  | { status: "ok"; latencyMs: number }
  | { status: "unconfigured"; latencyMs: null }
  | { status: "error"; latencyMs: number; message: string };

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!isSupabaseConfigured()) {
    return { status: "unconfigured", latencyMs: null };
  }

  const startedAt = performance.now();

  try {
    const client = getSupabaseAdminClient();
    const { error } = await client
      .from("content_records")
      .select("id", { count: "exact", head: true });

    const latencyMs = Math.round(performance.now() - startedAt);

    if (error) {
      return {
        status: "error",
        latencyMs,
        message: error.message,
      };
    }

    return { status: "ok", latencyMs };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Math.round(performance.now() - startedAt),
      message: error instanceof Error ? error.message : "Unknown database health-check error.",
    };
  }
}
