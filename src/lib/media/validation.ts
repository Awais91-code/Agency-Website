import {
  PRIVATE_FILE_MAX_BYTES,
  PRIVATE_FILE_MIME_TYPES,
  PUBLIC_IMAGE_MIME_TYPES,
  PUBLIC_MEDIA_MAX_BYTES,
  type MediaVisibility,
} from "@/lib/media/constants";

export type ImageDimensions = { width: number; height: number } | null;

const extensionByMime: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "application/pdf": ["pdf"],
  "text/plain": ["txt"],
  "text/csv": ["csv"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ["pptx"],
};

export function sanitizeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .toLowerCase();

  return cleaned.slice(0, 120) || "file";
}

function extensionOf(name: string) {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? "";
}

function hasExpectedSignature(bytes: Uint8Array, mime: string) {
  if (mime === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mime === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mime === "image/webp") {
    return (
      bytes.length >= 12 &&
      new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
      new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
    );
  }

  if (mime === "application/pdf") {
    return bytes.length >= 5 && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  }

  return true;
}

function jpegDimensions(bytes: Uint8Array): ImageDimensions {
  let offset = 2;

  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = bytes[offset + 1];
    const blockLength = (bytes[offset + 2] << 8) + bytes[offset + 3];
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xc3;

    if (isStartOfFrame && offset + 8 < bytes.length) {
      const height = (bytes[offset + 5] << 8) + bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) + bytes[offset + 8];
      return width > 0 && height > 0 ? { width, height } : null;
    }

    if (blockLength < 2) return null;
    offset += 2 + blockLength;
  }

  return null;
}

function webpDimensions(bytes: Uint8Array): ImageDimensions {
  const chunk = new TextDecoder().decode(bytes.slice(12, 16));

  if (chunk === "VP8X" && bytes.length >= 30) {
    const width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
    const height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    return { width, height };
  }

  if (chunk === "VP8 " && bytes.length >= 30 && bytes[23] === 0x9d && bytes[24] === 0x01 && bytes[25] === 0x2a) {
    const width = (bytes[26] | (bytes[27] << 8)) & 0x3fff;
    const height = (bytes[28] | (bytes[29] << 8)) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (chunk === "VP8L" && bytes.length >= 25 && bytes[20] === 0x2f) {
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    return { width, height };
  }

  return null;
}

export function getImageDimensions(bytes: Uint8Array, mime: string): ImageDimensions {
  if (mime === "image/png" && bytes.length >= 24) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const width = view.getUint32(16);
    const height = view.getUint32(20);
    return width > 0 && height > 0 ? { width, height } : null;
  }

  if (mime === "image/jpeg") return jpegDimensions(bytes);
  if (mime === "image/webp") return webpDimensions(bytes);
  return null;
}

export async function validateUpload(file: File, visibility: MediaVisibility) {
  if (!file.name || file.size <= 0) {
    return { ok: false as const, message: "Choose a non-empty file." };
  }

  const maxBytes = visibility === "public" ? PUBLIC_MEDIA_MAX_BYTES : PRIVATE_FILE_MAX_BYTES;
  const allowed = visibility === "public" ? PUBLIC_IMAGE_MIME_TYPES : PRIVATE_FILE_MIME_TYPES;

  if (file.size > maxBytes) {
    return {
      ok: false as const,
      message: `File is too large. Maximum allowed size is ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    };
  }

  if (!(allowed as readonly string[]).includes(file.type)) {
    return { ok: false as const, message: `Unsupported file type: ${file.type || "unknown"}.` };
  }

  const extension = extensionOf(file.name);
  if (!extensionByMime[file.type]?.includes(extension)) {
    return { ok: false as const, message: "The file extension does not match its declared type." };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  if (!hasExpectedSignature(bytes, file.type)) {
    return { ok: false as const, message: "The file content does not match its declared type." };
  }

  const dimensions = getImageDimensions(bytes, file.type);
  if (visibility === "public" && file.type.startsWith("image/") && !dimensions) {
    return { ok: false as const, message: "Could not validate image dimensions." };
  }

  return { ok: true as const, bytes, dimensions };
}
