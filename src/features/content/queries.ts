import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import { faqs as fallbackFaqs } from "@/content/marketing";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";

export type PublicSiteSettings = {
  agencyName: string;
  agencyDescription: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  seoDefaultTitle: string;
  seoDefaultDescription: string;
};

export type PublicContentSection = {
  sectionKey: string;
  eyebrow: string | null;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaHref: string | null;
};

export type PublicTestimonial = {
  id: string;
  clientName: string;
  companyName: string | null;
  roleTitle: string | null;
  quote: string;
  imageUrl: string | null;
};

export type PublicFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export type PublicTeamMember = {
  id: string;
  displayName: string;
  roleTitle: string;
  bio: string;
  publicEmail: string | null;
  linkedinUrl: string | null;
  imageUrl: string | null;
};

const fallbackSettings: PublicSiteSettings = {
  agencyName: "Agency",
  agencyDescription: "Strategy, design, development and automation brought together in one maintainable digital system.",
  email: "hello@agency.example",
  phone: "",
  location: "Remote / worldwide",
  linkedin: "",
  github: "",
  primaryCtaLabel: "Start a project",
  primaryCtaHref: "/start-a-project",
  seoDefaultTitle: "Agency",
  seoDefaultDescription: "A modern digital agency platform for strategy, design, development, automation and client experience.",
};

const fallbackHero: PublicContentSection = {
  sectionKey: "home.hero",
  eyebrow: "Design · Development · Automation",
  title: "Digital products that work beyond the screen.",
  body: "We design and build modern web experiences, product interfaces and automation systems that turn attention into action and repetitive work into reliable workflows.",
  ctaLabel: "Start a project",
  ctaHref: "/start-a-project",
};

const fallbackAbout: PublicContentSection = {
  sectionKey: "about.story",
  eyebrow: "About the agency",
  title: "A digital partner built around clarity, useful technology and maintainable systems.",
  body: "We treat websites and digital products as working systems, not isolated screens. Strategy, content, interface design, code, data and automation should support one another.",
  ctaLabel: null,
  ctaHref: null,
};

function stringValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function getPublicSiteSettings(): Promise<PublicSiteSettings> {
  if (!isSupabaseConfigured()) return fallbackSettings;

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("site_settings")
      .select("key,value")
      .eq("is_public", true);

    if (error) throw error;
    const map = new Map((data ?? []).map((row) => [row.key, row.value]));

    return {
      agencyName: stringValue(map.get("agency.name"), fallbackSettings.agencyName),
      agencyDescription: stringValue(map.get("agency.description"), fallbackSettings.agencyDescription),
      email: stringValue(map.get("contact.email"), fallbackSettings.email),
      phone: stringValue(map.get("contact.phone"), fallbackSettings.phone),
      location: stringValue(map.get("contact.location"), fallbackSettings.location),
      linkedin: stringValue(map.get("social.linkedin"), fallbackSettings.linkedin),
      github: stringValue(map.get("social.github"), fallbackSettings.github),
      primaryCtaLabel: stringValue(map.get("cta.primary_label"), fallbackSettings.primaryCtaLabel),
      primaryCtaHref: stringValue(map.get("cta.primary_href"), fallbackSettings.primaryCtaHref),
      seoDefaultTitle: stringValue(map.get("seo.default_title"), fallbackSettings.seoDefaultTitle),
      seoDefaultDescription: stringValue(map.get("seo.default_description"), fallbackSettings.seoDefaultDescription),
    };
  } catch {
    return fallbackSettings;
  }
}

export async function getPublishedSection(sectionKey: string): Promise<PublicContentSection | null> {
  const fallback =
    sectionKey === "home.hero"
      ? fallbackHero
      : sectionKey === "about.story"
        ? fallbackAbout
        : null;

  if (!isSupabaseConfigured()) return fallback;

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("content_sections")
      .select("section_key,eyebrow,title,body,cta_label,cta_href")
      .eq("section_key", sectionKey)
      .eq("status", "published")
      .is("archived_at", null)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fallback;

    return {
      sectionKey: data.section_key,
      eyebrow: data.eyebrow,
      title: data.title,
      body: data.body,
      ctaLabel: data.cta_label,
      ctaHref: data.cta_href,
    };
  } catch {
    return fallback;
  }
}

export async function listPublishedTestimonials(limit = 6): Promise<PublicTestimonial[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("testimonials")
      .select("*")
      .eq("status", "published")
      .eq("permission_granted", true)
      .is("archived_at", null)
      .order("sort_order")
      .limit(limit);

    if (error) throw error;
    if (!data?.length) return [];

    const mediaIds = [...new Set(data.map((row) => row.media_asset_id).filter((id): id is string => Boolean(id)))];
    const mediaMap = new Map<string, string>();

    if (mediaIds.length) {
      const { data: mediaRows } = await admin
        .from("media_assets")
        .select("*")
        .in("id", mediaIds)
        .eq("visibility", "public")
        .is("archived_at", null);

      for (const media of mediaRows ?? []) {
        const url = getPublicMediaUrl(media);
        if (url) mediaMap.set(media.id, url);
      }
    }

    return data.map((row) => ({
      id: row.id,
      clientName: row.client_name,
      companyName: row.company_name,
      roleTitle: row.role_title,
      quote: row.quote,
      imageUrl: row.media_asset_id ? mediaMap.get(row.media_asset_id) ?? null : null,
    }));
  } catch {
    return [];
  }
}

export async function listPublishedFaqs(category = "general"): Promise<PublicFaq[]> {
  if (!isSupabaseConfigured()) {
    return fallbackFaqs.map((item, index) => ({
      id: `fallback-${index}`,
      category,
      question: item.question,
      answer: item.answer,
    }));
  }

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("faqs")
      .select("id,category,question,answer")
      .eq("category", category)
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order");

    if (error) throw error;
    if (!data?.length) {
      return fallbackFaqs.map((item, index) => ({
        id: `fallback-${index}`,
        category,
        question: item.question,
        answer: item.answer,
      }));
    }

    return data;
  } catch {
    return fallbackFaqs.map((item, index) => ({
      id: `fallback-${index}`,
      category,
      question: item.question,
      answer: item.answer,
    }));
  }
}

export async function listPublishedTeam(): Promise<PublicTeamMember[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("team_members")
      .select("*")
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order");

    if (error) throw error;
    if (!data?.length) return [];

    const mediaIds = [...new Set(data.map((row) => row.media_asset_id).filter((id): id is string => Boolean(id)))];
    const mediaMap = new Map<string, string>();

    if (mediaIds.length) {
      const { data: mediaRows } = await admin
        .from("media_assets")
        .select("*")
        .in("id", mediaIds)
        .eq("visibility", "public")
        .is("archived_at", null);

      for (const media of mediaRows ?? []) {
        const url = getPublicMediaUrl(media);
        if (url) mediaMap.set(media.id, url);
      }
    }

    return data.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      roleTitle: row.role_title,
      bio: row.bio,
      publicEmail: row.public_email,
      linkedinUrl: row.linkedin_url,
      imageUrl: row.media_asset_id ? mediaMap.get(row.media_asset_id) ?? null : null,
    }));
  } catch {
    return [];
  }
}
