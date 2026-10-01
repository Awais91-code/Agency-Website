export type BlogAuthor = {
  id: string;
  slug: string;
  displayName: string;
  bio: string;
  jobTitle: string | null;
  avatarUrl: string | null;
};

export type BlogCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
};

export type BlogTag = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverMediaUrl: string | null;
  coverAltText: string | null;
  publishedAt: string;
  updatedAt: string;
  isFeatured: boolean;
  author: BlogAuthor | null;
  category: BlogCategory | null;
  tags: BlogTag[];
};

export type BlogInternalLink = {
  id: string;
  slug: string;
  title: string;
  href: string;
  description: string;
};

export type BlogPostDetail = BlogPostSummary & {
  bodyMarkdown: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  socialImageUrl: string | null;
  socialImageAltText: string | null;
  relatedServices: BlogInternalLink[];
  relatedCaseStudies: BlogInternalLink[];
};

export type BlogFilters = {
  q?: string;
  category?: string;
  tag?: string;
  limit?: number;
};
