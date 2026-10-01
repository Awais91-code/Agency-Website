import { existsSync, readFileSync } from "node:fs";

const required = [
  "supabase/migrations/20260922014000_m07_case_studies.sql",
  "src/app/work/page.tsx",
  "src/app/work/[slug]/page.tsx",
  "src/app/admin/case-studies/page.tsx",
  "src/app/admin/case-studies/actions.ts",
  "src/app/admin/case-studies/new/page.tsx",
  "src/app/admin/case-studies/[id]/page.tsx",
  "src/components/case-studies/case-study-card.tsx",
  "src/components/case-studies/case-study-editor.tsx",
  "src/features/case-studies/queries.ts",
  "src/features/case-studies/types.ts",
];

const missing = required.filter((file) => !existsSync(file));
if (missing.length) {
  console.error(`M07 missing files:\n${missing.map((file) => `- ${file}`).join("\n")}`);
  process.exit(1);
}

const migration = readFileSync(required[0], "utf8");
for (const marker of [
  "create table if not exists public.case_studies",
  "case_study_services",
  "case_study_media",
  "case_study_metrics",
  "enable row level security",
  "case_studies_public_read_m07",
  "testimonial_approved",
]) {
  if (!migration.includes(marker)) {
    console.error(`M07 migration is missing marker: ${marker}`);
    process.exit(1);
  }
}

const publicPage = readFileSync("src/app/work/[slug]/page.tsx", "utf8");
if (!publicPage.includes("getPublishedCaseStudy") || !publicPage.includes("generateMetadata")) {
  console.error("M07 case-study detail page must use the published query and dynamic metadata.");
  process.exit(1);
}

const action = readFileSync("src/app/admin/case-studies/actions.ts", "utf8");
if (!action.includes("requireStaff") || !action.includes("revalidatePath")) {
  console.error("M07 admin mutations must enforce staff auth and revalidate public content.");
  process.exit(1);
}

const query = readFileSync("src/features/case-studies/queries.ts", "utf8");
if (!query.includes('eq("is_approved", true)') || !query.includes("testimonial_approved")) {
  console.error("M07 public proof must be limited to approved metrics/testimonials.");
  process.exit(1);
}

console.log("M07 case-study boundaries look correct.");
