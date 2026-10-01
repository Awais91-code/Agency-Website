# M16 Blog, SEO & Content Distribution

M16 adds the maintainable organic-content layer described in the project specification.

## Public routes

```text
/blog
/blog/[slug]
/blog/category/[slug]
/blog/tag/[slug]
/blog/rss.xml
/sitemap.xml
/robots.txt
```

`/blog` supports query-string search plus category/tag filtering.

## Publishing rules

A post is publicly readable only when all are true:

- `status = published`
- `archived_at IS NULL`
- `published_at IS NOT NULL`
- `published_at <= now()`

A future `published_at` acts as a scheduled publish time without exposing the article early.

Draft/future content is excluded from public article queries, blog lists, taxonomy archives, RSS and sitemap generation.

## Blog CMS

```text
/admin/blog
/admin/blog/new
/admin/blog/[id]
```

Staff can manage:

- posts;
- authors;
- categories;
- tags;
- cover/social media;
- publish date;
- featured/sort state;
- SEO title/description;
- canonical URL;
- Open Graph title/description/image;
- internal links to Services and Case Studies;
- redirects.

## Article content

The editor stores `body_markdown`.

The public renderer intentionally supports a safe subset instead of arbitrary HTML:

- `##` / `###` headings
- bullets and numbered lists
- blockquotes
- bold
- inline code
- internal/http(s) links

## Canonical, social metadata and structured data

Each article supports explicit:

- SEO title;
- SEO description;
- canonical URL;
- Open Graph title;
- Open Graph description;
- social image.

Fallbacks use the article title, excerpt and cover image.

Each published article emits `BlogPosting` JSON-LD.

The root metadata defines `metadataBase` from:

```env
NEXT_PUBLIC_APP_URL
```

Before production, set that variable to the real canonical production origin.

## Sitemap and robots

`src/app/sitemap.ts` includes key public static pages, published Services, published Case Studies,
published Blog posts whose publish time has arrived, and active blog categories/tags.

`src/app/robots.ts` references the sitemap and disallows private/admin/API/auth routes.

## Redirect strategy

`seo_redirects` supports:

- `308` permanent redirects
- `307` temporary redirects

Changing a blog article slug automatically creates:

```text
/blog/old-slug -> /blog/new-slug (308)
```

Changing a category/tag slug also creates a 308 mapping.

Archiving an article attempts to preserve the old URL with a permanent redirect to `/blog`.

Generic retired URLs can be managed in Admin → Blog → Redirect management. Redirect source and
destination are restricted to internal paths, self-redirects are rejected, and direct two-way loops
are blocked.

A catch-all public route resolves redirects for otherwise missing routes. Blog, Service and Work
detail routes also consult the redirect registry before returning 404.

## Internal linking

Article editors can associate published Services and Case Studies. These relationships render beneath
the article to improve discoverability and internal navigation.

## Content distribution

RSS:

```text
/blog/rss.xml
```

Save/publish/archive actions revalidate blog URLs, RSS and sitemap paths.

External social/newsletter automation is intentionally optional; publication does not depend on an
external automation provider.

## Apply

```powershell
npx supabase migration up --local
npm run blog:check
npm run dev
```

Do not run `npm run db:reset` unless you intentionally want to recreate local Auth/database data.
