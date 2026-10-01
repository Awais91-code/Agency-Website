# M03 — Authentication, Profiles and Role-Based Access Control

## Goal

Provide secure Supabase authentication, account recovery, invitation-based onboarding and server-enforced role boundaries for staff and clients.

## Implemented

- Cookie-based Supabase SSR auth via `@supabase/ssr`.
- Next.js 16 `proxy.ts` session refresh and anonymous protected-route redirect.
- Login, logout, forgot-password and reset-password flows.
- PKCE callback plus token-hash confirmation endpoint.
- Automatic profile and default client-role provisioning for new Auth users.
- Roles: `super_admin`, `admin`, `staff`, `client`.
- Protected `/admin` and `/portal` shells with server-side authorization.
- RLS baseline that lets staff operate business records while clients remain closed out until M14.
- Authenticated profile read/update API with self-only RLS enforcement.
- Admin invitation API with role assignment and invitation/activity audit records.
- Local invite/recovery email templates.
- Static auth-boundary verification script.

## Not in M03

- Complete admin dashboard/CMS (M11).
- Client project workspace and project membership policies (M14).
- Branded transactional application email system (M12).
- MFA/SSO.
