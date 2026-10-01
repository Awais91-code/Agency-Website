import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "agency-m19-backup-test-"));
const database = Buffer.from(("-- test database backup\n" + "select 1;\n").repeat(12));
const storage = Buffer.from("test-storage-object");

try {
  fs.mkdirSync(path.join(dir, "storage", "public-media"), { recursive: true });
  fs.writeFileSync(path.join(dir, "database.sql"), database);
  fs.writeFileSync(path.join(dir, "storage", "public-media", "test.txt"), storage);

  const manifest = {
    format: "agency-m19-backup-v1",
    createdAt: new Date().toISOString(),
    source: "test",
    database: {
      file: "database.sql",
      bytes: database.byteLength,
      sha256: crypto.createHash("sha256").update(database).digest("hex"),
    },
    storage: {
      status: "complete",
      buckets: [{ id: "public-media", name: "public-media", public: true }],
      objects: [
        {
          bucket: "public-media",
          path: "test.txt",
          file: "storage/public-media/test.txt",
          bytes: storage.byteLength,
          sha256: crypto.createHash("sha256").update(storage).digest("hex"),
          contentType: "text/plain",
        },
      ],
    },
  };

  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));

  const good = spawnSync(process.execPath, ["scripts/verify-backup-bundle.mjs", dir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (good.status !== 0) {
    throw new Error(`Valid backup manifest did not verify: ${good.stderr || good.stdout}`);
  }

  fs.appendFileSync(path.join(dir, "storage", "public-media", "test.txt"), "tamper");
  const bad = spawnSync(process.execPath, ["scripts/verify-backup-bundle.mjs", dir], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (bad.status === 0) {
    throw new Error("Tampered backup unexpectedly passed checksum verification.");
  }

  console.log("M19 backup checksum verifier unit test passed.");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
