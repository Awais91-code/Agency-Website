import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "src/app/page.tsx",
  "src/app/about/page.tsx",
  "src/app/process/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/privacy/page.tsx",
  "src/app/terms/page.tsx",
  "src/components/layout/site-header.tsx",
  "src/components/layout/site-footer.tsx",
  "src/components/marketing/cta-band.tsx",
  "src/components/marketing/contact-form.tsx",
  "src/components/marketing/page-hero.tsx",
  "src/components/marketing/project-card.tsx",
  "src/components/marketing/section-heading.tsx",
  "src/components/marketing/service-card.tsx",
  "src/content/marketing.ts",
];

const missing = required.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error(`M05 marketing check failed. Missing:\n${missing.map((item) => `- ${item}`).join("\n")}`);
  process.exit(1);
}

const siteConfig = readFileSync(resolve("src/config/site.ts"), "utf8");
for (const route of ["/process", "/about", "/contact"]) {
  if (!siteConfig.includes(route)) {
    console.error(`M05 marketing check failed. Site config does not reference ${route}.`);
    process.exit(1);
  }
}

const home = readFileSync(resolve("src/app/page.tsx"), "utf8");
for (const section of ['id="services"', 'id="work"']) {
  if (!home.includes(section)) {
    console.error(`M05 marketing check failed. Home page missing ${section}.`);
    process.exit(1);
  }
}

console.log("M05 marketing structure check passed.");
