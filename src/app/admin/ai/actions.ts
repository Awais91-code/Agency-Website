"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export async function saveAiSettingsAction(formData: FormData) {
  const auth = await requireAdmin();

  const parsed = z.object({
    model: z.string().trim().min(3).max(120),
    promptVersion: z.string().trim().min(3).max(120),
    retentionDays: z.coerce.number().int().min(1).max(365),
    maxMessages: z.coerce.number().int().min(3).max(100),
    rateLimit: z.coerce.number().int().min(1).max(200),
    handoffLabel: z.string().trim().min(2).max(120),
    handoffHref: z.string().trim().min(1).max(500),
  }).safeParse({
    model: String(formData.get("model") ?? ""),
    promptVersion: String(formData.get("promptVersion") ?? ""),
    retentionDays: String(formData.get("retentionDays") ?? ""),
    maxMessages: String(formData.get("maxMessages") ?? ""),
    rateLimit: String(formData.get("rateLimit") ?? ""),
    handoffLabel: String(formData.get("handoffLabel") ?? ""),
    handoffHref: String(formData.get("handoffHref") ?? ""),
  });

  if (!parsed.success) {
    redirect(`/admin/ai?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid AI settings.")}`);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("ai_settings")
    .update({
      assistant_enabled: checked(formData, "assistantEnabled"),
      model: parsed.data.model,
      prompt_version: parsed.data.promptVersion,
      logging_enabled: checked(formData, "loggingEnabled"),
      review_enabled: checked(formData, "reviewEnabled"),
      retention_days: parsed.data.retentionDays,
      max_messages_per_conversation: parsed.data.maxMessages,
      rate_limit_per_10m: parsed.data.rateLimit,
      handoff_label: parsed.data.handoffLabel,
      handoff_href: parsed.data.handoffHref,
      updated_by: auth.userId,
    })
    .eq("id", "default");

  if (error) redirect(`/admin/ai?error=${encodeURIComponent(error.message)}`);

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "ai.settings.updated",
    objectType: "ai_settings",
    objectId: "default",
    metadata: {
      prompt_version: parsed.data.promptVersion,
      model: parsed.data.model,
    },
  });

  revalidatePath("/admin/ai");
  redirect("/admin/ai?saved=settings");
}

export async function saveAiKnowledgeAction(formData: FormData) {
  const auth = await requireAdmin();

  const parsed = z.object({
    id: z.union([z.string().uuid(), z.literal("")]),
    knowledgeKey: z.string().trim().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/),
    category: z.string().trim().min(2).max(80),
    title: z.string().trim().min(2).max(200),
    content: z.string().trim().min(10).max(12000),
    href: z.string().trim().max(500),
    sortOrder: z.coerce.number().int().min(-10000).max(10000),
  }).safeParse({
    id: String(formData.get("id") ?? ""),
    knowledgeKey: String(formData.get("knowledgeKey") ?? ""),
    category: String(formData.get("category") ?? ""),
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    href: String(formData.get("href") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "100"),
  });

  if (!parsed.success) {
    redirect(`/admin/ai?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid knowledge item.")}#knowledge`);
  }

  const admin = getSupabaseAdminClient();
  const payload = {
    knowledge_key: parsed.data.knowledgeKey,
    category: parsed.data.category,
    title: parsed.data.title,
    content: parsed.data.content,
    href: parsed.data.href || null,
    is_approved: checked(formData, "isApproved"),
    sort_order: parsed.data.sortOrder,
    updated_by: auth.userId,
  };

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin
      .from("ai_knowledge_items")
      .update(payload)
      .eq("id", id);

    if (error) redirect(`/admin/ai?error=${encodeURIComponent(error.message)}#knowledge`);
  } else {
    const { data, error } = await admin
      .from("ai_knowledge_items")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) {
      redirect(`/admin/ai?error=${encodeURIComponent(error?.message ?? "Could not create knowledge item.")}#knowledge`);
    }

    id = data.id;
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "ai.knowledge.saved",
    objectType: "ai_knowledge_item",
    objectId: id,
    metadata: {
      knowledge_key: parsed.data.knowledgeKey,
      approved: checked(formData, "isApproved"),
    },
  });

  revalidatePath("/admin/ai");
  redirect("/admin/ai?saved=knowledge#knowledge");
}

export async function closeAiConversationAction(formData: FormData) {
  const auth = await requireAdmin();
  const id = String(formData.get("id") ?? "");

  if (!z.string().uuid().safeParse(id).success) {
    redirect("/admin/ai?error=Invalid%20conversation");
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("ai_conversations")
    .update({ status: "closed" })
    .eq("id", id);

  if (error) redirect(`/admin/ai?error=${encodeURIComponent(error.message)}`);

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "ai.conversation.closed",
    objectType: "ai_conversation",
    objectId: id,
  });

  revalidatePath("/admin/ai");
  redirect("/admin/ai?saved=conversation");
}
