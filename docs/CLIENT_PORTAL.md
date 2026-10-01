# M14 Client Portal & Project Workspace

M14 exposes canonical project data to authenticated clients without broadening client access to other projects.

## Public/authenticated routes

- `/portal` — assigned-project dashboard and recent activity
- `/portal/projects/[id]` — milestones, timeline, files, meetings, requests and approvals
- `/portal/files` — client-visible files across assigned projects

## Staff routes

- `/admin/projects`
- `/admin/projects/[id]`

Staff can create/update projects, assign client accounts, add milestones, upload private project files, request approvals and respond to client requests.

## Isolation model

`project_members` is the membership boundary. Client policies use `user_is_project_member(project_id)` and return no rows for unrelated projects. The portal query layer deliberately uses the signed-in Supabase client so the same RLS policies are exercised by normal reads.

Clients cannot directly update project status, milestones or approval rows. Approval decisions are performed server-side only after an authenticated RLS read proves that the pending approval is visible to the current member.

## Private files

M14 extends M04 `user_can_access_media()` so a private `media_asset` is readable when it is linked through a client-visible `project_files` record to an active project membership. Downloads continue through:

```text
/api/files/[media_asset_id]/download
```

The existing route performs authorization first and then creates a short-lived signed storage URL. Storage object paths are never exposed as permanent public links.

## Requests / approvals / timeline

Client requests, comments and approval decisions write `project_activities` records. Staff updates use the same canonical project tables, so portal status and the admin view are not separate copies.

## Notifications

M14 reuses M12 templates:

- onboarding when a client is assigned;
- project-update for client-visible project/milestone/file/request changes;
- admin-alert for client requests, comments and approval decisions.

Non-production M12 safety rules still apply.

## Client isolation E2E test

After applying the M14 migration to local Supabase:

```powershell
npm run portal:isolation
```

The script creates two temporary client accounts and two projects, verifies that each client sees only its own project/milestones/private-file metadata, verifies cross-project request insertion is denied, and then cleans up the temporary data.

## Apply

```powershell
npx supabase migration up --local
npm run portal:check
npm run portal:isolation
npm run dev
```

Do not use `npm run db:reset` unless you intentionally want to wipe local Auth/database data.
