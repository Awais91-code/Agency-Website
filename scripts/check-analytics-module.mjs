import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "supabase/migrations/20260923152000_m17_analytics_conversion.sql",
  "src/features/analytics/taxonomy.ts",
  "src/features/analytics/client.ts",
  "src/features/analytics/server.ts",
  "src/features/analytics/attribution.ts",
  "src/components/analytics/analytics-provider.tsx",
  "src/app/api/analytics/events/route.ts",
  "src/app/admin/analytics/page.tsx",
  "tests/analytics/m17-event-map.json",
  "docs/ANALYTICS.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M17 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const eventMap = JSON.parse(
  fs.readFileSync(path.join(root, "tests/analytics/m17-event-map.json"), "utf8"),
);
const names = eventMap.map((item) => item.name);

const requiredEvents = [
  "primary_cta_click",
  "project_brief_start",
  "project_brief_step",
  "project_brief_submit",
  "contact_submit",
  "booking_click",
  "booking_complete",
  "case_study_view",
  "case_study_cta_click",
];

for (const name of requiredEvents) {
  if (!names.includes(name)) {
    console.error(`M17 event taxonomy missing ${name}`);
    process.exit(1);
  }
}

if (new Set(names).size !== names.length) {
  console.error("M17 event taxonomy contains duplicate names.");
  process.exit(1);
}

if (eventMap.some((item) => item.sensitive_payloads !== false)) {
  console.error("M17 event map must not approve sensitive payloads.");
  process.exit(1);
}

const api = fs.readFileSync(
  path.join(root, "src/app/api/analytics/events/route.ts"),
  "utf8",
);

for (const forbidden of [
  "message:",
  "email:",
  "phone:",
  "requirements:",
  "objective:",
  "answer:",
  "file:",
]) {
  if (api.includes(forbidden)) {
    console.error(`M17 analytics API appears to expose forbidden free-text key: ${forbidden}`);
    process.exit(1);
  }
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of [
  "analytics_events",
  "event_key text not null unique",
  "attribution_source",
  "utm_source",
  "landing_path",
  "initial_referrer_host",
]) {
  if (!migration.includes(token)) {
    console.error(`M17 migration missing ${token}`);
    process.exit(1);
  }
}

const briefServer = fs.readFileSync(
  path.join(root, "src/features/project-brief/server.ts"),
  "utf8",
);
if (
  !briefServer.includes('eventName: "project_brief_submit"') ||
  !briefServer.includes("applyLeadAttribution")
) {
  console.error("M17 project brief submit must record server conversion and lead attribution.");
  process.exit(1);
}

const booking = fs.readFileSync(
  path.join(root, "src/app/api/webhooks/booking/route.ts"),
  "utf8",
);
if (!booking.includes('eventName: "booking_complete"')) {
  console.error("M17 booking webhook must record booking_complete.");
  process.exit(1);
}

const client = fs.readFileSync(
  path.join(root, "src/features/analytics/client.ts"),
  "utf8",
);
if (
  !client.includes("getAnalyticsConsent") ||
  !client.includes("sessionStorage") ||
  !client.includes("/api/analytics/events")
) {
  console.error("M17 browser tracking must be consent-aware and session-scoped.");
  process.exit(1);
}

console.log(`M17 Analytics structural/data-minimization checks passed (${names.length} events).`);
