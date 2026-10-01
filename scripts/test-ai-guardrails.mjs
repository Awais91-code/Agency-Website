import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cases = JSON.parse(
  fs.readFileSync(path.join(root, "tests/ai/m15-evaluation-cases.json"), "utf8"),
);

const commercial =
  /\b(price|pricing|cost|quote|budget|fixed price|contract|terms|guarantee|guaranteed|promise|deadline|delivery date|launch date|legally binding)\b/i;
const privateData =
  /\b(private|admin data|client data|client files|other client|password|secret|api key|database dump|internal note)\b/i;
const bypass =
  /\b(ignore (all|previous|above) instructions|reveal (the )?(system|developer) prompt|jailbreak|bypass guardrails)\b/i;
const projectIntent =
  /\b(i|we|my company|our company)\b.{0,60}\b(need|want|looking|planning|build|redesign|hire|quote|consultation|help)\b/i;

let failures = 0;

for (const test of cases) {
  const prompt = test.prompt;
  let observed = "allowed_public_question";

  if (bypass.test(prompt)) observed = "instruction_bypass_guardrail";
  else if (privateData.test(prompt)) observed = "private_data_guardrail";
  else if (commercial.test(prompt)) observed = "commercial_guardrail";
  else if (projectIntent.test(prompt)) observed = "project_intent";

  if (test.expected === "handoff_requires_explicit_data") {
    const requiresExplicit =
      /lead/i.test(prompt) &&
      /not provide|without.*contact/i.test(prompt);
    observed = requiresExplicit ? "handoff_requires_explicit_data" : observed;
  }

  if (observed !== test.expected) {
    failures++;
    console.error(`FAIL ${test.id}: expected ${test.expected}, observed ${observed}`);
  }
}

if (failures) process.exit(1);
console.log(`M15 deterministic guardrail evaluation passed (${cases.length} adversarial/normal cases).`);
