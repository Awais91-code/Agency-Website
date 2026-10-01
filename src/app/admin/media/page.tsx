import { MediaLibrary, type MediaLibraryItem } from "@/components/media/media-library";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";

export default async function AdminMediaPage() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("media_assets")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    throw new Error(`Could not load media library: ${error.message}`);
  }

  const assets: MediaLibraryItem[] = (data ?? []).map((asset) => ({
    id: asset.id,
    display_name: asset.display_name,
    original_name: asset.original_name,
    mime_type: asset.mime_type,
    size_bytes: asset.size_bytes,
    width: asset.width,
    height: asset.height,
    alt_text: asset.alt_text,
    caption: asset.caption,
    visibility: asset.visibility,
    publicUrl: getPublicMediaUrl(asset),
    created_at: asset.created_at,
  }));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">M04 · Media management</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Media library</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Upload validated public imagery once, maintain accessibility metadata, and reuse the same asset from later service, portfolio and CMS modules.</p>
      </div>
      <MediaLibrary initialAssets={assets} />
    </section>
  );
}
