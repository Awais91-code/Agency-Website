import type * as React from "react";
import Link from "next/link";

import { archiveCaseStudyAction, saveCaseStudyAction } from "@/app/admin/case-studies/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Database } from "@/types/database";

type CaseStudyRow = Database["public"]["Tables"]["case_studies"]["Row"];
type MetricRow = Database["public"]["Tables"]["case_study_metrics"]["Row"];
type ServiceOption = Pick<Database["public"]["Tables"]["services"]["Row"], "id" | "slug" | "title" | "status">;
type MediaOption = { id: string; label: string; altText: string | null; publicUrl: string | null };

function lines(values: string[]) {
  return values.join("\n");
}

function metricLines(metrics: MetricRow[]) {
  return metrics
    .filter((metric) => metric.is_approved)
    .map((metric) => `${metric.value} | ${metric.label}${metric.context ? ` | ${metric.context}` : ""}`)
    .join("\n");
}

export function CaseStudyEditor({
  caseStudy,
  metrics,
  selectedServiceIds,
  selectedGalleryMediaIds,
  services,
  mediaOptions,
  message,
}: {
  caseStudy: CaseStudyRow | null;
  metrics: MetricRow[];
  selectedServiceIds: string[];
  selectedGalleryMediaIds: string[];
  services: ServiceOption[];
  mediaOptions: MediaOption[];
  message?: { kind: "success" | "error"; text: string } | null;
}) {
  const currentStatus = caseStudy?.status ?? "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M07 · Portfolio & case studies</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">{caseStudy ? caseStudy.title : "Create case study"}</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Build credible project stories with explicit service relationships, approved proof, public media and draft/publish control.
          </p>
        </div>
        <Button asChild variant="outline"><Link href="/admin/case-studies">Back to case studies</Link></Button>
      </div>

      {message ? (
        <div role="status" className={`rounded-xl border px-4 py-3 text-sm ${message.kind === "error" ? "border-red-500/30 bg-red-500/8 text-red-600" : "border-emerald-500/30 bg-emerald-500/8 text-emerald-700"}`}>
          {message.text}
        </div>
      ) : null}

      <form action={saveCaseStudyAction} className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <input type="hidden" name="id" value={caseStudy?.id ?? ""} />
        <input type="hidden" name="currentStatus" value={currentStatus} />

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project identity</CardTitle>
              <CardDescription>Use factual names and context. For demo/internal work, label it clearly rather than implying a client engagement.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Title" name="title" defaultValue={caseStudy?.title ?? ""} required maxLength={140} />
                <Field label="Slug" name="slug" defaultValue={caseStudy?.slug ?? ""} required maxLength={120} placeholder="project-name" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Project label" name="projectLabel" defaultValue={caseStudy?.project_label ?? "Case study"} required maxLength={80} placeholder="Case study / Internal concept" />
                <Field label="Client name" name="clientName" defaultValue={caseStudy?.client_name ?? ""} maxLength={160} placeholder="Leave blank when confidential or internal" />
              </div>
              <Field label="Industry" name="industry" defaultValue={caseStudy?.industry ?? ""} maxLength={140} />
              <TextArea label="Short description" name="shortDescription" defaultValue={caseStudy?.short_description ?? ""} rows={3} required hint="Used on portfolio cards. 20–360 characters." />
              <Field label="Hero title" name="heroTitle" defaultValue={caseStudy?.hero_title ?? ""} required maxLength={180} />
              <TextArea label="Hero description" name="heroDescription" defaultValue={caseStudy?.hero_description ?? ""} rows={4} required />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Case-study narrative</CardTitle>
              <CardDescription>Explain what changed and why. Avoid vague marketing claims or metrics that cannot be supported.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <TextArea label="Problem" name="problem" defaultValue={caseStudy?.problem ?? ""} rows={7} required />
              <TextArea label="Approach" name="approach" defaultValue={caseStudy?.approach ?? ""} rows={7} required />
              <TextArea label="Solution" name="solution" defaultValue={caseStudy?.solution ?? ""} rows={7} required />
              <TextArea label="Result / outcome summary" name="resultSummary" defaultValue={caseStudy?.result_summary ?? ""} rows={6} required hint="Give context. If this is a concept, say so explicitly." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Capabilities & filters</CardTitle>
              <CardDescription>One technology/tag per line. These values power the public portfolio filters.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <TextArea label="Technologies" name="technologies" defaultValue={lines(caseStudy?.technologies ?? [])} rows={7} />
              <TextArea label="Tags" name="tags" defaultValue={lines(caseStudy?.tags ?? [])} rows={7} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Approved proof only</CardTitle>
              <CardDescription>Metrics entered here are marked approved and rendered publicly. Format each line as <strong>Value | Label | Context</strong>.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <TextArea label="Approved outcome metrics" name="approvedMetrics" defaultValue={metricLines(metrics)} rows={6} hint="Example: 35% | Faster processing | Measured across the first 90 days. Do not enter an unsupported number." />
              <TextArea label="Testimonial quote" name="testimonialQuote" defaultValue={caseStudy?.testimonial_quote ?? ""} rows={5} />
              <Field label="Testimonial attribution" name="testimonialAttribution" defaultValue={caseStudy?.testimonial_attribution ?? ""} maxLength={240} placeholder="Name, role, company" />
              <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
                <input type="checkbox" name="testimonialApproved" defaultChecked={caseStudy?.testimonial_approved ?? false} className="mt-0.5 size-4" />
                <span><span className="font-semibold">Permission confirmed</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Only enable after the quote and attribution are approved for public publication.</span></span>
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion</CardTitle>
              <CardDescription>The case study should end with a relevant next action.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <Field label="CTA label" name="ctaLabel" defaultValue={caseStudy?.cta_label ?? "Start a similar project"} required maxLength={80} />
              <Field label="CTA href" name="ctaHref" defaultValue={caseStudy?.cta_href ?? "/start-a-project"} required maxLength={500} />
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
              <Field label="Sort order" name="sortOrder" type="number" defaultValue={String(caseStudy?.sort_order ?? 10)} required />
              <label className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-sm font-medium">
                <input type="checkbox" name="isFeatured" defaultChecked={caseStudy?.is_featured ?? false} className="size-4" />
                Feature on home / work surfaces
              </label>
              <div className="grid gap-2">
                <Button type="submit" name="intent" value="publish">{currentStatus === "published" ? "Save & keep published" : "Publish case study"}</Button>
                <Button type="submit" name="intent" value="draft" variant="outline">Save as draft</Button>
              </div>
              {caseStudy?.status === "published" ? (
                <Button asChild variant="ghost" className="w-full"><Link href={`/work/${caseStudy.slug}`} target="_blank">Open public page ↗</Link></Button>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Services</CardTitle><CardDescription>Used for portfolio filtering and related work on service pages.</CardDescription></CardHeader>
            <CardContent className="space-y-2">
              {services.length === 0 ? <p className="text-sm text-muted-foreground">No services are available yet.</p> : services.map((service) => (
                <label key={service.id} className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm">
                  <input type="checkbox" name="serviceIds" value={service.id} defaultChecked={selectedServiceIds.includes(service.id)} className="mt-0.5 size-4" />
                  <span><span className="font-semibold">{service.title}</span><span className="block text-xs text-muted-foreground">/{service.slug} · {service.status}</span></span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Hero media</CardTitle><CardDescription>Select one public M04 asset for the case-study hero.</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="heroMediaId">Public media asset</Label>
              <select id="heroMediaId" name="heroMediaId" defaultValue={caseStudy?.hero_media_id ?? ""} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Use generated visual placeholder</option>
                {mediaOptions.map((media) => <option key={media.id} value={media.id}>{media.label}</option>)}
              </select>
              <Button asChild size="sm" variant="outline"><Link href="/admin/media">Open media library</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Gallery</CardTitle><CardDescription>Select additional public media. Hero media is excluded from duplicate gallery insertion.</CardDescription></CardHeader>
            <CardContent className="max-h-[26rem] space-y-2 overflow-auto pr-1">
              {mediaOptions.length === 0 ? <p className="text-sm text-muted-foreground">Upload public media first.</p> : mediaOptions.map((media) => (
                <label key={media.id} className="flex items-start gap-3 rounded-xl border border-border px-3 py-3 text-sm">
                  <input type="checkbox" name="galleryMediaIds" value={media.id} defaultChecked={selectedGalleryMediaIds.includes(media.id)} className="mt-0.5 size-4" />
                  <span className="min-w-0"><span className="block truncate font-semibold">{media.label}</span><span className="block truncate text-xs text-muted-foreground">{media.altText || "No alt text yet"}</span></span>
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO</CardTitle><CardDescription>Optional overrides. Public metadata falls back to the case-study copy.</CardDescription></CardHeader>
            <CardContent className="space-y-5">
              <Field label="SEO title" name="seoTitle" defaultValue={caseStudy?.seo_title ?? ""} maxLength={70} />
              <TextArea label="Meta description" name="seoDescription" defaultValue={caseStudy?.seo_description ?? ""} rows={4} />
            </CardContent>
          </Card>
        </div>
      </form>

      {caseStudy ? (
        <Card className="border-red-500/20">
          <CardHeader><CardTitle>Archive case study</CardTitle><CardDescription>Removes the case study from public listings while retaining its record and activity history.</CardDescription></CardHeader>
          <CardContent>
            <form action={archiveCaseStudyAction}>
              <input type="hidden" name="id" value={caseStudy.id} />
              <Button type="submit" variant="outline">Archive case study</Button>
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
