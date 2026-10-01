# M11 Admin Dashboard & Content Management

M11 adds the internal content/operations layer promised in the product specification.

## Routes

- `/admin` — operational overview
- `/admin/content` — selected page sections, testimonials, FAQs and team profiles
- `/admin/services` — service CMS from M06
- `/admin/case-studies` — portfolio CMS from M07
- `/admin/media` — media library from M04
- `/admin/settings` — administrator-only global settings
- `/admin/audit` — administrator-only audit view

## Permissions

Current role mapping:

- `staff`: operational CRM + content editing
- `admin`: staff capabilities + site settings + audit view
- `super_admin`: same M11 access as admin, plus existing user-management authority
- `client`: no admin access

This preserves the existing M03 role model while keeping security/global settings away from ordinary staff.

## Public content wired in M11

The public site now reads:

- `home.hero` from `content_sections`
- general homepage FAQs from `faqs`
- approved testimonials from `testimonials`
- `about.story` from `content_sections`
- published team profiles from `team_members`
- public contact/brand/social settings from `site_settings`

If Supabase is unavailable, safe code fallbacks remain in place for core public copy.

## Testimonials

A testimonial is public only when:

1. status is `published`;
2. `permission_granted = true`;
3. the record is not archived.

Do not publish a client quote until permission is documented.

## Audit

M11 introduces `audit_logs` for important business/admin actions. New M11 content/settings actions write audit records, and M06/M07 service/case-study publish/archive actions are upgraded to write audit entries too.

M12/M13 and later modules should reuse `recordAuditLog()` for privileged actions.

## Apply

Because local authentication is already configured, apply the migration without wiping local data:

```powershell
npx supabase migration up --local
npm run cms:check
npm run typecheck
npm run build
```
