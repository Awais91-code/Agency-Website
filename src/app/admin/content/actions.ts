"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const statusSchema = z.enum(["draft", "published", "archived"]);
const uuidOrEmpty = z.union([z.string().uuid(), z.literal("")]);

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optional(value: string) {
  return value || null;
}

function returnWithError(anchor: string, message: string): never {
  redirect(`/admin/content?error=${encodeURIComponent(message)}#${anchor}`);
}

async function audit(actorUserId: string, action: string, objectType: string, objectId: string, metadata: Record<string, string | number | boolean | null> = {}) {
  await recordAuditLog({
    actorUserId,
    action,
    objectType,
    objectId,
    metadata,
  });
}

function refreshContent() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin");
  revalidatePath("/admin/content");
}

export async function saveContentSectionAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: z.string().uuid(),
    eyebrow: z.string().max(120),
    title: z.string().min(2).max(220),
    body: z.string().max(12000),
    ctaLabel: z.string().max(120),
    ctaHref: z.string().max(500),
    status: statusSchema,
  }).safeParse({
    id: value(formData, "id"),
    eyebrow: value(formData, "eyebrow"),
    title: value(formData, "title"),
    body: value(formData, "body"),
    ctaLabel: value(formData, "ctaLabel"),
    ctaHref: value(formData, "ctaHref"),
    status: value(formData, "status"),
  });

  if (!parsed.success) returnWithError("sections", parsed.error.issues[0]?.message ?? "Invalid content section.");

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("content_sections")
    .update({
      eyebrow: optional(parsed.data.eyebrow),
      title: parsed.data.title,
      body: parsed.data.body,
      cta_label: optional(parsed.data.ctaLabel),
      cta_href: optional(parsed.data.ctaHref),
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? now : null,
      updated_by: auth.userId,
    })
    .eq("id", parsed.data.id)
    .select("section_key")
    .single();

  if (error || !data) returnWithError("sections", error?.message ?? "Could not save section.");

  await audit(auth.userId, `content_section.${parsed.data.status}`, "content_section", parsed.data.id, { section_key: data.section_key });
  refreshContent();
  redirect(`/admin/content?saved=section#sections`);
}

export async function saveTestimonialAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuidOrEmpty,
    clientName: z.string().min(2).max(160),
    companyName: z.string().max(200),
    roleTitle: z.string().max(200),
    quote: z.string().min(10).max(4000),
    caseStudyId: uuidOrEmpty,
    mediaAssetId: uuidOrEmpty,
    status: statusSchema,
    sortOrder: z.coerce.number().int().min(-10000).max(10000),
  }).safeParse({
    id: value(formData, "id"),
    clientName: value(formData, "clientName"),
    companyName: value(formData, "companyName"),
    roleTitle: value(formData, "roleTitle"),
    quote: value(formData, "quote"),
    caseStudyId: value(formData, "caseStudyId"),
    mediaAssetId: value(formData, "mediaAssetId"),
    status: value(formData, "status"),
    sortOrder: value(formData, "sortOrder"),
  });

  if (!parsed.success) returnWithError("testimonials", parsed.error.issues[0]?.message ?? "Invalid testimonial.");

  const permissionGranted = formData.get("permissionGranted") === "on";
  if (parsed.data.status === "published" && !permissionGranted) {
    returnWithError("testimonials", "A testimonial cannot be published until public permission is confirmed.");
  }

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = {
    client_name: parsed.data.clientName,
    company_name: optional(parsed.data.companyName),
    role_title: optional(parsed.data.roleTitle),
    quote: parsed.data.quote,
    permission_granted: permissionGranted,
    case_study_id: parsed.data.caseStudyId || null,
    media_asset_id: parsed.data.mediaAssetId || null,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder,
    published_at: parsed.data.status === "published" ? now : null,
    updated_by: auth.userId,
  } as const;

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin.from("testimonials").update(payload).eq("id", id);
    if (error) returnWithError("testimonials", error.message);
  } else {
    const { data, error } = await admin.from("testimonials").insert({ ...payload, created_by: auth.userId }).select("id").single();
    if (error || !data) returnWithError("testimonials", error?.message ?? "Could not create testimonial.");
    id = data.id;
  }

  await audit(auth.userId, `testimonial.${parsed.data.status}`, "testimonial", id, { permission_granted: permissionGranted });
  refreshContent();
  redirect(`/admin/content?saved=testimonial#testimonials`);
}

export async function archiveTestimonialAction(formData: FormData) {
  const auth = await requireStaff();
  const id = value(formData, "id");
  if (!z.string().uuid().safeParse(id).success) returnWithError("testimonials", "Invalid testimonial.");

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("testimonials").update({
    status: "archived",
    archived_at: new Date().toISOString(),
    updated_by: auth.userId,
  }).eq("id", id);

  if (error) returnWithError("testimonials", error.message);
  await audit(auth.userId, "testimonial.archived", "testimonial", id);
  refreshContent();
  redirect("/admin/content?saved=testimonial-archived#testimonials");
}

export async function saveFaqAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuidOrEmpty,
    category: z.string().min(2).max(80),
    question: z.string().min(4).max(280),
    answer: z.string().min(10).max(5000),
    status: statusSchema,
    sortOrder: z.coerce.number().int().min(-10000).max(10000),
  }).safeParse({
    id: value(formData, "id"),
    category: value(formData, "category"),
    question: value(formData, "question"),
    answer: value(formData, "answer"),
    status: value(formData, "status"),
    sortOrder: value(formData, "sortOrder"),
  });

  if (!parsed.success) returnWithError("faqs", parsed.error.issues[0]?.message ?? "Invalid FAQ.");

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = {
    category: parsed.data.category,
    question: parsed.data.question,
    answer: parsed.data.answer,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder,
    published_at: parsed.data.status === "published" ? now : null,
    updated_by: auth.userId,
  } as const;

  let id = parsed.data.id;
  if (id) {
    const { error } = await admin.from("faqs").update(payload).eq("id", id);
    if (error) returnWithError("faqs", error.message);
  } else {
    const { data, error } = await admin.from("faqs").insert({ ...payload, created_by: auth.userId }).select("id").single();
    if (error || !data) returnWithError("faqs", error?.message ?? "Could not create FAQ.");
    id = data.id;
  }

  await audit(auth.userId, `faq.${parsed.data.status}`, "faq", id, { category: parsed.data.category });
  refreshContent();
  redirect("/admin/content?saved=faq#faqs");
}

export async function archiveFaqAction(formData: FormData) {
  const auth = await requireStaff();
  const id = value(formData, "id");
  if (!z.string().uuid().safeParse(id).success) returnWithError("faqs", "Invalid FAQ.");

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("faqs").update({
    status: "archived",
    archived_at: new Date().toISOString(),
    updated_by: auth.userId,
  }).eq("id", id);

  if (error) returnWithError("faqs", error.message);
  await audit(auth.userId, "faq.archived", "faq", id);
  refreshContent();
  redirect("/admin/content?saved=faq-archived#faqs");
}

export async function saveTeamMemberAction(formData: FormData) {
  const auth = await requireStaff();
  const parsed = z.object({
    id: uuidOrEmpty,
    displayName: z.string().min(2).max(160),
    roleTitle: z.string().min(2).max(180),
    bio: z.string().max(5000),
    publicEmail: z.union([z.literal(""), z.email()]),
    linkedinUrl: z.union([z.literal(""), z.url()]),
    mediaAssetId: uuidOrEmpty,
    status: statusSchema,
    sortOrder: z.coerce.number().int().min(-10000).max(10000),
  }).safeParse({
    id: value(formData, "id"),
    displayName: value(formData, "displayName"),
    roleTitle: value(formData, "roleTitle"),
    bio: value(formData, "bio"),
    publicEmail: value(formData, "publicEmail"),
    linkedinUrl: value(formData, "linkedinUrl"),
    mediaAssetId: value(formData, "mediaAssetId"),
    status: value(formData, "status"),
    sortOrder: value(formData, "sortOrder"),
  });

  if (!parsed.success) returnWithError("team", parsed.error.issues[0]?.message ?? "Invalid team member.");

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const payload = {
    display_name: parsed.data.displayName,
    role_title: parsed.data.roleTitle,
    bio: parsed.data.bio,
    public_email: optional(parsed.data.publicEmail),
    linkedin_url: optional(parsed.data.linkedinUrl),
    media_asset_id: parsed.data.mediaAssetId || null,
    status: parsed.data.status,
    sort_order: parsed.data.sortOrder,
    published_at: parsed.data.status === "published" ? now : null,
    updated_by: auth.userId,
  } as const;

  let id = parsed.data.id;
  if (id) {
    const { error } = await admin.from("team_members").update(payload).eq("id", id);
    if (error) returnWithError("team", error.message);
  } else {
    const { data, error } = await admin.from("team_members").insert({ ...payload, created_by: auth.userId }).select("id").single();
    if (error || !data) returnWithError("team", error?.message ?? "Could not create team member.");
    id = data.id;
  }

  await audit(auth.userId, `team_member.${parsed.data.status}`, "team_member", id);
  refreshContent();
  redirect("/admin/content?saved=team#team");
}

export async function archiveTeamMemberAction(formData: FormData) {
  const auth = await requireStaff();
  const id = value(formData, "id");
  if (!z.string().uuid().safeParse(id).success) returnWithError("team", "Invalid team member.");

  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("team_members").update({
    status: "archived",
    archived_at: new Date().toISOString(),
    updated_by: auth.userId,
  }).eq("id", id);

  if (error) returnWithError("team", error.message);
  await audit(auth.userId, "team_member.archived", "team_member", id);
  refreshContent();
  redirect("/admin/content?saved=team-archived#team");
}
