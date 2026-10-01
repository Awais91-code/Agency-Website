import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import { fallbackCaseStudies } from "@/features/case-studies/fallback";
import type {
  CaseStudyDetail,
  CaseStudyMedia,
  CaseStudyMetric,
  CaseStudyService,
  CaseStudySummary,
} from "@/features/case-studies/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";
import type { Database } from "@/types/database";

type CaseStudyRow = Database["public"]["Tables"]["case_studies"]["Row"];
type CaseStudyMetricRow = Database["public"]["Tables"]["case_study_metrics"]["Row"];
type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

function fallbackSummary(study: CaseStudyDetail): CaseStudySummary {
  const { heroTitle: _heroTitle, heroDescription: _heroDescription, problem: _problem, approach: _approach, solution: _solution, resultSummary: _resultSummary, testimonialQuote: _testimonialQuote, testimonialAttribution: _testimonialAttribution, testimonialApproved: _testimonialApproved, ctaLabel: _ctaLabel, ctaHref: _ctaHref, seoTitle: _seoTitle, seoDescription: _seoDescription, heroMediaId: _heroMediaId, publishedAt: _publishedAt, gallery: _gallery, metrics: _metrics, ...summary } = study;
  return summary;
}

function rowToSummary(row: CaseStudyRow, services: CaseStudyService[], heroMedia: MediaRow | null): CaseStudySummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    projectLabel: row.project_label,
    clientName: row.client_name,
    industry: row.industry,
    shortDescription: row.short_description,
    technologies: row.technologies,
    tags: row.tags,
    heroMediaUrl: heroMedia ? getPublicMediaUrl(heroMedia) : null,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    status: row.status,
    services,
  };
}

function metricRowToMetric(row: CaseStudyMetricRow): CaseStudyMetric {
  return {
    id: row.id,
    value: row.value,
    label: row.label,
    context: row.context,
    isApproved: row.is_approved,
    sortOrder: row.sort_order,
  };
}

async function loadServiceMap(caseStudyIds: string[]) {
  const admin = getSupabaseAdminClient();
  if (caseStudyIds.length === 0) return new Map<string, CaseStudyService[]>();

  const { data: relations, error: relationError } = await admin
    .from("case_study_services")
    .select("case_study_id,service_id,sort_order")
    .in("case_study_id", caseStudyIds)
    .order("sort_order", { ascending: true });

  if (relationError) throw relationError;

  const serviceIds = [...new Set((relations ?? []).map((item) => item.service_id))];
  if (serviceIds.length === 0) return new Map<string, CaseStudyService[]>();

  const { data: serviceRows, error: serviceError } = await admin
    .from("services")
    .select("id,slug,title,status,archived_at")
    .in("id", serviceIds)
    .eq("status", "published")
    .is("archived_at", null);

  if (serviceError) throw serviceError;

  const serviceById = new Map((serviceRows ?? []).map((service) => [service.id, { id: service.id, slug: service.slug, title: service.title }]));
  const result = new Map<string, CaseStudyService[]>();

  for (const relation of relations ?? []) {
    const service = serviceById.get(relation.service_id);
    if (!service) continue;
    const current = result.get(relation.case_study_id) ?? [];
    current.push(service);
    result.set(relation.case_study_id, current);
  }

  return result;
}

async function loadHeroMediaMap(rows: CaseStudyRow[]) {
  const admin = getSupabaseAdminClient();
  const ids = [...new Set(rows.map((row) => row.hero_media_id).filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return new Map<string, MediaRow>();

  const { data, error } = await admin
    .from("media_assets")
    .select("*")
    .in("id", ids)
    .eq("visibility", "public")
    .is("archived_at", null);

  if (error) throw error;
  return new Map((data ?? []).map((item) => [item.id, item]));
}

export async function listPublishedCaseStudies({
  limit,
  featuredOnly = false,
}: {
  limit?: number;
  featuredOnly?: boolean;
} = {}): Promise<CaseStudySummary[]> {
  if (!isSupabaseConfigured()) {
    let items = fallbackCaseStudies.map(fallbackSummary);
    if (featuredOnly) items = items.filter((item) => item.isFeatured);
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }

  try {
    const admin = getSupabaseAdminClient();
    let query = admin
      .from("case_studies")
      .select("*")
      .eq("status", "published")
      .is("archived_at", null)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("title", { ascending: true });

    if (featuredOnly) query = query.eq("is_featured", true);
    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;
    if (!data?.length) return [];

    const [serviceMap, mediaMap] = await Promise.all([loadServiceMap(data.map((row) => row.id)), loadHeroMediaMap(data)]);
    return data.map((row) => rowToSummary(row, serviceMap.get(row.id) ?? [], row.hero_media_id ? mediaMap.get(row.hero_media_id) ?? null : null));
  } catch {
    let items = fallbackCaseStudies.map(fallbackSummary);
    if (featuredOnly) items = items.filter((item) => item.isFeatured);
    return typeof limit === "number" ? items.slice(0, limit) : items;
  }
}

export async function getPublishedCaseStudy(slug: string): Promise<CaseStudyDetail | null> {
  if (!isSupabaseConfigured()) {
    return fallbackCaseStudies.find((study) => study.slug === slug) ?? null;
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data: row, error } = await admin
      .from("case_studies")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!row) return null;

    const [serviceMap, heroMediaMap, metricResult, mediaRelations] = await Promise.all([
      loadServiceMap([row.id]),
      loadHeroMediaMap([row]),
      admin.from("case_study_metrics").select("*").eq("case_study_id", row.id).eq("is_approved", true).order("sort_order"),
      admin.from("case_study_media").select("*").eq("case_study_id", row.id).eq("visible", true).order("sort_order"),
    ]);

    if (metricResult.error) throw metricResult.error;
    if (mediaRelations.error) throw mediaRelations.error;

    const mediaIds = (mediaRelations.data ?? []).map((item) => item.media_asset_id);
    let gallery: CaseStudyMedia[] = [];

    if (mediaIds.length) {
      const { data: assets, error: assetError } = await admin
        .from("media_assets")
        .select("*")
        .in("id", mediaIds)
        .eq("visibility", "public")
        .is("archived_at", null);

      if (assetError) throw assetError;
      const assetById = new Map((assets ?? []).map((asset) => [asset.id, asset]));

      gallery = (mediaRelations.data ?? []).flatMap((relation) => {
        const asset = assetById.get(relation.media_asset_id);
        const url = asset ? getPublicMediaUrl(asset) : null;
        if (!asset || !url) return [];
        return [{
          id: relation.id,
          mediaAssetId: asset.id,
          url,
          altText: relation.alt_text_override || asset.alt_text || asset.display_name,
          caption: relation.caption ?? asset.caption,
          sortOrder: relation.sort_order,
        }];
      });
    }

    const summary = rowToSummary(
      row,
      serviceMap.get(row.id) ?? [],
      row.hero_media_id ? heroMediaMap.get(row.hero_media_id) ?? null : null,
    );

    return {
      ...summary,
      heroTitle: row.hero_title,
      heroDescription: row.hero_description,
      problem: row.problem,
      approach: row.approach,
      solution: row.solution,
      resultSummary: row.result_summary,
      testimonialQuote: row.testimonial_approved ? row.testimonial_quote : null,
      testimonialAttribution: row.testimonial_approved ? row.testimonial_attribution : null,
      testimonialApproved: row.testimonial_approved,
      ctaLabel: row.cta_label,
      ctaHref: row.cta_href,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      heroMediaId: row.hero_media_id,
      publishedAt: row.published_at,
      gallery,
      metrics: (metricResult.data ?? []).map(metricRowToMetric),
    };
  } catch {
    return fallbackCaseStudies.find((study) => study.slug === slug) ?? null;
  }
}

export async function getPublishedCaseStudiesBySlugs(slugs: string[]): Promise<CaseStudySummary[]> {
  const wanted = [...new Set(slugs.filter(Boolean))];
  if (!wanted.length) return [];
  const items = await listPublishedCaseStudies();
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  return wanted.flatMap((slug) => {
    const item = bySlug.get(slug);
    return item ? [item] : [];
  });
}
