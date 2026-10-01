import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

type PageProps = { searchParams: Promise<{ error?: string; archived?: string }> };

export default async function AdminServicesPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("services").select("*").is("archived_at", null).order("sort_order").order("title");
  if (error) throw new Error(`Could not load services: ${error.message}`);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M06 · Services</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Service CMS</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Create, order, draft and publish SEO-ready service pages without changing code.</p>
        </div>
        <Button asChild><Link href="/admin/services/new">Create service</Link></Button>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-600">{query.error}</div> : null}
      {query.archived ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Service archived.</div> : null}

      <div className="grid gap-4">
        {(data ?? []).length === 0 ? (
          <Card><CardContent className="py-10 text-center"><p className="text-muted-foreground">No services yet.</p><Button asChild className="mt-4"><Link href="/admin/services/new">Create the first service</Link></Button></CardContent></Card>
        ) : data?.map((service) => (
          <article key={service.id} className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">{service.title}</h2>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${service.status === "published" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"}`}>{service.status}</span>
                {service.is_featured ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Featured</span> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">/services/{service.slug} · order {service.sort_order}</p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{service.short_description}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              {service.status === "published" ? <Button asChild size="sm" variant="outline"><Link href={`/services/${service.slug}`} target="_blank">View</Link></Button> : null}
              <Button asChild size="sm"><Link href={`/admin/services/${service.id}`}>Edit</Link></Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
