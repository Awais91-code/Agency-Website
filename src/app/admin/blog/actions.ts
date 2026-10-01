"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { recordAuditLog } from "@/lib/audit/log";
import { requireStaff } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase words separated by hyphens.",
  );

const internalPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .refine(
    (value) =>
      value.startsWith("/") &&
      !value.startsWith("//") &&
      !/\s/.test(value),
    "Use an internal path beginning with a single / and no spaces.",
  );

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parsePublishedAt(raw: string, shouldPublish: boolean) {
  if (!shouldPublish) return null;
  if (!raw) return new Date().toISOString();

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Publish date must be a valid ISO 8601 date/time.");
  }

  return date.toISOString();
}

function refreshBlog(slug?: string, oldSlug?: string | null) {
  revalidatePath("/blog");
  revalidatePath("/blog/rss.xml");
  revalidatePath("/sitemap.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
  if (oldSlug && oldSlug !== slug) revalidatePath(`/blog/${oldSlug}`);
}

async function savePermanentRedirect({
  sourcePath,
  destinationPath,
  userId,
  reason,
}: {
  sourcePath: string;
  destinationPath: string;
  userId: string;
  reason: string;
}) {
  if (sourcePath === destinationPath) return;

  const admin = getSupabaseAdminClient();

  const { data: reverse } = await admin
    .from("seo_redirects")
    .select("id")
    .eq("source_path", destinationPath)
    .eq("destination_path", sourcePath)
    .eq("is_active", true)
    .maybeSingle();

  if (reverse) throw new Error("Redirect would create a two-way loop.");

  const { error } = await admin.from("seo_redirects").upsert(
    {
      source_path: sourcePath,
      destination_path: destinationPath,
      status_code: 308,
      is_active: true,
      reason,
      created_by: userId,
      updated_by: userId,
    },
    { onConflict: "source_path" },
  );

  if (error) throw new Error(error.message);
}

const postSchema = z.object({
  id: z.union([z.string().uuid(), z.literal("")]),
  slug: slugSchema,
  title: z.string().trim().min(4).max(220),
  excerpt: z.string().trim().min(30).max(500),
  bodyMarkdown: z.string().trim().min(50).max(120000),
  authorId: z.union([z.string().uuid(), z.literal("")]),
  categoryId: z.union([z.string().uuid(), z.literal("")]),
  coverMediaId: z.union([z.string().uuid(), z.literal("")]),
  socialImageMediaId: z.union([z.string().uuid(), z.literal("")]),
  seoTitle: z.string().trim().max(80),
  seoDescription: z.string().trim().max(220),
  canonicalUrl: z.string().trim().max(500),
  ogTitle: z.string().trim().max(120),
  ogDescription: z.string().trim().max(300),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
  publishAt: z.string().trim().max(100),
});

export async function saveBlogPostAction(formData: FormData) {
  const auth = await requireStaff();

  const parsed = postSchema.safeParse({
    id: value(formData, "id"),
    slug: value(formData, "slug"),
    title: value(formData, "title"),
    excerpt: value(formData, "excerpt"),
    bodyMarkdown: value(formData, "bodyMarkdown"),
    authorId: value(formData, "authorId"),
    categoryId: value(formData, "categoryId"),
    coverMediaId: value(formData, "coverMediaId"),
    socialImageMediaId: value(formData, "socialImageMediaId"),
    seoTitle: value(formData, "seoTitle"),
    seoDescription: value(formData, "seoDescription"),
    canonicalUrl: value(formData, "canonicalUrl"),
    ogTitle: value(formData, "ogTitle"),
    ogDescription: value(formData, "ogDescription"),
    sortOrder: value(formData, "sortOrder"),
    publishAt: value(formData, "publishAt"),
  });

  const target =
    parsed.success && parsed.data.id
      ? `/admin/blog/${parsed.data.id}`
      : "/admin/blog/new";

  if (!parsed.success) {
    redirect(
      `${target}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid article.",
      )}`,
    );
  }

  if (
    parsed.data.canonicalUrl &&
    !parsed.data.canonicalUrl.startsWith("/") &&
    !/^https?:\/\//i.test(parsed.data.canonicalUrl)
  ) {
    redirect(
      `${target}?error=${encodeURIComponent(
        "Canonical URL must be an internal path or an http(s) URL.",
      )}`,
    );
  }

  const intent = value(formData, "intent") || "save";
  const rawCurrentStatus = value(formData, "currentStatus") || "draft";
  const currentStatus =
    rawCurrentStatus === "published" || rawCurrentStatus === "draft"
      ? rawCurrentStatus
      : "draft";
  const nextStatus =
    intent === "publish"
      ? "published"
      : intent === "draft"
        ? "draft"
        : currentStatus;

  let publishedAt: string | null;

  try {
    publishedAt = parsePublishedAt(
      parsed.data.publishAt,
      nextStatus === "published",
    );
  } catch (error) {
    redirect(
      `${target}?error=${encodeURIComponent(
        error instanceof Error ? error.message : "Invalid publish date.",
      )}`,
    );
  }

  const admin = getSupabaseAdminClient();
  let oldSlug: string | null = null;

  if (parsed.data.id) {
    const { data: current, error } = await admin
      .from("blog_posts")
      .select("slug")
      .eq("id", parsed.data.id)
      .single();

    if (error || !current) {
      redirect(
        `${target}?error=${encodeURIComponent(
          error?.message ?? "Article not found.",
        )}`,
      );
    }

    oldSlug = current.slug;
  }

  const payload = {
    slug: parsed.data.slug,
    title: parsed.data.title,
    excerpt: parsed.data.excerpt,
    body_markdown: parsed.data.bodyMarkdown,
    author_id: parsed.data.authorId || null,
    category_id: parsed.data.categoryId || null,
    cover_media_id: parsed.data.coverMediaId || null,
    social_image_media_id: parsed.data.socialImageMediaId || null,
    status: nextStatus as "draft" | "published" | "archived",
    is_featured: formData.get("isFeatured") === "on",
    sort_order: parsed.data.sortOrder,
    published_at: publishedAt,
    seo_title: parsed.data.seoTitle || null,
    seo_description: parsed.data.seoDescription || null,
    canonical_url: parsed.data.canonicalUrl || null,
    og_title: parsed.data.ogTitle || null,
    og_description: parsed.data.ogDescription || null,
    archived_at: null,
    updated_by: auth.userId,
  };

  let postId = parsed.data.id;

  if (postId) {
    const { error } = await admin
      .from("blog_posts")
      .update(payload)
      .eq("id", postId);

    if (error) {
      redirect(`${target}?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const { data, error } = await admin
      .from("blog_posts")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) {
      redirect(
        `/admin/blog/new?error=${encodeURIComponent(
          error?.message ?? "Could not create article.",
        )}`,
      );
    }

    postId = data.id;
  }

  if (!postId) {
    redirect("/admin/blog?error=Article%20could%20not%20be%20resolved");
  }

  const validIds = (name: string) =>
    [...new Set(formData.getAll(name).map(String))].filter((id) =>
      z.string().uuid().safeParse(id).success,
    );

  const tagIds = validIds("tagIds");
  const serviceIds = validIds("serviceIds");
  const caseStudyIds = validIds("caseStudyIds");

  const [tagDelete, serviceDelete, caseDelete] = await Promise.all([
    admin.from("blog_post_tags").delete().eq("post_id", postId),
    admin.from("blog_post_services").delete().eq("post_id", postId),
    admin.from("blog_post_case_studies").delete().eq("post_id", postId),
  ]);

  for (const result of [tagDelete, serviceDelete, caseDelete]) {
    if (result.error) {
      redirect(
        `/admin/blog/${postId}?error=${encodeURIComponent(result.error.message)}`,
      );
    }
  }

  if (tagIds.length) {
    const { error } = await admin.from("blog_post_tags").insert(
      tagIds.map((tagId, index) => ({
        post_id: postId,
        tag_id: tagId,
        sort_order: (index + 1) * 10,
      })),
    );
    if (error) {
      redirect(`/admin/blog/${postId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (serviceIds.length) {
    const { error } = await admin.from("blog_post_services").insert(
      serviceIds.map((serviceId, index) => ({
        post_id: postId,
        service_id: serviceId,
        sort_order: (index + 1) * 10,
      })),
    );
    if (error) {
      redirect(`/admin/blog/${postId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (caseStudyIds.length) {
    const { error } = await admin.from("blog_post_case_studies").insert(
      caseStudyIds.map((caseStudyId, index) => ({
        post_id: postId,
        case_study_id: caseStudyId,
        sort_order: (index + 1) * 10,
      })),
    );
    if (error) {
      redirect(`/admin/blog/${postId}?error=${encodeURIComponent(error.message)}`);
    }
  }

  if (oldSlug && oldSlug !== parsed.data.slug) {
    try {
      await savePermanentRedirect({
        sourcePath: `/blog/${oldSlug}`,
        destinationPath: `/blog/${parsed.data.slug}`,
        userId: auth.userId,
        reason: "Automatic redirect created after blog slug change.",
      });
    } catch (error) {
      redirect(
        `/admin/blog/${postId}?error=${encodeURIComponent(
          error instanceof Error
            ? error.message
            : "Could not create slug redirect.",
        )}`,
      );
    }
  }

  await admin.from("activity_events").insert({
    entity_type: "blog_post",
    entity_id: postId,
    event_type:
      nextStatus === "published" ? "blog_post.published" : "blog_post.saved",
    actor_user_id: auth.userId,
    source: "admin",
    metadata: {
      slug: parsed.data.slug,
      status: nextStatus,
      published_at: publishedAt,
    },
  });

  await recordAuditLog({
    actorUserId: auth.userId,
    action:
      nextStatus === "published" ? "blog_post.published" : "blog_post.saved",
    objectType: "blog_post",
    objectId: postId,
    metadata: {
      slug: parsed.data.slug,
      previous_slug: oldSlug,
      status: nextStatus,
      published_at: publishedAt,
    },
  });

  refreshBlog(parsed.data.slug, oldSlug);
  revalidatePath("/admin/blog");
  redirect(`/admin/blog/${postId}?saved=1`);
}

export async function archiveBlogPostAction(formData: FormData) {
  const auth = await requireStaff();
  const id = value(formData, "id");

  if (!z.string().uuid().safeParse(id).success) {
    redirect("/admin/blog?error=Invalid%20article");
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("blog_posts")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
      updated_by: auth.userId,
    })
    .eq("id", id)
    .select("slug")
    .single();

  if (error || !data) {
    redirect(
      `/admin/blog?error=${encodeURIComponent(
        error?.message ?? "Could not archive article.",
      )}`,
    );
  }

  try {
    await savePermanentRedirect({
      sourcePath: `/blog/${data.slug}`,
      destinationPath: "/blog",
      userId: auth.userId,
      reason:
        "Automatic fallback redirect created when blog post was archived.",
    });
  } catch {
    // Archiving remains authoritative even if an old redirect needs manual review.
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "blog_post.archived",
    objectType: "blog_post",
    objectId: id,
    metadata: { slug: data.slug },
  });

  refreshBlog(data.slug);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?archived=1");
}

const commonTaxonomy = z.object({
  id: z.union([z.string().uuid(), z.literal("")]),
  slug: slugSchema,
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().max(5000),
  sortOrder: z.coerce.number().int().min(-10000).max(10000),
});

export async function saveBlogAuthorAction(formData: FormData) {
  const auth = await requireStaff();

  const parsed = commonTaxonomy
    .omit({ description: true })
    .extend({
      bio: z.string().trim().max(5000),
      jobTitle: z.string().trim().max(180),
      avatarMediaId: z.union([z.string().uuid(), z.literal("")]),
    })
    .safeParse({
      id: value(formData, "id"),
      slug: value(formData, "slug"),
      name: value(formData, "name"),
      sortOrder: value(formData, "sortOrder"),
      bio: value(formData, "bio"),
      jobTitle: value(formData, "jobTitle"),
      avatarMediaId: value(formData, "avatarMediaId"),
    });

  if (!parsed.success) {
    redirect(
      `/admin/blog?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid author.",
      )}#authors`,
    );
  }

  const admin = getSupabaseAdminClient();
  const payload = {
    slug: parsed.data.slug,
    display_name: parsed.data.name,
    bio: parsed.data.bio,
    job_title: parsed.data.jobTitle || null,
    avatar_media_id: parsed.data.avatarMediaId || null,
    is_active: formData.get("isActive") === "on",
    sort_order: parsed.data.sortOrder,
    updated_by: auth.userId,
  };

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin.from("blog_authors").update(payload).eq("id", id);
    if (error) {
      redirect(`/admin/blog?error=${encodeURIComponent(error.message)}#authors`);
    }
  } else {
    const { data, error } = await admin
      .from("blog_authors")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(
          error?.message ?? "Could not create author.",
        )}#authors`,
      );
    }

    id = data.id;
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "blog_author.saved",
    objectType: "blog_author",
    objectId: id,
  });

  revalidatePath("/blog");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=author#authors");
}

export async function saveBlogCategoryAction(formData: FormData) {
  const auth = await requireStaff();

  const parsed = commonTaxonomy
    .extend({
      seoTitle: z.string().trim().max(80),
      seoDescription: z.string().trim().max(220),
    })
    .safeParse({
      id: value(formData, "id"),
      slug: value(formData, "slug"),
      name: value(formData, "name"),
      description: value(formData, "description"),
      sortOrder: value(formData, "sortOrder"),
      seoTitle: value(formData, "seoTitle"),
      seoDescription: value(formData, "seoDescription"),
    });

  if (!parsed.success) {
    redirect(
      `/admin/blog?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid category.",
      )}#categories`,
    );
  }

  const admin = getSupabaseAdminClient();
  let previousSlug: string | null = null;

  if (parsed.data.id) {
    const { data } = await admin
      .from("blog_categories")
      .select("slug")
      .eq("id", parsed.data.id)
      .maybeSingle();
    previousSlug = data?.slug ?? null;
  }

  const payload = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    seo_title: parsed.data.seoTitle || null,
    seo_description: parsed.data.seoDescription || null,
    is_active: formData.get("isActive") === "on",
    sort_order: parsed.data.sortOrder,
    updated_by: auth.userId,
  };

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin
      .from("blog_categories")
      .update(payload)
      .eq("id", id);
    if (error) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(error.message)}#categories`,
      );
    }
  } else {
    const { data, error } = await admin
      .from("blog_categories")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(
          error?.message ?? "Could not create category.",
        )}#categories`,
      );
    }

    id = data.id;
  }

  if (previousSlug && previousSlug !== parsed.data.slug) {
    await savePermanentRedirect({
      sourcePath: `/blog/category/${previousSlug}`,
      destinationPath: `/blog/category/${parsed.data.slug}`,
      userId: auth.userId,
      reason: "Automatic redirect created after blog category slug change.",
    });
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "blog_category.saved",
    objectType: "blog_category",
    objectId: id,
  });

  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=category#categories");
}

export async function saveBlogTagAction(formData: FormData) {
  const auth = await requireStaff();

  const parsed = commonTaxonomy.safeParse({
    id: value(formData, "id"),
    slug: value(formData, "slug"),
    name: value(formData, "name"),
    description: value(formData, "description"),
    sortOrder: value(formData, "sortOrder"),
  });

  if (!parsed.success) {
    redirect(
      `/admin/blog?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid tag.",
      )}#tags`,
    );
  }

  const admin = getSupabaseAdminClient();
  let previousSlug: string | null = null;

  if (parsed.data.id) {
    const { data } = await admin
      .from("blog_tags")
      .select("slug")
      .eq("id", parsed.data.id)
      .maybeSingle();
    previousSlug = data?.slug ?? null;
  }

  const payload = {
    slug: parsed.data.slug,
    name: parsed.data.name,
    description: parsed.data.description,
    is_active: formData.get("isActive") === "on",
    sort_order: parsed.data.sortOrder,
    updated_by: auth.userId,
  };

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin.from("blog_tags").update(payload).eq("id", id);
    if (error) {
      redirect(`/admin/blog?error=${encodeURIComponent(error.message)}#tags`);
    }
  } else {
    const { data, error } = await admin
      .from("blog_tags")
      .insert({ ...payload, created_by: auth.userId })
      .select("id")
      .single();

    if (error || !data) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(
          error?.message ?? "Could not create tag.",
        )}#tags`,
      );
    }

    id = data.id;
  }

  if (previousSlug && previousSlug !== parsed.data.slug) {
    await savePermanentRedirect({
      sourcePath: `/blog/tag/${previousSlug}`,
      destinationPath: `/blog/tag/${parsed.data.slug}`,
      userId: auth.userId,
      reason: "Automatic redirect created after blog tag slug change.",
    });
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "blog_tag.saved",
    objectType: "blog_tag",
    objectId: id,
  });

  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=tag#tags");
}

export async function saveSeoRedirectAction(formData: FormData) {
  const auth = await requireStaff();

  const parsed = z
    .object({
      id: z.union([z.string().uuid(), z.literal("")]),
      sourcePath: internalPathSchema,
      destinationPath: internalPathSchema,
      statusCode: z.coerce
        .number()
        .int()
        .refine((value) => value === 307 || value === 308),
      reason: z.string().trim().max(500),
    })
    .safeParse({
      id: value(formData, "id"),
      sourcePath: value(formData, "sourcePath"),
      destinationPath: value(formData, "destinationPath"),
      statusCode: value(formData, "statusCode"),
      reason: value(formData, "reason"),
    });

  if (!parsed.success) {
    redirect(
      `/admin/blog?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid redirect.",
      )}#redirects`,
    );
  }

  if (parsed.data.sourcePath === parsed.data.destinationPath) {
    redirect(
      "/admin/blog?error=Redirect%20source%20and%20destination%20must%20be%20different#redirects",
    );
  }

  const admin = getSupabaseAdminClient();
  const { data: reverse } = await admin
    .from("seo_redirects")
    .select("id")
    .eq("source_path", parsed.data.destinationPath)
    .eq("destination_path", parsed.data.sourcePath)
    .eq("is_active", true)
    .maybeSingle();

  if (reverse) {
    redirect(
      "/admin/blog?error=Redirect%20would%20create%20a%20two-way%20loop#redirects",
    );
  }

  const payload = {
    source_path: parsed.data.sourcePath,
    destination_path: parsed.data.destinationPath,
    status_code: parsed.data.statusCode,
    is_active: formData.get("isActive") === "on",
    reason: parsed.data.reason || null,
    updated_by: auth.userId,
  };

  let id = parsed.data.id;

  if (id) {
    const { error } = await admin.from("seo_redirects").update(payload).eq("id", id);
    if (error) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(error.message)}#redirects`,
      );
    }
  } else {
    const { data, error } = await admin
      .from("seo_redirects")
      .upsert(
        { ...payload, created_by: auth.userId },
        { onConflict: "source_path" },
      )
      .select("id")
      .single();

    if (error || !data) {
      redirect(
        `/admin/blog?error=${encodeURIComponent(
          error?.message ?? "Could not save redirect.",
        )}#redirects`,
      );
    }

    id = data.id;
  }

  await recordAuditLog({
    actorUserId: auth.userId,
    action: "seo_redirect.saved",
    objectType: "seo_redirect",
    objectId: id,
    metadata: {
      source_path: parsed.data.sourcePath,
      destination_path: parsed.data.destinationPath,
      status_code: parsed.data.statusCode,
    },
  });

  revalidatePath(parsed.data.sourcePath);
  revalidatePath("/admin/blog");
  redirect("/admin/blog?saved=redirect#redirects");
}
