# Media & File Management — M04

M04 creates two deliberately separate storage classes.

## Buckets

- `public-media`: public, cacheable CMS imagery. Staff upload only through `/api/admin/media` in V1. JPEG, PNG and WebP; max 8 MB.
- `private-files`: authenticated documents/images. Max 20 MB. Access is delivered through short-lived signed URLs.

## Security model

Storage paths are not treated as authorization. `media_assets` is the canonical metadata record and `user_can_access_media(asset_id)` decides whether an authenticated user can read a private object. Staff can read all active assets. A user can read a private asset they uploaded or one explicitly granted through `file_access_grants`.

M14 will extend project access through project membership. Until then, clients cannot gain access merely by guessing a project/file UUID.

## Public media upload

Open `/admin/media` as a staff user. The server validates size, MIME type, extension, magic bytes and image dimensions before using the service-role storage client. Metadata is stored in `media_assets`; public URLs are generated from Supabase Storage.

## Private file upload API

Authenticated users may `POST multipart/form-data` to `/api/files` using the `file` field. Downloads go through `/api/files/[id]/download`, which checks authorization before issuing a short-lived signed URL.

## Referencing files from later modules

Use `file_references` instead of copying bucket/object paths into service, case-study or project tables. It supports a stable asset ID plus an entity relationship. M06/M07 will use this for CMS media relationships; M14 will use it for project files.

## Image policy

Keep source uploads reasonable and serve responsive derivatives where the deployment stack supports transformation. Do not upload SVG through the media library because active SVG content can create script/security issues when served directly. Preserve meaningful `alt_text`; use an empty alt only for decorative imagery.

## Archive and cleanup

Admin archive is a soft archive. The object stays in Storage so existing references are not broken accidentally. A future maintenance job may physically purge archived, unreferenced objects after the retention window.
