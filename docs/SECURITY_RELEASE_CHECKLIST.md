# M18 Production Security Release Checklist

Complete this checklist before production launch/handover.

- [ ] Production `NEXT_PUBLIC_APP_URL` is HTTPS and canonical.
- [ ] Supabase production keys are configured only in deployment secret storage.
- [ ] No `.env.local`, provider key or private key is committed.
- [ ] `npm run security:scan` passes.
- [ ] `npm run security:check` passes.
- [ ] `npm run security:deps` has been reviewed for high/critical dependency findings.
- [ ] `npm run security:rls` passes against the intended staging/local database.
- [ ] Cross-client project/file isolation is verified.
- [ ] Admin-only audit/security RLS is verified.
- [ ] Turnstile production site/secret keys are configured.
- [ ] `TURNSTILE_REQUIRED=true` is enabled after hostname verification.
- [ ] Cal.com, Resend and n8n webhook/callback secrets are configured.
- [ ] Webhook signature failures return 401 and create safe security events.
- [ ] CSP works with Supabase, Cal.com, Turnstile and the selected analytics provider.
- [ ] Admin/client authentication redirects and session refresh still work under CSP.
- [ ] Public project brief rate limiting/honeypot/Turnstile are smoke-tested.
- [ ] Audit logs contain actor IDs for privileged actions and no raw secrets.
- [ ] `/admin/security` contains no secret values.
- [ ] Retention periods have been approved for the deployment jurisdiction/business policy.
- [ ] `npm run security:retention` has been tested on non-production data.
- [ ] Incident owner, credential-rotation access and escalation contacts are documented privately.
- [ ] Backup/restore and monitoring tasks continue in M19 before final handover.
