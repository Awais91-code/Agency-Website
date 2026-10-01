import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  parseBackupArgs,
  resolveSupabaseBinary,
  runSupabaseCommand,
} from "./lib/backup-cli.mjs";

const cli = parseBackupArgs(process.argv.slice(2));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = path.resolve(
  cli.output || path.join("backups", timestamp),
);
const dbUrl = cli.dbUrl || process.env.BACKUP_DATABASE_URL || null;
const local = cli.local || !dbUrl;
const skipStorage = cli.skipStorage;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || null;
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || null;
const supabaseBinary = resolveSupabaseBinary(process.cwd());

fs.mkdirSync(outputDir, { recursive: true, mode: 0o700 });


function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function sanitizeError(text) {
  let value = String(text || "");
  if (dbUrl) value = value.replaceAll(dbUrl, "[REDACTED_DATABASE_URL]");
  return value.slice(-4000);
}

function runDump(extraArgs, file) {
  if (!supabaseBinary) {
    throw new Error(
      "Local Supabase CLI is unavailable. Run npm install first, then confirm `npx supabase --version` works.",
    );
  }

  const args = ["db", "dump"];

  if (local) args.push("--local");
  else if (dbUrl) args.push("--db-url", dbUrl);
  else {
    throw new Error(
      "Use --local or provide BACKUP_DATABASE_URL / --db-url.",
    );
  }

  args.push(...extraArgs, "--file", file);

  const result = runSupabaseCommand({
    binary: supabaseBinary,
    args,
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.error) {
    throw new Error(
      `Could not launch Supabase CLI (${result.error.code || "spawn_error"}): ${sanitizeError(
        result.error.message,
      )}`,
    );
  }

  if (result.status !== 0) {
    const details = sanitizeError(
      result.stderr ||
        result.stdout ||
        `Supabase CLI exited with status ${String(result.status)}.`,
    );

    throw new Error(`Supabase database dump failed: ${details}`);
  }
}

const schemaFile = path.join(outputDir, "database.schema.sql");
const dataFile = path.join(outputDir, "database.data.sql");
const combinedFile = path.join(outputDir, "database.sql");

console.log(`Creating database backup in ${outputDir}`);
runDump([], schemaFile);
runDump(["--data-only", "--use-copy"], dataFile);

fs.writeFileSync(
  combinedFile,
  [
    "-- Agency M19 logical backup. Public/database logical dump; production provider snapshots remain authoritative.\n",
    fs.readFileSync(schemaFile, "utf8"),
    "\n-- DATA SECTION\n",
    fs.readFileSync(dataFile, "utf8"),
  ].join("\n"),
  { encoding: "utf8", mode: 0o600 },
);

const manifest = {
  format: "agency-m19-backup-v1",
  createdAt: new Date().toISOString(),
  source: local ? "local" : "remote",
  database: {
    file: "database.sql",
    sha256: sha256File(combinedFile),
    bytes: fs.statSync(combinedFile).size,
    schemaFile: "database.schema.sql",
    schemaSha256: sha256File(schemaFile),
    schemaBytes: fs.statSync(schemaFile).size,
    dataFile: "database.data.sql",
    dataSha256: sha256File(dataFile),
    dataBytes: fs.statSync(dataFile).size,
  },
  storage: {
    status: "skipped",
    buckets: [],
    objects: [],
  },
};

async function listObjects(client, bucketId, prefix = "") {
  const objects = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const { data, error } = await client.storage.from(bucketId).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw new Error(`Could not list storage bucket ${bucketId}: ${error.message}`);
    const rows = data ?? [];

    for (const item of rows) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (!item.id && !item.metadata) {
        objects.push(...(await listObjects(client, bucketId, objectPath)));
      } else {
        objects.push({ path: objectPath, metadata: item.metadata ?? null });
      }
    }

    if (rows.length < limit) break;
    offset += limit;
  }

  return objects;
}

if (!skipStorage && supabaseUrl && supabaseSecret) {
  const client = createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: buckets, error: bucketError } = await client.storage.listBuckets();
  if (bucketError) throw new Error(`Could not list storage buckets: ${bucketError.message}`);

  manifest.storage.status = "complete";
  manifest.storage.buckets = (buckets ?? []).map((bucket) => ({
    id: bucket.id,
    name: bucket.name,
    public: Boolean(bucket.public),
    fileSizeLimit: bucket.file_size_limit ?? null,
    allowedMimeTypes: bucket.allowed_mime_types ?? null,
  }));

  for (const bucket of buckets ?? []) {
    const objects = await listObjects(client, bucket.id);

    for (const object of objects) {
      const { data, error } = await client.storage.from(bucket.id).download(object.path);
      if (error || !data) {
        throw new Error(`Could not download ${bucket.id}/${object.path}: ${error?.message || "no data"}`);
      }

      const safeRelative = path.normalize(object.path).replace(/^([.][.][/\\])+/, "");
      if (path.isAbsolute(safeRelative) || safeRelative.startsWith("..")) {
        throw new Error(`Unsafe storage object path encountered: ${object.path}`);
      }

      const target = path.join(outputDir, "storage", bucket.id, safeRelative);
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(target, buffer, { mode: 0o600 });

      manifest.storage.objects.push({
        bucket: bucket.id,
        path: object.path,
        file: path.relative(outputDir, target).replaceAll(path.sep, "/"),
        bytes: buffer.byteLength,
        sha256: crypto.createHash("sha256").update(buffer).digest("hex"),
        contentType:
          typeof object.metadata?.mimetype === "string"
            ? object.metadata.mimetype
            : null,
      });
    }
  }
} else if (!skipStorage) {
  manifest.storage.status = "unconfigured";
}

const manifestFile = path.join(outputDir, "manifest.json");
fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, {
  encoding: "utf8",
  mode: 0o600,
});

console.log(`Backup bundle created: ${outputDir}`);
console.log(`Database SHA-256: ${manifest.database.sha256}`);
console.log(`Storage status: ${manifest.storage.status}; objects: ${manifest.storage.objects.length}`);
console.log("Treat this directory as sensitive and store it in encrypted backup storage. Do not commit it.");
