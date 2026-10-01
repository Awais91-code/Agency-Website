import type { MetadataRoute } from "next";

import { isSupabaseConfigured } from "@/config/database";
import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export const revalidate = 3600;

function absolute(path: string) {
  return new URL(path, env.NEXT_PUBLIC_APP_URL).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absolute("/services"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute("/work"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absolute("/process"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absolute("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/contact"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/book"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absolute("/start-a-project"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  if (!isSupabaseConfigured()) return staticEntries;

  try {
    const admin = getSupabaseAdminClient();
    const isoNow = now.toISOString();

    const [
      serviceResult,
      workResult,
      postResult,
      categoryResult,
      tagResult,
    ] = await Promise.all([
      admin
        .from("services")
        .select("slug,updated_at")
        .eq("status", "published")
        .is("archived_at", null),
      admin
        .from("case_studies")
        .select("slug,updated_at")
        .eq("status", "published")
        .is("archived_at", null),
      admin
        .from("blog_posts")
        .select("slug,updated_at")
        .eq("status", "published")
        .is("archived_at", null)
        .not("published_at", "is", null)
        .lte("published_at", isoNow),
      admin
        .from("blog_categories")
        .select("slug,updated_at")
        .eq("is_active", true),
      admin
        .from("blog_tags")
        .select("slug,updated_at")
        .eq("is_active", true),
    ]);

    const dynamicEntries: MetadataRoute.Sitemap = [
      ...(serviceResult.data ?? []).map((item) => ({
        url: absolute(`/services/${item.slug}`),
        lastModified: new Date(item.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...(workResult.data ?? []).map((item) => ({
        url: absolute(`/work/${item.slug}`),
        lastModified: new Date(item.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...(postResult.data ?? []).map((item) => ({
        url: absolute(`/blog/${item.slug}`),
        lastModified: new Date(item.updated_at),
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })),
      ...(categoryResult.data ?? []).map((item) => ({
        url: absolute(`/blog/category/${item.slug}`),
        lastModified: new Date(item.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.55,
      })),
      ...(tagResult.data ?? []).map((item) => ({
        url: absolute(`/blog/tag/${item.slug}`),
        lastModified: new Date(item.updated_at),
        changeFrequency: "weekly" as const,
        priority: 0.45,
      })),
    ];

    return [...staticEntries, ...dynamicEntries];
  } catch {
    return staticEntries;
  }
}
