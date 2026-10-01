import "server-only";

import { permanentRedirect, redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/config/database";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export type SeoRedirectRecord = {
  source_path: string;
  destination_path: string;
  status_code: number;
};

export async function resolveSeoRedirect(
  sourcePath: string,
): Promise<SeoRedirectRecord | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("seo_redirects")
    .select("source_path,destination_path,status_code")
    .eq("source_path", sourcePath)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function executeSeoRedirect(record: SeoRedirectRecord): never {
  if (record.status_code === 308) {
    permanentRedirect(record.destination_path);
  }

  redirect(record.destination_path);
}
