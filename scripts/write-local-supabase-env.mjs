import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const binary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);

if (!fs.existsSync(binary)) {
  console.error("Local Supabase CLI is not installed. Run npm install first.");
  process.exit(1);
}

const result = spawnSync(binary, ["status", "-o", "env"], {
  cwd: process.cwd(),
  encoding: "utf8",
});

if (result.status !== 0) {
  console.error("Could not read local Supabase status. Start it with npm run db:start first.");
  process.exit(result.status || 1);
}

const values = {};
for (const rawLine of result.stdout.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || !line.includes("=")) continue;
  const index = line.indexOf("=");
  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();
  value = value.replace(/^['"]|['"]$/g, "");
  values[key] = value;
}

function first(...keys) {
  for (const key of keys) {
    if (values[key]) return values[key];
  }
  return null;
}

const url = first("API_URL", "PROJECT_URL", "SUPABASE_URL");
const publishable = first("PUBLISHABLE_KEY", "ANON_KEY", "SUPABASE_ANON_KEY");
const secret = first("SECRET_KEY", "SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY");

if (!url || !publishable || !secret) {
  console.error("Supabase status output did not contain URL/publishable/secret values understood by this script.");
  console.error(`Available keys: ${Object.keys(values).sort().join(", ")}`);
  process.exit(1);
}

const target = process.argv.includes("--ci") ? ".env.ci" : ".env.local";
if (fs.existsSync(target) && !process.argv.includes("--force")) {
  console.error(`${target} already exists. Refusing to overwrite it; use --force only in a disposable environment.`);
  process.exit(2);
}
const appUrl = process.env.M19_E2E_BASE_URL || "http://127.0.0.1:3000";

const body = [
  'NEXT_PUBLIC_APP_NAME="Agency"',
  `NEXT_PUBLIC_APP_URL="${appUrl}"`,
  `NEXT_PUBLIC_SUPABASE_URL="${url}"`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${publishable}"`,
  `SUPABASE_SECRET_KEY="${secret}"`,
  'ANALYTICS_PROVIDER="none"',
  'ANALYTICS_ENVIRONMENT="test"',
  'TURNSTILE_REQUIRED="false"',
  'SECURITY_HASH_SECRET="m19-local-ci-security-hash-only"',
  'APP_RELEASE="m19-ci"',
  'LOG_LEVEL="info"',
  "",
].join("\n");

fs.writeFileSync(target, body, { encoding: "utf8", mode: 0o600 });
console.log(`Wrote ${target} from local Supabase status without printing credentials.`);
