# M16 — Blog, SEO & Content Distribution

## Goal

Create a maintainable organic-search content layer with technically correct metadata and structured publishing.

## Depends on

M05 and M11.

## Delivered

- `/blog` index with search/category/tag filters
- `/blog/[slug]` article pages
- category and tag archive routes
- authors/categories/tags data model
- article CMS with draft/publish/scheduled/archive states
- cover/social media controls
- SEO title/description/canonical controls
- Open Graph and social image controls
- `BlogPosting` structured data
- production-origin-aware metadata base
- XML sitemap
- robots.txt
- RSS feed
- Service/Case Study internal linking
- redirect registry
- automatic permanent redirects after slug changes
- archived-post fallback redirect
- generic redirect catch-all
- sitemap/RSS revalidation on publishing changes
- M16 structural checker

## Migration

`supabase/migrations/20260923141000_m16_blog_seo.sql`
