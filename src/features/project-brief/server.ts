import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { createBookingHandoff } from "@/features/booking/server";
import { notifyLeadCreated } from "@/features/notifications/workflows";
import { enqueueLeadCreatedAutomation } from "@/features/automation/queue";
import { applyLeadAttribution } from "@/features/analytics/attribution";
import { recordServerConversion } from "@/features/analytics/server";
import { calculateEstimate, estimateSnapshot } from "@/features/project-brief/estimate";
import { scoreProjectBrief } from "@/features/project-brief/score";
import type { DraftProjectBriefPayload, SubmitProjectBriefPayload } from "@/features/project-brief/schemas";
import type { Json } from "@/types/database";

function nullable(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function dateOrNull(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

async function resolveServiceId(serviceSlug: string) {
  if (!serviceSlug) return null;
  const admin = getSupabaseAdminClient();
  const { data } = await admin.from("services").select("id").eq("slug", serviceSlug).maybeSingle();
  return data?.id ?? null;
}

export async function saveProjectBriefDraft(input: DraftProjectBriefPayload) {
  const admin = getSupabaseAdminClient();
  const { data: existing } = await admin
    .from("project_briefs")
    .select("id,status,lead_id")
    .eq("session_token", input.sessionToken)
    .maybeSingle();

  // A submitted brief is immutable from the public draft route. Later CRM modules may
  // append internal activity, but the visitor cannot rewrite the canonical submitted scope.
  if (existing?.status === "submitted") {
    return existing;
  }

  const serviceId = await resolveServiceId(input.serviceSlug);

  const payload = {
    session_token: input.sessionToken,
    service_type: input.projectType || null,
    service_id: serviceId,
    company_name: nullable(input.companyName),
    industry: nullable(input.industry),
    current_url: nullable(input.currentUrl),
    objective: nullable(input.objective),
    timeline: null,
    desired_start: dateOrNull(input.desiredStart),
    deadline: dateOrNull(input.deadline),
    urgency: input.urgency,
    budget_band: input.budgetBand,
    contact_name: nullable(input.contactName),
    contact_email: nullable(input.contactEmail),
    contact_phone: nullable(input.contactPhone),
    timezone_country: nullable(input.timezoneCountry),
    requirements: nullable(input.requirements),
    marketing_consent: input.marketingConsent,
    privacy_accepted: input.privacyAccepted,
    attribution: input.attribution as Json,
  };

  const { data: brief, error } = await admin
    .from("project_briefs")
    .upsert(payload, { onConflict: "session_token" })
    .select("id,status,lead_id")
    .single();

  if (error || !brief) throw new Error(error?.message ?? "Could not save project brief.");

  const answers = [
    ["features", input.features],
    ["complexity", input.complexity],
    ["support", input.support],
    ["service_slug", input.serviceSlug],
  ].map(([answerKey, answerValue]) => ({
    brief_id: brief.id,
    answer_key: String(answerKey),
    answer_value: answerValue as Json,
  }));

  const { error: answersError } = await admin.from("brief_answers").upsert(answers, { onConflict: "brief_id,answer_key" });
  if (answersError) throw new Error(`Could not save brief answers: ${answersError.message}`);

  return brief;
}

export async function submitProjectBrief(input: SubmitProjectBriefPayload) {
  const admin = getSupabaseAdminClient();
  const brief = await saveProjectBriefDraft(input);

  if (brief.status === "submitted" && brief.lead_id) {
    const bookingContext = await createBookingHandoff(brief.lead_id);
    await notifyLeadCreated({
      leadId: brief.lead_id,
      briefId: brief.id,
      bookingContext,
    });
    await enqueueLeadCreatedAutomation(brief.lead_id, brief.id);
    await applyLeadAttribution(brief.lead_id, input.attribution);
    await recordServerConversion({
      eventKey: `project-brief-submit:${brief.id}`,
      eventName: "project_brief_submit",
      leadId: brief.lead_id,
      entityType: "project_brief",
      entityId: brief.id,
      attribution: input.attribution,
      properties: {
        service_slug: input.serviceSlug || undefined,
        result: "already_submitted",
      },
    });
    return { briefId: brief.id, leadId: brief.lead_id, alreadySubmitted: true, estimate: null, bookingContext };
  }

  const estimate = await calculateEstimate({
    projectType: input.projectType,
    features: input.features,
    complexity: input.complexity,
    urgency: input.urgency,
    support: input.support,
  });

  const { error: estimateError } = await admin.from("estimate_results").insert({
    brief_id: brief.id,
    currency: estimate.currency,
    subtotal_min: estimate.subtotalMin,
    subtotal_max: estimate.subtotalMax,
    final_min: estimate.finalMin,
    final_max: estimate.finalMax,
    inputs: {
      projectType: input.projectType,
      features: input.features,
      complexity: input.complexity,
      urgency: input.urgency,
      support: input.support,
    },
    adjustments: estimate.adjustments as unknown as Json,
    rule_snapshot: estimateSnapshot(estimate),
  });
  if (estimateError) throw new Error(`Could not save estimate: ${estimateError.message}`);

  const leadScore = scoreProjectBrief(input);
  const { data, error } = await admin.rpc("submit_project_brief", {
    p_brief_id: brief.id,
    p_idempotency_key: input.idempotencyKey,
    p_lead_score: leadScore.score,
    p_score_reasons: leadScore.reasons as unknown as Json,
  });

  if (error) throw new Error(`Could not finalize project brief: ${error.message}`);
  const result = data as { brief_id?: string; lead_id?: string; already_submitted?: boolean } | null;
  if (!result?.lead_id) throw new Error("Project brief finalized without a lead identifier.");

  const bookingContext = await createBookingHandoff(result.lead_id);

  await notifyLeadCreated({
    leadId: result.lead_id,
    briefId: result.brief_id ?? brief.id,
    bookingContext,
  });
  await enqueueLeadCreatedAutomation(result.lead_id, result.brief_id ?? brief.id);
  await applyLeadAttribution(result.lead_id, input.attribution);
  await recordServerConversion({
    eventKey: `project-brief-submit:${result.brief_id ?? brief.id}`,
    eventName: "project_brief_submit",
    leadId: result.lead_id,
    entityType: "project_brief",
    entityId: result.brief_id ?? brief.id,
    attribution: input.attribution,
    properties: {
      service_slug: input.serviceSlug || undefined,
      result: "submitted",
    },
  });

  return {
    briefId: result.brief_id ?? brief.id,
    leadId: result.lead_id,
    alreadySubmitted: Boolean(result.already_submitted),
    estimate,
    bookingContext,
  };
}
