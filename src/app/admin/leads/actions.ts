"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { leadPriorities, leadStatuses } from "@/features/leads/constants";
import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const uuid = z.string().uuid();
const statusSchema = z.enum(leadStatuses);
const prioritySchema = z.enum(leadPriorities);

function clean(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function safeReturnTo(formData: FormData, fallback: string) {
  const value = String(formData.get("returnTo") ?? "");
  return value.startsWith("/admin/") ? value : fallback;
}

async function appendActivity(
  leadId: string,
  eventType: string,
  actorUserId: string,
  metadata: Record<string, string | number | boolean | null | string[]>,
) {
  const admin = getSupabaseAdminClient();
  await admin.from("activity_events").insert({
    entity_type: "lead",
    entity_id: leadId,
    event_type: eventType,
    actor_user_id: actorUserId,
    source: "admin",
    metadata,
  });
}

function refreshLead(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/leads/${id}`);
}

export async function updateLeadAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuid,
    priority: prioritySchema,
    ownerUserId: z.union([uuid, z.literal("")]).optional(),
    nextAction: z.string().trim().max(500).optional(),
    nextActionAt: z.string().trim().max(64).optional(),
    lostReason: z.string().trim().max(1000).optional(),
  }).safeParse({
    id: formData.get("id"),
    priority: formData.get("priority"),
    ownerUserId: String(formData.get("ownerUserId") ?? ""),
    nextAction: String(formData.get("nextAction") ?? ""),
    nextActionAt: String(formData.get("nextActionAt") ?? ""),
    lostReason: String(formData.get("lostReason") ?? ""),
  });

  const returnTo = safeReturnTo(formData, "/admin/leads");
  if (!parsed.success) {
    redirect(`${returnTo}?error=${encodeURIComponent(parsed.error.issues.map((issue) => issue.message).join(" "))}`);
  }

  const nextActionAt = parsed.data.nextActionAt
    ? new Date(parsed.data.nextActionAt).toISOString()
    : null;

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("leads").update({
    priority: parsed.data.priority,
    owner_user_id: parsed.data.ownerUserId || null,
    next_action: parsed.data.nextAction || null,
    next_action_at: nextActionAt,
    lost_reason: parsed.data.lostReason || null,
  }).eq("id", parsed.data.id);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

  await appendActivity(parsed.data.id, "lead.updated", auth.userId, {
    priority: parsed.data.priority,
    owner_user_id: parsed.data.ownerUserId || null,
    next_action: parsed.data.nextAction || null,
  });

  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=lead`);
}

export async function changeLeadStatusAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuid,
    status: statusSchema,
    reason: z.string().trim().max(1000).optional(),
  }).safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    reason: String(formData.get("reason") ?? ""),
  });

  const returnTo = safeReturnTo(formData, "/admin/leads");
  if (!parsed.success) redirect(`${returnTo}?error=Invalid%20lead%20status`);

  const admin = getSupabaseAdminClient();
  const { data: current, error: currentError } = await admin
    .from("leads")
    .select("status")
    .eq("id", parsed.data.id)
    .single();

  if (currentError) redirect(`${returnTo}?error=${encodeURIComponent(currentError.message)}`);

  if (current.status !== parsed.data.status) {
    const { error } = await admin.from("leads").update({
      status: parsed.data.status,
      last_contacted_at:
        parsed.data.status === "contacted" || parsed.data.status === "consultation_booked"
          ? new Date().toISOString()
          : undefined,
    }).eq("id", parsed.data.id);

    if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);

    const { error: historyError } = await admin.from("lead_stage_history").insert({
      lead_id: parsed.data.id,
      from_status: current.status,
      to_status: parsed.data.status,
      changed_by: auth.userId,
      reason: parsed.data.reason || null,
    });
    if (historyError) redirect(`${returnTo}?error=${encodeURIComponent(historyError.message)}`);

    await appendActivity(parsed.data.id, "lead.status_changed", auth.userId, {
      from: current.status,
      to: parsed.data.status,
      reason: parsed.data.reason || null,
    });
  }

  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=status`);
}

export async function addLeadNoteAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuid,
    body: z.string().trim().min(1).max(6000),
  }).safeParse({
    id: formData.get("id"),
    body: formData.get("body"),
  });
  const returnTo = safeReturnTo(formData, "/admin/leads");

  if (!parsed.success) redirect(`${returnTo}?error=Note%20cannot%20be%20empty`);

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("lead_notes").insert({
    lead_id: parsed.data.id,
    author_user_id: auth.userId,
    body: parsed.data.body,
  }).select("id").single();

  if (error || !data) redirect(`${returnTo}?error=${encodeURIComponent(error?.message ?? "Could not save note.")}`);

  await appendActivity(parsed.data.id, "lead.note_added", auth.userId, { note_id: data.id });
  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=note`);
}

export async function addLeadTaskAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuid,
    title: z.string().trim().min(1).max(300),
    assignedTo: z.union([uuid, z.literal("")]).optional(),
    dueAt: z.string().trim().max(64).optional(),
  }).safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    assignedTo: String(formData.get("assignedTo") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
  });
  const returnTo = safeReturnTo(formData, "/admin/leads");

  if (!parsed.success) redirect(`${returnTo}?error=Invalid%20follow-up%20task`);

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("lead_tasks").insert({
    lead_id: parsed.data.id,
    title: parsed.data.title,
    assigned_to: parsed.data.assignedTo || null,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
    created_by: auth.userId,
  }).select("id").single();

  if (error || !data) redirect(`${returnTo}?error=${encodeURIComponent(error?.message ?? "Could not create task.")}`);

  await appendActivity(parsed.data.id, "lead.task_created", auth.userId, {
    task_id: data.id,
    title: parsed.data.title,
  });
  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=task`);
}

export async function completeLeadTaskAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({ id: uuid, taskId: uuid }).safeParse({
    id: formData.get("id"),
    taskId: formData.get("taskId"),
  });
  const returnTo = safeReturnTo(formData, "/admin/leads");
  if (!parsed.success) redirect(`${returnTo}?error=Invalid%20task`);

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("lead_tasks").update({
    completed_at: new Date().toISOString(),
    completed_by: auth.userId,
  }).eq("id", parsed.data.taskId).eq("lead_id", parsed.data.id);

  if (error) redirect(`${returnTo}?error=${encodeURIComponent(error.message)}`);
  await appendActivity(parsed.data.id, "lead.task_completed", auth.userId, { task_id: parsed.data.taskId });
  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=task`);
}

export async function updateLeadTagsAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuid,
    tags: z.string().max(1000),
  }).safeParse({
    id: formData.get("id"),
    tags: String(formData.get("tags") ?? ""),
  });
  const returnTo = safeReturnTo(formData, "/admin/leads");
  if (!parsed.success) redirect(`${returnTo}?error=Invalid%20tags`);

  const names = [...new Set(parsed.data.tags
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.slice(0, 60))
  )].slice(0, 20);

  const admin = getSupabaseAdminClient();
  const tagIds: string[] = [];

  for (const name of names) {
    const normalized = name.toLowerCase();
    const { data: existing, error: lookupError } = await admin
      .from("lead_tags")
      .select("id")
      .eq("normalized_name", normalized)
      .maybeSingle();
    if (lookupError) redirect(`${returnTo}?error=${encodeURIComponent(lookupError.message)}`);

    if (existing?.id) {
      tagIds.push(existing.id);
      continue;
    }

    const { data: created, error: createError } = await admin
      .from("lead_tags")
      .insert({ name, created_by: auth.userId })
      .select("id")
      .single();
    if (createError || !created) redirect(`${returnTo}?error=${encodeURIComponent(createError?.message ?? "Could not create tag.")}`);
    tagIds.push(created.id);
  }

  const { error: deleteError } = await admin.from("lead_tag_links").delete().eq("lead_id", parsed.data.id);
  if (deleteError) redirect(`${returnTo}?error=${encodeURIComponent(deleteError.message)}`);

  if (tagIds.length) {
    const { error: linkError } = await admin.from("lead_tag_links").insert(
      tagIds.map((tagId) => ({ lead_id: parsed.data.id, tag_id: tagId, created_by: auth.userId })),
    );
    if (linkError) redirect(`${returnTo}?error=${encodeURIComponent(linkError.message)}`);
  }

  await appendActivity(parsed.data.id, "lead.tags_updated", auth.userId, { tags: names });
  refreshLead(parsed.data.id);
  redirect(`${returnTo}?saved=tags`);
}

export async function archiveLeadAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({ id: uuid, archive: z.enum(["yes", "no"]) }).safeParse({
    id: formData.get("id"),
    archive: formData.get("archive"),
  });
  if (!parsed.success) redirect("/admin/leads?error=Invalid%20lead");

  const admin = getSupabaseAdminClient();
  const archivedAt = parsed.data.archive === "yes" ? new Date().toISOString() : null;
  const { error } = await admin.from("leads").update({ archived_at: archivedAt }).eq("id", parsed.data.id);
  if (error) redirect(`/admin/leads?error=${encodeURIComponent(error.message)}`);

  await appendActivity(
    parsed.data.id,
    parsed.data.archive === "yes" ? "lead.archived" : "lead.restored",
    auth.userId,
    {},
  );
  refreshLead(parsed.data.id);
  redirect("/admin/leads");
}

export async function mergeLeadAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    sourceId: uuid,
    targetId: uuid,
  }).safeParse({
    sourceId: formData.get("sourceId"),
    targetId: formData.get("targetId"),
  });
  if (!parsed.success) redirect("/admin/leads?error=Invalid%20merge%20request");

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.rpc("merge_leads", {
    p_source_id: parsed.data.sourceId,
    p_target_id: parsed.data.targetId,
    p_actor_id: auth.userId,
  });

  if (error) redirect(`/admin/leads/${parsed.data.targetId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/admin/leads");
  revalidatePath("/admin/pipeline");
  revalidatePath(`/admin/leads/${parsed.data.sourceId}`);
  revalidatePath(`/admin/leads/${parsed.data.targetId}`);
  redirect(`/admin/leads/${parsed.data.targetId}?saved=merged`);
}
