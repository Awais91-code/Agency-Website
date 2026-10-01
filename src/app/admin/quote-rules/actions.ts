"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const ruleSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(2).max(160),
  amountMin: z.coerce.number().int().min(0).max(10_000_000),
  amountMax: z.coerce.number().int().min(0).max(10_000_000),
  multiplier: z.coerce.number().min(0.1).max(10),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
});

export async function updateEstimateRuleAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = ruleSchema.safeParse({
    id: formData.get("id"),
    label: formData.get("label"),
    amountMin: formData.get("amountMin"),
    amountMax: formData.get("amountMax"),
    multiplier: formData.get("multiplier"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    redirect(`/admin/quote-rules?error=${encodeURIComponent(parsed.error.issues.map((issue) => issue.message).join(" "))}`);
  }

  if (parsed.data.amountMax < parsed.data.amountMin) {
    redirect("/admin/quote-rules?error=Maximum%20amount%20must%20be%20greater%20than%20or%20equal%20to%20minimum.");
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("estimate_rules")
    .update({
      label: parsed.data.label,
      amount_min: parsed.data.amountMin,
      amount_max: parsed.data.amountMax,
      multiplier: parsed.data.multiplier,
      currency: parsed.data.currency,
      is_active: formData.get("isActive") === "on",
      updated_by: auth.userId,
    })
    .eq("id", parsed.data.id)
    .select("rule_key")
    .single();

  if (error) redirect(`/admin/quote-rules?error=${encodeURIComponent(error.message)}`);

  await admin.from("activity_events").insert({
    entity_type: "estimate_rule",
    entity_id: parsed.data.id,
    event_type: "estimate_rule.updated",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { ruleKey: data.rule_key },
  });

  revalidatePath("/admin/quote-rules");
  redirect(`/admin/quote-rules?saved=${encodeURIComponent(data.rule_key)}`);
}
