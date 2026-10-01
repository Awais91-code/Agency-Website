import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import process from "node:process";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const diagnoseOnly = process.argv.includes("--diagnose");

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

let hostname;
try {
  hostname = new URL(url).hostname;
} catch {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
  process.exit(1);
}

if (!["127.0.0.1", "localhost"].includes(hostname)) {
  console.error(
    "Refusing to bootstrap an admin against a non-local Supabase project. This helper is intentionally local-only.",
  );
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const email = (await rl.question("Admin email: ")).trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("Enter a valid email.");
  rl.close();
  process.exit(1);
}

async function findUserByEmail(targetEmail) {
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const found = data.users.find(
      (user) => (user.email ?? "").toLowerCase() === targetEmail.toLowerCase(),
    );
    if (found) return found;

    if (data.users.length < perPage) break;
    page += 1;
  }

  return null;
}

try {
  let user = await findUserByEmail(email);

  if (diagnoseOnly) {
    if (!user) {
      console.log("\nUser not found in the local Supabase Auth database.");
      process.exitCode = 2;
    } else {
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      console.log("\nLocal auth diagnosis");
      console.log("--------------------");
      console.log(`User ID:          ${user.id}`);
      console.log(`Email:            ${user.email}`);
      console.log(`Email confirmed:  ${Boolean(user.email_confirmed_at)}`);
      console.log(`Confirmed at:     ${user.email_confirmed_at ?? "not confirmed"}`);
      console.log(`App role:         ${roleData?.role ?? "missing (defaults to client at runtime)"}`);
      console.log(`Last sign-in:     ${user.last_sign_in_at ?? "never"}`);
      console.log(`Created at:       ${user.created_at}`);
    }
    rl.close();
    process.exit();
  }

  const password = await rl.question(
    user
      ? "Set a NEW local admin password (min 10 chars): "
      : "Choose local admin password (min 10 chars): ",
  );

  if (password.length < 10) {
    console.error("Password must be at least 10 characters.");
    rl.close();
    process.exit(1);
  }

  if (user) {
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (error) throw error;
    user = data.user;
    console.log("\nExisting Auth user updated and email confirmed.");
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: "Agency Administrator",
      },
    });
    if (error) throw error;
    user = data.user;
    console.log("\nNew confirmed Auth user created.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        display_name:
          user.user_metadata?.display_name ||
          user.user_metadata?.full_name ||
          "Agency Administrator",
      },
      { onConflict: "id" },
    );

  if (profileError) throw profileError;

  const { error: roleError } = await supabase
    .from("user_roles")
    .upsert(
      {
        user_id: user.id,
        role: "super_admin",
        assigned_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (roleError) throw roleError;

  console.log("\nReady.");
  console.log(`Email: ${email}`);
  console.log("Role: super_admin");
  console.log("Email confirmed: yes");
  console.log("Login: http://localhost:3000/login");
  console.log("\nIf Next.js is already running, restart it after changing .env.local.");
} catch (error) {
  console.error("\nBootstrap failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
