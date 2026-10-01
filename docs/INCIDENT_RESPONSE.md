# Incident Response Basics

This is an operational starter runbook, not a substitute for an organization-specific incident plan.

## 1. Triage

Identify what is affected: public site, authentication, client isolation, storage, automation, email,
booking, analytics or administrative access. Preserve relevant timestamps, request IDs and provider event
IDs. Do not copy passwords, API keys or private file contents into tickets/chat logs.

## 2. Contain

Use the smallest safe containment action: disable a compromised integration, rotate the affected secret,
disable an account, pause automation dispatch, or temporarily disable the affected public action. Avoid
deleting evidence before the incident scope is understood.

## 3. Investigate

Review admin audit logs, `/admin/security`, provider logs and deployment logs. Correlate request IDs/event
IDs where available. Confirm whether client-to-client isolation or private-file access was affected.

## 4. Eradicate and recover

Patch the root cause, rotate exposed credentials, revoke stale sessions where necessary, redeploy from a
known-good revision and run security/RLS/smoke checks before restoring normal operation.

## 5. Communicate

Use the organization's approved legal/privacy process for notification decisions. Do not speculate about
impact before evidence is available. Keep a dated incident timeline and owner for each remediation item.

## 6. Post-incident

Record the root cause, detection gap, remediation, follow-up tests and any retention/monitoring changes.
Feed repeatable checks into M19 release/monitoring automation.
