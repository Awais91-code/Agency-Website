import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPortalDate } from "@/features/portal/format";
import { getPortalDashboard } from "@/features/portal/queries";

export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const data = await getPortalDashboard();
  return <section className="space-y-8">
    <div><p className="text-sm font-semibold text-primary">M14 · Client portal</p><h1 className="mt-2 text-3xl font-black tracking-tight">Your projects</h1><p className="mt-2 max-w-3xl text-muted-foreground">Canonical project status, milestones, files, requests, approvals and recent activity in one private workspace.</p></div>
    {data.projects.length === 0 ? <Card><CardContent className="py-12 text-center"><h2 className="text-xl font-bold">No project workspace is assigned yet.</h2><p className="mt-2 text-muted-foreground">When the team assigns your account to a project, it will appear here.</p></CardContent></Card> : null}
    <div className="grid gap-5 lg:grid-cols-2">{data.projects.map(project => <Card key={project.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{project.name}</CardTitle><CardDescription className="mt-2">{project.client_status_label || project.status.replaceAll("_", " ")}</CardDescription></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black uppercase text-primary">{project.status}</span></div></CardHeader><CardContent><p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{project.summary || "Project details are being prepared."}</p><div className="mt-5 grid gap-2 text-sm sm:grid-cols-2"><p><b>Next action:</b> {project.next_action || "No action requested"}</p><p><b>Updated:</b> {formatPortalDate(project.updated_at)}</p></div><Button asChild className="mt-5"><Link href={`/portal/projects/${project.id}`}>Open workspace</Link></Button></CardContent></Card>)}</div>
    <div className="grid gap-5 xl:grid-cols-3">
      <Card><CardHeader><CardTitle>Pending approvals</CardTitle></CardHeader><CardContent className="space-y-3">{data.approvals.length ? data.approvals.map(a=><Link key={a.id} href={`/portal/projects/${a.project_id}`} className="block rounded-xl border p-3 hover:bg-muted"><b>{a.title}</b><p className="mt-1 text-xs text-muted-foreground">{formatPortalDate(a.created_at)}</p></Link>) : <p className="text-sm text-muted-foreground">Nothing waiting for approval.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recent requests</CardTitle></CardHeader><CardContent className="space-y-3">{data.requests.length ? data.requests.slice(0,6).map(r=><Link key={r.id} href={`/portal/projects/${r.project_id}`} className="block rounded-xl border p-3 hover:bg-muted"><b>{r.title}</b><p className="mt-1 text-xs text-muted-foreground">{r.status.replaceAll("_", " ")}</p></Link>) : <p className="text-sm text-muted-foreground">No requests yet.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent className="space-y-3">{data.activities.length ? data.activities.slice(0,8).map(a=><div key={a.id} className="border-b border-border/60 pb-3 last:border-0"><p className="text-sm font-semibold">{a.summary}</p><p className="mt-1 text-xs text-muted-foreground">{formatPortalDate(a.created_at)}</p></div>) : <p className="text-sm text-muted-foreground">No project activity yet.</p>}</CardContent></Card>
    </div>
  </section>;
}
