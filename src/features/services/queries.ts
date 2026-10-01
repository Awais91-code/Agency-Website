import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import { fallbackServices } from "@/features/services/fallback";
import { parseProcessSteps, type ServiceDetail, type ServiceSummary } from "@/features/services/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";
import type { Database } from "@/types/database";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type FaqRow = Database["public"]["Tables"]["service_faqs"]["Row"];
type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

function fallbackSummary(service: ServiceDetail): ServiceSummary {
  return {
    id: service.id,
    slug: service.slug,
    title: service.title,
    eyebrow: service.eyebrow,
    shortDescription: service.shortDescription,
    isFeatured: service.isFeatured,
    sortOrder: service.sortOrder,
    status: service.status,
  };
}

function rowToSummary(row: ServiceRow): ServiceSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    eyebrow: row.eyebrow,
    shortDescription: row.short_description,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    status: row.status,
  };
}

function rowToDetail({
  row,
  faqs,
  relatedServices,
  heroMedia,
}: {
  row: ServiceRow;
  faqs: FaqRow[];
  relatedServices: ServiceSummary[];
  heroMedia: MediaRow | null;
}): ServiceDetail {
  return {
    ...rowToSummary(row),
    heroTitle: row.hero_title,
    heroDescription: row.hero_description,
    problems: row.problems,
    deliverables: row.deliverables,
    outcomes: row.outcomes,
    processSteps: parseProcessSteps(row.process_steps),
    technologies: row.technologies,
    pricingNote: row.pricing_note,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    heroMediaId: row.hero_media_id,
    heroMediaUrl: heroMedia ? getPublicMediaUrl(heroMedia) : null,
    relatedCaseStudySlugs: row.related_case_study_slugs,
    publishedAt: row.published_at,
    faqs: faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sort_order,
    })),
    relatedServices,
  };
}

export async function listPublishedServices(limit?: number): Promise<ServiceSummary[]> {
  if (!isSupabaseConfigured()) {
    return fallbackServices.slice(0, limit).map(fallbackSummary);
  }

  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from("services")
      .select("*")
      .eq("status", "published")
      .is("archived_at", null)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;

    if (!data?.length) {
      return [];
    }

    return data.map(rowToSummary);
  } catch {
    return fallbackServices.slice(0, limit).map(fallbackSummary);
  }
}

export async function getPublishedService(slug: string): Promise<ServiceDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackServices.find((service) => service.slug === slug) ?? null;
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: row, error } = await admin
      .from("services")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!row) return null;

    const [{ data: faqs }, { data: relations }, { data: heroMedia }] = await Promise.all([
      admin
        .from("service_faqs")
        .select("*")
        .eq("service_id", row.id)
        .eq("visible", true)
        .order("sort_order", { ascending: true }),
      admin
        .from("service_relations")
        .select("related_service_id, sort_order")
        .eq("service_id", row.id)
        .order("sort_order", { ascending: true }),
      row.hero_media_id
        ? admin.from("media_assets").select("*").eq("id", row.hero_media_id).eq("visibility", "public").maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const relatedIds = (relations ?? []).map((relation) => relation.related_service_id);
    let relatedServices: ServiceSummary[] = [];

    if (relatedIds.length > 0) {
      const { data: relatedRows } = await admin
        .from("services")
        .select("*")
        .in("id", relatedIds)
        .eq("status", "published")
        .is("archived_at", null);

      const byId = new Map((relatedRows ?? []).map((service) => [service.id, rowToSummary(service)]));
      relatedServices = relatedIds.flatMap((id) => {
        const service = byId.get(id);
        return service ? [service] : [];
      });
    }

    return rowToDetail({
      row,
      faqs: faqs ?? [],
      relatedServices,
      heroMedia: heroMedia ?? null,
    });
  } catch {
    return fallbackServices.find((service) => service.slug === slug) ?? null;
  }
}
