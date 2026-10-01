# M05 — Public Marketing Website

## Goal
Deliver the responsive, premium public-facing agency experience and the main conversion paths that later CMS, portfolio, lead, booking and analytics modules connect to.

## Depends on
- M01 Project Foundation
- Compatible with M02–M04 already applied

## Added in this patch
- Modern home page with hero, capability strip, service preview, concept work preview, process, principles, FAQ and CTA
- Production page structures for `/about`, `/process`, `/contact`, `/privacy` and `/terms`
- Responsive sticky header and mobile navigation
- Expanded footer and conversion links
- Reusable marketing components and centralized marketing content
- Reduced-motion-compatible visual motion and decorative system
- Honest concept placeholders instead of fabricated client names, testimonials or project outcomes
- Temporary email-based contact fallback until M08/M09 provide the structured brief + CRM lead transaction
- Marketing boundary verification script

## Intentionally deferred
- Dynamic service pages and service CMS → M06
- Real portfolio/case-study system → M07
- Smart project brief and estimate → M08
- CRM-backed contact/lead storage → M09
- Booking → M10
- CMS-controlled global marketing content → M11
- Analytics events → M17

## Acceptance notes
- All M05 routes must load without business data.
- Primary public navigation and CTAs remain usable on mobile and desktop.
- Motion respects the global `prefers-reduced-motion` override.
- Concept cards are not presented as real client results.
- Replace `hello@agency.example` before production launch.
