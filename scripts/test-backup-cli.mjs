import assert from "node:assert/strict";
import path from "node:path";

import {
  buildPowerShellShimInvocation,
  parseBackupArgs,
} from "./lib/backup-cli.mjs";

{
  const parsed = parseBackupArgs([
    "--local",
    "--output",
    ".\\backups\\m19-drill",
  ]);

  assert.equal(parsed.local, true);
  assert.equal(parsed.output, ".\\backups\\m19-drill");
  assert.equal(parsed.dbUrl, null);
}

{
  // Windows/npm fallback observed during RC testing: only the output path was
  // forwarded to the script. That path must still be honored.
  const parsed = parseBackupArgs([
    ".\\backups\\m19-drill",
  ]);

  assert.equal(parsed.output, ".\\backups\\m19-drill");
  assert.equal(parsed.local, false);
}

{
  const parsed = parseBackupArgs([
    "--db-url",
    "postgresql://example.invalid/db",
    "--skip-storage",
    "--output",
    "./backups/remote",
  ]);

  assert.equal(parsed.dbUrl, "postgresql://example.invalid/db");
  assert.equal(parsed.skipStorage, true);
  assert.equal(parsed.output, "./backups/remote");
}

assert.throws(
  () => parseBackupArgs(["--output"]),
  /requires a value/,
);

assert.throws(
  () => parseBackupArgs(["--unknown"]),
  /Unknown backup option/,
);

{
  const cwd = path.resolve("C:\\Agency Test");
  const binary = path.join(cwd, "node_modules", ".bin", "supabase.cmd");
  const args = [
    "db",
    "dump",
    "--local",
    "--data-only",
    "--use-copy",
    "--file",
    "C:\\Agency Test\\backups\\m19-drill\\database.data.sql",
  ];

  const invocation = buildPowerShellShimInvocation({
    binary,
    args,
    cwd,
    env: { SystemRoot: "C:\\Windows" },
  });

  assert.ok(invocation.args.includes("-File"));
  assert.equal(
    invocation.runner,
    path.join(cwd, "scripts", "lib", "run-command.ps1"),
  );

  const decoded = JSON.parse(
    Buffer.from(invocation.encodedArgs, "base64").toString("utf8"),
  );

  assert.deepEqual(decoded, args);
  assert.equal(invocation.args.at(-2), binary);
  assert.equal(invocation.args.at(-1), invocation.encodedArgs);
}

console.log("RC4 Windows backup PowerShell runner compatibility tests passed.");
