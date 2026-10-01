import type { Json } from "@/types/database";

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
}

export function jsonObject(value: Json | null | undefined): Record<string, Json | undefined> {
  if (!value || Array.isArray(value) || typeof value !== "object") return {};
  return value;
}

export function jsonStringArray(value: Json | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function displayName(profile: { display_name: string | null } | null | undefined, fallback = "Unassigned") {
  return profile?.display_name?.trim() || fallback;
}
