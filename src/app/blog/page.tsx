import type { Metadata } from "next";
import Link from "next/link";

import { BlogPostCard } from "@/components/blog/post-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { env } from "@/config/env";
import {
  listBlogTaxonomy,
  listPublishedBlogPosts,
} from "@/features/blog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Practical notes on digital products, web platforms, design, automation and agency delivery.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: "/blog",
    title: `Blog | ${env.NEXT_PUBLIC_APP_NAME}`,
    description:
      "Practical notes on digital products, web platforms, design, automation and agency delivery.",
  },
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    tag?: string;
  }>;
};

export default async function BlogPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const q = query.q?.trim() || "";
  const category = query.category?.trim() || "";
  const tag = query.tag?.trim() || "";

  const [posts, taxonomy] = await Promise.all([
    listPublishedBlogPosts({
      q: q || undefined,
      category: category || undefined,
      tag: tag || undefined,
    }),
    listBlogTaxonomy(),
  ]);

  return (
    <>
      <section className="border-b border-border/60 py-16 sm:py-20">
        <Container>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
            Insights
          </p>
          <h1 className="mt-4 max-w-4xl text-[clamp(3rem,7vw,6rem)] font-black leading-[0.95] tracking-[-0.055em]">
            Useful thinking for better digital products.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Published agency articles on product strategy, design, engineering,
            automation and practical delivery.
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          <form
            action="/blog"
            className="grid gap-3 rounded-[1.5rem] border border-border/70 bg-card p-4 md:grid-cols-[1fr_13rem_13rem_auto]"
            role="search"
          >
            <label className="text-sm font-semibold">
              Search articles
              <input
                name="q"
                defaultValue={q}
                placeholder="Search title, topic or article text"
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Category
              <select
                name="category"
                defaultValue={category}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
              >
                <option value="">All categories</option>
                {taxonomy.categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold">
              Tag
              <select
                name="tag"
                defaultValue={tag}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 font-normal"
              >
                <option value="">All tags</option>
                {taxonomy.tags.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end gap-2">
              <Button type="submit">Filter</Button>
              {(q || category || tag) ? (
                <Button asChild variant="outline">
                  <Link href="/blog">Clear</Link>
                </Button>
              ) : null}
            </div>
          </form>

          <div className="mt-8 flex flex-wrap gap-2">
            {taxonomy.categories.map((item) => (
              <Link
                key={item.id}
                href={`/blog/category/${item.slug}`}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {posts.length ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-[1.75rem] border border-dashed border-border p-10 text-center">
              <h2 className="text-xl font-bold">No published articles matched.</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Try a broader search or clear the current filters.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
