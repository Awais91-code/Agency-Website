import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleBody } from "@/components/blog/article-body";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPublishedBlogPost } from "@/features/blog/queries";
import {
  executeSeoRedirect,
  resolveSeoRedirect,
} from "@/features/blog/redirects";
import {
  blogPostMetadata,
  blogPostingJsonLd,
} from "@/features/blog/seo";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
    new Date(value),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    return {
      title: "Article not found",
      robots: { index: false, follow: false },
    };
  }

  return blogPostMetadata(post);
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedBlogPost(slug);

  if (!post) {
    const record = await resolveSeoRedirect(`/blog/${slug}`);
    if (record) executeSeoRedirect(record);
    notFound();
  }

  const jsonLd = blogPostingJsonLd(post);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article>
        <header className="border-b border-border/60 py-16 sm:py-20">
          <Container className="max-w-5xl">
            <Link
              href="/blog"
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Blog
            </Link>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {post.category ? (
                <Link
                  href={`/blog/category/${post.category.slug}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {post.category.name}
                </Link>
              ) : null}
              <span>{formatDate(post.publishedAt)}</span>
              {post.author ? <span>By {post.author.displayName}</span> : null}
            </div>

            <h1 className="mt-5 text-[clamp(2.8rem,7vw,6.2rem)] font-black leading-[0.95] tracking-[-0.055em]">
              {post.title}
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {post.excerpt}
            </p>

            {post.tags.length ? (
              <div className="mt-7 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </Container>
        </header>

        {post.coverMediaUrl ? (
          <Container className="max-w-6xl py-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverMediaUrl}
              alt={post.coverAltText || ""}
              className="aspect-[16/8] w-full rounded-[2rem] border border-border/70 object-cover"
            />
          </Container>
        ) : null}

        <section className="py-10 sm:py-16">
          <Container className="max-w-3xl">
            <ArticleBody markdown={post.bodyMarkdown} />
          </Container>
        </section>

        {post.author ? (
          <section className="border-y border-border/60 bg-card/35 py-10">
            <Container className="max-w-3xl">
              <div className="flex items-start gap-4">
                {post.author.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.displayName}
                    loading="lazy"
                    className="h-16 w-16 rounded-2xl object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-primary">
                    Author
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {post.author.displayName}
                  </h2>
                  {post.author.jobTitle ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {post.author.jobTitle}
                    </p>
                  ) : null}
                  {post.author.bio ? (
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {post.author.bio}
                    </p>
                  ) : null}
                </div>
              </div>
            </Container>
          </section>
        ) : null}

        {(post.relatedServices.length || post.relatedCaseStudies.length) ? (
          <section className="py-14 sm:py-20">
            <Container className="max-w-5xl">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                Continue exploring
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">
                Related agency capabilities and work.
              </h2>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {[...post.relatedServices, ...post.relatedCaseStudies].map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-[1.5rem] border border-border/70 bg-card p-5 transition hover:border-primary/30 hover:shadow-lg"
                    >
                      <h3 className="text-xl font-black">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            </Container>
          </section>
        ) : null}

        <section className="border-t border-border/60 py-14">
          <Container className="max-w-3xl rounded-[2rem] bg-foreground p-8 text-background">
            <h2 className="text-3xl font-black tracking-tight">
              Have a project in mind?
            </h2>
            <p className="mt-3 leading-7 text-background/70">
              Share the context with the agency team. Final scope, pricing and
              delivery commitments are confirmed by people after review.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-background text-foreground hover:bg-background/90"
              >
                <Link href="/start-a-project">Start a project</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-background/30 text-background"
              >
                <Link href="/contact">Contact the team</Link>
              </Button>
            </div>
          </Container>
        </section>
      </article>
    </>
  );
}
