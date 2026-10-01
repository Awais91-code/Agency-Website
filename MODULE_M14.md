# M14 — Client Portal & Project Workspace

Goal: give authenticated clients a branded, isolated workspace for project status, milestones, private files, meetings, requests, approvals and activity.

Delivered:
- `/portal`, `/portal/projects/[id]`, `/portal/files`
- staff `/admin/projects` management
- project membership boundary and client RLS
- project milestones and next actions
- private project files using M04 signed-download authorization
- client requests/comments
- approval decisions
- project activity timeline
- M12 onboarding/project/admin notifications
- meeting visibility for assigned project leads
- automated local client-isolation E2E test

Migration: `supabase/migrations/20260923002000_m14_client_portal.sql`
