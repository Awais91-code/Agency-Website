"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { notifyAdminsOfClientAction } from "@/features/portal/notifications";
import { requireUser } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { createClient } from "@/lib/supabase/server";

function back(projectId: string, message: string, error = false): never {
  redirect(`/portal/projects/${projectId}?${error ? "error" : "saved"}=${encodeURIComponent(message)}`);
}

export async function createClientRequestAction(formData: FormData) {
  const auth = await requireUser("/portal");
  const parsed = z.object({
    projectId: z.string().uuid(),
    requestType: z.enum(["revision", "question", "change_request", "feedback"]),
    title: z.string().trim().min(2).max(220),
    description: z.string().trim().min(2).max(10000),
  }).safeParse({
    projectId: formData.get("projectId"),
    requestType: formData.get("requestType"),
    title: formData.get("title"),
    description: formData.get("description"),
  });
  if (!parsed.success) back(String(formData.get("projectId") ?? ""), parsed.error.issues[0]?.message ?? "Invalid request.", true);

  const supabase = await createClient();
  const { data, error } = await supabase.from("client_requests").insert({
    project_id: parsed.data.projectId,
    created_by: auth.userId,
    request_type: parsed.data.requestType,
    title: parsed.data.title,
    description: parsed.data.description,
  }).select("id").single();
  if (error || !data) back(parsed.data.projectId, error?.message ?? "Could not create request.", true);

  const admin = getSupabaseAdminClient();
  await admin.from("project_activities").insert({
    project_id: parsed.data.projectId,
    event_type: "client_request.created",
    summary: `Client request: ${parsed.data.title}`,
    actor_user_id: auth.userId,
    client_visible: true,
    metadata: { request_id: data.id, request_type: parsed.data.requestType },
  });
  await notifyAdminsOfClientAction(parsed.data.projectId, "New client request", parsed.data.title, `request/${data.id}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  back(parsed.data.projectId, "Request sent.");
}

export async function addClientRequestCommentAction(formData: FormData) {
  const auth = await requireUser("/portal");
  const parsed = z.object({ projectId: z.string().uuid(), requestId: z.string().uuid(), body: z.string().trim().min(1).max(8000) }).safeParse({
    projectId: formData.get("projectId"), requestId: formData.get("requestId"), body: formData.get("body"),
  });
  if (!parsed.success) back(String(formData.get("projectId") ?? ""), "Invalid comment.", true);

  const supabase = await createClient();
  const { data: requestRow } = await supabase.from("client_requests").select("id,project_id,title").eq("id", parsed.data.requestId).eq("project_id", parsed.data.projectId).maybeSingle();
  if (!requestRow) back(parsed.data.projectId, "Request not found.", true);

  const { data, error } = await supabase.from("client_request_comments").insert({ request_id: parsed.data.requestId, author_user_id: auth.userId, body: parsed.data.body, is_internal: false }).select("id").single();
  if (error || !data) back(parsed.data.projectId, error?.message ?? "Could not add comment.", true);

  const admin = getSupabaseAdminClient();
  await admin.from("project_activities").insert({ project_id: parsed.data.projectId, event_type: "client_request.comment", summary: `Client commented on: ${requestRow.title}`, actor_user_id: auth.userId, client_visible: true, metadata: { request_id: parsed.data.requestId, comment_id: data.id } });
  await notifyAdminsOfClientAction(parsed.data.projectId, "Client request comment", requestRow.title, `request-comment/${data.id}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  back(parsed.data.projectId, "Comment added.");
}

export async function decideApprovalAction(formData: FormData) {
  const auth = await requireUser("/portal");
  const parsed = z.object({ projectId: z.string().uuid(), approvalId: z.string().uuid(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(4000) }).safeParse({
    projectId: formData.get("projectId"), approvalId: formData.get("approvalId"), decision: formData.get("decision"), note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) back(String(formData.get("projectId") ?? ""), "Invalid approval decision.", true);

  // Membership is verified with the caller's RLS session before service-role mutation.
  const supabase = await createClient();
  const { data: visible } = await supabase.from("approvals").select("id,title,status").eq("id", parsed.data.approvalId).eq("project_id", parsed.data.projectId).eq("status", "pending").maybeSingle();
  if (!visible) back(parsed.data.projectId, "Approval was not found or is no longer pending.", true);

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("approvals").update({ status: parsed.data.decision, decided_by: auth.userId, decided_at: new Date().toISOString(), decision_note: parsed.data.note || null }).eq("id", parsed.data.approvalId).eq("status", "pending");
  if (error) back(parsed.data.projectId, error.message, true);

  await admin.from("project_activities").insert({ project_id: parsed.data.projectId, event_type: `approval.${parsed.data.decision}`, summary: `${visible.title}: ${parsed.data.decision}`, actor_user_id: auth.userId, client_visible: true, metadata: { approval_id: parsed.data.approvalId, decision: parsed.data.decision } });
  await notifyAdminsOfClientAction(parsed.data.projectId, `Client ${parsed.data.decision} an approval`, visible.title, `approval/${parsed.data.approvalId}/${parsed.data.decision}`);
  revalidatePath(`/portal/projects/${parsed.data.projectId}`);
  back(parsed.data.projectId, `Approval ${parsed.data.decision}.`);
}
