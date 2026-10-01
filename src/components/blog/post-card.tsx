import Link from "next/link";

import type { BlogPostSummary } from "@/features/blog/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function BlogPostCard({ post }: { post: BlogPostSummary }) {
  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-xl">
      <Link href={`/blog/${post.slug}`} className="block">
        {post.coverMediaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverMediaUrl}
            alt={post.coverAltText || ""}
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
        ) : (
          <div className="hero-grid aspect-[16/9] border-b border-border/60" />
        )}
      </Link>

      <div className="p-6">
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          {post.category ? (
            <Link
              href={`/blog/category/${post.category.slug}`}
              className="text-primary hover:underline"
            >
              {post.category.name}
            </Link>
          ) : null}
          <span>{formatDate(post.publishedAt)}</span>
          {post.author ? <span>By {post.author.displayName}</span> : null}
        </div>

        <h2 className="mt-4 text-2xl font-black tracking-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="transition group-hover:text-primary"
          >
            {post.title}
          </Link>
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {post.excerpt}
        </p>

        {post.tags.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {post.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog/tag/${tag.slug}`}
                className="rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-primary"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
