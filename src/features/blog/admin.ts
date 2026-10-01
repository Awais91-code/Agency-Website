import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { getPublicMediaUrl } from "@/lib/media/service";

export async function getBlogAdminData() {
  const admin = getSupabaseAdminClient();

  const [
    posts,
    authors,
    categories,
    tags,
    redirects,
    media,
    services,
    caseStudies,
  ] = await Promise.all([
    admin.from("blog_posts").select("*").order("updated_at", { ascending: false }),
    admin.from("blog_authors").select("*").order("sort_order").order("display_name"),
    admin.from("blog_categories").select("*").order("sort_order").order("name"),
    admin.from("blog_tags").select("*").order("sort_order").order("name"),
    admin.from("seo_redirects").select("*").order("created_at", { ascending: false }).limit(100),
    admin
      .from("media_assets")
      .select("*")
      .eq("visibility", "public")
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    admin
      .from("services")
      .select("id,slug,title")
      .eq("status", "published")
      .is("archived_at", null)
      .order("title"),
    admin
      .from("case_studies")
      .select("id,slug,title")
      .eq("status", "published")
      .is("archived_at", null)
      .order("title"),
  ]);

  for (const result of [
    posts,
    authors,
    categories,
    tags,
    redirects,
    media,
    services,
    caseStudies,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    posts: posts.data ?? [],
    authors: authors.data ?? [],
    categories: categories.data ?? [],
    tags: tags.data ?? [],
    redirects: redirects.data ?? [],
    media: (media.data ?? []).map((item) => ({
      ...item,
      publicUrl: getPublicMediaUrl(item),
    })),
    services: services.data ?? [],
    caseStudies: caseStudies.data ?? [],
  };
}

export async function getBlogAdminPost(id: string) {
  const admin = getSupabaseAdminClient();

  const [postResult, tagResult, serviceResult, caseResult] = await Promise.all([
    admin.from("blog_posts").select("*").eq("id", id).single(),
    admin.from("blog_post_tags").select("tag_id").eq("post_id", id),
    admin.from("blog_post_services").select("service_id").eq("post_id", id),
    admin.from("blog_post_case_studies").select("case_study_id").eq("post_id", id),
  ]);

  if (postResult.error || !postResult.data) {
    throw new Error(postResult.error?.message ?? "Blog post not found.");
  }

  for (const result of [tagResult, serviceResult, caseResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    post: postResult.data,
    tagIds: (tagResult.data ?? []).map((item) => item.tag_id),
    serviceIds: (serviceResult.data ?? []).map((item) => item.service_id),
    caseStudyIds: (caseResult.data ?? []).map((item) => item.case_study_id),
  };
}
