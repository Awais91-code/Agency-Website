# M06 — Services & Service CMS

## Goal
Deliver structured, SEO-ready public service pages that staff can create, draft, publish, reorder and archive without editing code.

## Depends on
M02 data platform, M04 media management and M05 public marketing website.

## Delivered
- `/services` public service index.
- `/services/[slug]` dynamic service detail pages.
- `/admin/services`, create and edit screens.
- `services`, `service_faqs` and `service_relations` tables.
- Draft/publish/archive workflow with staff-only mutations.
- Service hero, problems, deliverables, outcomes, process, capabilities, pricing guidance, FAQs and related services.
- Optional M04 hero media selection.
- SEO title/description overrides and canonical service URL.
- Forward-compatible related case-study slug references for M07.
- RLS policies that expose only published services publicly.
- Activity events for save/publish/archive actions.

## Acceptance notes
A published service is publicly readable; drafts and archived services are not. Admin mutations require a staff session and are validated server-side. The service page remains usable without local Supabase by using clearly generic fallback service content, which is replaced by database content when Supabase is available.
