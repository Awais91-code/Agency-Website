import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260923165000_m18_security_privacy.sql",
  "src/lib/security/request.ts",
  "src/lib/security/rate-limit-server.ts",
  "src/lib/security/turnstile.ts",
  "src/lib/security/events.ts",
  "src/components/security/turnstile-widget.tsx",
  "src/app/admin/security/page.tsx",
  "scripts/test-security-rls.mjs",
  "scripts/scan-secrets.mjs",
  "docs/SECURITY.md",
  "docs/SECURITY_RELEASE_CHECKLIST.md",
  "docs/INCIDENT_RESPONSE.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M18 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of [
  "security_events",
  "security_rate_limits",
  "data_retention_policies",
  "consume_security_rate_limit",
  "purge_expired_operational_data",
  "audit_logs_admin_read_m18",
  "current_user_can_manage_users()",
]) {
  if (!migration.includes(token)) {
    console.error(`M18 migration missing ${token}`);
    process.exit(1);
  }
}

const nextConfig = fs.readFileSync(path.join(root, "next.config.ts"), "utf8");
for (const header of [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy",
]) {
  if (!nextConfig.includes(header)) {
    console.error(`M18 response header missing ${header}`);
    process.exit(1);
  }
}

const submit = fs.readFileSync(path.join(root, "src/app/api/project-briefs/submit/route.ts"), "utf8");
for (const token of ["checkPublicRateLimit", "verifyTurnstile", "isTrustedMutationRequest", "recordSecurityEvent"]) {
  if (!submit.includes(token)) {
    console.error(`M18 public form hardening missing ${token}`);
    process.exit(1);
  }
}

const assistantHandoff = fs.readFileSync(path.join(root, "src/app/api/assistant/handoff/route.ts"), "utf8");
if (!assistantHandoff.includes("verifyTurnstile") || !assistantHandoff.includes("checkPublicRateLimit")) {
  console.error("M18 AI handoff must use bot verification and distributed rate limiting.");
  process.exit(1);
}

for (const file of [
  "src/app/api/automation/callback/route.ts",
  "src/app/api/automation/dispatch/route.ts",
  "src/app/api/automation/schedule/no-booking/route.ts",
]) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  if (!source.includes("timingSafeSecretEqual")) {
    console.error(`${file} must use timing-safe secret comparison.`);
    process.exit(1);
  }
}

const audit = fs.readFileSync(path.join(root, "src/lib/audit/log.ts"), "utf8");
if (!audit.includes("[REDACTED]") || !audit.includes("secretKey")) {
  console.error("M18 audit logger must redact secret-like metadata keys.");
  process.exit(1);
}

console.log("M18 Security, Privacy, Audit & Abuse Prevention structural checks passed.");
