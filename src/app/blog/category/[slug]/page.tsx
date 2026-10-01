import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostCard } from "@/components/blog/post-card";
import { Container } from "@/components/ui/container";
import {
  getBlogCategory,
  listPublishedBlogPosts,
} from "@/features/blog/queries";
import {
  executeSeoRedirect,
  resolveSeoRedirect,
} from "@/features/blog/redirects";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getBlogCategory(slug);

  if (!category) {
    return {
      title: "Blog category not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: category.seoTitle || `${category.name} articles`,
    description:
      category.seoDescription ||
      category.description ||
      `Published articles in ${category.name}.`,
    alternates: { canonical: `/blog/category/${category.slug}` },
  };
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const [category, posts] = await Promise.all([
    getBlogCategory(slug),
    listPublishedBlogPosts({ category: slug }),
  ]);

  if (!category) {
    const record = await resolveSeoRedirect(`/blog/category/${slug}`);
    if (record) executeSeoRedirect(record);
    notFound();
  }

  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Link href="/blog" className="text-sm font-semibold text-primary hover:underline">
          ← All articles
        </Link>
        <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-primary">
          Category
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {category.description}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </div>

        {!posts.length ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No published articles in this category yet.
          </p>
        ) : null}
      </Container>
    </section>
  );
}
