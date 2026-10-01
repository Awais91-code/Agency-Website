import { z } from "zod";

import { apiFailure, apiSuccess } from "@/lib/api/response";
import { recordAuditLog } from "@/lib/audit/log";
import { isStaffRole } from "@/lib/auth/permissions";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";

const updateSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  altText: z.string().trim().max(300).optional().default(""),
  caption: z.string().trim().max(800).optional().default(""),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "admin_media" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });
  if (!isStaffRole(auth.role)) return apiFailure("FORBIDDEN", "Staff access is required.", { status: 403 });

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFailure("INVALID_MEDIA_METADATA", "Check the media metadata and try again.");

  const { id } = await context.params;
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("media_assets")
    .update({
      display_name: parsed.data.displayName,
      alt_text: parsed.data.altText || null,
      caption: parsed.data.caption || null,
    })
    .eq("id", id)
    .is("archived_at", null)
    .select("*")
    .maybeSingle();

  if (error) return apiFailure("MEDIA_UPDATE_FAILED", error.message, { status: 500 });
  if (!data) return apiFailure("MEDIA_NOT_FOUND", "Media asset was not found.", { status: 404 });

  await admin.from("activity_events").insert({
    entity_type: "media_asset",
    entity_id: id,
    event_type: "media.metadata_updated",
    actor_user_id: auth.userId,
    source: "application",
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "media.metadata_updated",
    objectType: "media_asset",
    objectId: id,
  });

  return apiSuccess({ ...data, publicUrl: getPublicMediaUrl(data) });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "admin_media" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });
  if (!isStaffRole(auth.role)) return apiFailure("FORBIDDEN", "Staff access is required.", { status: 403 });

  const { id } = await context.params;
  const admin = getSupabaseAdminClient();
  const archivedAt = new Date().toISOString();
  const { data, error } = await admin.from("media_assets").update({ archived_at: archivedAt }).eq("id", id).is("archived_at", null).select("id").maybeSingle();

  if (error) return apiFailure("MEDIA_ARCHIVE_FAILED", error.message, { status: 500 });
  if (!data) return apiFailure("MEDIA_NOT_FOUND", "Media asset was not found.", { status: 404 });

  await admin.from("activity_events").insert({
    entity_type: "media_asset",
    entity_id: id,
    event_type: "media.archived",
    actor_user_id: auth.userId,
    source: "application",
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "media.archived",
    objectType: "media_asset",
    objectId: id,
  });

  return apiSuccess({ id });
}
