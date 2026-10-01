import type { Database, Json } from "@/types/database";

export type EmailDeliveryStatus = Database["public"]["Enums"]["email_delivery_status"];

export const emailTemplateKeys = [
  "enquiry-confirmation",
  "booking",
  "invite",
  "password-reset",
  "onboarding",
  "project-update",
  "admin-new-lead",
  "admin-booking",
  "admin-alert",
] as const;

export type EmailTemplateKey = (typeof emailTemplateKeys)[number];

export type EmailTemplateData = Record<string, Json | undefined>;

export type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
};

export type SendTransactionalEmailInput = {
  templateKey: EmailTemplateKey;
  to: string;
  data: EmailTemplateData;
  idempotencyKey: string;
  contextType?: string | null;
  contextId?: string | null;
};

export type SendTransactionalEmailResult = {
  eventId: string | null;
  status: EmailDeliveryStatus;
  duplicate: boolean;
  providerMessageId: string | null;
  recipient: string;
  originalRecipient: string;
  error: string | null;
};
