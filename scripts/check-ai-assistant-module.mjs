import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260923133000_m15_ai_assistant.sql",
  "src/components/ai/assistant-widget.tsx",
  "src/app/api/assistant/route.ts",
  "src/app/api/assistant/handoff/route.ts",
  "src/features/ai/knowledge.ts",
  "src/features/ai/prompt.ts",
  "src/features/ai/provider.ts",
  "src/features/ai/service.ts",
  "src/app/admin/ai/page.tsx",
  "tests/ai/m15-evaluation-cases.json",
  "docs/AI_ASSISTANT.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M15 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of [
  "ai_settings",
  "ai_conversations",
  "ai_messages",
  "ai_events",
  "ai_knowledge_items",
  "consume_ai_rate_limit",
  "purge_expired_ai_conversations",
]) {
  if (!migration.includes(token)) {
    console.error(`M15 migration missing: ${token}`);
    process.exit(1);
  }
}

const knowledge = fs.readFileSync(
  path.join(root, "src/features/ai/knowledge.ts"),
  "utf8",
);

for (const forbidden of [
  '.from("projects")',
  '.from("project_members")',
  '.from("profiles")',
  '.from("lead_notes")',
  '.from("client_requests")',
  '.from("project_files")',
]) {
  if (knowledge.includes(forbidden)) {
    console.error(`M15 public grounding reads a private table: ${forbidden}`);
    process.exit(1);
  }
}

const provider = fs.readFileSync(
  path.join(root, "src/features/ai/provider.ts"),
  "utf8",
);
if (!provider.includes('store: false') || !provider.includes("omni-moderation-latest")) {
  console.error("M15 provider must disable Responses storage and moderate public input.");
  process.exit(1);
}

const prompt = fs.readFileSync(path.join(root, "src/features/ai/prompt.ts"), "utf8");
for (const token of [
  "Never make autonomous final pricing decisions",
  "no access to admin data",
  "detectInstructionBypass",
  "enforceCommercialGuardrails",
]) {
  if (!prompt.includes(token)) {
    console.error(`M15 prompt/guardrail policy missing: ${token}`);
    process.exit(1);
  }
}

console.log("M15 AI Website Assistant structural checks passed.");
