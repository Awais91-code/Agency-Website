import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260922043000_m09_lead_crm.sql",
  "src/app/admin/leads/page.tsx",
  "src/app/admin/leads/[id]/page.tsx",
  "src/app/admin/leads/actions.ts",
  "src/app/admin/pipeline/page.tsx",
  "src/features/leads/constants.ts",
  "src/features/leads/queries.ts",
  "docs/LEAD_CRM.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M09 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of ["lead_notes", "lead_stage_history", "lead_tasks", "lead_tags", "merge_leads", "lead_score", "owner_user_id"]) {
  if (!migration.includes(token)) {
    console.error(`M09 migration missing expected token: ${token}`);
    process.exit(1);
  }
}

const actions = fs.readFileSync(path.join(root, "src/app/admin/leads/actions.ts"), "utf8");
if (!actions.includes("requireStaff") || !actions.includes("lead.status_changed")) {
  console.error("M09 actions must enforce staff auth and record status activity.");
  process.exit(1);
}

console.log("M09 Lead CRM structural checks passed.");
