import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export function parseBackupArgs(argv) {
  const options = {
    local: false,
    output: null,
    dbUrl: null,
    skipStorage: false,
    positionals: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--local") {
      options.local = true;
      continue;
    }

    if (token === "--skip-storage") {
      options.skipStorage = true;
      continue;
    }

    if (token === "--output" || token === "--db-url") {
      const next = argv[index + 1];

      if (!next || next.startsWith("--")) {
        throw new Error(`${token} requires a value.`);
      }

      if (token === "--output") options.output = next;
      else options.dbUrl = next;

      index += 1;
      continue;
    }

    if (token.startsWith("--")) {
      throw new Error(`Unknown backup option: ${token}`);
    }

    options.positionals.push(token);
  }

  // npm on some Windows setups may consume named flags after `npm run ... --`
  // while still forwarding the output path. Accept one positional path as a
  // compatibility fallback.
  if (!options.output && options.positionals.length > 0) {
    options.output = options.positionals[0];
  }

  if (options.positionals.length > 1) {
    throw new Error(
      `Unexpected backup arguments: ${options.positionals.slice(1).join(" ")}`,
    );
  }

  return options;
}

export function resolveSupabaseBinary(cwd, platform = process.platform) {
  const candidates =
    platform === "win32"
      ? [
          path.join(cwd, "node_modules", "supabase", "bin", "supabase.exe"),
          path.join(cwd, "node_modules", ".bin", "supabase.exe"),
          path.join(cwd, "node_modules", ".bin", "supabase.cmd"),
        ]
      : [
          path.join(cwd, "node_modules", ".bin", "supabase"),
          path.join(cwd, "node_modules", "supabase", "bin", "supabase"),
        ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}

function powershellExecutable(env) {
  const systemRoot = env.SystemRoot || env.WINDIR;

  if (systemRoot) {
    const candidate = path.join(
      systemRoot,
      "System32",
      "WindowsPowerShell",
      "v1.0",
      "powershell.exe",
    );

    if (fs.existsSync(candidate)) return candidate;
  }

  return "powershell.exe";
}

export function buildPowerShellShimInvocation({
  binary,
  args,
  cwd,
  env = process.env,
}) {
  const runner = path.join(cwd, "scripts", "lib", "run-command.ps1");
  const encodedArgs = Buffer.from(
    JSON.stringify(args),
    "utf8",
  ).toString("base64");

  return {
    command: powershellExecutable(env),
    args: [
      "-NoLogo",
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      runner,
      binary,
      encodedArgs,
    ],
    runner,
    encodedArgs,
  };
}

export function runSupabaseCommand({
  binary,
  args,
  cwd,
  env = process.env,
  platform = process.platform,
}) {
  if (
    platform === "win32" &&
    /\.(?:cmd|bat)$/i.test(binary)
  ) {
    const invocation = buildPowerShellShimInvocation({
      binary,
      args,
      cwd,
      env,
    });

    if (!fs.existsSync(invocation.runner)) {
      return {
        status: null,
        signal: null,
        stdout: "",
        stderr: "",
        error: Object.assign(
          new Error(
            `PowerShell command runner is missing: ${invocation.runner}`,
          ),
          { code: "ENOENT" },
        ),
      };
    }

    return spawnSync(
      invocation.command,
      invocation.args,
      {
        cwd,
        encoding: "utf8",
        env,
        windowsHide: true,
      },
    );
  }

  return spawnSync(binary, args, {
    cwd,
    encoding: "utf8",
    env,
    windowsHide: true,
  });
}
