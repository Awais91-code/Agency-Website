import "server-only";

import crypto from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { BookingContext, BookingTypeRow } from "@/features/booking/types";
import type { Json } from "@/types/database";

function toObject(value: Json | null | undefined): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value as Record<string, unknown>;
}

function normalizedServiceType(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function listActiveBookingTypes() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("booking_types")
    .select("*")
    .eq("is_active", true)
    .is("archived_at", null)
    .order("sort_order")
    .order("label");

  if (error) throw new Error(`Could not load booking types: ${error.message}`);
  return data ?? [];
}

export async function createBookingHandoff(leadId: string) {
  const admin = getSupabaseAdminClient();

  const { data: existing } = await admin
    .from("booking_handoffs")
    .select("token,expires_at")
    .eq("lead_id", leadId)
    .gt("expires_at", new Date().toISOString())
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token;

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("metadata")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) throw new Error("Could not create booking handoff for lead.");

  const metadata = toObject(lead.metadata);
  const serviceType = normalizedServiceType(metadata.service_type);

  const { data: preferredType } = serviceType
    ? await admin
        .from("booking_types")
        .select("slug")
        .eq("service_type", serviceType)
        .eq("is_active", true)
        .is("archived_at", null)
        .order("sort_order")
        .limit(1)
        .maybeSingle()
    : { data: null };

  const token = crypto.randomUUID();
  const attribution = toObject(metadata.attribution as Json | undefined);

  const { error } = await admin.from("booking_handoffs").insert({
    token,
    lead_id: leadId,
    booking_type_slug: preferredType?.slug ?? "discovery-call",
    attribution: attribution as Json,
  });

  if (error) throw new Error(`Could not create booking handoff: ${error.message}`);
  return token;
}

export async function resolveBookingContext(token: string | undefined | null): Promise<BookingContext | null> {
  if (!token || !/^[0-9a-f-]{36}$/i.test(token)) return null;

  const admin = getSupabaseAdminClient();
  const { data: handoff, error } = await admin
    .from("booking_handoffs")
    .select("token,lead_id,attribution,expires_at")
    .eq("token", token)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error || !handoff) return null;

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id,full_name,email,source,metadata")
    .eq("id", handoff.lead_id)
    .is("archived_at", null)
    .maybeSingle();

  if (leadError || !lead) return null;

  const metadata = toObject(lead.metadata);
  return {
    token: handoff.token,
    leadId: lead.id,
    leadName: lead.full_name,
    leadEmail: lead.email,
    source: lead.source,
    serviceType: normalizedServiceType(metadata.service_type),
    attribution: toObject(handoff.attribution),
  };
}

export function chooseBookingType(
  types: BookingTypeRow[],
  requestedSlug: string | undefined,
  context: BookingContext | null,
) {
  const requested = requestedSlug ? types.find((item) => item.slug === requestedSlug) : null;
  if (requested) return requested;

  if (context?.serviceType) {
    const match = types.find((item) => item.service_type === context.serviceType);
    if (match) return match;
  }

  return types.find((item) => item.slug === "discovery-call") ?? types[0] ?? null;
}

export function buildBookingUrl(type: BookingTypeRow, context: BookingContext | null) {
  if (!type.provider_url) return null;

  try {
    const url = new URL(type.provider_url);
    if (context?.leadName) url.searchParams.set("name", context.leadName);
    if (context?.leadEmail) url.searchParams.set("email", context.leadEmail);

    // Cal.com supports query-string prefilling and UTM propagation.
    // booking_context should also be configured as a custom booking field if
    // you want deterministic lead matching beyond attendee-email fallback.
    if (context?.token) url.searchParams.set("booking_context", context.token);

    url.searchParams.set("utm_source", String(context?.attribution.utm_source ?? context?.source ?? "agency-website"));
    if (context?.attribution.utm_medium) url.searchParams.set("utm_medium", String(context.attribution.utm_medium));
    if (context?.attribution.utm_campaign) url.searchParams.set("utm_campaign", String(context.attribution.utm_campaign));
    return url.toString();
  } catch {
    return null;
  }
}

export async function markBookingHandoffUsed(token: string | null) {
  if (!token) return;
  const admin = getSupabaseAdminClient();
  await admin
    .from("booking_handoffs")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token)
    .is("used_at", null);
}
