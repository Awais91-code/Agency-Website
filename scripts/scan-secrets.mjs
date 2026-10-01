import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["src", "scripts", "supabase", "docs"];
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".sql", ".md", ".json"]);
const findings = [];

const secretPatterns = [
  { name: "OpenAI-style secret", regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { name: "Private key block", regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { name: "Long JWT-like token", regex: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
];

const serverOnlyNames = [
  "SUPABASE_SECRET_KEY",
  "TURNSTILE_SECRET_KEY",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "CALCOM_WEBHOOK_SECRET",
  "N8N_WEBHOOK_SECRET",
  "N8N_CALLBACK_SECRET",
  "AUTOMATION_DISPATCH_SECRET",
  "OPENAI_API_KEY",
  "SECURITY_HASH_SECRET",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git"].includes(entry.name)) continue;
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(target));
    else if (textExtensions.has(path.extname(entry.name))) out.push(target);
  }
  return out;
}

for (const relative of scanRoots) {
  for (const file of walk(path.join(root, relative))) {
    const source = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);

    for (const pattern of secretPatterns) {
      pattern.regex.lastIndex = 0;
      if (pattern.regex.test(source)) findings.push(`${rel}: ${pattern.name}`);
    }

    if (/^[\s\S]*?["']use client["'];/.test(source.slice(0, 300))) {
      for (const name of serverOnlyNames) {
        if (source.includes(name)) findings.push(`${rel}: client module references ${name}`);
      }
    }
  }
}

if (findings.length) {
  console.error("Potential secret exposure detected:");
  for (const finding of findings) console.error(` - ${finding}`);
  process.exit(1);
}

console.log("M18 secret/source scan passed.");
