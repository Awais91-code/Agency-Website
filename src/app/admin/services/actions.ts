"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

const serviceSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  title: z.string().trim().min(1).max(120),
  eyebrow: z.string().trim().max(80).optional(),
  shortDescription: z.string().trim().min(20).max(320),
  heroTitle: z.string().trim().min(1).max(180),
  heroDescription: z.string().trim().min(20).max(600),
  pricingNote: z.string().trim().max(1200).optional(),
  ctaLabel: z.string().trim().min(2).max(80),
  ctaHref: z.string().trim().min(1).max(500),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
  heroMediaId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
});

function cleanLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parsePairs(value: FormDataEntryValue | null) {
  return cleanLines(value).flatMap((line) => {
    const separatorIndex = line.indexOf("|");
    if (separatorIndex < 1) return [];
    const title = line.slice(0, separatorIndex).trim();
    const description = line.slice(separatorIndex + 1).trim();
    return title && description ? [{ title, description }] : [];
  });
}

function parseFaqs(value: FormDataEntryValue | null) {
  return parsePairs(value).map((item, index) => ({
    question: item.title,
    answer: item.description,
    sort_order: (index + 1) * 10,
    visible: true,
  }));
}

function optional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

export async function saveServiceAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = serviceSchema.safeParse({
    id: optional(formData.get("id")),
    slug: formData.get("slug"),
    title: formData.get("title"),
    eyebrow: optional(formData.get("eyebrow")),
    shortDescription: formData.get("shortDescription"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
    pricingNote: optional(formData.get("pricingNote")),
    ctaLabel: formData.get("ctaLabel"),
    ctaHref: formData.get("ctaHref"),
    seoTitle: optional(formData.get("seoTitle")),
    seoDescription: optional(formData.get("seoDescription")),
    heroMediaId: optional(formData.get("heroMediaId")),
    sortOrder: formData.get("sortOrder"),
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join(" ");
    const rawId = optional(formData.get("id"));
    redirect(rawId ? `/admin/services/${rawId}?error=${encodeURIComponent(message)}` : `/admin/services/new?error=${encodeURIComponent(message)}`);
  }

  const admin = getSupabaseAdminClient();
  const intent = String(formData.get("intent") ?? "save");
  const currentStatus = String(formData.get("currentStatus") ?? "draft") as "draft" | "published" | "archived";
  const nextStatus = intent === "publish" ? "published" : intent === "draft" ? "draft" : currentStatus;
  const now = new Date().toISOString();

  const payload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    eyebrow: parsed.data.eyebrow ?? null,
    short_description: parsed.data.shortDescription,
    hero_title: parsed.data.heroTitle,
    hero_description: parsed.data.heroDescription,
    problems: cleanLines(formData.get("problems")),
    deliverables: cleanLines(formData.get("deliverables")),
    outcomes: cleanLines(formData.get("outcomes")),
    process_steps: parsePairs(formData.get("processSteps")) as Json,
    technologies: cleanLines(formData.get("technologies")),
    pricing_note: parsed.data.pricingNote ?? null,
    cta_label: parsed.data.ctaLabel,
    cta_href: parsed.data.ctaHref,
    seo_title: parsed.data.seoTitle ?? null,
    seo_description: parsed.data.seoDescription ?? null,
    hero_media_id: parsed.data.heroMediaId ?? null,
    related_case_study_slugs: cleanLines(formData.get("relatedCaseStudySlugs")),
    status: nextStatus,
    is_featured: formData.get("isFeatured") === "on",
    sort_order: parsed.data.sortOrder,
    published_at: nextStatus === "published" ? now : null,
    updated_by: auth.userId,
  } as const;

  let serviceId = parsed.data.id;

  if (serviceId) {
    const { error } = await admin.from("services").update(payload).eq("id", serviceId);
    if (error) redirect(`/admin/services/${serviceId}?error=${encodeURIComponent(error.message)}`);
  } else {
    const { data, error } = await admin
      .from("services")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) redirect(`/admin/services/new?error=${encodeURIComponent(error?.message ?? "Could not create service.")}`);
    serviceId = data.id;
  }

  if (!serviceId) {
    redirect("/admin/services?error=Service%20could%20not%20be%20resolved");
  }

  const resolvedServiceId = serviceId;
  const faqRows = parseFaqs(formData.get("faqs")).map((faq) => ({ ...faq, service_id: resolvedServiceId }));
  const relatedIds = formData
    .getAll("relatedServiceIds")
    .map(String)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id) && id !== resolvedServiceId);

  const { error: deleteFaqError } = await admin.from("service_faqs").delete().eq("service_id", resolvedServiceId);
  if (deleteFaqError) redirect(`/admin/services/${resolvedServiceId}?error=${encodeURIComponent(deleteFaqError.message)}`);
  if (faqRows.length) {
    const { error } = await admin.from("service_faqs").insert(faqRows);
    if (error) redirect(`/admin/services/${resolvedServiceId}?error=${encodeURIComponent(error.message)}`);
  }

  const { error: deleteRelationError } = await admin.from("service_relations").delete().eq("service_id", resolvedServiceId);
  if (deleteRelationError) redirect(`/admin/services/${resolvedServiceId}?error=${encodeURIComponent(deleteRelationError.message)}`);
  if (relatedIds.length) {
    const { error } = await admin.from("service_relations").insert(
      relatedIds.map((relatedServiceId, index) => ({
        service_id: resolvedServiceId,
        related_service_id: relatedServiceId,
        sort_order: (index + 1) * 10,
      })),
    );
    if (error) redirect(`/admin/services/${resolvedServiceId}?error=${encodeURIComponent(error.message)}`);
  }

  await admin.from("activity_events").insert({
    entity_type: "service",
    entity_id: resolvedServiceId,
    event_type: nextStatus === "published" ? "service.published" : "service.saved",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { slug: parsed.data.slug, status: nextStatus },
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: nextStatus === "published" ? "service.published" : "service.saved",
    objectType: "service",
    objectId: resolvedServiceId,
    metadata: { slug: parsed.data.slug, status: nextStatus },
  });

  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath(`/services/${parsed.data.slug}`);
  revalidatePath("/admin/services");
  redirect(`/admin/services/${resolvedServiceId}?saved=1`);
}

export async function archiveServiceAction(formData: FormData) {
  const auth = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/services?error=Invalid%20service%20id");

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("services")
    .update({ status: "archived", archived_at: new Date().toISOString(), updated_by: auth.userId })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) redirect(`/admin/services?error=${encodeURIComponent(error.message)}`);

  await admin.from("activity_events").insert({
    entity_type: "service",
    entity_id: id,
    event_type: "service.archived",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { slug: data.slug },
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "service.archived",
    objectType: "service",
    objectId: id,
    metadata: { slug: data.slug },
  });

  revalidatePath("/");
  revalidatePath("/services");
  revalidatePath(`/services/${data.slug}`);
  revalidatePath("/admin/services");
  redirect("/admin/services?archived=1");
}
