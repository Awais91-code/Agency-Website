import { readFile } from "node:fs/promises";

const requiredFiles = [
  "src/proxy.ts",
  "src/lib/auth/server.ts",
  "src/lib/supabase/server.ts",
  "src/app/(auth)/login/page.tsx",
  "src/app/(auth)/forgot-password/page.tsx",
  "src/app/(auth)/reset-password/page.tsx",
  "src/app/api/admin/invitations/route.ts",
  "src/app/api/profile/route.ts",
  "supabase/migrations/20260921171500_m03_auth_rbac.sql",
];

await Promise.all(requiredFiles.map((file) => readFile(file, "utf8")));
const migration = await readFile("supabase/migrations/20260921171500_m03_auth_rbac.sql", "utf8");
for (const marker of ["enable row level security", "current_user_is_staff", "profiles_update_self_m03", "projects_staff_all_m03", "user_invitations_select_m03"]) {
  if (!migration.includes(marker)) throw new Error(`M03 auth migration is missing required boundary: ${marker}`);
}
console.log("M03 authentication boundary static checks passed.");
