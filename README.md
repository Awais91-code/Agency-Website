# Agency Portfolio Platform

A modular Next.js agency platform built through copy/replace patches.

Completed modules:

- M01 — Project Foundation & Design System
- M02 — Data Platform & Core Backend
- M03 — Authentication & RBAC
- M04 — Media & File Management
- M05 — Public Marketing Website
- M06 — Services & Service CMS
- M07 — Portfolio & Case Studies
- M08 — Smart Project Brief & Quote Engine

Current public routes include `/`, `/services`, `/services/[slug]`, `/work`, `/work/[slug]`, `/start-a-project`, `/quote/success`, `/about`, `/process`, `/contact`, `/privacy`, and `/terms`.

Protected staff routes include `/admin/services`, `/admin/media`, `/admin/case-studies`, and `/admin/quote-rules`.

M08 converts a project enquiry into structured data, an explainable indicative estimate and one canonical lead. Transactional email arrives in M12, automation in M13, and full lead-management UI in M09.

See `RUN.md`, each `MODULE_M*.md`, and the files under `docs/` for module-specific setup notes.


## M10 Consultation Booking

Public booking: `/book`. Admin configuration: `/admin/bookings`. Webhook: `/api/webhooks/booking`. See `MODULE_M10.md` and `docs/BOOKING.md`.


## M11 Admin Dashboard & CMS

Content: `/admin/content`. Global settings: `/admin/settings`. Audit: `/admin/audit`. See `MODULE_M11.md` and `docs/ADMIN_CMS.md`.


## M12 Email & Notification System

Admin delivery/log UI: `/admin/notifications`. Resend webhook endpoint: `/api/webhooks/email`. See `MODULE_M12.md` and `docs/NOTIFICATIONS.md`.


## M13 Automation Engine

Admin: `/admin/automation-logs`. n8n exports: `automation/n8n/workflows/v1`. See `docs/AUTOMATION_ENGINE.md`.


## M14 Client Portal

Client workspace: `/portal`. Staff projects: `/admin/projects`. See `MODULE_M14.md` and `docs/CLIENT_PORTAL.md`.


## M15 AI Website Assistant

Public AI widget + grounded server endpoint + explicit CRM handoff. Admin configuration/review: `/admin/ai`. See `MODULE_M15.md` and `docs/AI_ASSISTANT.md`.


## M16 Blog, SEO & Content Distribution

Public blog: `/blog`. CMS: `/admin/blog`. SEO infrastructure includes sitemap, robots, structured article metadata, redirects and RSS. See `MODULE_M16.md` and `docs/BLOG_SEO.md`.


## M17 Analytics & Conversion Tracking

Privacy-conscious first-party conversion events, UTM/referrer lead attribution, consent-aware optional provider integration and `/admin/analytics`. See `MODULE_M17.md` and `docs/ANALYTICS.md`.


## M18 Security, Privacy, Audit & Abuse Prevention

Cross-cutting hardening adds shared abuse controls, Turnstile, origin checks, admin-only security events, audit hardening, retention metadata and release security checks. See `MODULE_M18.md` and `docs/SECURITY.md`.


## M19 QA, Deployment, Monitoring & Release Operations

The final release module adds critical E2E coverage, release workflows, sanitized health/structured error telemetry, uptime checks, backup verification and operational/handover runbooks. See `MODULE_M19.md`, `docs/DEPLOYMENT_RELEASE.md`, `docs/OPERATIONS_RUNBOOK.md` and `docs/BACKUP_RESTORE.md`.
