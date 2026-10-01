import type { Database, Json } from "@/types/database";

export type ServiceStatus = Database["public"]["Enums"]["content_status"];

export type ServiceProcessStep = {
  title: string;
  description: string;
};

export type ServiceFaq = {
  id?: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type ServiceSummary = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string | null;
  shortDescription: string;
  isFeatured: boolean;
  sortOrder: number;
  status: ServiceStatus;
};

export type ServiceDetail = ServiceSummary & {
  heroTitle: string;
  heroDescription: string;
  problems: string[];
  deliverables: string[];
  outcomes: string[];
  processSteps: ServiceProcessStep[];
  technologies: string[];
  pricingNote: string | null;
  ctaLabel: string;
  ctaHref: string;
  seoTitle: string | null;
  seoDescription: string | null;
  heroMediaId: string | null;
  heroMediaUrl: string | null;
  relatedCaseStudySlugs: string[];
  publishedAt: string | null;
  faqs: ServiceFaq[];
  relatedServices: ServiceSummary[];
};

export function parseProcessSteps(value: Json): ServiceProcessStep[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const description = typeof item.description === "string" ? item.description.trim() : "";
    return title && description ? [{ title, description }] : [];
  });
}
