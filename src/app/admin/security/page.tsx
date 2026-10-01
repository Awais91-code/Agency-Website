import Link from "next/link";

import { saveRetentionPolicyAction } from "@/app/admin/security/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSecurityAdminData } from "@/features/security/admin";
import { formatDateTime } from "@/features/leads/format";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminSecurityPage({ searchParams }: PageProps) {
  await requireAdmin();
  const [query, data] = await Promise.all([searchParams, getSecurityAdminData()]);

  const checks = [
    ["Production HTTPS origin", data.configuration.productionHttps],
    ["Turnstile keys configured", data.configuration.turnstileConfigured],
    ["Turnstile fail-closed mode", data.configuration.turnstileRequired],
    ["Independent security hash secret", data.configuration.securityHashConfigured],
    ["Cal.com webhook secret", data.configuration.bookingWebhookSigned],
    ["Resend webhook secret", data.configuration.emailWebhookSigned],
    ["n8n callback secret", data.configuration.automationCallbackSigned],
    ["Automation dispatch secret", data.configuration.automationDispatchSigned],
  ] as const;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            M18 · Security, privacy, audit & abuse prevention
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Security baseline</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Admin-only security metadata, abuse controls, retention rules and release-readiness checks. Secret values are never displayed here.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/audit">Open audit log</Link>
        </Button>
      </div>

      {query.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700">{query.error}</div>
      ) : null}
      {query.saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">Saved.</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Security events · 24h", data.summary.last24h],
          ["Warnings · 24h", data.summary.warnings24h],
          ["Critical · 24h", data.summary.critical24h],
          ["Audit actions · 24h", data.recentAuditCount],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Production configuration checklist</CardTitle>
          <CardDescription>
            This is configuration visibility only. Review the full release checklist in docs/SECURITY_RELEASE_CHECKLIST.md before launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {checks.map(([label, ready]) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm">
              <span>{label}</span>
              <span className={ready ? "font-black text-emerald-700" : "font-black text-amber-700"}>
                {ready ? "Ready" : "Review"}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="retention" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Operational retention rules</CardTitle>
          <CardDescription>
            These policies affect operational telemetry/log cleanup only. They do not automatically delete client projects or CRM business records.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.retention.map((policy) => (
            <form key={policy.policy_key} action={saveRetentionPolicyAction} className="grid gap-3 rounded-xl border border-border/70 p-4 lg:grid-cols-[1fr_9rem_2fr_auto] lg:items-end">
              <input type="hidden" name="policyKey" value={policy.policy_key} />
              <div>
                <p className="font-bold">{policy.policy_key}</p>
                <p className="mt-1 text-xs text-muted-foreground">{policy.resource_name}</p>
              </div>
              <label className="text-xs font-semibold">
                Days
                <input name="retentionDays" type="number" min={1} max={3650} defaultValue={policy.retention_days} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
              </label>
              <label className="text-xs font-semibold">
                Notes
                <input name="notes" defaultValue={policy.notes} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm font-normal" />
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold"><input name="enabled" type="checkbox" defaultChecked={policy.enabled} /> Enabled</label>
                <Button type="submit" size="sm" variant="outline">Save</Button>
              </div>
            </form>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent security events</CardTitle>
          <CardDescription>
            Metadata only: event type, route, hashed requester/user-agent fingerprints and safe diagnostics. Raw passwords, secrets, contact messages and private file contents are not stored here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.events.length ? data.events.map((event) => (
            <article key={event.id} className="grid gap-2 rounded-xl border border-border/70 p-3 text-sm lg:grid-cols-[1fr_7rem_1fr_1fr_auto]">
              <p className="font-semibold">{event.event_type}</p>
              <p className="text-xs font-bold uppercase text-muted-foreground">{event.severity}</p>
              <p className="truncate text-xs text-muted-foreground">{event.route || "—"}</p>
              <p className="truncate text-xs text-muted-foreground">{JSON.stringify(event.metadata)}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
            </article>
          )) : (
            <p className="text-sm text-muted-foreground">No security events yet.</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
