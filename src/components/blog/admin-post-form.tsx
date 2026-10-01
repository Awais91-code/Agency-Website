import Link from "next/link";

import {
  archiveBlogPostAction,
  saveBlogPostAction,
} from "@/app/admin/blog/actions";
import { Button } from "@/components/ui/button";
import type {
  getBlogAdminData,
  getBlogAdminPost,
} from "@/features/blog/admin";

type AdminData = Awaited<ReturnType<typeof getBlogAdminData>>;
type PostData = Awaited<ReturnType<typeof getBlogAdminPost>> | null;

export function AdminBlogPostForm({
  data,
  postData,
}: {
  data: AdminData;
  postData: PostData;
}) {
  const post = postData?.post ?? null;
  const tagIds = new Set(postData?.tagIds ?? []);
  const serviceIds = new Set(postData?.serviceIds ?? []);
  const caseStudyIds = new Set(postData?.caseStudyIds ?? []);

  return (
    <form action={saveBlogPostAction} className="space-y-8">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input type="hidden" name="currentStatus" value={post?.status ?? "draft"} />

      <section className="grid gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            Article
          </p>
          <h2 className="mt-2 text-2xl font-black">Editorial content</h2>
        </div>

        <label className="text-sm font-semibold">
          Title
          <input
            name="title"
            required
            minLength={4}
            maxLength={220}
            defaultValue={post?.title ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold">
          Slug
          <input
            name="slug"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            defaultValue={post?.slug ?? ""}
            placeholder="how-to-plan-a-web-platform"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold">
          Author
          <select
            name="authorId"
            defaultValue={post?.author_id ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          >
            <option value="">No author</option>
            {data.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.display_name}
                {author.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Category
          <select
            name="categoryId"
            defaultValue={post?.category_id ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          >
            <option value="">No category</option>
            {data.categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.is_active ? "" : " (inactive)"}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold lg:col-span-2">
          Excerpt
          <textarea
            name="excerpt"
            required
            minLength={30}
            maxLength={500}
            rows={3}
            defaultValue={post?.excerpt ?? ""}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold lg:col-span-2">
          Article body
          <textarea
            name="bodyMarkdown"
            required
            minLength={50}
            rows={20}
            defaultValue={post?.body_markdown ?? ""}
            placeholder={"## Section heading\n\nWrite paragraphs here.\n\n- Bullet item\n- Another item\n\n[Internal link](/services)"}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-mono text-sm font-normal leading-6"
          />
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            Safe subset: ## / ### headings, bullets, numbered lists, blockquotes,
            **bold**, `code` and internal/http(s) links.
          </span>
        </label>

        <div className="lg:col-span-2">
          <p className="text-sm font-semibold">Tags</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
              >
                <input
                  name="tagIds"
                  value={tag.id}
                  type="checkbox"
                  defaultChecked={tagIds.has(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            Media & publishing
          </p>
          <h2 className="mt-2 text-2xl font-black">Cover, status and timing</h2>
        </div>

        <label className="text-sm font-semibold">
          Cover image
          <select
            name="coverMediaId"
            defaultValue={post?.cover_media_id ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          >
            <option value="">No cover image</option>
            {data.media.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.display_name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Social / Open Graph image
          <select
            name="socialImageMediaId"
            defaultValue={post?.social_image_media_id ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          >
            <option value="">Use cover image</option>
            {data.media.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.display_name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm font-semibold">
          Publish at
          <input
            name="publishAt"
            defaultValue={post?.published_at ?? ""}
            placeholder="2026-09-25T10:00:00+05:00"
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
          <span className="mt-2 block text-xs font-normal text-muted-foreground">
            ISO 8601. Blank = now when publishing. Future dates stay hidden until
            their publish time.
          </span>
        </label>

        <label className="text-sm font-semibold">
          Sort order
          <input
            name="sortOrder"
            type="number"
            defaultValue={post?.sort_order ?? 100}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="flex items-center gap-2 text-sm font-semibold lg:col-span-2">
          <input
            name="isFeatured"
            type="checkbox"
            defaultChecked={post?.is_featured ?? false}
          />
          Feature this article
        </label>
      </section>

      <section className="grid gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            SEO
          </p>
          <h2 className="mt-2 text-2xl font-black">Search & social metadata</h2>
        </div>

        <label className="text-sm font-semibold">
          SEO title
          <input
            name="seoTitle"
            maxLength={80}
            defaultValue={post?.seo_title ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold">
          Canonical URL
          <input
            name="canonicalUrl"
            maxLength={500}
            defaultValue={post?.canonical_url ?? ""}
            placeholder="/blog/current-slug or https://..."
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold lg:col-span-2">
          SEO description
          <textarea
            name="seoDescription"
            maxLength={220}
            rows={3}
            defaultValue={post?.seo_description ?? ""}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold">
          Open Graph title
          <input
            name="ogTitle"
            maxLength={120}
            defaultValue={post?.og_title ?? ""}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
          />
        </label>

        <label className="text-sm font-semibold">
          Open Graph description
          <textarea
            name="ogDescription"
            maxLength={300}
            rows={3}
            defaultValue={post?.og_description ?? ""}
            className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal"
          />
        </label>
      </section>

      <section className="grid gap-5 rounded-[1.75rem] border border-border/70 bg-card p-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
            Internal links
          </p>
          <h2 className="mt-2 text-2xl font-black">
            Related services & case studies
          </h2>
        </div>

        <div>
          <p className="text-sm font-semibold">Services</p>
          <div className="mt-3 grid gap-2">
            {data.services.map((service) => (
              <label key={service.id} className="flex items-center gap-2 text-sm">
                <input
                  name="serviceIds"
                  value={service.id}
                  type="checkbox"
                  defaultChecked={serviceIds.has(service.id)}
                />
                {service.title}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold">Case studies</p>
          <div className="mt-3 grid gap-2">
            {data.caseStudies.map((study) => (
              <label key={study.id} className="flex items-center gap-2 text-sm">
                <input
                  name="caseStudyIds"
                  value={study.id}
                  type="checkbox"
                  defaultChecked={caseStudyIds.has(study.id)}
                />
                {study.title}
              </label>
            ))}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="save">
          Save
        </Button>
        <Button type="submit" name="intent" value="draft" variant="outline">
          Save as draft
        </Button>
        <Button type="submit" name="intent" value="publish" variant="outline">
          Publish / schedule
        </Button>

        {post?.status === "published" ? (
          <Button asChild variant="ghost">
            <Link href={`/blog/${post.slug}`} target="_blank">
              Open public URL
            </Link>
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function AdminBlogArchiveForm({ id }: { id: string }) {
  return (
    <form
      action={archiveBlogPostAction}
      className="mt-8 border-t border-border pt-6"
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="outline"
        className="border-red-500/40 text-red-700 hover:bg-red-500/10 hover:text-red-800"
      >
        Archive article
      </Button>
    </form>
  );
}
