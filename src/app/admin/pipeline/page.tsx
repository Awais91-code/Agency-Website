import Link from "next/link";

import { Button } from "@/components/ui/button";
import { leadStatuses, leadStatusLabels, priorityClass } from "@/features/leads/constants";
import { getPipelineBoard } from "@/features/leads/queries";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { leads } = await getPipelineBoard();

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M09 · Pipeline</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Sales pipeline</h1>
          <p className="mt-2 text-muted-foreground">A status-based operating view. Change a lead stage from its detail screen so every transition is logged.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/leads">Lead list</Link></Button>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="grid min-w-[2200px] grid-cols-10 gap-4">
          {leadStatuses.map((status) => {
            const items = leads.filter((lead) => lead.status === status);
            return (
              <section key={status} className="rounded-2xl border border-border/70 bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h2 className="text-sm font-black">{leadStatusLabels[status]}</h2>
                  <span className="rounded-full bg-background px-2 py-1 text-xs font-bold">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">No leads</p> : null}
                  {items.map((lead) => (
                    <Link key={lead.id} href={`/admin/leads/${lead.id}`} className="block rounded-xl border border-border bg-card p-3 transition hover:border-primary/40">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold">{lead.full_name || lead.email || "Unnamed"}</p>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${priorityClass(lead.priority)}`}>{lead.priority}</span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{lead.company_name || lead.email || "No company"}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="font-bold">Score {lead.lead_score}</span>
                        <span className="text-muted-foreground">{lead.ownerName || "Unassigned"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
