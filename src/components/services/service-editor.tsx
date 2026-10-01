import type * as React from "react";
import Link from "next/link";

import { archiveServiceAction, saveServiceAction } from "@/app/admin/services/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseProcessSteps } from "@/features/services/types";
import type { Database } from "@/types/database";

type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type FaqRow = Database["public"]["Tables"]["service_faqs"]["Row"];

type RelatedOption = Pick<ServiceRow, "id" | "slug" | "title" | "status" | "sort_order" | "is_featured">;

type MediaOption = { id: string; label: string; publicUrl: string | null };

function lines(value: string[]) {
  return value.join("\n");
}

function processLines(service: ServiceRow | null) {
  if (!service) return "";
  return parseProcessSteps(service.process_steps).map((step) => `${step.title} | ${step.description}`).join("\n");
}

function faqLines(faqs: FaqRow[]) {
  return faqs.map((faq) => `${faq.question} | ${faq.answer}`).join("\n");
}

export function ServiceEditor({
  service,
  faqs,
  relatedIds,
  allServices,
  mediaOptions,
  message,
}: {
  service: ServiceRow | null;
  faqs: FaqRow[];
  relatedIds: string[];
  allServices: RelatedOption[];
  mediaOptions: MediaOption[];
  message?: { kind: "success" | "error"; text: string } | null;
}) {
  const isNew = !service;
  const currentStatus = service?.status ?? "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M06 · Service CMS</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">{isNew ? "Create service" : service.title}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">Manage public service content, publishing state, FAQs, related services and search metadata without editing code.</p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/services">Back to services</Link></Button>
      </div>

      {message ? (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "error" ? "border-red-500/30 bg-red-500/8 text-red-600" : "border-emerald-500/30 bg-emerald-500/8 text-emerald-700"}`}>
          {message.text}
        </div>
      ) : null}

      <form action={saveServiceAction} className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <input type="hidden" name="id" value={service?.id ?? ""} />
        <input type="hidden" name="currentStatus" value={currentStatus} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identity & hero</CardTitle>
              <CardDescription>Core copy shown in service listings and at the top of the service detail page.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title" name="title" defaultValue={service?.title ?? ""} required maxLength={120} />
                <Field label="Slug" name="slug" defaultValue={service?.slug ?? ""} required maxLength={120} placeholder="web-development" />
              </div>
              <Field label="Eyebrow" name="eyebrow" defaultValue={service?.eyebrow ?? ""} maxLength={80} placeholder="Web platforms" />
              <TextArea label="Short description" name="shortDescription" defaultValue={service?.short_description ?? ""} rows={3} required hint="20–320 characters. Used on service cards." />
              <Field label="Hero title" name="heroTitle" defaultValue={service?.hero_title ?? ""} required maxLength={180} />
              <TextArea label="Hero description" name="heroDescription" defaultValue={service?.hero_description ?? ""} rows={4} required hint="20–600 characters." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service content</CardTitle>
              <CardDescription>Enter one item per line. Process rows use <strong>Title | Description</strong>.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <TextArea label="Problems solved" name="problems" defaultValue={lines(service?.problems ?? [])} rows={7} />
              <TextArea label="Deliverables" name="deliverables" defaultValue={lines(service?.deliverables ?? [])} rows={7} />
              <TextArea label="Outcomes" name="outcomes" defaultValue={lines(service?.outcomes ?? [])} rows={7} />
              <TextArea label="Technologies / capabilities" name="technologies" defaultValue={lines(service?.technologies ?? [])} rows={7} />
              <div className="sm:col-span-2">
                <TextArea label="Process steps" name="processSteps" defaultValue={processLines(service)} rows={7} hint="Example: Discovery | Clarify goals, audience, constraints and integrations." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>FAQ</CardTitle>
              <CardDescription>One FAQ per line using <strong>Question | Answer</strong>. Saving replaces the service FAQ list with these rows.</CardDescription>
            </CardHeader>
            <CardContent>
              <TextArea label="Service FAQs" name="faqs" defaultValue={faqLines(faqs)} rows={9} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion & pricing guidance</CardTitle>
              <CardDescription>Pricing copy remains non-binding; custom quotes still require human review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <TextArea label="Pricing note" name="pricingNote" defaultValue={service?.pricing_note ?? ""} rows={3} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="CTA label" name="ctaLabel" defaultValue={service?.cta_label ?? "Start a project"} required maxLength={80} />
                <Field label="CTA href" name="ctaHref" defaultValue={service?.cta_href ?? "/start-a-project"} required maxLength={500} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="xl:sticky xl:top-6">
            <CardHeader>
              <CardTitle>Publish</CardTitle>
              <CardDescription>Current state: <span className="font-semibold text-foreground">{currentStatus}</span></CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Field label="Sort order" name="sortOrder" type="number" defaultValue={String(service?.sort_order ?? 10)} required />
              <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm font-medium">
                <input type="checkbox" name="isFeatured" defaultChecked={service?.is_featured ?? false} className="size-4" />
                Feature this service
              </label>
              <div className="grid gap-2">
                <Button type="submit" name="intent" value="publish">{currentStatus === "published" ? "Save & keep published" : "Publish service"}</Button>
                <Button type="submit" name="intent" value="draft" variant="outline">Save as draft</Button>
              </div>
              {service?.status === "published" ? (
                <Button asChild variant="ghost" className="w-full"><Link href={`/services/${service.slug}`} target="_blank">Open public page ↗</Link></Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hero media</CardTitle><CardDescription>Select a reusable public image from M04.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="heroMediaId">Public media asset</Label>
              <select id="heroMediaId" name="heroMediaId" defaultValue={service?.hero_media_id ?? ""} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">No hero image</option>
                {mediaOptions.map((media) => <option key={media.id} value={media.id}>{media.label}</option>)}
              </select>
              <Button asChild size="sm" variant="outline"><Link href="/admin/media">Open media library</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Related services</CardTitle><CardDescription>Explicit cross-links shown near the end of the public page.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {allServices.length === 0 ? <p className="text-sm text-muted-foreground">Create another service to add relationships.</p> : allServices.map((item) => (
                <label key={item.id} className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm">
                  <input type="checkbox" name="relatedServiceIds" value={item.id} defaultChecked={relatedIds.includes(item.id)} className="mt-0.5 size-4" />
                  <span><span className="font-semibold">{item.title}</span><span className="block text-xs text-muted-foreground">/{item.slug} · {item.status}</span></span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>M07 case-study references</CardTitle><CardDescription>Store slugs now; M07 resolves these into verified case-study links.</CardDescription></CardHeader>
            <CardContent><TextArea label="Related case-study slugs" name="relatedCaseStudySlugs" defaultValue={lines(service?.related_case_study_slugs ?? [])} rows={4} hint="One slug per line. Not rendered publicly until M07." /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO</CardTitle><CardDescription>Optional overrides. Page title/description fall back to service copy.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <Field label="SEO title" name="seoTitle" defaultValue={service?.seo_title ?? ""} maxLength={70} />
              <TextArea label="Meta description" name="seoDescription" defaultValue={service?.seo_description ?? ""} rows={4} />
            </CardContent>
          </Card>
        </div>
      </form>

      {service ? (
        <Card className="border-red-500/20">
          <CardHeader><CardTitle>Archive service</CardTitle><CardDescription>Archiving removes the service from public listings while retaining its record and activity history.</CardDescription></CardHeader>
          <CardContent>
            <form action={archiveServiceAction}>
              <input type="hidden" name="id" value={service.id} />
              <Button type="submit" variant="outline">Archive service</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, name, ...props }: React.ComponentProps<typeof Input> & { label: string; name: string }) {
  return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} {...props} /></div>;
}

function TextArea({ label, name, hint, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; name: string; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <textarea id={name} name={name} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring" {...props} />
      {hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
