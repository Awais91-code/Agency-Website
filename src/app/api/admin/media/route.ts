import { recordAuditLog } from "@/lib/audit/log";
import { isStaffRole } from "@/lib/auth/permissions";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { apiFailure, apiSuccess } from "@/lib/api/response";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl, MediaUploadError, uploadMediaAsset } from "@/lib/media/service";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";

function serializeAsset(asset: Awaited<ReturnType<typeof uploadMediaAsset>>) {
  return { ...asset, publicUrl: getPublicMediaUrl(asset) };
}

export async function GET() {
  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });
  if (!isStaffRole(auth.role)) return apiFailure("FORBIDDEN", "Staff access is required.", { status: 403 });

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("media_assets").select("*").is("archived_at", null).order("created_at", { ascending: false }).limit(100);
  if (error) return apiFailure("MEDIA_LIST_FAILED", error.message, { status: 500 });

  return apiSuccess((data ?? []).map((asset) => ({ ...asset, publicUrl: getPublicMediaUrl(asset) })));
}

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "admin_media" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });
  if (!isStaffRole(auth.role)) return apiFailure("FORBIDDEN", "Staff access is required.", { status: 403 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return apiFailure("FILE_REQUIRED", "Choose an image to upload.");

    const asset = await uploadMediaAsset({ file, visibility: "public", userId: auth.userId });

    const admin = getSupabaseAdminClient();
    await admin.from("activity_events").insert({
      entity_type: "media_asset",
      entity_id: asset.id,
      event_type: "media.uploaded",
      actor_user_id: auth.userId,
      source: "application",
      metadata: { visibility: asset.visibility, mime_type: asset.mime_type, size_bytes: asset.size_bytes },
    });

    await recordAuditLog({
      actorUserId: auth.userId,
      action: "media.uploaded",
      objectType: "media_asset",
      objectId: asset.id,
      metadata: {
        visibility: asset.visibility,
        mime_type: asset.mime_type,
        size_bytes: asset.size_bytes,
      },
    });

    return apiSuccess(serializeAsset(asset), { status: 201 });
  } catch (error) {
    if (error instanceof MediaUploadError) return apiFailure("INVALID_UPLOAD", error.message, { status: 400 });
    return apiFailure("MEDIA_UPLOAD_FAILED", error instanceof Error ? error.message : "Upload failed.", { status: 500 });
  }
}
