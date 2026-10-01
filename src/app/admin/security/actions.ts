"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function saveRetentionPolicyAction(formData: FormData) {
  const auth = await requireAdmin();

  const parsed = z.object({
    policyKey: z.string().trim().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/),
    retentionDays: z.coerce.number().int().min(1).max(3650),
    notes: z.string().trim().max(2000),
  }).safeParse({
    policyKey: String(formData.get("policyKey") ?? ""),
    retentionDays: String(formData.get("retentionDays") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!parsed.success) {
    redirect(`/admin/security?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid retention policy.")}#retention`);
  }

  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("data_retention_policies")
    .update({
      retention_days: parsed.data.retentionDays,
      enabled: formData.get("enabled") === "on",
      notes: parsed.data.notes,
      updated_by: auth.userId,
    })
    .eq("policy_key", parsed.data.policyKey);

  if (error) {
    redirect(`/admin/security?error=${encodeURIComponent(error.message)}#retention`);
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "security.retention_policy_updated",
    objectType: "data_retention_policy",
    objectId: parsed.data.policyKey,
    metadata: {
      retention_days: parsed.data.retentionDays,
      enabled: formData.get("enabled") === "on",
    },
  });

  revalidatePath("/admin/security");
  redirect("/admin/security?saved=retention#retention");
}
