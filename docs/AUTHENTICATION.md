# M03 Authentication and RBAC

M03 uses Supabase Auth with cookie-based SSR through `@supabase/ssr`.

## Roles

- `super_admin`: highest application role. Bootstrap manually; not assignable through the API.
- `admin`: can invite staff and client users.
- `staff`: may use protected operational data but cannot manage user roles.
- `client`: authenticated account with no access to staff business data. Project-specific client access is added in M14.

## Route boundaries

- `/login`, `/forgot-password`, `/reset-password`: authentication UI.
- `/admin/*`: verified session plus `super_admin`, `admin`, or `staff`.
- `/portal/*`: verified session; M14 later adds project-specific client workspace policies.

`src/proxy.ts` refreshes the cookie-backed session and performs only the optimistic anonymous redirect. Sensitive authorization is repeated in Server Components/actions and PostgreSQL RLS.

## Password reset and invite links

The application supports both PKCE callbacks (`/auth/callback`) and server-side token-hash confirmation (`/auth/confirm`). Local templates under `supabase/templates/` use the token-hash flow.

For hosted Supabase, configure Invite and Recovery templates to use the same `/auth/confirm` pattern if you want SSR token-hash verification.

## Profile endpoint

Authenticated users can read/update their own safe profile fields through `GET/PATCH /api/profile`. RLS also prevents changing another user's profile row.

## Invitation endpoint

`POST /api/admin/invitations`

```json
{ "email": "client@example.com", "role": "client" }
```

Role assignment:

- super admin -> admin/staff/client
- admin -> staff/client
- staff/client -> denied

## Bootstrap the first administrator

Create an Auth user in local Studio or the hosted dashboard, copy the UUID, then run in a trusted SQL environment:

```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'super_admin')
on conflict (user_id)
do update set role = excluded.role, assigned_at = now();
```

Never add a public "make me admin" route. Never expose `SUPABASE_SECRET_KEY` to the browser.
