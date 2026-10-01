import { readFileSync, existsSync } from "node:fs";

const required = [
  "supabase/migrations/20260922023000_m08_project_brief_quote.sql",
  "src/app/start-a-project/page.tsx",
  "src/app/quote/success/page.tsx",
  "src/app/api/project-briefs/draft/route.ts",
  "src/app/api/project-briefs/estimate/route.ts",
  "src/app/api/project-briefs/submit/route.ts",
  "src/components/project-brief/project-brief-wizard.tsx",
  "src/features/project-brief/estimate.ts",
  "src/features/project-brief/server.ts",
  "src/app/admin/quote-rules/page.tsx",
  "docs/PROJECT_BRIEF_QUOTE.md",
];

const missing = required.filter((path) => !existsSync(path));
if (missing.length) {
  console.error(`M08 check failed. Missing:\n${missing.join("\n")}`);
  process.exit(1);
}

const migration = readFileSync(required[0], "utf8");
for (const token of ["project_briefs", "brief_answers", "estimate_rules", "estimate_results", "submit_project_brief", "idempotency_key"]) {
  if (!migration.includes(token)) {
    console.error(`M08 check failed: migration is missing ${token}`);
    process.exit(1);
  }
}

const wizard = readFileSync("src/components/project-brief/project-brief-wizard.tsx", "utf8");
for (const token of ["sessionStorage", "/api/project-briefs/estimate", "/api/project-briefs/submit", "privacyAccepted"]) {
  if (!wizard.includes(token)) {
    console.error(`M08 check failed: project brief wizard is missing ${token}`);
    process.exit(1);
  }
}

console.log("M08 project brief / quote structural checks passed.");
