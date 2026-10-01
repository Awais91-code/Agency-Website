import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";

export async function getCaseStudyAdminEditorData(id?: string) {
  const admin = getSupabaseAdminClient();

  const [{ data: services, error: serviceError }, { data: media, error: mediaError }] = await Promise.all([
    admin.from("services").select("id,slug,title,status").is("archived_at", null).order("sort_order"),
    admin.from("media_assets").select("*").eq("visibility", "public").is("archived_at", null).order("created_at", { ascending: false }).limit(120),
  ]);

  if (serviceError) throw new Error(`Could not load services: ${serviceError.message}`);
  if (mediaError) throw new Error(`Could not load media: ${mediaError.message}`);

  const mediaOptions = (media ?? []).map((asset) => ({
    id: asset.id,
    label: asset.display_name,
    altText: asset.alt_text,
    publicUrl: getPublicMediaUrl(asset),
  }));

  if (!id) {
    return {
      caseStudy: null,
      metrics: [],
      selectedServiceIds: [],
      selectedGalleryMediaIds: [],
      services: services ?? [],
      mediaOptions,
    };
  }

  const [
    { data: caseStudy, error },
    { data: metrics },
    { data: serviceRelations },
    { data: galleryRelations },
  ] = await Promise.all([
    admin.from("case_studies").select("*").eq("id", id).is("archived_at", null).maybeSingle(),
    admin.from("case_study_metrics").select("*").eq("case_study_id", id).order("sort_order"),
    admin.from("case_study_services").select("service_id").eq("case_study_id", id).order("sort_order"),
    admin.from("case_study_media").select("media_asset_id").eq("case_study_id", id).order("sort_order"),
  ]);

  if (error) throw new Error(`Could not load case study: ${error.message}`);

  return {
    caseStudy,
    metrics: metrics ?? [],
    selectedServiceIds: (serviceRelations ?? []).map((item) => item.service_id),
    selectedGalleryMediaIds: (galleryRelations ?? []).map((item) => item.media_asset_id),
    services: services ?? [],
    mediaOptions,
  };
}
