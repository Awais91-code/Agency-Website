"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const schema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens."),
  title: z.string().trim().min(1).max(140),
  projectLabel: z.string().trim().min(2).max(80),
  clientName: z.string().trim().max(160).optional(),
  industry: z.string().trim().max(140).optional(),
  shortDescription: z.string().trim().min(20).max(360),
  heroTitle: z.string().trim().min(1).max(180),
  heroDescription: z.string().trim().min(20).max(700),
  problem: z.string().trim().min(20).max(6000),
  approach: z.string().trim().min(20).max(6000),
  solution: z.string().trim().min(20).max(6000),
  resultSummary: z.string().trim().min(20).max(4000),
  testimonialQuote: z.string().trim().max(3000).optional(),
  testimonialAttribution: z.string().trim().max(240).optional(),
  ctaLabel: z.string().trim().min(2).max(80),
  ctaHref: z.string().trim().min(1).max(500),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(180).optional(),
  heroMediaId: z.string().uuid().optional(),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
});

function optional(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim();
  return normalized || undefined;
}

function cleanLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseApprovedMetrics(value: FormDataEntryValue | null) {
  return cleanLines(value).flatMap((line, index) => {
    const [rawValue, rawLabel, ...contextParts] = line.split("|");
    const metricValue = rawValue?.trim();
    const label = rawLabel?.trim();
    const context = contextParts.join("|").trim();
    if (!metricValue || !label) return [];
    return [{
      value: metricValue.slice(0, 80),
      label: label.slice(0, 140),
      context: context ? context.slice(0, 500) : null,
      is_approved: true,
      sort_order: (index + 1) * 10,
    }];
  });
}

export async function saveCaseStudyAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = schema.safeParse({
    id: optional(formData.get("id")),
    slug: formData.get("slug"),
    title: formData.get("title"),
    projectLabel: formData.get("projectLabel"),
    clientName: optional(formData.get("clientName")),
    industry: optional(formData.get("industry")),
    shortDescription: formData.get("shortDescription"),
    heroTitle: formData.get("heroTitle"),
    heroDescription: formData.get("heroDescription"),
    problem: formData.get("problem"),
    approach: formData.get("approach"),
    solution: formData.get("solution"),
    resultSummary: formData.get("resultSummary"),
    testimonialQuote: optional(formData.get("testimonialQuote")),
    testimonialAttribution: optional(formData.get("testimonialAttribution")),
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
    redirect(rawId ? `/admin/case-studies/${rawId}?error=${encodeURIComponent(message)}` : `/admin/case-studies/new?error=${encodeURIComponent(message)}`);
  }

  const admin = getSupabaseAdminClient();
  const intent = String(formData.get("intent") ?? "save");
  const currentStatus = String(formData.get("currentStatus") ?? "draft") as "draft" | "published" | "archived";
  const nextStatus = intent === "publish" ? "published" : intent === "draft" ? "draft" : currentStatus;
  const now = new Date().toISOString();
  const testimonialApproved = formData.get("testimonialApproved") === "on" && Boolean(parsed.data.testimonialQuote);

  const payload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    project_label: parsed.data.projectLabel,
    client_name: parsed.data.clientName ?? null,
    industry: parsed.data.industry ?? null,
    short_description: parsed.data.shortDescription,
    hero_title: parsed.data.heroTitle,
    hero_description: parsed.data.heroDescription,
    problem: parsed.data.problem,
    approach: parsed.data.approach,
    solution: parsed.data.solution,
    result_summary: parsed.data.resultSummary,
    technologies: cleanLines(formData.get("technologies")),
    tags: cleanLines(formData.get("tags")),
    testimonial_quote: parsed.data.testimonialQuote ?? null,
    testimonial_attribution: parsed.data.testimonialAttribution ?? null,
    testimonial_approved: testimonialApproved,
    cta_label: parsed.data.ctaLabel,
    cta_href: parsed.data.ctaHref,
    seo_title: parsed.data.seoTitle ?? null,
    seo_description: parsed.data.seoDescription ?? null,
    hero_media_id: parsed.data.heroMediaId ?? null,
    status: nextStatus,
    is_featured: formData.get("isFeatured") === "on",
    sort_order: parsed.data.sortOrder,
    published_at: nextStatus === "published" ? now : null,
    updated_by: auth.userId,
  } as const;

  let caseStudyId = parsed.data.id;

  if (caseStudyId) {
    const { error } = await admin.from("case_studies").update(payload).eq("id", caseStudyId);
    if (error) redirect(`/admin/case-studies/${caseStudyId}?error=${encodeURIComponent(error.message)}`);
  } else {
    const { data, error } = await admin
      .from("case_studies")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) redirect(`/admin/case-studies/new?error=${encodeURIComponent(error?.message ?? "Could not create case study.")}`);
    caseStudyId = data.id;
  }

  if (!caseStudyId) redirect("/admin/case-studies?error=Case%20study%20could%20not%20be%20resolved");

  const resolvedId = caseStudyId;
  const serviceIds = formData
    .getAll("serviceIds")
    .map(String)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id));

  const galleryIds = formData
    .getAll("galleryMediaIds")
    .map(String)
    .filter((id) => /^[0-9a-f-]{36}$/i.test(id) && id !== parsed.data.heroMediaId);

  const metrics = parseApprovedMetrics(formData.get("approvedMetrics")).map((metric) => ({
    ...metric,
    case_study_id: resolvedId,
  }));

  const deleteResults = await Promise.all([
    admin.from("case_study_services").delete().eq("case_study_id", resolvedId),
    admin.from("case_study_media").delete().eq("case_study_id", resolvedId),
    admin.from("case_study_metrics").delete().eq("case_study_id", resolvedId),
  ]);

  const deleteError = deleteResults.find((result) => result.error)?.error;
  if (deleteError) redirect(`/admin/case-studies/${resolvedId}?error=${encodeURIComponent(deleteError.message)}`);

  const inserts = [];
  if (serviceIds.length) {
    inserts.push(admin.from("case_study_services").insert(serviceIds.map((serviceId, index) => ({
      case_study_id: resolvedId,
      service_id: serviceId,
      sort_order: (index + 1) * 10,
    }))));
  }
  if (galleryIds.length) {
    inserts.push(admin.from("case_study_media").insert(galleryIds.map((mediaAssetId, index) => ({
      case_study_id: resolvedId,
      media_asset_id: mediaAssetId,
      sort_order: (index + 1) * 10,
      visible: true,
    }))));
  }
  if (metrics.length) {
    inserts.push(admin.from("case_study_metrics").insert(metrics));
  }

  if (inserts.length) {
    const results = await Promise.all(inserts);
    const relationError = results.find((result) => result.error)?.error;
    if (relationError) redirect(`/admin/case-studies/${resolvedId}?error=${encodeURIComponent(relationError.message)}`);
  }

  await admin.from("activity_events").insert({
    entity_type: "case_study",
    entity_id: resolvedId,
    event_type: nextStatus === "published" ? "case_study.published" : "case_study.saved",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { slug: parsed.data.slug, status: nextStatus },
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: nextStatus === "published" ? "case_study.published" : "case_study.saved",
    objectType: "case_study",
    objectId: resolvedId,
    metadata: { slug: parsed.data.slug, status: nextStatus },
  });

  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${parsed.data.slug}`);
  revalidatePath("/admin/case-studies");
  revalidatePath("/services");
  redirect(`/admin/case-studies/${resolvedId}?saved=1`);
}

export async function archiveCaseStudyAction(formData: FormData) {
  const auth = await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(id).success) redirect("/admin/case-studies?error=Invalid%20case%20study%20id");

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("case_studies")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      updated_by: auth.userId,
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) redirect(`/admin/case-studies?error=${encodeURIComponent(error.message)}`);

  await admin.from("activity_events").insert({
    entity_type: "case_study",
    entity_id: id,
    event_type: "case_study.archived",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: { slug: data.slug },
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "case_study.archived",
    objectType: "case_study",
    objectId: id,
    metadata: { slug: data.slug },
  });

  revalidatePath("/");
  revalidatePath("/work");
  revalidatePath(`/work/${data.slug}`);
  revalidatePath("/admin/case-studies");
  redirect("/admin/case-studies?archived=1");
}
