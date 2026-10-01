import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const portal = spawnSync(process.execPath, ["scripts/test-client-portal-isolation.mjs"], {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
});

if (portal.status !== 0) {
  console.error("M18 security RLS: client cross-project isolation failed.");
  process.exit(portal.status || 1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  console.error("Supabase local environment variables are required.");
  process.exit(2);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = crypto.randomBytes(5).toString("hex");
const password = `M18-${crypto.randomBytes(12).toString("base64url")}!aA1`;
const adminEmail = `m18-admin-${suffix}@example.test`;
const staffEmail = `m18-staff-${suffix}@example.test`;
let adminUser, staffUser, auditId, securityId;

function client() {
  return createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
}
function assert(value, message) {
  if (!value) throw new Error(message);
}

try {
  ({ data: { user: adminUser } } = await admin.auth.admin.createUser({ email: adminEmail, password, email_confirm: true }));
  ({ data: { user: staffUser } } = await admin.auth.admin.createUser({ email: staffEmail, password, email_confirm: true }));
  assert(adminUser && staffUser, "Could not create M18 test users.");

  await admin.from("user_roles").upsert([
    { user_id: adminUser.id, role: "admin" },
    { user_id: staffUser.id, role: "staff" },
  ], { onConflict: "user_id" });

  const audit = await admin.from("audit_logs").insert({ actor_user_id: adminUser.id, action: "m18.test", object_type: "security_test" }).select("id").single();
  const security = await admin.from("security_events").insert({ event_type: "m18.test", severity: "info", actor_user_id: adminUser.id }).select("id").single();
  if (audit.error || security.error) throw new Error(audit.error?.message || security.error?.message || "Could not seed M18 RLS test rows.");
  auditId = audit.data.id;
  securityId = security.data.id;

  const adminClient = client();
  const staffClient = client();
  assert(!(await adminClient.auth.signInWithPassword({ email: adminEmail, password })).error, "Admin login failed.");
  assert(!(await staffClient.auth.signInWithPassword({ email: staffEmail, password })).error, "Staff login failed.");

  const adminAudit = await adminClient.from("audit_logs").select("id").eq("id", auditId).maybeSingle();
  const staffAudit = await staffClient.from("audit_logs").select("id").eq("id", auditId).maybeSingle();
  const adminSecurity = await adminClient.from("security_events").select("id").eq("id", securityId).maybeSingle();
  const staffSecurity = await staffClient.from("security_events").select("id").eq("id", securityId).maybeSingle();

  assert(adminAudit.data?.id === auditId, "Admin cannot read audit logs.");
  assert(!staffAudit.data, "Staff can read admin-only audit logs.");
  assert(adminSecurity.data?.id === securityId, "Admin cannot read security events.");
  assert(!staffSecurity.data, "Staff can read admin-only security events.");

  console.log("M18 security RLS/admin-boundary E2E: PASS");
} catch (error) {
  console.error("M18 security RLS/admin-boundary E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (auditId) await admin.from("audit_logs").delete().eq("id", auditId);
  if (securityId) await admin.from("security_events").delete().eq("id", securityId);
  if (adminUser?.id) await admin.auth.admin.deleteUser(adminUser.id);
  if (staffUser?.id) await admin.auth.admin.deleteUser(staffUser.id);
}
