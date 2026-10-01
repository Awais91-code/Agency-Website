import "server-only";

import { randomUUID } from "node:crypto";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import {
  PRIVATE_FILES_BUCKET,
  PUBLIC_MEDIA_BUCKET,
  type MediaVisibility,
} from "@/lib/media/constants";
import { sanitizeFileName, validateUpload } from "@/lib/media/validation";
import type { Database } from "@/types/database";

type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];

export class MediaUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaUploadError";
  }
}

export async function uploadMediaAsset({
  file,
  visibility,
  userId,
}: {
  file: File;
  visibility: MediaVisibility;
  userId: string;
}): Promise<MediaAssetRow> {
  const validated = await validateUpload(file, visibility);
  if (!validated.ok) throw new MediaUploadError(validated.message);

  const admin = getSupabaseAdminClient();
  const assetId = randomUUID();
  const bucket = visibility === "public" ? PUBLIC_MEDIA_BUCKET : PRIVATE_FILES_BUCKET;
  const objectPath = `${visibility === "public" ? "staff" : "users"}/${userId}/${assetId}/${sanitizeFileName(file.name)}`;

  const { error: storageError } = await admin.storage.from(bucket).upload(objectPath, validated.bytes, {
    contentType: file.type,
    cacheControl: visibility === "public" ? "31536000" : "3600",
    upsert: false,
  });

  if (storageError) throw new MediaUploadError(storageError.message);

  const { data, error } = await admin
    .from("media_assets")
    .insert({
      id: assetId,
      bucket,
      object_path: objectPath,
      original_name: file.name,
      display_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: validated.dimensions?.width ?? null,
      height: validated.dimensions?.height ?? null,
      visibility,
      uploaded_by: userId,
    })
    .select("*")
    .single();

  if (error || !data) {
    await admin.storage.from(bucket).remove([objectPath]);
    throw new MediaUploadError(error?.message ?? "Could not save media metadata.");
  }

  return data;
}

export function getPublicMediaUrl(asset: Pick<MediaAssetRow, "bucket" | "object_path" | "visibility">) {
  if (asset.visibility !== "public") return null;
  const admin = getSupabaseAdminClient();
  return admin.storage.from(asset.bucket).getPublicUrl(asset.object_path).data.publicUrl;
}

export async function createPrivateDownloadUrl(asset: MediaAssetRow, expiresIn = 60) {
  const admin = getSupabaseAdminClient();

  if (asset.visibility === "public") {
    return getPublicMediaUrl(asset);
  }

  const { data, error } = await admin.storage
    .from(asset.bucket)
    .createSignedUrl(asset.object_path, expiresIn, { download: asset.display_name });

  if (error || !data?.signedUrl) {
    throw new MediaUploadError(error?.message ?? "Could not create a secure download link.");
  }

  return data.signedUrl;
}
