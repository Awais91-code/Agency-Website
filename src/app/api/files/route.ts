import { apiFailure, apiSuccess } from "@/lib/api/response";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { uploadMediaAsset, MediaUploadError } from "@/lib/media/service";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,display_name,original_name,mime_type,size_bytes,created_at,visibility")
    .eq("visibility", "private")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return apiFailure("FILE_LIST_FAILED", error.message, { status: 500 });
  return apiSuccess(data ?? []);
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "files" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return apiFailure("FILE_REQUIRED", "Choose a file to upload.");

    const asset = await uploadMediaAsset({ file, visibility: "private", userId: auth.userId });
    const admin = getSupabaseAdminClient();
    await admin.from("activity_events").insert({
      entity_type: "media_asset",
      entity_id: asset.id,
      event_type: "file.uploaded",
      actor_user_id: auth.userId,
      source: "application",
      metadata: { visibility: "private", mime_type: asset.mime_type, size_bytes: asset.size_bytes },
    });

    return apiSuccess({ id: asset.id, display_name: asset.display_name, mime_type: asset.mime_type, size_bytes: asset.size_bytes }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaUploadError) return apiFailure("INVALID_UPLOAD", error.message, { status: 400 });
    return apiFailure("FILE_UPLOAD_FAILED", error instanceof Error ? error.message : "Upload failed.", { status: 500 });
  }
}
