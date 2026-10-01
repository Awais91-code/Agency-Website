# M04 — Media and File Management

## Goal

Create a consistent, secure way to upload, store, authorize and reuse public CMS imagery and private authenticated files.

## Implemented

- `public-media` and `private-files` Supabase Storage buckets with separate limits and visibility.
- `media_assets`, `file_references` and `file_access_grants` schema.
- Central `user_can_access_media()` authorization function and RLS/storage read policies.
- Server-side file validation for size, MIME, extension, file signature and supported image dimensions.
- Staff `/admin/media` library with upload, preview, metadata editing and soft archive.
- Reusable `MediaPicker` component for later CMS modules.
- Authenticated private file upload API and authorization-checked signed downloads.
- Activity records for upload, metadata updates and archive actions.
- Static media-boundary verification script.

## Deliberately deferred

- Full project-member-based file access is completed in M14.
- Image derivative/transformation service is deployment/provider-specific and is not hard-coded in M04.
- Malware scanning service integration is part of production hardening; M04 rejects unsupported executable/archive formats and documents the boundary.
- Physical deletion of archived storage objects is deferred to retention/cleanup operations.
