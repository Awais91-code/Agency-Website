import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const required = [
  "supabase/migrations/20260923141000_m16_blog_seo.sql",
  "src/app/blog/page.tsx",
  "src/app/blog/[slug]/page.tsx",
  "src/app/blog/category/[slug]/page.tsx",
  "src/app/blog/tag/[slug]/page.tsx",
  "src/app/blog/rss.xml/route.ts",
  "src/app/admin/blog/page.tsx",
  "src/app/admin/blog/actions.ts",
  "src/app/sitemap.ts",
  "src/app/robots.ts",
  "src/features/blog/queries.ts",
  "src/features/blog/seo.ts",
  "src/features/blog/redirects.ts",
  "docs/BLOG_SEO.md",
];

const missing = required.filter((file) => !fs.existsSync(path.join(root, file)));

if (missing.length) {
  console.error("M16 missing required files:");
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}

const migration = fs.readFileSync(path.join(root, required[0]), "utf8");

for (const token of [
  "blog_posts",
  "blog_authors",
  "blog_categories",
  "blog_tags",
  "blog_post_services",
  "blog_post_case_studies",
  "seo_redirects",
  "published_at <= now()",
]) {
  if (!migration.includes(token)) {
    console.error(`M16 migration missing required behavior: ${token}`);
    process.exit(1);
  }
}

const queries = fs.readFileSync(
  path.join(root, "src/features/blog/queries.ts"),
  "utf8",
);

for (const token of [
  '.eq("status", "published")',
  '.is("archived_at", null)',
  '.lte("published_at", now)',
]) {
  if (!queries.includes(token)) {
    console.error(`M16 public query does not enforce publish visibility: ${token}`);
    process.exit(1);
  }
}

const actions = fs.readFileSync(
  path.join(root, "src/app/admin/blog/actions.ts"),
  "utf8",
);

for (const token of [
  "Automatic redirect created after blog slug change.",
  "status_code: 308",
  'revalidatePath("/sitemap.xml")',
]) {
  if (!actions.includes(token)) {
    console.error(`M16 publishing/redirect behavior missing: ${token}`);
    process.exit(1);
  }
}

const seo = fs.readFileSync(
  path.join(root, "src/features/blog/seo.ts"),
  "utf8",
);

for (const token of ["alternates", "openGraph", "twitter", "BlogPosting"]) {
  if (!seo.includes(token)) {
    console.error(`M16 SEO metadata missing: ${token}`);
    process.exit(1);
  }
}

const sitemap = fs.readFileSync(
  path.join(root, "src/app/sitemap.ts"),
  "utf8",
);

if (
  !sitemap.includes('.eq("status", "published")') ||
  !sitemap.includes('.lte("published_at", isoNow)')
) {
  console.error("M16 sitemap must exclude draft/future blog posts.");
  process.exit(1);
}

const article = fs.readFileSync(
  path.join(root, "src/app/blog/[slug]/page.tsx"),
  "utf8",
);

if (!article.includes("<article>") || !article.includes("ArticleBody")) {
  console.error("M16 article template must use semantic article structure.");
  process.exit(1);
}

const adminForm = fs.readFileSync(
  path.join(root, "src/components/blog/admin-post-form.tsx"),
  "utf8",
);

if (
  !adminForm.includes('name="canonicalUrl"') ||
  !adminForm.includes('name="socialImageMediaId"') ||
  !adminForm.includes('name="serviceIds"') ||
  !adminForm.includes('name="caseStudyIds"')
) {
  console.error("M16 article editor is missing SEO/internal-link controls.");
  process.exit(1);
}

console.log("M16 Blog, SEO & Content Distribution structural checks passed.");
