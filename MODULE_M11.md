# M11 — Admin Dashboard & Content Management

## Goal

Give non-developers a safe operational console for content, leads and website configuration.

## Depends on

M02, M03, M04, M06, M07 and M09.

## Delivered

- Expanded admin overview
- Lead/booking/content operational counts
- Upcoming consultation summary
- Permission-aware admin navigation
- CMS for homepage/about content sections
- Testimonials with explicit permission gate
- General FAQ CMS
- Team profile CMS
- Existing service/case-study/media CMS linked into one content area
- Administrator-only global settings
- Public brand/contact/social settings
- Public homepage FAQ/testimonial integration
- Public About team integration
- Audit log table and admin viewer
- Audit logging for M11 content/settings plus M06/M07 publication/archive actions

## Routes

- `/admin`
- `/admin/content`
- `/admin/settings`
- `/admin/audit`

## Migration

`supabase/migrations/20260922062000_m11_admin_cms.sql`

## Safe local apply

```powershell
npx supabase migration up --local
npm run cms:check
npm run dev
```

Do not run `npm run db:reset` unless you intentionally want to wipe local database/Auth data.
