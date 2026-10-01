import "server-only";

import crypto from "node:crypto";

import { env } from "@/config/env";
import type { AssistantEventMetadata, AssistantSettings } from "@/features/ai/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function secureHash(value: string) {
  const secret =
    env.AI_REQUEST_HASH_SECRET ??
    env.SUPABASE_SECRET_KEY ??
    "agency-local-ai-request-hash";

  return crypto.createHmac("sha256", secret).update(value).digest("hex");
}

export function requesterFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  const agent = request.headers.get("user-agent") || "unknown";
  return secureHash(`${ip}|${agent}`);
}

export async function getAssistantSettings(): Promise<AssistantSettings> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_settings")
    .select("*")
    .eq("id", "default")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "AI settings are not configured.");
  }

  return data;
}

export async function consumeAssistantRateLimit(requesterHash: string, limit: number) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("consume_ai_rate_limit", {
    p_requester_hash: requesterHash,
    p_limit: limit,
  });

  if (error) throw new Error(`AI rate limit check failed: ${error.message}`);
  return Boolean(data);
}

export async function createConversation({
  requesterHash,
  consentToLogging,
  sourcePage,
  settings,
}: {
  requesterHash: string;
  consentToLogging: boolean;
  sourcePage: string | null;
  settings: AssistantSettings;
}) {
  const admin = getSupabaseAdminClient();
  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const retentionDays =
    consentToLogging && settings.logging_enabled
      ? settings.retention_days
      : 1;

  const retainUntil = new Date(
    Date.now() + retentionDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("ai_conversations")
    .insert({
      session_token_hash: hash(sessionToken),
      requester_hash: requesterHash,
      status: "open",
      consent_to_logging: Boolean(consentToLogging && settings.logging_enabled),
      source_page: sourcePage,
      prompt_version: settings.prompt_version,
      model: settings.model,
      retain_until: retainUntil,
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not start AI conversation.");

  return { conversation: data, sessionToken };
}

export async function verifyConversationSession(id: string, sessionToken: string) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("ai_conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) throw new Error("Conversation session was not found.");

  const expected = Buffer.from(data.session_token_hash, "utf8");
  const actual = Buffer.from(hash(sessionToken), "utf8");

  if (
    expected.length !== actual.length ||
    !crypto.timingSafeEqual(expected, actual)
  ) {
    throw new Error("Conversation session is invalid.");
  }

  return data;
}

export async function updateConversationAfterResponse({
  conversationId,
  messageCount,
}: {
  conversationId: string;
  messageCount: number;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("ai_conversations")
    .update({
      message_count: messageCount,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  if (error) throw new Error(error.message);
}

export async function logAssistantMessage({
  conversationId,
  role,
  body,
  sources = [],
  model,
  promptVersion,
  shouldStore,
}: {
  conversationId: string;
  role: "user" | "assistant";
  body: string;
  sources?: Json[];
  model?: string | null;
  promptVersion?: string | null;
  shouldStore: boolean;
}) {
  if (!shouldStore) return;

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("ai_messages").insert({
    conversation_id: conversationId,
    role,
    body,
    sources,
    model: model ?? null,
    prompt_version: promptVersion ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function logAssistantEvent({
  conversationId,
  eventType,
  metadata = {},
}: {
  conversationId: string | null;
  eventType: string;
  metadata?: AssistantEventMetadata;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("ai_events").insert({
    conversation_id: conversationId,
    event_type: eventType,
    metadata: metadata as Json,
  });

  if (error && env.NODE_ENV !== "production") {
    console.error("[ai] event log failed", { eventType, error: error.message });
  }
}

export async function blockConversation(conversationId: string) {
  const admin = getSupabaseAdminClient();
  await admin
    .from("ai_conversations")
    .update({ status: "blocked" })
    .eq("id", conversationId);
}
