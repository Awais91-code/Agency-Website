import Link from "next/link";

import {
  saveBlogAuthorAction,
  saveBlogCategoryAction,
  saveBlogTagAction,
  saveSeoRedirectAction,
} from "@/app/admin/blog/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBlogAdminData } from "@/features/blog/admin";
import { formatDateTime } from "@/features/leads/format";
import { requireStaff } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string; archived?: string }>;
};

export default async function AdminBlogPage({ searchParams }: PageProps) {
  await requireStaff();
  const [query, data] = await Promise.all([searchParams, getBlogAdminData()]);

  const draftCount = data.posts.filter((post) => post.status === "draft").length;
  const publishedCount = data.posts.filter((post) => post.status === "published").length;
  const scheduledCount = data.posts.filter(
    (post) =>
      post.status === "published" &&
      post.published_at &&
      new Date(post.published_at).getTime() > Date.now(),
  ).length;

  return (
    <section className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            M16 · Blog, SEO & distribution
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Blog CMS</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Articles, authors, taxonomy, search/social metadata, internal links and
            redirect management.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blog/new">New article</Link>
        </Button>
      </div>

      {query.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Drafts", draftCount],
          ["Published", publishedCount],
          ["Scheduled", scheduledCount],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Articles</CardTitle>
          <CardDescription>
            Drafts and future-scheduled posts are excluded from public reads and
            sitemap generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.posts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          ) : (
            data.posts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{post.title}</h2>
                    <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                      {post.status}
                    </span>
                    {post.status === "published" &&
                    post.published_at &&
                    new Date(post.published_at).getTime() > Date.now() ? (
                      <span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase text-amber-700">
                        scheduled
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /blog/{post.slug} · updated {formatDateTime(post.updated_at)}
                  </p>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/admin/blog/${post.id}`}>Edit</Link>
                </Button>
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <section id="authors" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Authors</h2>
          <p className="text-sm text-muted-foreground">
            Independent public bylines, bios and optional profile images.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add author</CardTitle></CardHeader>
            <CardContent>
              <AuthorForm media={data.media} />
            </CardContent>
          </Card>

          {data.authors.map((author) => (
            <Card key={author.id}>
              <CardContent className="p-5">
                <form action={saveBlogAuthorAction} className="grid gap-3">
                  <input type="hidden" name="id" value={author.id} />
                  <input
                    name="name"
                    defaultValue={author.display_name}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    name="slug"
                    defaultValue={author.slug}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    name="jobTitle"
                    defaultValue={author.job_title ?? ""}
                    placeholder="Role / title"
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <textarea
                    name="bio"
                    rows={3}
                    defaultValue={author.bio}
                    className="rounded-xl border border-border bg-background p-3 text-sm"
                  />
                  <select
                    name="avatarMediaId"
                    defaultValue={author.avatar_media_id ?? ""}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  >
                    <option value="">No avatar</option>
                    {data.media.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.display_name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={author.sort_order}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={author.is_active}
                    />
                    Active
                  </label>
                  <Button type="submit" size="sm" variant="outline">
                    Save author
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="categories" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Category slug changes create a permanent redirect automatically.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add category</CardTitle></CardHeader>
            <CardContent><CategoryForm /></CardContent>
          </Card>

          {data.categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-5">
                <form action={saveBlogCategoryAction} className="grid gap-3">
                  <input type="hidden" name="id" value={category.id} />
                  <input
                    name="name"
                    defaultValue={category.name}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    name="slug"
                    defaultValue={category.slug}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={category.description}
                    className="rounded-xl border border-border bg-background p-3 text-sm"
                  />
                  <input
                    name="seoTitle"
                    defaultValue={category.seo_title ?? ""}
                    placeholder="SEO title"
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <textarea
                    name="seoDescription"
                    rows={2}
                    defaultValue={category.seo_description ?? ""}
                    placeholder="SEO description"
                    className="rounded-xl border border-border bg-background p-3 text-sm"
                  />
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={category.sort_order}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={category.is_active}
                    />
                    Active
                  </label>
                  <Button type="submit" size="sm" variant="outline">
                    Save category
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="tags" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Tags</h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-lg">Add tag</CardTitle></CardHeader>
            <CardContent><TagForm /></CardContent>
          </Card>

          {data.tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent className="p-5">
                <form action={saveBlogTagAction} className="grid gap-3">
                  <input type="hidden" name="id" value={tag.id} />
                  <input
                    name="name"
                    defaultValue={tag.name}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <input
                    name="slug"
                    defaultValue={tag.slug}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <textarea
                    name="description"
                    rows={3}
                    defaultValue={tag.description}
                    className="rounded-xl border border-border bg-background p-3 text-sm"
                  />
                  <input
                    name="sortOrder"
                    type="number"
                    defaultValue={tag.sort_order}
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={tag.is_active}
                    />
                    Active
                  </label>
                  <Button type="submit" size="sm" variant="outline">
                    Save tag
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="redirects" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Redirect management</h2>
          <p className="text-sm text-muted-foreground">
            Use 308 for permanent URL changes and 307 for temporary moves.
          </p>
        </div>

        <Card>
          <CardContent className="p-5">
            <form
              action={saveSeoRedirectAction}
              className="grid gap-3 md:grid-cols-[1fr_1fr_8rem_auto] md:items-end"
            >
              <label className="text-sm font-semibold">
                Source path
                <input
                  name="sourcePath"
                  required
                  placeholder="/old-url"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Destination path
                <input
                  name="destinationPath"
                  required
                  placeholder="/new-url"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
                />
              </label>
              <label className="text-sm font-semibold">
                Status
                <select
                  name="statusCode"
                  defaultValue="308"
                  className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
                >
                  <option value="308">308</option>
                  <option value="307">307</option>
                </select>
              </label>
              <Button type="submit">Add redirect</Button>
              <input
                name="reason"
                placeholder="Reason / note"
                className="h-10 rounded-xl border border-border bg-background px-3 text-sm md:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="isActive" type="checkbox" defaultChecked />
                Active
              </label>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {data.redirects.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <form
                  action={saveSeoRedirectAction}
                  className="grid gap-3 lg:grid-cols-[1fr_1fr_7rem_1fr_auto] lg:items-end"
                >
                  <input type="hidden" name="id" value={item.id} />
                  <label className="text-xs font-semibold">
                    Source
                    <input
                      name="sourcePath"
                      defaultValue={item.source_path}
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Destination
                    <input
                      name="destinationPath"
                      defaultValue={item.destination_path}
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="text-xs font-semibold">
                    Status
                    <select
                      name="statusCode"
                      defaultValue={String(item.status_code)}
                      className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal"
                    >
                      <option value="308">308</option>
                      <option value="307">307</option>
                    </select>
                  </label>
                  <input
                    name="reason"
                    defaultValue={item.reason ?? ""}
                    placeholder="Reason"
                    className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                  <label className="flex items-center gap-2 text-xs font-semibold">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={item.is_active}
                    />
                    Active
                  </label>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  );
}

function AuthorForm({
  media,
}: {
  media: Array<{ id: string; display_name: string }>;
}) {
  return (
    <form action={saveBlogAuthorAction} className="grid gap-3">
      <input
        name="name"
        required
        placeholder="Display name"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <input
        name="slug"
        required
        placeholder="display-name"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <input
        name="jobTitle"
        placeholder="Role / title"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <textarea
        name="bio"
        rows={3}
        placeholder="Public bio"
        className="rounded-xl border border-border bg-background p-3 text-sm"
      />
      <select
        name="avatarMediaId"
        defaultValue=""
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      >
        <option value="">No avatar</option>
        {media.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.display_name}
          </option>
        ))}
      </select>
      <input
        name="sortOrder"
        type="number"
        defaultValue="100"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked />
        Active
      </label>
      <Button type="submit" size="sm">Create author</Button>
    </form>
  );
}

function CategoryForm() {
  return (
    <form action={saveBlogCategoryAction} className="grid gap-3">
      <input
        name="name"
        required
        placeholder="Category name"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <input
        name="slug"
        required
        placeholder="category-slug"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Description"
        className="rounded-xl border border-border bg-background p-3 text-sm"
      />
      <input
        name="seoTitle"
        placeholder="SEO title"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <textarea
        name="seoDescription"
        rows={2}
        placeholder="SEO description"
        className="rounded-xl border border-border bg-background p-3 text-sm"
      />
      <input
        name="sortOrder"
        type="number"
        defaultValue="100"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked />
        Active
      </label>
      <Button type="submit" size="sm">Create category</Button>
    </form>
  );
}

function TagForm() {
  return (
    <form action={saveBlogTagAction} className="grid gap-3">
      <input
        name="name"
        required
        placeholder="Tag name"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <input
        name="slug"
        required
        placeholder="tag-slug"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <textarea
        name="description"
        rows={3}
        placeholder="Description"
        className="rounded-xl border border-border bg-background p-3 text-sm"
      />
      <input
        name="sortOrder"
        type="number"
        defaultValue="100"
        className="h-10 rounded-xl border border-border bg-background px-3 text-sm"
      />
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked />
        Active
      </label>
      <Button type="submit" size="sm">Create tag</Button>
    </form>
  );
}
