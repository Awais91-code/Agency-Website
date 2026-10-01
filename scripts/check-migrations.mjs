import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const migrationsDir = resolve(root, "supabase", "migrations");
const seedFile = resolve(root, "supabase", "seed.sql");
const migrationPattern = /^(\d{14})_[a-z0-9_]+\.sql$/;
const forbiddenPatterns = [
  /\bdrop\s+database\b/i,
  /\btruncate\s+(table\s+)?auth\./i,
  /\balter\s+role\s+(postgres|service_role)\b/i,
];

async function main() {
  const entries = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

  if (entries.length === 0) {
    throw new Error("No Supabase migration files were found.");
  }

  const timestamps = new Set();

  for (const name of entries) {
    const match = name.match(migrationPattern);

    if (!match) {
      throw new Error(`Invalid migration filename: ${name}. Use YYYYMMDDHHMMSS_description.sql.`);
    }

    if (timestamps.has(match[1])) {
      throw new Error(`Duplicate migration timestamp: ${match[1]}.`);
    }
    timestamps.add(match[1]);

    const sql = await readFile(resolve(migrationsDir, name), "utf8");
    if (!sql.trim()) {
      throw new Error(`Migration is empty: ${name}.`);
    }

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(sql)) {
        throw new Error(`Potentially destructive SQL detected in ${name}: ${pattern}.`);
      }
    }
  }

  const seedStat = await stat(seedFile);
  if (!seedStat.isFile() || seedStat.size === 0) {
    throw new Error("supabase/seed.sql is missing or empty.");
  }

  console.log(`Database patch structure OK: ${entries.length} migration(s) + seed.sql.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
