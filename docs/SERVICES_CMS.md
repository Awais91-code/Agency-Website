# Services CMS

## Public routes
- `/services`
- `/services/[slug]`

Only rows with `status = published`, `published_at` set and no `archived_at` are intended for public use.

## Admin routes
- `/admin/services`
- `/admin/services/new`
- `/admin/services/[id]`

The editor supports structured list fields by using one item per line. Process and FAQ rows use the format:

```text
Title | Description
```

## Database
M06 adds:
- `services`
- `service_faqs`
- `service_relations`

`related_case_study_slugs` is intentionally stored but not rendered until M07 introduces the canonical case-study model.

## Media
The hero can reference a public M04 `media_assets` record. Private files are not accepted as public service hero media.

## Publishing
- **Save as draft** hides the service publicly.
- **Publish service** sets the published state and timestamp.
- **Save & keep published** updates an already-published service without taking it offline.
- **Archive** removes it from the public site while retaining history.

## Development fallback
If Supabase is not configured or temporarily unavailable, the public service pages use generic fallback content so the marketing UI can still be reviewed. Admin CMS screens still require the database because they are operational tools.
