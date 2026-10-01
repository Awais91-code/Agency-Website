import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { executeSeoRedirect, resolveSeoRedirect } from "@/features/blog/redirects";

import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { CaseStudyViewTracker } from "@/components/analytics/case-study-view-tracker";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPublishedCaseStudy, listPublishedCaseStudies } from "@/features/case-studies/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const study = await getPublishedCaseStudy(slug);
  if (!study) return { title: "Case study not found" };

  return {
    title: study.seoTitle ?? study.title,
    description: study.seoDescription ?? study.shortDescription,
    alternates: { canonical: `/work/${study.slug}` },
  };
}

export default async function CaseStudyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const study = await getPublishedCaseStudy(slug);
  if (!study) {
    const record = await resolveSeoRedirect(`/work/${slug}`);
    if (record) executeSeoRedirect(record);
    notFound();
  }

  const all = await listPublishedCaseStudies();
  const serviceIds = new Set(study.services.map((service) => service.id));
  const related = all
    .filter((item) => item.id !== study.id && item.services.some((service) => serviceIds.has(service.id)))
    .slice(0, 3);

  return (
    <>
      <CaseStudyViewTracker slug={study.slug} />
      <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-20 lg:py-24">
        <div className="page-orb page-orb-one" />
        <Container className="relative">
          <Link href="/work" className="text-sm font-semibold text-primary hover:underline">← All work</Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-[0.18em]">
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-primary">{study.projectLabel}</span>
                {study.industry ? <span className="text-muted-foreground">{study.industry}</span> : null}
              </div>
              <h1 className="mt-5 max-w-5xl text-[clamp(2.7rem,6vw,5.5rem)] font-black leading-[0.96] tracking-[-0.055em]">{study.heroTitle}</h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">{study.heroDescription}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {study.clientName ? <MetaCard label="Client" value={study.clientName} /> : <MetaCard label="Project context" value={study.projectLabel} />}
              {study.services.length ? <MetaCard label="Services" value={study.services.map((service) => service.title).join(" · ")} /> : null}
            </div>
          </div>

          <div className="mt-12 overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-primary/5">
            {study.heroMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={study.heroMediaUrl} alt="" className="aspect-[16/8] w-full object-cover" />
            ) : (
              <div className="hero-grid relative grid min-h-[22rem] place-items-center p-8 sm:min-h-[30rem]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_35%)]" />
                <div className="relative z-10 grid w-full max-w-4xl gap-4 rounded-[1.75rem] border border-border/70 bg-background/88 p-6 shadow-2xl backdrop-blur sm:grid-cols-[1.2fr_.8fr] sm:p-8">
                  <div className="rounded-2xl border border-border/70 bg-card p-5">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{study.projectLabel}</p>
                    <p className="mt-4 text-3xl font-black tracking-tight">{study.title}</p>
                    <div className="mt-7 grid gap-2">
                      <span className="h-3 w-4/5 rounded-full bg-muted" />
                      <span className="h-3 w-2/3 rounded-full bg-muted" />
                      <span className="h-3 w-3/4 rounded-full bg-muted" />
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-border/70 bg-card p-5">
                      <p className="text-xs font-bold text-muted-foreground">Architecture</p>
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((item) => <span key={item} className="h-10 rounded-lg bg-primary/12" />)}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-foreground p-5 text-background">
                      <p className="text-xs font-bold text-background/55">Outcome</p>
                      <p className="mt-3 text-lg font-black">Structured, reusable, ready to connect.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {study.metrics.length ? (
        <section className="border-b border-border/60 bg-card/35 py-10">
          <Container className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {study.metrics.map((metric) => (
              <article key={metric.id ?? `${metric.value}-${metric.label}`} className="rounded-2xl border border-border/70 bg-background p-5">
                <p className="text-3xl font-black tracking-tight text-primary">{metric.value}</p>
                <p className="mt-2 font-bold">{metric.label}</p>
                {metric.context ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{metric.context}</p> : null}
              </article>
            ))}
          </Container>
        </section>
      ) : null}

      <section className="py-18 sm:py-24">
        <Container className="grid gap-5 lg:grid-cols-3">
          <NarrativeBlock number="01" title="Problem" text={study.problem} />
          <NarrativeBlock number="02" title="Approach" text={study.approach} />
          <NarrativeBlock number="03" title="Solution" text={study.solution} />
        </Container>
      </section>

      <section className="border-y border-border/60 bg-foreground py-18 text-background sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-background/50">Outcome</p>
            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">What changed—and what this proof actually represents.</h2>
            <p className="mt-6 max-w-3xl whitespace-pre-line text-base leading-8 text-background/70">{study.resultSummary}</p>
          </div>
          <div className="rounded-[1.75rem] border border-background/15 bg-background/5 p-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-background/50">Technology & capability</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {study.technologies.map((item) => <span key={item} className="rounded-full border border-background/15 bg-background/8 px-3 py-1.5 text-sm font-semibold">{item}</span>)}
            </div>
            {study.tags.length ? <p className="mt-6 text-sm leading-6 text-background/55">{study.tags.join(" · ")}</p> : null}
          </div>
        </Container>
      </section>

      {study.gallery.length ? (
        <section className="py-18 sm:py-24">
          <Container>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Project gallery</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">Selected screens and project visuals.</h2>
            <div className="mt-9 grid gap-5 md:grid-cols-2">
              {study.gallery.map((media) => (
                <figure key={media.id ?? media.mediaAssetId} className="overflow-hidden rounded-[1.75rem] border border-border/70 bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={media.url} alt={media.altText} className="aspect-[16/10] w-full object-cover" />
                  {media.caption ? <figcaption className="p-4 text-sm leading-6 text-muted-foreground">{media.caption}</figcaption> : null}
                </figure>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {study.testimonialApproved && study.testimonialQuote ? (
        <section className="border-y border-border/60 bg-card/35 py-18 sm:py-24">
          <Container>
            <blockquote className="mx-auto max-w-4xl text-center">
              <p className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">“{study.testimonialQuote}”</p>
              {study.testimonialAttribution ? <footer className="mt-6 text-sm font-semibold text-muted-foreground">{study.testimonialAttribution}</footer> : null}
            </blockquote>
          </Container>
        </section>
      ) : null}

      <section className="py-18 sm:py-24">
        <Container className="rounded-[2rem] border border-border/70 bg-card p-7 sm:p-10 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Have a similar challenge?</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-tight">Turn the right project context into a clear delivery plan.</h2>
          </div>
          <Button asChild size="lg" className="mt-6 lg:mt-0"><Link href={study.ctaHref} data-analytics-event="case_study_cta_click" data-analytics-location="case-study-detail" data-analytics-case-study={study.slug}>{study.ctaLabel} <span aria-hidden="true">→</span></Link></Button>
        </Container>
      </section>

      {related.length ? (
        <section className="border-t border-border/60 py-18 sm:py-24">
          <Container>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Related work</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight">More work connected to the same capabilities.</h2>
            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => <CaseStudyCard key={item.id} study={item} />)}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/70 bg-card p-5"><p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className="mt-2 font-bold">{value}</p></div>;
}

function NarrativeBlock({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <article className="rounded-[1.75rem] border border-border/70 bg-card p-6 sm:p-7">
      <span className="text-xs font-black tracking-[0.18em] text-primary">{number}</span>
      <h2 className="mt-5 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{text}</p>
    </article>
  );
}
