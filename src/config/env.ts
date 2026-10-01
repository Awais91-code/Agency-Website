import "server-only";

import { z } from "zod";

const emptyToUndefined = (value: unknown) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined;
  }

  return value;
};

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalKey = z.preprocess(emptyToUndefined, z.string().trim().min(8).optional());
const optionalEmail = z.preprocess(emptyToUndefined, z.email().optional());
const optionalText = z.preprocess(emptyToUndefined, z.string().trim().min(1).optional());
const booleanFromEnv = z.preprocess(
  (value) => {
    if (typeof value !== "string") return value;
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
    return value;
  },
  z.boolean().default(false),
);

const serverEnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default("Agency"),
    NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
    NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalKey,
    SUPABASE_SECRET_KEY: optionalKey,
    CALCOM_WEBHOOK_SECRET: optionalKey,
    RESEND_API_KEY: optionalKey,
    RESEND_WEBHOOK_SECRET: optionalKey,
    EMAIL_FROM: optionalText,
    EMAIL_REPLY_TO: optionalEmail,
    EMAIL_DEV_REDIRECT_TO: optionalEmail,
    EMAIL_DEV_ALLOWLIST: optionalText,
    EMAIL_ALLOW_EXTERNAL_IN_NON_PROD: booleanFromEnv,
    NOTIFICATION_ADMIN_EMAILS: optionalText,
    N8N_WEBHOOK_URL: z.preprocess(emptyToUndefined, z.url().optional()),
    N8N_WEBHOOK_SECRET: optionalKey,
    N8N_CALLBACK_SECRET: optionalKey,
    AUTOMATION_DISPATCH_SECRET: optionalKey,
    OPENAI_API_KEY: optionalKey,
    AI_REQUEST_HASH_SECRET: optionalKey,
    ANALYTICS_PROVIDER: z.enum(["internal", "plausible", "ga4", "none"]).default("internal"),
    ANALYTICS_ENVIRONMENT: optionalText,
    ANALYTICS_EXTERNAL_DASHBOARD_URL: optionalUrl,
    ANALYTICS_CONSENT_REQUIRED: z.preprocess(
      (value) => {
        if (typeof value !== "string") return value;
        if (value.toLowerCase() === "true") return true;
        if (value.toLowerCase() === "false") return false;
        return value;
      },
      z.boolean().default(true),
    ),
    ANALYTICS_ENABLE_IN_NON_PRODUCTION: booleanFromEnv,
    PLAUSIBLE_DOMAIN: optionalText,
    GA_MEASUREMENT_ID: optionalText,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: optionalText,
    TURNSTILE_SECRET_KEY: optionalKey,
    TURNSTILE_REQUIRED: booleanFromEnv,
    SECURITY_HASH_SECRET: optionalKey,
    TRUSTED_APP_ORIGINS: optionalText,
    APP_RELEASE: optionalText,
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  })
  .superRefine((value, context) => {
    const supabaseValues = [
      value.NEXT_PUBLIC_SUPABASE_URL,
      value.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      value.SUPABASE_SECRET_KEY,
    ];
    const configuredCount = supabaseValues.filter(Boolean).length;

    if (configuredCount > 0 && configuredCount < supabaseValues.length) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_SUPABASE_URL"],
        message:
          "Supabase configuration is partial. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY together.",
      });
    }

    const turnstileCount = [
      value.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      value.TURNSTILE_SECRET_KEY,
    ].filter(Boolean).length;

    if (turnstileCount === 1) {
      context.addIssue({
        code: "custom",
        path: ["NEXT_PUBLIC_TURNSTILE_SITE_KEY"],
        message:
          "Turnstile configuration is partial. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY together.",
      });
    }

    if (value.TURNSTILE_REQUIRED && turnstileCount !== 2) {
      context.addIssue({
        code: "custom",
        path: ["TURNSTILE_REQUIRED"],
        message:
          "TURNSTILE_REQUIRED=true requires both Turnstile site and secret keys.",
      });
    }
  });

const parsed = serverEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  CALCOM_WEBHOOK_SECRET: process.env.CALCOM_WEBHOOK_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_REPLY_TO: process.env.EMAIL_REPLY_TO,
  EMAIL_DEV_REDIRECT_TO: process.env.EMAIL_DEV_REDIRECT_TO,
  EMAIL_DEV_ALLOWLIST: process.env.EMAIL_DEV_ALLOWLIST,
  EMAIL_ALLOW_EXTERNAL_IN_NON_PROD: process.env.EMAIL_ALLOW_EXTERNAL_IN_NON_PROD,
  NOTIFICATION_ADMIN_EMAILS: process.env.NOTIFICATION_ADMIN_EMAILS,
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  N8N_WEBHOOK_SECRET: process.env.N8N_WEBHOOK_SECRET,
  N8N_CALLBACK_SECRET: process.env.N8N_CALLBACK_SECRET,
  AUTOMATION_DISPATCH_SECRET: process.env.AUTOMATION_DISPATCH_SECRET,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_REQUEST_HASH_SECRET: process.env.AI_REQUEST_HASH_SECRET,
  ANALYTICS_PROVIDER: process.env.ANALYTICS_PROVIDER,
  ANALYTICS_ENVIRONMENT: process.env.ANALYTICS_ENVIRONMENT,
  ANALYTICS_EXTERNAL_DASHBOARD_URL: process.env.ANALYTICS_EXTERNAL_DASHBOARD_URL,
  ANALYTICS_CONSENT_REQUIRED: process.env.ANALYTICS_CONSENT_REQUIRED,
  ANALYTICS_ENABLE_IN_NON_PRODUCTION: process.env.ANALYTICS_ENABLE_IN_NON_PRODUCTION,
  PLAUSIBLE_DOMAIN: process.env.PLAUSIBLE_DOMAIN,
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
  TURNSTILE_REQUIRED: process.env.TURNSTILE_REQUIRED,
  SECURITY_HASH_SECRET: process.env.SECURITY_HASH_SECRET,
  TRUSTED_APP_ORIGINS: process.env.TRUSTED_APP_ORIGINS,
  APP_RELEASE: process.env.APP_RELEASE,
  LOG_LEVEL: process.env.LOG_LEVEL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = Object.freeze(parsed.data);
