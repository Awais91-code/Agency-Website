import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "supabase/migrations/20260922062000_m11_admin_cms.sql",
  "src/app/admin/content/page.tsx",
  "src/app/admin/settings/page.tsx",
  "src/app/admin/audit/page.tsx",
  "src/features/content/queries.ts",
  "src/lib/audit/log.ts",
  "docs/ADMIN_CMS.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("M11 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");
for (const token of ["site_settings", "content_sections", "testimonials", "faqs", "team_members", "audit_logs", "permission_granted"]) {
  if (!migration.includes(token)) {
    console.error(`M11 migration missing expected token: ${token}`);
    process.exit(1);
  }
}

const contentActions = fs.readFileSync(path.join(root, "src/app/admin/content/actions.ts"), "utf8");
if (!contentActions.includes("recordAuditLog") || !contentActions.includes("permissionGranted")) {
  console.error("M11 content actions must audit mutations and enforce testimonial permission.");
  process.exit(1);
}

const settingsPage = fs.readFileSync(path.join(root, "src/app/admin/settings/page.tsx"), "utf8");
if (!settingsPage.includes("requireAdmin")) {
  console.error("M11 settings must remain administrator-only.");
  process.exit(1);
}

console.log("M11 Admin Dashboard & CMS structural checks passed.");
