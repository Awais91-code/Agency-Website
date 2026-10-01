import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260922072000_m12_email_notifications.sql",
  "src/features/notifications/service.ts",
  "src/features/notifications/templates.ts",
  "src/features/notifications/providers/resend.ts",
  "src/features/notifications/workflows.ts",
  "src/app/api/webhooks/email/route.ts",
  "src/app/admin/notifications/page.tsx",
  "src/app/admin/notifications/actions.ts",
  "docs/NOTIFICATIONS.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M12 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of [
  "notification_settings",
  "email_events",
  "email_provider_events",
  "idempotency_key",
  "email_delivery_status",
]) {
  if (!migration.includes(token)) {
    console.error(`M12 migration missing expected token: ${token}`);
    process.exit(1);
  }
}

const service = fs.readFileSync(path.join(root, "src/features/notifications/service.ts"), "utf8");
for (const token of [
  "EMAIL_DEV_REDIRECT_TO",
  "EMAIL_DEV_ALLOWLIST",
  "EMAIL_ALLOW_EXTERNAL_IN_NON_PROD",
  "idempotencyKey",
  "skipped",
]) {
  if (!service.includes(token)) {
    console.error(`M12 send service missing safety/idempotency behavior: ${token}`);
    process.exit(1);
  }
}

const provider = fs.readFileSync(path.join(root, "src/features/notifications/providers/resend.ts"), "utf8");
if (!provider.includes("Idempotency") && !service.includes("providerIdempotencyKey")) {
  console.error("M12 provider path must preserve idempotent sends.");
  process.exit(1);
}

const webhook = fs.readFileSync(path.join(root, "src/app/api/webhooks/email/route.ts"), "utf8");
for (const token of ["svix-id", "svix-timestamp", "svix-signature", "email_provider_events"]) {
  if (!webhook.includes(token)) {
    console.error(`M12 webhook missing verification/delivery behavior: ${token}`);
    process.exit(1);
  }
}

const templates = fs.readFileSync(path.join(root, "src/features/notifications/types.ts"), "utf8");
for (const key of ["enquiry-confirmation", "booking", "invite", "password-reset", "onboarding", "project-update", "admin-alert"]) {
  if (!templates.includes(key)) {
    console.error(`M12 template catalogue missing: ${key}`);
    process.exit(1);
  }
}

console.log("M12 Email & Notification structural checks passed.");
