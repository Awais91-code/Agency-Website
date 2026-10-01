import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const bundleArg = process.argv.find((item, index) => index > 1 && !item.startsWith("--"));
const confirmIndex = process.argv.indexOf("--confirm");
const confirmation = confirmIndex >= 0 ? process.argv[confirmIndex + 1] : null;
const bundleDir = path.resolve(bundleArg || "backups/latest");
const url = process.env.RESTORE_SUPABASE_URL;
const secret = process.env.RESTORE_SUPABASE_SECRET_KEY;

if (confirmation !== "restore-storage") {
  console.error('Refusing restore. Re-run with --confirm restore-storage after verifying the target project.');
  process.exit(2);
}

if (!url || !secret) {
  console.error("RESTORE_SUPABASE_URL and RESTORE_SUPABASE_SECRET_KEY are required.");
  process.exit(2);
}

if (process.env.RESTORE_TARGET_ENVIRONMENT === "production" && process.env.ALLOW_PRODUCTION_RESTORE !== "true") {
  console.error("Production restore is blocked. Use a disposable/local/staging target for drills.");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(bundleDir, "manifest.json"), "utf8"));
const client = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const existing = await client.storage.listBuckets();
if (existing.error) throw new Error(existing.error.message);
const bucketIds = new Set((existing.data ?? []).map((bucket) => bucket.id));

for (const bucket of manifest.storage?.buckets ?? []) {
  if (!bucketIds.has(bucket.id)) {
    const { error } = await client.storage.createBucket(bucket.id, {
      public: Boolean(bucket.public),
      fileSizeLimit: bucket.fileSizeLimit ?? undefined,
      allowedMimeTypes: bucket.allowedMimeTypes ?? undefined,
    });
    if (error) throw new Error(`Could not create bucket ${bucket.id}: ${error.message}`);
  }
}

let restored = 0;
for (const object of manifest.storage?.objects ?? []) {
  const file = path.join(bundleDir, object.file);
  const buffer = fs.readFileSync(file);
  const { error } = await client.storage.from(object.bucket).upload(object.path, buffer, {
    upsert: true,
    contentType: object.contentType ?? undefined,
  });
  if (error) throw new Error(`Could not restore ${object.bucket}/${object.path}: ${error.message}`);
  restored += 1;
}

console.log(`M19 storage restore drill completed. Restored ${restored} object(s).`);
console.log("Database restore is intentionally a separate, reviewed step; follow docs/BACKUP_RESTORE.md.");
