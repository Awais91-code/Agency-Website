# M07 — Portfolio & Case Studies

M07 turns the M05 concept-work section into a database-backed portfolio/CMS.

## Public routes

- `/work` — published portfolio with shareable service, industry and technology filters.
- `/work/[slug]` — structured case-study detail page.
- Published M07 work can appear on the home page and service pages.

## Admin routes

- `/admin/case-studies`
- `/admin/case-studies/new`
- `/admin/case-studies/[id]`

Staff can manage project narrative, service relationships, hero/gallery media, technologies, tags, SEO, approved outcome metrics and testimonials.

## Proof policy

The public layer deliberately separates proof from draft claims:

- `case_study_metrics.is_approved = true` is required before a metric is rendered publicly.
- `case_studies.testimonial_approved = true` is required before a testimonial is rendered.
- Seed/fallback portfolio entries are labelled **Internal concept** and do not claim real client metrics.

## Media

M07 reuses M04 public `media_assets`. Private client files are not valid portfolio media.

## Service integration

`case_study_services` creates real service relationships for filters and related-work matching. M06's `related_case_study_slugs` are now resolved on service detail pages.

## Migration

`supabase/migrations/20260922014000_m07_case_studies.sql`

After local Supabase is healthy:

```powershell
npm run db:reset
npm run work:check
npm run dev
```
