import "server-only";

import {
  buildAssistantInstructions,
  detectCommercialRequest,
  detectInstructionBypass,
  detectPrivateDataRequest,
  detectProjectIntent,
  enforceCommercialGuardrails,
} from "@/features/ai/prompt";
import { getApprovedKnowledge } from "@/features/ai/knowledge";
import {
  generateGroundedAssistantAnswer,
  moderateAssistantInput,
} from "@/features/ai/provider";
import {
  blockConversation,
  createConversation,
  getAssistantSettings,
  logAssistantEvent,
  logAssistantMessage,
  updateConversationAfterResponse,
  verifyConversationSession,
} from "@/features/ai/session";
import type { AssistantHistoryMessage } from "@/features/ai/types";

function fallbackAnswer(
  message: string,
  sources: Awaited<ReturnType<typeof getApprovedKnowledge>>,
  handoffHref: string,
) {
  const top = sources.find((source) => source.score > 0);

  if (detectPrivateDataRequest(message) || detectInstructionBypass(message)) {
    return "I only have access to approved public agency content. I can’t access or reveal private client, admin, credential or internal project data.";
  }

  if (!top) {
    return `I don’t have a confirmed answer for that in the approved public knowledge. A human can help at ${handoffHref}.`;
  }

  return `Based on the published information for “${top.title}”: ${top.excerpt}`;
}

export async function runAssistantTurn({
  request,
  message,
  history,
  conversationId,
  sessionToken,
  consentToLogging,
  sourcePage,
}: {
  request: Request;
  message: string;
  history: AssistantHistoryMessage[];
  conversationId: string | null;
  sessionToken: string | null;
  consentToLogging: boolean;
  sourcePage: string | null;
}) {
  const settings = await getAssistantSettings();

  if (!settings.assistant_enabled) {
    return {
      status: 503,
      body: {
        ok: false,
        error: "assistant_disabled",
        answer: `The AI assistant is currently unavailable. Please use ${settings.handoff_href} to contact a human.`,
        handoffHref: settings.handoff_href,
      },
    };
  }

  const { requesterFingerprint, consumeAssistantRateLimit } = await import(
    "@/features/ai/session"
  );
  const requesterHash = requesterFingerprint(request);
  const allowed = await consumeAssistantRateLimit(
    requesterHash,
    settings.rate_limit_per_10m,
  );

  if (!allowed) {
    await logAssistantEvent({
      conversationId,
      eventType: "assistant.rate_limited",
      metadata: { limit: settings.rate_limit_per_10m },
    });

    return {
      status: 429,
      body: {
        ok: false,
        error: "rate_limited",
        answer: `Too many assistant requests were sent in a short period. Please try again later or contact a human at ${settings.handoff_href}.`,
        handoffHref: settings.handoff_href,
      },
    };
  }

  let conversation;
  let nextSessionToken = sessionToken;

  if (conversationId && sessionToken) {
    conversation = await verifyConversationSession(conversationId, sessionToken);
  } else {
    const created = await createConversation({
      requesterHash,
      consentToLogging,
      sourcePage,
      settings,
    });
    conversation = created.conversation;
    nextSessionToken = created.sessionToken;
  }

  if (conversation.status === "blocked" || conversation.status === "closed") {
    return {
      status: 403,
      body: {
        ok: false,
        error: "conversation_closed",
        answer: `This assistant session is closed. Please use ${settings.handoff_href} if you need help.`,
        handoffHref: settings.handoff_href,
      },
    };
  }

  if (conversation.message_count >= settings.max_messages_per_conversation) {
    await logAssistantEvent({
      conversationId: conversation.id,
      eventType: "assistant.conversation_limit",
      metadata: { max_messages: settings.max_messages_per_conversation },
    });

    return {
      status: 429,
      body: {
        ok: false,
        error: "conversation_limit",
        answer: `This chat has reached its conversation limit. Please continue with a human at ${settings.handoff_href}.`,
        conversationId: conversation.id,
        sessionToken: nextSessionToken,
        handoffHref: settings.handoff_href,
      },
    };
  }

  const moderation = await moderateAssistantInput(message);

  if (moderation.flagged) {
    await blockConversation(conversation.id);
    await logAssistantEvent({
      conversationId: conversation.id,
      eventType: "assistant.safety_block",
      metadata: {
        categories: moderation.categories,
        moderation_provider_used: moderation.providerUsed,
      },
    });

    return {
      status: 400,
      body: {
        ok: false,
        error: "safety_block",
        answer:
          "I can’t continue with that request. I can still help with ordinary questions about the agency’s published services, process and project enquiry options in a new session.",
        conversationId: conversation.id,
        sessionToken: nextSessionToken,
        handoffHref: settings.handoff_href,
      },
    };
  }

  const sources = await getApprovedKnowledge(message);
  const instructions = buildAssistantInstructions({
    knowledge: sources,
    promptVersion: settings.prompt_version,
    handoffHref: settings.handoff_href,
  });

  const shouldStore =
    conversation.consent_to_logging && settings.logging_enabled;

  await logAssistantMessage({
    conversationId: conversation.id,
    role: "user",
    body: message,
    model: conversation.model,
    promptVersion: conversation.prompt_version,
    shouldStore,
  });

  const startedAt = Date.now();
  const provider = await generateGroundedAssistantAnswer({
    model: settings.model,
    instructions,
    history,
    message,
  });

  let answer =
    provider.answer ||
    fallbackAnswer(message, sources, settings.handoff_href);

  answer = enforceCommercialGuardrails(message, answer);

  const publicSources = sources
    .filter((source) => source.score > 0)
    .slice(0, 4)
    .map((source) => ({
      key: source.key,
      type: source.type,
      title: source.title,
      href: source.href,
      excerpt: source.excerpt,
      score: source.score,
    }));

  await logAssistantMessage({
    conversationId: conversation.id,
    role: "assistant",
    body: answer,
    sources: publicSources,
    model: provider.model ?? settings.model,
    promptVersion: settings.prompt_version,
    shouldStore,
  });

  await updateConversationAfterResponse({
    conversationId: conversation.id,
    messageCount: conversation.message_count + 1,
  });

  const projectIntent = detectProjectIntent(message);

  await logAssistantEvent({
    conversationId: conversation.id,
    eventType: "assistant.responded",
    metadata: {
      prompt_version: settings.prompt_version,
      model: provider.model ?? settings.model,
      provider_used: provider.usedProvider,
      provider_error: provider.error,
      provider_response_id: provider.providerResponseId,
      latency_ms: Date.now() - startedAt,
      source_keys: publicSources.map((source) => source.key),
      project_intent: projectIntent,
      commercial_guardrail: detectCommercialRequest(message),
      private_data_guardrail: detectPrivateDataRequest(message),
      injection_guardrail: detectInstructionBypass(message),
      logged_with_consent: shouldStore,
    },
  });

  return {
    status: 200,
    body: {
      ok: true,
      answer,
      conversationId: conversation.id,
      sessionToken: nextSessionToken,
      sources: publicSources,
      handoffSuggested: projectIntent || detectCommercialRequest(message),
      handoffLabel: settings.handoff_label,
      handoffHref: settings.handoff_href,
      providerConfigured: provider.usedProvider,
      remainingMessages: Math.max(
        0,
        settings.max_messages_per_conversation -
          (conversation.message_count + 1),
      ),
    },
  };
}
