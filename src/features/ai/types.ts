import type { Json } from "@/types/database";

export type AssistantHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AssistantSource = {
  key: string;
  type: "service" | "faq" | "case_study" | "process" | "policy" | "page";
  title: string;
  href: string | null;
  excerpt: string;
  score: number;
};

export type AssistantSettings = {
  assistant_enabled: boolean;
  provider: string;
  model: string;
  prompt_version: string;
  logging_enabled: boolean;
  review_enabled: boolean;
  retention_days: number;
  max_messages_per_conversation: number;
  rate_limit_per_10m: number;
  handoff_label: string;
  handoff_href: string;
};

export type AssistantProviderResult = {
  answer: string;
  model: string | null;
  providerResponseId: string | null;
  usedProvider: boolean;
  error: string | null;
};

export type AssistantEventMetadata = Record<string, Json | undefined>;
