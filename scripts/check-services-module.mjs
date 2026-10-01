import { existsSync, readFileSync } from "node:fs";

const required = [
  "supabase/migrations/20260922012000_m06_services.sql",
  "src/app/services/page.tsx",
  "src/app/services/[slug]/page.tsx",
  "src/app/admin/services/page.tsx",
  "src/app/admin/services/actions.ts",
  "src/app/admin/services/new/page.tsx",
  "src/app/admin/services/[id]/page.tsx",
  "src/components/services/service-editor.tsx",
  "src/features/services/queries.ts",
  "src/features/services/types.ts",
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`M06 missing files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const migration = readFileSync(required[0], "utf8");
for (const marker of ["create table if not exists public.services", "service_faqs", "service_relations", "enable row level security", "services_public_read_m06"]) {
  if (!migration.includes(marker)) {
    console.error(`M06 migration is missing marker: ${marker}`);
    process.exit(1);
  }
}

const publicPage = readFileSync("src/app/services/[slug]/page.tsx", "utf8");
if (!publicPage.includes("getPublishedService") || !publicPage.includes("generateMetadata")) {
  console.error("M06 service detail page must use the published service query and dynamic metadata.");
  process.exit(1);
}

const action = readFileSync("src/app/admin/services/actions.ts", "utf8");
if (!action.includes("requireStaff") || !action.includes("revalidatePath")) {
  console.error("M06 admin mutations must enforce staff auth and revalidate public content.");
  process.exit(1);
}

console.log("M06 service boundaries look correct.");
