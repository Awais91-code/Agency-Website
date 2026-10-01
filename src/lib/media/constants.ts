export const PUBLIC_MEDIA_BUCKET = "public-media" as const;
export const PRIVATE_FILES_BUCKET = "private-files" as const;

export const PUBLIC_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
export const PRIVATE_FILE_MAX_BYTES = 20 * 1024 * 1024;

export const PUBLIC_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const PRIVATE_FILE_MIME_TYPES = [
  ...PUBLIC_IMAGE_MIME_TYPES,
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

export type MediaVisibility = "public" | "private";
