import { z } from "zod";

const projectType = z.enum(["website", "ecommerce", "web-app", "mobile-app", "ui-ux", "automation", "ai-solution", "other"]);
const complexity = z.enum(["standard", "advanced", "enterprise"]);
const urgency = z.enum(["flexible", "standard", "urgent"]);
const support = z.enum(["none", "launch-support", "monthly-retainer"]);

export const estimateInputSchema = z.object({
  projectType,
  features: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  complexity,
  urgency,
  support,
});

export const draftProjectBriefSchema = z.object({
  sessionToken: z.string().uuid(),
  projectType: projectType.optional().or(z.literal("")),
  features: z.array(z.string().trim().min(2).max(80)).max(20).default([]),
  companyName: z.string().trim().max(160).default(""),
  industry: z.string().trim().max(120).default(""),
  currentUrl: z.string().trim().max(500).default(""),
  objective: z.string().trim().max(2000).default(""),
  complexity: complexity.default("standard"),
  urgency: urgency.default("flexible"),
  desiredStart: z.string().trim().max(40).default(""),
  deadline: z.string().trim().max(40).default(""),
  budgetBand: z.string().trim().max(80).default("need-guidance"),
  support: support.default("none"),
  contactName: z.string().trim().max(140).default(""),
  contactEmail: z.string().trim().max(320).default(""),
  contactPhone: z.string().trim().max(60).default(""),
  timezoneCountry: z.string().trim().max(120).default(""),
  requirements: z.string().trim().max(6000).default(""),
  marketingConsent: z.boolean().default(false),
  privacyAccepted: z.boolean().default(false),
  serviceSlug: z.string().trim().max(120).default(""),
  honeypot: z.string().max(200).default(""),
  startedAt: z.number().int().positive(),
  attribution: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().default({}),
});

export const submitProjectBriefSchema = draftProjectBriefSchema.extend({
  projectType,
  contactName: z.string().trim().min(2, "Enter your name.").max(140),
  contactEmail: z.string().trim().email("Enter a valid email address.").max(320),
  objective: z.string().trim().min(20, "Tell us a little more about the project goal.").max(2000),
  requirements: z.string().trim().min(20, "Add a short description of the required scope.").max(6000),
  privacyAccepted: z.boolean().refine((value) => value === true, { message: "Accept the privacy notice before submitting." }),
  idempotencyKey: z.string().trim().min(12).max(120),
  turnstileToken: z.string().trim().max(4096).optional().default(""),
});

export type DraftProjectBriefPayload = z.infer<typeof draftProjectBriefSchema>;
export type SubmitProjectBriefPayload = z.infer<typeof submitProjectBriefSchema>;
