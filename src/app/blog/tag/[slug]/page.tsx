import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostCard } from "@/components/blog/post-card";
import { Container } from "@/components/ui/container";
import {
  getBlogTag,
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
  const tag = await getBlogTag(slug);

  if (!tag) {
    return {
      title: "Blog tag not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${tag.name} articles`,
    description: tag.description || `Published articles tagged ${tag.name}.`,
    alternates: { canonical: `/blog/tag/${tag.slug}` },
  };
}

export default async function BlogTagPage({ params }: PageProps) {
  const { slug } = await params;
  const [tag, posts] = await Promise.all([
    getBlogTag(slug),
    listPublishedBlogPosts({ tag: slug }),
  ]);

  if (!tag) {
    const record = await resolveSeoRedirect(`/blog/tag/${slug}`);
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
          Tag
        </p>
        <h1 className="mt-3 text-5xl font-black tracking-[-0.045em]">
          #{tag.name}
        </h1>
        {tag.description ? (
          <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
            {tag.description}
          </p>
        ) : null}

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => <BlogPostCard key={post.id} post={post} />)}
        </div>

        {!posts.length ? (
          <p className="mt-10 text-sm text-muted-foreground">
            No published articles use this tag yet.
          </p>
        ) : null}
      </Container>
    </section>
  );
}
