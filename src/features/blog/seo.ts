import "server-only";

import type { Metadata } from "next";

import { env } from "@/config/env";
import type { BlogPostDetail } from "@/features/blog/types";

export function absoluteSiteUrl(pathOrUrl: string) {
  try {
    return new URL(pathOrUrl).toString();
  } catch {
    return new URL(
      pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`,
      env.NEXT_PUBLIC_APP_URL,
    ).toString();
  }
}

export function blogPostCanonical(post: BlogPostDetail) {
  return absoluteSiteUrl(post.canonicalUrl || `/blog/${post.slug}`);
}

export function blogPostMetadata(post: BlogPostDetail): Metadata {
  const canonical = blogPostCanonical(post);
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const ogTitle = post.ogTitle || title;
  const ogDescription = post.ogDescription || description;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      url: canonical,
      title: ogTitle,
      description: ogDescription,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: post.author ? [post.author.displayName] : undefined,
      images: post.socialImageUrl
        ? [{ url: post.socialImageUrl, alt: post.socialImageAltText || post.title }]
        : undefined,
    },
    twitter: {
      card: post.socialImageUrl ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: post.socialImageUrl ? [post.socialImageUrl] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export function blogPostingJsonLd(post: BlogPostDetail) {
  const canonical = blogPostCanonical(post);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: canonical,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: post.author
      ? { "@type": "Person", name: post.author.displayName }
      : { "@type": "Organization", name: env.NEXT_PUBLIC_APP_NAME },
    publisher: {
      "@type": "Organization",
      name: env.NEXT_PUBLIC_APP_NAME,
      url: env.NEXT_PUBLIC_APP_URL,
    },
    image: post.socialImageUrl || post.coverMediaUrl || undefined,
  };
}
