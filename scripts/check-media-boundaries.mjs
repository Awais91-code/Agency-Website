import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260921230500_m04_media_files.sql"), "utf8");
const required = [
  "create table if not exists public.media_assets",
  "create table if not exists public.file_references",
  "create table if not exists public.file_access_grants",
  "create or replace function public.user_can_access_media",
  "public-media",
  "private-files",
  "alter table public.media_assets enable row level security",
  "private_files_read_m04",
];

const missing = required.filter((token) => !migration.includes(token));
if (missing.length) {
  console.error("M04 media boundary check failed. Missing:", missing.join(", "));
  process.exit(1);
}

console.log("M04 media boundary check passed.");
