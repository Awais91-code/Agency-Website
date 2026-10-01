import "server-only";

import { isSupabaseConfigured } from "@/config/database";
import type {
  BlogAuthor,
  BlogCategory,
  BlogFilters,
  BlogPostDetail,
  BlogPostSummary,
  BlogTag,
} from "@/features/blog/types";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["blog_posts"]["Row"];
type AuthorRow = Database["public"]["Tables"]["blog_authors"]["Row"];
type CategoryRow = Database["public"]["Tables"]["blog_categories"]["Row"];
type TagRow = Database["public"]["Tables"]["blog_tags"]["Row"];
type MediaRow = Database["public"]["Tables"]["media_assets"]["Row"];

function authorFromRow(row: AuthorRow, media: MediaRow | null): BlogAuthor {
  return {
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    bio: row.bio,
    jobTitle: row.job_title,
    avatarUrl: media ? getPublicMediaUrl(media) : null,
  };
}

function categoryFromRow(row: CategoryRow): BlogCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}

function tagFromRow(row: TagRow): BlogTag {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
  };
}

async function loadPublicMedia(ids: Array<string | null>) {
  const admin = getSupabaseAdminClient();
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, MediaRow>();

  const { data, error } = await admin
    .from("media_assets")
    .select("*")
    .in("id", unique)
    .eq("visibility", "public")
    .is("archived_at", null);

  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.id, row]));
}

async function loadPostRelations(rows: PostRow[]) {
  const admin = getSupabaseAdminClient();
  const postIds = rows.map((row) => row.id);

  if (!postIds.length) {
    return {
      authors: new Map<string, AuthorRow>(),
      categories: new Map<string, CategoryRow>(),
      tags: new Map<string, BlogTag[]>(),
      media: new Map<string, MediaRow>(),
    };
  }

  const authorIds = [...new Set(rows.map((row) => row.author_id).filter((id): id is string => Boolean(id)))];
  const categoryIds = [...new Set(rows.map((row) => row.category_id).filter((id): id is string => Boolean(id)))];
  const authorMediaIds: string[] = [];

  const [authorResult, categoryResult, tagRelationResult] = await Promise.all([
    authorIds.length
      ? admin.from("blog_authors").select("*").in("id", authorIds).eq("is_active", true)
      : Promise.resolve({ data: [] as AuthorRow[], error: null }),
    categoryIds.length
      ? admin.from("blog_categories").select("*").in("id", categoryIds).eq("is_active", true)
      : Promise.resolve({ data: [] as CategoryRow[], error: null }),
    admin.from("blog_post_tags").select("post_id,tag_id,sort_order").in("post_id", postIds).order("sort_order"),
  ]);

  if (authorResult.error) throw authorResult.error;
  if (categoryResult.error) throw categoryResult.error;
  if (tagRelationResult.error) throw tagRelationResult.error;

  for (const author of authorResult.data ?? []) {
    if (author.avatar_media_id) authorMediaIds.push(author.avatar_media_id);
  }

  const media = await loadPublicMedia(
    rows.flatMap((row) => [row.cover_media_id, row.social_image_media_id]).concat(authorMediaIds),
  );

  const tagIds = [...new Set((tagRelationResult.data ?? []).map((row) => row.tag_id))];
  const { data: tagRows, error: tagError } = tagIds.length
    ? await admin.from("blog_tags").select("*").in("id", tagIds).eq("is_active", true)
    : { data: [] as TagRow[], error: null };

  if (tagError) throw tagError;

  const tagById = new Map((tagRows ?? []).map((tag) => [tag.id, tagFromRow(tag)]));
  const tags = new Map<string, BlogTag[]>();

  for (const relation of tagRelationResult.data ?? []) {
    const tag = tagById.get(relation.tag_id);
    if (!tag) continue;
    const current = tags.get(relation.post_id) ?? [];
    current.push(tag);
    tags.set(relation.post_id, current);
  }

  return {
    authors: new Map((authorResult.data ?? []).map((row) => [row.id, row])),
    categories: new Map((categoryResult.data ?? []).map((row) => [row.id, row])),
    tags,
    media,
  };
}

function summaryFromRow(
  row: PostRow,
  relations: Awaited<ReturnType<typeof loadPostRelations>>,
): BlogPostSummary {
  const authorRow = row.author_id ? relations.authors.get(row.author_id) ?? null : null;
  const categoryRow = row.category_id ? relations.categories.get(row.category_id) ?? null : null;
  const cover = row.cover_media_id ? relations.media.get(row.cover_media_id) ?? null : null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverMediaUrl: cover ? getPublicMediaUrl(cover) : null,
    coverAltText: cover?.alt_text || cover?.display_name || null,
    publishedAt: row.published_at!,
    updatedAt: row.updated_at,
    isFeatured: row.is_featured,
    author: authorRow
      ? authorFromRow(
          authorRow,
          authorRow.avatar_media_id
            ? relations.media.get(authorRow.avatar_media_id) ?? null
            : null,
        )
      : null,
    category: categoryRow ? categoryFromRow(categoryRow) : null,
    tags: relations.tags.get(row.id) ?? [],
  };
}

function matchesSearch(post: BlogPostSummary, body: string, q: string) {
  const needle = q.toLowerCase();
  return [
    post.title,
    post.excerpt,
    body,
    post.author?.displayName ?? "",
    post.category?.name ?? "",
    ...post.tags.map((tag) => tag.name),
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export async function listPublishedBlogPosts(
  filters: BlogFilters = {},
): Promise<BlogPostSummary[]> {
  if (!isSupabaseConfigured()) return [];

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("status", "published")
    .is("archived_at", null)
    .not("published_at", "is", null)
    .lte("published_at", now)
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return [];

  const relations = await loadPostRelations(data);
  let items = data.map((row) => ({
    row,
    summary: summaryFromRow(row, relations),
  }));

  const q = filters.q?.trim();

  if (q) {
    items = items.filter(({ row, summary }) =>
      matchesSearch(summary, row.body_markdown, q),
    );
  }

  if (filters.category) {
    items = items.filter(
      ({ summary }) => summary.category?.slug === filters.category,
    );
  }

  if (filters.tag) {
    items = items.filter(({ summary }) =>
      summary.tags.some((tag) => tag.slug === filters.tag),
    );
  }

  const summaries = items.map((item) => item.summary);

  return typeof filters.limit === "number"
    ? summaries.slice(0, filters.limit)
    : summaries;
}

export async function getPublishedBlogPost(
  slug: string,
): Promise<BlogPostDetail | null> {
  if (!isSupabaseConfigured()) return null;

  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: row, error } = await admin
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .is("archived_at", null)
    .not("published_at", "is", null)
    .lte("published_at", now)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const relations = await loadPostRelations([row]);
  const summary = summaryFromRow(row, relations);

  const [serviceRelations, caseRelations] = await Promise.all([
    admin
      .from("blog_post_services")
      .select("service_id,sort_order")
      .eq("post_id", row.id)
      .order("sort_order"),
    admin
      .from("blog_post_case_studies")
      .select("case_study_id,sort_order")
      .eq("post_id", row.id)
      .order("sort_order"),
  ]);

  if (serviceRelations.error) throw serviceRelations.error;
  if (caseRelations.error) throw caseRelations.error;

  const serviceIds = (serviceRelations.data ?? []).map((item) => item.service_id);
  const caseIds = (caseRelations.data ?? []).map((item) => item.case_study_id);

  const [servicesResult, casesResult] = await Promise.all([
    serviceIds.length
      ? admin
          .from("services")
          .select("id,slug,title,short_description")
          .in("id", serviceIds)
          .eq("status", "published")
          .is("archived_at", null)
      : Promise.resolve({ data: [], error: null }),
    caseIds.length
      ? admin
          .from("case_studies")
          .select("id,slug,title,short_description")
          .in("id", caseIds)
          .eq("status", "published")
          .is("archived_at", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (servicesResult.error) throw servicesResult.error;
  if (casesResult.error) throw casesResult.error;

  const servicesById = new Map(
    (servicesResult.data ?? []).map((item) => [item.id, item]),
  );
  const casesById = new Map(
    (casesResult.data ?? []).map((item) => [item.id, item]),
  );

  const socialImage = row.social_image_media_id
    ? relations.media.get(row.social_image_media_id) ?? null
    : null;

  return {
    ...summary,
    bodyMarkdown: row.body_markdown,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    canonicalUrl: row.canonical_url,
    ogTitle: row.og_title,
    ogDescription: row.og_description,
    socialImageUrl: socialImage ? getPublicMediaUrl(socialImage) : summary.coverMediaUrl,
    socialImageAltText:
      socialImage?.alt_text ||
      socialImage?.display_name ||
      summary.coverAltText ||
      null,
    relatedServices: serviceIds.flatMap((id) => {
      const item = servicesById.get(id);
      return item
        ? [{
            id: item.id,
            slug: item.slug,
            title: item.title,
            href: `/services/${item.slug}`,
            description: item.short_description,
          }]
        : [];
    }),
    relatedCaseStudies: caseIds.flatMap((id) => {
      const item = casesById.get(id);
      return item
        ? [{
            id: item.id,
            slug: item.slug,
            title: item.title,
            href: `/work/${item.slug}`,
            description: item.short_description,
          }]
        : [];
    }),
  };
}

export async function listBlogTaxonomy() {
  if (!isSupabaseConfigured()) {
    return { categories: [] as BlogCategory[], tags: [] as BlogTag[] };
  }

  const admin = getSupabaseAdminClient();

  const [categoryResult, tagResult] = await Promise.all([
    admin
      .from("blog_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
    admin
      .from("blog_tags")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .order("name"),
  ]);

  if (categoryResult.error) throw categoryResult.error;
  if (tagResult.error) throw tagResult.error;

  return {
    categories: (categoryResult.data ?? []).map(categoryFromRow),
    tags: (tagResult.data ?? []).map(tagFromRow),
  };
}

export async function getBlogCategory(slug: string) {
  const { categories } = await listBlogTaxonomy();
  return categories.find((item) => item.slug === slug) ?? null;
}

export async function getBlogTag(slug: string) {
  const { tags } = await listBlogTaxonomy();
  return tags.find((item) => item.slug === slug) ?? null;
}
