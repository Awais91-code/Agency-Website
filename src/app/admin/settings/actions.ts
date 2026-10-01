"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const fields = [
  ["agency.name", "agencyName"],
  ["agency.description", "agencyDescription"],
  ["contact.email", "email"],
  ["contact.phone", "phone"],
  ["contact.location", "location"],
  ["social.linkedin", "linkedin"],
  ["social.github", "github"],
  ["cta.primary_label", "primaryCtaLabel"],
  ["cta.primary_href", "primaryCtaHref"],
  ["seo.default_title", "seoTitle"],
  ["seo.default_description", "seoDescription"],
] as const;

export async function saveSiteSettingsAction(formData: FormData) {
  const auth = await requireAdmin();

  const parsed = z.object({
    agencyName: z.string().trim().min(2).max(120),
    agencyDescription: z.string().trim().min(10).max(600),
    email: z.email(),
    phone: z.string().trim().max(80),
    location: z.string().trim().max(200),
    linkedin: z.union([z.literal(""), z.url()]),
    github: z.union([z.literal(""), z.url()]),
    primaryCtaLabel: z.string().trim().min(2).max(100),
    primaryCtaHref: z.string().trim().min(1).max(500),
    seoTitle: z.string().trim().min(2).max(120),
    seoDescription: z.string().trim().min(10).max(320),
  }).safeParse({
    agencyName: String(formData.get("agencyName") ?? ""),
    agencyDescription: String(formData.get("agencyDescription") ?? ""),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    phone: String(formData.get("phone") ?? ""),
    location: String(formData.get("location") ?? ""),
    linkedin: String(formData.get("linkedin") ?? ""),
    github: String(formData.get("github") ?? ""),
    primaryCtaLabel: String(formData.get("primaryCtaLabel") ?? ""),
    primaryCtaHref: String(formData.get("primaryCtaHref") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  });

  if (!parsed.success) {
    redirect(`/admin/settings?error=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Invalid settings.")}`);
  }

  const admin = getSupabaseAdminClient();
  const rows = fields.map(([key, field]) => ({
    key,
    value: parsed.data[field],
    updated_by: auth.userId,
  }));

  for (const row of rows) {
    const { error } = await admin
      .from("site_settings")
      .update({ value: row.value, updated_by: row.updated_by })
      .eq("key", row.key);

    if (error) redirect(`/admin/settings?error=${encodeURIComponent(error.message)}`);
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "site_settings.updated",
    objectType: "site_settings",
    objectId: "global",
    metadata: { keys: fields.map(([key]) => key) },
  });

  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
