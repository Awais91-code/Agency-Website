import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const base = (process.env.M19_E2E_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !secret) {
  console.error("M19 E2E requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  process.exit(2);
}

const admin = createClient(supabaseUrl, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const suffix = crypto.randomBytes(6).toString("hex");
const email = `m19-e2e-${suffix}@example.test`;
const sessionToken = crypto.randomUUID();
const idempotencyKey = `m19-e2e-${crypto.randomUUID()}`;
let leadId = null;
let briefId = null;

function assert(value, message) {
  if (!value) throw new Error(message);
}

async function jsonRequest(path, payload) {
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: base,
      "user-agent": "agency-m19-e2e/1.0",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20_000),
  });

  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${path} returned non-JSON (${response.status}).`);
  }

  if (!response.ok || body?.ok !== true) {
    throw new Error(`${path} failed (${response.status}): ${body?.error?.code || body?.error?.message || text.slice(0, 200)}`);
  }

  return body.data;
}

const basePayload = {
  sessionToken,
  projectType: "website",
  features: ["auth", "booking"],
  companyName: "M19 E2E Company",
  industry: "Software testing",
  currentUrl: "",
  objective: "Validate the complete structured project enquiry lifecycle before a release.",
  complexity: "standard",
  urgency: "flexible",
  desiredStart: "",
  deadline: "",
  budgetBand: "5k-10k",
  support: "none",
  contactName: "M19 E2E Test",
  contactEmail: email,
  contactPhone: "",
  timezoneCountry: "Test/CI",
  requirements: "Exercise project intake, estimate creation, CRM lead creation, attribution and downstream handoff records.",
  marketingConsent: false,
  privacyAccepted: true,
  serviceSlug: "web-development",
  honeypot: "",
  startedAt: Date.now() - 10_000,
  attribution: {
    utm_source: "m19-e2e",
    utm_medium: "ci",
    utm_campaign: "release-validation",
    landing_path: "/start-a-project",
  },
};

try {
  const healthResponse = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(15_000) });
  const health = await healthResponse.json();
  assert(healthResponse.ok && health.status === "ok", "Health endpoint is not ready for E2E.");

  const protectedResponse = await fetch(`${base}/admin`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
  });
  assert([301, 302, 303, 307, 308].includes(protectedResponse.status), "Unauthenticated /admin did not redirect.");
  const location = protectedResponse.headers.get("location") || "";
  assert(location.includes("/login"), "Unauthenticated /admin did not redirect to login.");

  const draft = await jsonRequest("/api/project-briefs/draft", basePayload);
  briefId = draft.briefId;
  assert(briefId, "Draft API did not return a brief ID.");

  const estimate = await jsonRequest("/api/project-briefs/estimate", {
    projectType: basePayload.projectType,
    features: basePayload.features,
    complexity: basePayload.complexity,
    urgency: basePayload.urgency,
    support: basePayload.support,
  });
  assert(Number.isFinite(estimate.finalMin), "Estimate response is missing finalMin.");
  assert(Number.isFinite(estimate.finalMax), "Estimate response is missing finalMax.");

  const submit = await jsonRequest("/api/project-briefs/submit", {
    ...basePayload,
    idempotencyKey,
    turnstileToken: "",
  });
  assert(submit.submitted === true, "Project brief submit did not report success.");

  const { data: lead, error: leadError } = await admin
    .from("leads")
    .select("id,email,source,utm_source,utm_medium,utm_campaign,landing_path")
    .eq("email", email)
    .maybeSingle();

  if (leadError) throw leadError;
  assert(lead?.id, "Submitted project brief did not create a CRM lead.");
  leadId = lead.id;
  assert(lead.utm_source === "m19-e2e", "Lead UTM source was not preserved.");
  assert(lead.utm_medium === "ci", "Lead UTM medium was not preserved.");

  const { data: storedBrief, error: briefError } = await admin
    .from("project_briefs")
    .select("id,status,lead_id")
    .eq("id", briefId)
    .single();
  if (briefError) throw briefError;
  assert(storedBrief.status === "submitted", "Project brief did not become submitted.");
  assert(storedBrief.lead_id === leadId, "Project brief is not linked to its CRM lead.");

  const { data: handoff, error: handoffError } = await admin
    .from("booking_handoffs")
    .select("id,lead_id")
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();
  if (handoffError) throw handoffError;
  assert(handoff?.lead_id === leadId, "Project brief did not create a booking handoff.");

  const { data: analytics, error: analyticsError } = await admin
    .from("analytics_events")
    .select("id,event_name,lead_id")
    .eq("event_name", "project_brief_submit")
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();
  if (analyticsError) throw analyticsError;
  assert(analytics?.lead_id === leadId, "Server conversion event was not recorded.");

  console.log("M19 conversion E2E: PASS");

  const permission = spawnSync(
    process.execPath,
    ["scripts/test-security-rls.mjs"],
    { cwd: process.cwd(), env: process.env, stdio: "inherit" },
  );

  if (permission.status !== 0) {
    throw new Error("M19 permission/RLS E2E failed.");
  }

  console.log("M19 critical conversion + permission E2E: PASS");
} catch (error) {
  console.error("M19 critical conversion + permission E2E: FAIL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  try {
    if (leadId) {
      await admin.from("analytics_events").delete().eq("lead_id", leadId);
      await admin.from("automation_events").delete().eq("entity_id", leadId);
      await admin.from("activity_events").delete().eq("entity_id", leadId);
      await admin.from("leads").delete().eq("id", leadId);
    }
    if (briefId) {
      await admin.from("project_briefs").delete().eq("id", briefId);
    } else {
      await admin.from("project_briefs").delete().eq("session_token", sessionToken);
    }
  } catch (cleanupError) {
    console.warn("M19 E2E cleanup warning:", cleanupError instanceof Error ? cleanupError.message : cleanupError);
  }
}
