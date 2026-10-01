import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishable || !secret) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local.");
  process.exit(2);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = crypto.randomBytes(6).toString("hex");
const password = `M14-${crypto.randomBytes(12).toString("base64url")}!aA1`;
const emailA = `m14-a-${suffix}@example.test`;
const emailB = `m14-b-${suffix}@example.test`;
let userA, userB, projectA, projectB;

function client() { return createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } }); }
function assert(value, message) { if (!value) throw new Error(message); }

try {
  ({ data: { user: userA } } = await admin.auth.admin.createUser({ email: emailA, password, email_confirm: true }));
  ({ data: { user: userB } } = await admin.auth.admin.createUser({ email: emailB, password, email_confirm: true }));
  assert(userA && userB, "Could not create test users.");
  await admin.from("user_roles").upsert([{ user_id: userA.id, role: "client" }, { user_id: userB.id, role: "client" }], { onConflict: "user_id" });

  ({ data: projectA } = await admin.from("projects").insert({ name: `M14 Isolation A ${suffix}`, status: "active" }).select("*").single());
  ({ data: projectB } = await admin.from("projects").insert({ name: `M14 Isolation B ${suffix}`, status: "active" }).select("*").single());
  assert(projectA && projectB, "Could not create test projects.");
  await admin.from("project_members").insert([{ project_id: projectA.id, user_id: userA.id }, { project_id: projectB.id, user_id: userB.id }]);
  await admin.from("milestones").insert([{ project_id: projectA.id, title: "A milestone", client_visible: true }, { project_id: projectB.id, title: "B milestone", client_visible: true }]);

  const assetA = crypto.randomUUID(), assetB = crypto.randomUUID();
  await admin.from("media_assets").insert([
    { id: assetA, bucket: "private-files", object_path: `isolation/${assetA}.pdf`, original_name: "a.pdf", display_name: "a.pdf", mime_type: "application/pdf", size_bytes: 10, visibility: "private" },
    { id: assetB, bucket: "private-files", object_path: `isolation/${assetB}.pdf`, original_name: "b.pdf", display_name: "b.pdf", mime_type: "application/pdf", size_bytes: 10, visibility: "private" },
  ]);
  await admin.from("project_files").insert([{ project_id: projectA.id, media_asset_id: assetA, client_visible: true }, { project_id: projectB.id, media_asset_id: assetB, client_visible: true }]);

  const a = client(), b = client();
  assert(!(await a.auth.signInWithPassword({ email: emailA, password })).error, "Client A login failed.");
  assert(!(await b.auth.signInWithPassword({ email: emailB, password })).error, "Client B login failed.");

  const { data: aProjects } = await a.from("projects").select("id");
  const { data: bProjects } = await b.from("projects").select("id");
  assert(aProjects?.length === 1 && aProjects[0].id === projectA.id, "Client A can see unexpected project data.");
  assert(bProjects?.length === 1 && bProjects[0].id === projectB.id, "Client B can see unexpected project data.");

  const { data: leakedProject } = await a.from("projects").select("id").eq("id", projectB.id).maybeSingle();
  assert(!leakedProject, "Client A could infer/read Client B project.");
  const { data: leakedMilestones } = await a.from("milestones").select("id").eq("project_id", projectB.id);
  assert((leakedMilestones ?? []).length === 0, "Client A could read Client B milestones.");
  const { data: ownAsset } = await a.from("media_assets").select("id").eq("id", assetA).maybeSingle();
  const { data: leakedAsset } = await a.from("media_assets").select("id").eq("id", assetB).maybeSingle();
  assert(ownAsset?.id === assetA, "Client A could not read authorized project-file metadata.");
  assert(!leakedAsset, "Client A could read Client B private-file metadata.");

  const ownRequest = await a.from("client_requests").insert({ project_id: projectA.id, created_by: userA.id, title: "Own request", description: "Allowed request" }).select("id").single();
  assert(!ownRequest.error, `Client A could not create own request: ${ownRequest.error?.message}`);
  const otherRequest = await a.from("client_requests").insert({ project_id: projectB.id, created_by: userA.id, title: "Cross request", description: "Must fail" });
  assert(Boolean(otherRequest.error), "Client A could create request in Client B project.");

  console.log("M14 client isolation E2E: PASS");
} catch (error) {
  console.error("M14 client isolation E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (projectA?.id) await admin.from("projects").delete().eq("id", projectA.id);
  if (projectB?.id) await admin.from("projects").delete().eq("id", projectB.id);
  if (userA?.id) await admin.auth.admin.deleteUser(userA.id);
  if (userB?.id) await admin.auth.admin.deleteUser(userB.id);
}
