import type { Database } from "@/types/database";

export type CaseStudyStatus = Database["public"]["Enums"]["content_status"];

export type CaseStudyService = {
  id: string;
  slug: string;
  title: string;
};

export type CaseStudyMetric = {
  id?: string;
  value: string;
  label: string;
  context: string | null;
  isApproved: boolean;
  sortOrder: number;
};

export type CaseStudyMedia = {
  id?: string;
  mediaAssetId: string;
  url: string;
  altText: string;
  caption: string | null;
  sortOrder: number;
};

export type CaseStudySummary = {
  id: string;
  slug: string;
  title: string;
  projectLabel: string;
  clientName: string | null;
  industry: string | null;
  shortDescription: string;
  technologies: string[];
  tags: string[];
  heroMediaUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  status: CaseStudyStatus;
  services: CaseStudyService[];
};

export type CaseStudyDetail = CaseStudySummary & {
  heroTitle: string;
  heroDescription: string;
  problem: string;
  approach: string;
  solution: string;
  resultSummary: string;
  testimonialQuote: string | null;
  testimonialAttribution: string | null;
  testimonialApproved: boolean;
  ctaLabel: string;
  ctaHref: string;
  seoTitle: string | null;
  seoDescription: string | null;
  heroMediaId: string | null;
  publishedAt: string | null;
  gallery: CaseStudyMedia[];
  metrics: CaseStudyMetric[];
};
