import "server-only";

import { env } from "@/config/env";
import { applyLeadAttribution } from "@/features/analytics/attribution";
import { getNotificationPreferences, sendTransactionalEmail } from "@/features/notifications/service";
import { logAssistantEvent, verifyConversationSession } from "@/features/ai/session";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

function mergeMetadata(current: Json, next: Record<string, Json>) {
  const base =
    current && typeof current === "object" && !Array.isArray(current)
      ? (current as Record<string, Json>)
      : {};

  return { ...base, ...next };
}

export async function createAssistantLeadHandoff({
  conversationId,
  sessionToken,
  name,
  email,
  company,
  projectSummary,
  serviceType,
  attribution,
}: {
  conversationId: string;
  sessionToken: string;
  name: string;
  email: string;
  company: string | null;
  projectSummary: string;
  serviceType: string | null;
  attribution?: unknown;
}) {
  const admin = getSupabaseAdminClient();
  const conversation = await verifyConversationSession(
    conversationId,
    sessionToken,
  );

  if (conversation.lead_id) {
    return { leadId: conversation.lead_id, alreadyCreated: true };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { data: existing, error: existingError } = await admin
    .from("leads")
    .select("id,metadata,full_name,company_name")
    .eq("normalized_email", normalizedEmail)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);

  const score =
    45 +
    (serviceType ? 10 : 0) +
    (company ? 5 : 0);

  const reasons: Json[] = [
    { rule: "explicit_contact", points: 25, label: "Explicit contact details supplied in AI handoff" },
    { rule: "project_summary", points: 20, label: "Project context supplied in AI handoff" },
    ...(serviceType
      ? [{ rule: "service_context", points: 10, label: "Service area supplied" } as Json]
      : []),
    ...(company
      ? [{ rule: "company_context", points: 5, label: "Company supplied" } as Json]
      : []),
  ];

  let leadId: string;
  let alreadyCreated = false;

  if (existing) {
    leadId = existing.id;
    alreadyCreated = true;

    const { error } = await admin
      .from("leads")
      .update({
        full_name: existing.full_name || name,
        company_name: existing.company_name || company,
        source: "ai_assistant",
        lead_score: Math.max(score, 0),
        score_reasons: reasons,
        metadata: mergeMetadata(existing.metadata, {
          ai_assistant_handoff: {
            conversation_id: conversationId,
            project_summary: projectSummary,
            service_type: serviceType,
            supplied_at: new Date().toISOString(),
          },
        }),
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await admin
      .from("leads")
      .insert({
        full_name: name,
        email: normalizedEmail,
        company_name: company,
        source: "ai_assistant",
        status: score >= 60 ? "qualified" : "new",
        priority: score >= 60 ? "high" : "normal",
        lead_score: score,
        score_reasons: reasons,
        metadata: {
          ai_assistant_handoff: {
            conversation_id: conversationId,
            project_summary: projectSummary,
            service_type: serviceType,
            supplied_at: new Date().toISOString(),
          },
        },
      })
      .select("id,status")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Could not create lead.");
    leadId = data.id;

    await admin.from("lead_stage_history").insert({
      lead_id: leadId,
      from_status: null,
      to_status: data.status,
      reason: "Created from explicit AI assistant handoff.",
    });
  }

  await admin.from("lead_notes").insert({
    lead_id: leadId,
    author_user_id: null,
    body: `AI assistant handoff summary:\n${projectSummary}${serviceType ? `\nService: ${serviceType}` : ""}`,
  });

  await admin.from("activity_events").insert({
    entity_type: "lead",
    entity_id: leadId,
    event_type: "ai_assistant.handoff",
    source: "ai_assistant",
    metadata: {
      conversation_id: conversationId,
      existing_lead_enriched: alreadyCreated,
      explicit_contact_data: true,
    },
  });

  await applyLeadAttribution(leadId, attribution);

  const { error: conversationError } = await admin
    .from("ai_conversations")
    .update({
      status: "handed_off",
      lead_id: leadId,
    })
    .eq("id", conversationId);

  if (conversationError) throw new Error(conversationError.message);

  await logAssistantEvent({
    conversationId,
    eventType: "assistant.handoff_completed",
    metadata: {
      lead_id: leadId,
      existing_lead_enriched: alreadyCreated,
    },
  });

  try {
    const preferences = await getNotificationPreferences();

    if (preferences.send_new_lead_alerts) {
      for (const recipient of preferences.adminRecipients) {
        await sendTransactionalEmail({
          templateKey: "admin-new-lead",
          to: recipient,
          idempotencyKey: `ai-handoff/${conversationId}/admin-new-lead/${recipient}`,
          contextType: "lead",
          contextId: leadId,
          data: {
            agencyName: env.NEXT_PUBLIC_APP_NAME,
            appUrl: env.NEXT_PUBLIC_APP_URL,
            leadName: name,
            leadEmail: normalizedEmail,
            company: company ?? "No company",
            serviceType: serviceType ?? "AI assistant enquiry",
            leadScore: score,
            crmUrl: `${env.NEXT_PUBLIC_APP_URL}/admin/leads/${leadId}`,
          },
        });
      }
    }
  } catch (error) {
    if (env.NODE_ENV !== "production") {
      console.error("[ai] admin handoff notification failed", error);
    }
  }

  return { leadId, alreadyCreated };
}
