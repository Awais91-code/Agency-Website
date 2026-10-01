import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  leadPriorities,
  leadPriorityLabels,
  leadStatuses,
  leadStatusLabels,
  priorityClass,
  statusClass,
  type LeadPriority,
  type LeadStatus,
} from "@/features/leads/constants";
import { formatDateTime } from "@/features/leads/format";
import { getLeadList } from "@/features/leads/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    owner?: string;
    source?: string;
    archived?: string;
    error?: string;
    saved?: string;
  }>;
};

export default async function AdminLeadsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const status = leadStatuses.includes(query.status as LeadStatus) ? (query.status as LeadStatus) : undefined;
  const priority = leadPriorities.includes(query.priority as LeadPriority) ? (query.priority as LeadPriority) : undefined;

  const { leads, owners, sources } = await getLeadList({
    q: query.q,
    status,
    priority,
    owner: query.owner,
    source: query.source,
    archived: query.archived === "yes" ? "yes" : undefined,
  });

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M09 · Lead CRM</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Search, qualify, assign and follow every enquiry from one traceable sales record.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/admin/pipeline">Pipeline board</Link></Button>
          <Button asChild><Link href="/start-a-project" target="_blank">Open project form</Link></Button>
        </div>
      </div>

      {query.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div>
      ) : null}
      {query.saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Lead updated.</div>
      ) : null}

      <Card>
        <CardContent className="p-5">
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <input
              name="q"
              defaultValue={query.q}
              placeholder="Name, email or company"
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <select name="status" defaultValue={status ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
              <option value="">All statuses</option>
              {leadStatuses.map((item) => <option key={item} value={item}>{leadStatusLabels[item]}</option>)}
            </select>
            <select name="priority" defaultValue={priority ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
              <option value="">All priorities</option>
              {leadPriorities.map((item) => <option key={item} value={item}>{leadPriorityLabels[item]}</option>)}
            </select>
            <select name="owner" defaultValue={query.owner ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
              <option value="">All owners</option>
              <option value="unassigned">Unassigned</option>
              {owners.map((owner) => (
                <option key={owner.userId} value={owner.userId}>
                  {owner.displayName ?? owner.userId.slice(0, 8)} · {owner.role.replace("_", " ")}
                </option>
              ))}
            </select>
            <select name="source" defaultValue={query.source ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm">
              <option value="">All sources</option>
              {sources.map((source) => <option key={source} value={source}>{source}</option>)}
            </select>
            <div className="flex gap-2">
              <label className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-border px-3 text-sm">
                <input type="checkbox" name="archived" value="yes" defaultChecked={query.archived === "yes"} />
                Archived
              </label>
              <Button type="submit" size="sm" className="h-10">Filter</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {leads.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No leads match these filters.</CardContent></Card>
        ) : leads.map((lead) => (
          <article key={lead.id} className="rounded-2xl border border-border/70 bg-card p-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(14rem,1.6fr)_minmax(10rem,1fr)_8rem_9rem_minmax(12rem,1fr)_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold">{lead.full_name || lead.email || "Unnamed lead"}</h2>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(lead.status)}`}>
                    {leadStatusLabels[lead.status]}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${priorityClass(lead.priority)}`}>
                    {leadPriorityLabels[lead.priority]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {lead.company_name || "No company"} · {lead.email || "No email"}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {lead.tags.map((tag) => <span key={tag} className="rounded-full bg-muted px-2 py-1 text-[11px] font-semibold">{tag}</span>)}
                </div>
              </div>

              <div className="text-sm">
                <p className="font-semibold">{lead.serviceType || "General enquiry"}</p>
                <p className="mt-1 text-muted-foreground">{lead.budgetBand || lead.source || "Unknown source"}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Score</p>
                <p className="mt-1 text-2xl font-black">{lead.lead_score}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Owner</p>
                <p className="mt-1 text-sm font-semibold">{lead.ownerName || "Unassigned"}</p>
              </div>

              <div className="text-sm">
                <p className="font-semibold">{lead.next_action || "No next action"}</p>
                <p className="mt-1 text-muted-foreground">
                  {lead.next_action_at ? formatDateTime(lead.next_action_at) : `Created ${formatDateTime(lead.created_at)}`}
                </p>
              </div>

              <Button asChild size="sm"><Link href={`/admin/leads/${lead.id}`}>Open</Link></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
