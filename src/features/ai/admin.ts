import "server-only";

import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Database } from "@/types/database";

export async function getAiAdminData() {
  const admin = getSupabaseAdminClient();

  const [
    settingsResult,
    knowledgeResult,
    conversationsResult,
    eventsResult,
  ] = await Promise.all([
    admin.from("ai_settings").select("*").eq("id", "default").single(),
    admin.from("ai_knowledge_items").select("*").order("sort_order"),
    admin
      .from("ai_conversations")
      .select("*")
      .eq("consent_to_logging", true)
      .order("created_at", { ascending: false })
      .limit(50),
    admin
      .from("ai_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  for (const result of [
    settingsResult,
    knowledgeResult,
    conversationsResult,
    eventsResult,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  const settings = settingsResult.data;
  if (!settings) throw new Error("AI settings are not initialized.");

  const conversations = conversationsResult.data ?? [];
  const conversationIds = conversations.map((item) => item.id);

  type AiMessageRow = Database["public"]["Tables"]["ai_messages"]["Row"];
  let messages: AiMessageRow[] = [];

  if (conversationIds.length) {
    const { data, error } = await admin
      .from("ai_messages")
      .select("*")
      .in("conversation_id", conversationIds)
      .order("created_at");

    if (error) throw new Error(error.message);
    messages = data ?? [];
  }

  const messagesByConversation = new Map<string, AiMessageRow[]>();

  for (const message of messages) {
    const current = messagesByConversation.get(message.conversation_id) ?? [];
    current.push(message);
    messagesByConversation.set(message.conversation_id, current);
  }

  const events = eventsResult.data ?? [];

  return {
    settings,
    knowledge: knowledgeResult.data ?? [],
    conversations: conversations.map((conversation) => ({
      ...conversation,
      messages: messagesByConversation.get(conversation.id) ?? [],
    })),
    events,
    providerConfigured: Boolean(env.OPENAI_API_KEY),
    summary: {
      responses: events.filter((event) => event.event_type === "assistant.responded").length,
      handoffs: events.filter((event) => event.event_type === "assistant.handoff_completed").length,
      safetyBlocks: events.filter((event) => event.event_type === "assistant.safety_block").length,
      rateLimits: events.filter((event) => event.event_type === "assistant.rate_limited").length,
    },
  };
}
