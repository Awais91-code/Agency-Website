import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const bundleArg = process.argv.find((item, index) => index > 1 && !item.startsWith("--"));
const bundleDir = path.resolve(bundleArg || "backups/latest");
const manifestFile = path.join(bundleDir, "manifest.json");

function hash(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

if (!fs.existsSync(manifestFile)) {
  console.error(`Backup manifest not found: ${manifestFile}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
if (manifest.format !== "agency-m19-backup-v1") {
  console.error(`Unsupported backup format: ${manifest.format ?? "missing"}`);
  process.exit(1);
}

const failures = [];
const databaseFile = path.join(bundleDir, manifest.database.file);

if (!fs.existsSync(databaseFile)) failures.push(`Missing ${manifest.database.file}`);
else {
  const stat = fs.statSync(databaseFile);
  if (stat.size !== manifest.database.bytes) failures.push("Database byte count does not match manifest.");
  if (hash(databaseFile) !== manifest.database.sha256) failures.push("Database SHA-256 does not match manifest.");
  if (stat.size < 100) failures.push("Database dump is unexpectedly small.");
}

for (const part of [
  { file: manifest.database.schemaFile, bytes: manifest.database.schemaBytes, sha256: manifest.database.schemaSha256, label: "schema" },
  { file: manifest.database.dataFile, bytes: manifest.database.dataBytes, sha256: manifest.database.dataSha256, label: "data" },
]) {
  if (!part.file) continue;
  const file = path.join(bundleDir, part.file);
  if (!fs.existsSync(file)) {
    failures.push(`Missing database ${part.label} file ${part.file}`);
    continue;
  }
  const stat = fs.statSync(file);
  if (typeof part.bytes === "number" && stat.size !== part.bytes) failures.push(`Database ${part.label} byte count does not match manifest.`);
  if (part.sha256 && hash(file) !== part.sha256) failures.push(`Database ${part.label} SHA-256 does not match manifest.`);
}

for (const object of manifest.storage?.objects ?? []) {
  const file = path.join(bundleDir, object.file);
  if (!fs.existsSync(file)) {
    failures.push(`Missing storage object ${object.bucket}/${object.path}`);
    continue;
  }
  const stat = fs.statSync(file);
  if (stat.size !== object.bytes) failures.push(`Size mismatch for ${object.bucket}/${object.path}`);
  if (hash(file) !== object.sha256) failures.push(`SHA-256 mismatch for ${object.bucket}/${object.path}`);
}

if (failures.length) {
  console.error("M19 backup verification failed:");
  for (const failure of failures) console.error(` - ${failure}`);
  process.exit(1);
}

console.log(`M19 backup verification passed: ${bundleDir}`);
console.log(`Database bytes: ${manifest.database.bytes}`);
console.log(`Storage objects verified: ${(manifest.storage?.objects ?? []).length}`);
console.log(`Storage capture status: ${manifest.storage?.status ?? "unknown"}`);
