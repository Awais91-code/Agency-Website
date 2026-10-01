import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  ".github/workflows/ci.yml",
  ".github/workflows/release.yml",
  ".github/workflows/uptime.yml",
  ".github/workflows/backup-verify.yml",
  "src/app/api/health/route.ts",
  "src/instrumentation.ts",
  "src/lib/observability/log.ts",
  "scripts/e2e-critical-flows.mjs",
  "scripts/smoke-test.mjs",
  "scripts/performance-budget.mjs",
  "scripts/create-backup-bundle.mjs",
  "scripts/verify-backup-bundle.mjs",
  "scripts/test-backup-manifest.mjs",
  "docs/QA_TEST_STRATEGY.md",
  "docs/DEPLOYMENT_RELEASE.md",
  "docs/BACKUP_RESTORE.md",
  "docs/OPERATIONS_RUNBOOK.md",
  "docs/RELEASE_CHECKLIST.md",
  "docs/HANDOVER.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M19 missing required release/operations files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const health = fs.readFileSync(path.join(root, "src/app/api/health/route.ts"), "utf8");
if (/message:\s*database|database\.message|error\.message/.test(health)) {
  console.error("M19 public health endpoint appears to expose database error details.");
  process.exit(1);
}

const e2e = fs.readFileSync(path.join(root, "scripts/e2e-critical-flows.mjs"), "utf8");
for (const token of [
  "/api/project-briefs/draft",
  "/api/project-briefs/estimate",
  "/api/project-briefs/submit",
  "test-security-rls.mjs",
  "booking_handoffs",
  "project_brief_submit",
]) {
  if (!e2e.includes(token)) {
    console.error(`M19 critical E2E coverage missing token: ${token}`);
    process.exit(1);
  }
}

const release = fs.readFileSync(path.join(root, ".github/workflows/release.yml"), "utf8");
for (const token of ["preview", "staging", "production", "smoke", "db push"]) {
  if (!release.includes(token)) {
    console.error(`M19 release workflow missing: ${token}`);
    process.exit(1);
  }
}

const uptime = fs.readFileSync(path.join(root, ".github/workflows/uptime.yml"), "utf8");
if (!uptime.includes("schedule:") || !uptime.includes("/api/health")) {
  console.error("M19 uptime workflow must be scheduled and check /api/health.");
  process.exit(1);
}

const backup = fs.readFileSync(path.join(root, "scripts/create-backup-bundle.mjs"), "utf8");
const verify = fs.readFileSync(path.join(root, "scripts/verify-backup-bundle.mjs"), "utf8");
for (const token of ["database.sql", "storage", "manifest.json", "sha256"]) {
  if (!backup.includes(token) && !verify.includes(token)) {
    console.error(`M19 backup package missing expected capability: ${token}`);
    process.exit(1);
  }
}

const log = fs.readFileSync(path.join(root, "src/lib/observability/log.ts"), "utf8");
for (const token of ["[REDACTED]", "stackHash", "APP_RELEASE", "JSON.stringify"]) {
  if (!log.includes(token)) {
    console.error(`M19 structured logging missing: ${token}`);
    process.exit(1);
  }
}

console.log("M19 QA, deployment, monitoring and release operations structural checks passed.");
