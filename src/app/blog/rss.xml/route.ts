import { env } from "@/config/env";
import { listPublishedBlogPosts } from "@/features/blog/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const posts = await listPublishedBlogPosts({ limit: 50 });
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(env.NEXT_PUBLIC_APP_NAME)} Blog</title>
    <link>${escapeXml(`${base}/blog`)}</link>
    <description>${escapeXml("Published agency articles on digital products, design, development and automation.")}</description>
    ${posts
      .map(
        (post) => `<item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(`${base}/blog/${post.slug}`)}</link>
      <guid>${escapeXml(`${base}/blog/${post.slug}`)}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
    </item>`,
      )
      .join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control":
        "public, max-age=0, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
