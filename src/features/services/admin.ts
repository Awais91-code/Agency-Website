import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";

export async function getServiceAdminEditorData(id?: string) {
  const admin = getSupabaseAdminClient();

  const [{ data: allServices, error: serviceListError }, { data: media, error: mediaError }] = await Promise.all([
    admin.from("services").select("id,slug,title,status,sort_order,is_featured").is("archived_at", null).order("sort_order"),
    admin.from("media_assets").select("*").eq("visibility", "public").is("archived_at", null).order("created_at", { ascending: false }).limit(80),
  ]);

  if (serviceListError) throw new Error(`Could not load services: ${serviceListError.message}`);
  if (mediaError) throw new Error(`Could not load media: ${mediaError.message}`);

  const mediaOptions = (media ?? []).map((asset) => ({
    id: asset.id,
    label: asset.display_name,
    publicUrl: getPublicMediaUrl(asset),
  }));

  if (!id) {
    return { service: null, faqs: [], relatedIds: [], allServices: allServices ?? [], mediaOptions };
  }

  const [{ data: service, error }, { data: faqs }, { data: relations }] = await Promise.all([
    admin.from("services").select("*").eq("id", id).is("archived_at", null).maybeSingle(),
    admin.from("service_faqs").select("*").eq("service_id", id).order("sort_order"),
    admin.from("service_relations").select("related_service_id").eq("service_id", id).order("sort_order"),
  ]);

  if (error) throw new Error(`Could not load service: ${error.message}`);

  return {
    service,
    faqs: faqs ?? [],
    relatedIds: (relations ?? []).map((item) => item.related_service_id),
    allServices: (allServices ?? []).filter((item) => item.id !== id),
    mediaOptions,
  };
}
