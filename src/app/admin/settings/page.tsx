import { saveSiteSettingsAction } from "@/app/admin/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSettingsAdminData } from "@/features/content/admin";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default async function AdminSettingsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const [query, rows] = await Promise.all([searchParams, getSettingsAdminData()]);
  const map = new Map(rows.map((row) => [row.key, asString(row.value)]));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">M11 · Global settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Site settings</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Administrator-only brand, contact, social, CTA and default SEO settings.</p>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div> : null}
      {query.saved ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Settings saved.</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Public site configuration</CardTitle>
          <CardDescription>Changes here are immediately available to server-rendered public sections after revalidation.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveSiteSettingsAction} className="grid gap-5 lg:grid-cols-2">
            {[
              ["agencyName", "Agency name", map.get("agency.name")],
              ["email", "Public email", map.get("contact.email")],
              ["phone", "Public phone", map.get("contact.phone")],
              ["location", "Location / service area", map.get("contact.location")],
              ["linkedin", "LinkedIn URL", map.get("social.linkedin")],
              ["github", "GitHub URL", map.get("social.github")],
              ["primaryCtaLabel", "Primary CTA label", map.get("cta.primary_label")],
              ["primaryCtaHref", "Primary CTA URL", map.get("cta.primary_href")],
              ["seoTitle", "Default SEO title", map.get("seo.default_title")],
              ["seoDescription", "Default SEO description", map.get("seo.default_description")],
            ].map(([name, label, current]) => (
              <label key={name} className="text-sm font-semibold">
                {label}
                <input name={name} defaultValue={current ?? ""} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" />
              </label>
            ))}
            <label className="lg:col-span-2 text-sm font-semibold">
              Agency description
              <textarea name="agencyDescription" rows={4} defaultValue={map.get("agency.description") ?? ""} className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal" />
            </label>
            <div className="lg:col-span-2">
              <Button type="submit">Save settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
