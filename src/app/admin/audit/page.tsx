import { Card, CardContent } from "@/components/ui/card";
import { getAuditLogs } from "@/features/content/admin";
import { formatDateTime } from "@/features/leads/format";
import { requireAuditAccess } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  await requireAuditAccess();
  const logs = await getAuditLogs();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">M18 · Privileged audit visibility</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Audit log</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Admin-only view of attributable privileged actions. Secret-like metadata keys are redacted before persistence.</p>
      </div>

      <div className="grid gap-3">
        {logs.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No audit events yet.</CardContent></Card>
        ) : logs.map((log) => (
          <article key={log.id} className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
              <div>
                <p className="font-bold">{log.action}</p>
                <p className="mt-1 text-xs text-muted-foreground">{log.object_type} · {log.object_id || "—"}</p>
              </div>
              <div className="text-sm">
                <p className="font-semibold">{log.actorName || "System / service"}</p>
                <p className="text-xs text-muted-foreground">{log.actor_user_id || "No actor ID"}</p>
                {log.request_id ? <p className="text-xs text-muted-foreground">Request {log.request_id}</p> : null}
              </div>
              <pre className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-foreground">{JSON.stringify(log.metadata)}</pre>
              <p className="text-xs text-muted-foreground">{formatDateTime(log.created_at)}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
