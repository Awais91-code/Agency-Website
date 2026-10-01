import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

const allowedKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "landing_path",
  "referrer_host",
] as const;

export type LeadAttribution = Partial<Record<(typeof allowedKeys)[number], string>>;

function clean(value: unknown, max = 240) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed || null;
}

export function normalizeAttribution(input: unknown): LeadAttribution {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};

  const raw = input as Record<string, unknown>;
  const next: LeadAttribution = {};

  for (const key of allowedKeys) {
    const value = clean(raw[key], key === "landing_path" ? 500 : 240);
    if (value) next[key] = value;
  }

  if (next.landing_path && !next.landing_path.startsWith("/")) {
    delete next.landing_path;
  }

  return next;
}

export async function applyLeadAttribution(
  leadId: string,
  rawAttribution: unknown,
) {
  const incoming = normalizeAttribution(rawAttribution);
  if (!Object.keys(incoming).length) return null;

  const admin = getSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("leads")
    .select(
      "attribution_source,utm_source,utm_medium,utm_campaign,utm_term,utm_content,landing_path,initial_referrer_host,attribution_captured_at",
    )
    .eq("id", leadId)
    .single();

  if (currentError || !current) {
    throw new Error(currentError?.message ?? "Lead attribution target not found.");
  }

  const attributionSource =
    current.attribution_source ??
    incoming.utm_source ??
    incoming.referrer_host ??
    null;

  const payload = {
    attribution_source: attributionSource,
    utm_source: current.utm_source ?? incoming.utm_source ?? null,
    utm_medium: current.utm_medium ?? incoming.utm_medium ?? null,
    utm_campaign: current.utm_campaign ?? incoming.utm_campaign ?? null,
    utm_term: current.utm_term ?? incoming.utm_term ?? null,
    utm_content: current.utm_content ?? incoming.utm_content ?? null,
    landing_path: current.landing_path ?? incoming.landing_path ?? null,
    initial_referrer_host:
      current.initial_referrer_host ?? incoming.referrer_host ?? null,
    attribution_captured_at:
      current.attribution_captured_at ?? new Date().toISOString(),
  };

  const { error } = await admin.from("leads").update(payload).eq("id", leadId);
  if (error) throw new Error(error.message);

  return payload;
}
