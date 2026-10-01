import "server-only";

import { env } from "@/config/env";
import type {
  AssistantHistoryMessage,
  AssistantProviderResult,
} from "@/features/ai/types";

function extractOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as {
    output_text?: unknown;
    output?: unknown;
  };

  if (typeof response.output_text === "string") return response.output_text.trim();

  if (!Array.isArray(response.output)) return "";

  const parts: string[] = [];

  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;

    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const typed = part as { type?: unknown; text?: unknown };
      if (typed.type === "output_text" && typeof typed.text === "string") {
        parts.push(typed.text);
      }
    }
  }

  return parts.join("\n").trim();
}

async function openAiFetch(path: string, body: unknown, timeoutMs = 25_000) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });

    const text = await response.text();
    let json: unknown = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!response.ok) {
      const message =
        json && typeof json === "object"
          ? JSON.stringify(json).slice(0, 1000)
          : text.slice(0, 1000);
      throw new Error(`OpenAI ${response.status}: ${message}`);
    }

    return json;
  } finally {
    clearTimeout(timer);
  }
}

export function isOpenAiConfigured() {
  return Boolean(env.OPENAI_API_KEY);
}

export async function moderateAssistantInput(input: string) {
  if (!env.OPENAI_API_KEY) {
    return { flagged: false, categories: [] as string[], providerUsed: false };
  }

  const payload = await openAiFetch("moderations", {
    model: "omni-moderation-latest",
    input,
  });

  const results =
    payload && typeof payload === "object"
      ? (payload as { results?: unknown }).results
      : null;

  const first = Array.isArray(results) ? results[0] : null;
  if (!first || typeof first !== "object") {
    return { flagged: false, categories: [] as string[], providerUsed: true };
  }

  const flagged = Boolean((first as { flagged?: unknown }).flagged);
  const categoriesRaw = (first as { categories?: unknown }).categories;
  const categories =
    categoriesRaw && typeof categoriesRaw === "object"
      ? Object.entries(categoriesRaw as Record<string, unknown>)
          .filter(([, value]) => value === true)
          .map(([key]) => key)
      : [];

  return { flagged, categories, providerUsed: true };
}

export async function generateGroundedAssistantAnswer({
  model,
  instructions,
  history,
  message,
}: {
  model: string;
  instructions: string;
  history: AssistantHistoryMessage[];
  message: string;
}): Promise<AssistantProviderResult> {
  if (!env.OPENAI_API_KEY) {
    return {
      answer: "",
      model: null,
      providerResponseId: null,
      usedProvider: false,
      error: "OPENAI_API_KEY is not configured.",
    };
  }

  try {
    const input = [
      ...history.slice(-8).map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: "user" as const, content: message },
    ];

    const payload = await openAiFetch("responses", {
      model,
      store: false,
      instructions,
      input,
      max_output_tokens: 700,
      metadata: {
        purpose: "public_agency_assistant",
      },
    });

    const answer = extractOutputText(payload);
    const providerResponseId =
      payload && typeof payload === "object"
        ? ((payload as { id?: unknown }).id as string | undefined) ?? null
        : null;

    if (!answer) {
      return {
        answer: "",
        model,
        providerResponseId,
        usedProvider: true,
        error: "The model returned no text output.",
      };
    }

    return {
      answer,
      model,
      providerResponseId,
      usedProvider: true,
      error: null,
    };
  } catch (error) {
    return {
      answer: "",
      model,
      providerResponseId: null,
      usedProvider: true,
      error: error instanceof Error ? error.message : "OpenAI request failed.",
    };
  }
}
