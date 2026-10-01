import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { executeSeoRedirect, resolveSeoRedirect } from "@/features/blog/redirects";

import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { getPublishedCaseStudiesBySlugs } from "@/features/case-studies/queries";
import { getPublishedService } from "@/features/services/queries";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const service = await getPublishedService(slug);
  if (!service) return { title: "Service not found" };

  return {
    title: service.seoTitle ?? service.title,
    description: service.seoDescription ?? service.shortDescription,
    alternates: { canonical: `/services/${service.slug}` },
  };
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const service = await getPublishedService(slug);
  if (!service) {
    const record = await resolveSeoRedirect(`/services/${slug}`);
    if (record) executeSeoRedirect(record);
    notFound();
  }
  const relatedCaseStudies = await getPublishedCaseStudiesBySlugs(service.relatedCaseStudySlugs);

  return (
    <>
      <section className="relative overflow-hidden border-b border-border/60 py-16 sm:py-20 lg:py-24">
        <div className="page-orb page-orb-one" />
        <Container className="relative grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <div>
            <Link href="/services" className="text-sm font-semibold text-primary hover:underline">← All services</Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.22em] text-primary">{service.eyebrow ?? service.title}</p>
            <h1 className="mt-4 max-w-4xl text-[clamp(2.7rem,6vw,5.4rem)] font-black leading-[0.96] tracking-[-0.055em]">{service.heroTitle}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{service.heroDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link href={service.ctaHref}>{service.ctaLabel} <span aria-hidden="true">→</span></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/process">See our process</Link></Button>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-2xl shadow-primary/5">
            {service.heroMediaUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.heroMediaUrl} alt="" className="aspect-[4/3] h-full w-full object-cover" />
            ) : (
              <div className="hero-grid relative grid aspect-[4/3] place-items-center p-8">
                <div className="relative z-10 max-w-sm rounded-2xl border border-border/70 bg-background/90 p-6 shadow-xl backdrop-blur">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Service system</p>
                  <p className="mt-3 text-2xl font-black tracking-tight">{service.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">Structured scope, reusable delivery and a clear path from enquiry to launch.</p>
                </div>
              </div>
            )}
          </div>
        </Container>
      </section>

      {(service.problems.length || service.deliverables.length || service.outcomes.length) ? (
        <section className="py-18 sm:py-24">
          <Container className="grid gap-6 lg:grid-cols-3">
            <ListBlock title="Problems we solve" items={service.problems} />
            <ListBlock title="What is included" items={service.deliverables} />
            <ListBlock title="Expected outcomes" items={service.outcomes} />
          </Container>
        </section>
      ) : null}

      {service.processSteps.length ? (
        <section className="border-y border-border/60 bg-card/35 py-18 sm:py-24">
          <Container>
            <SectionHeading eyebrow="Engagement flow" title="A clear process from scope to delivery." description="The exact plan adapts to the project, but ownership and decisions stay visible throughout the engagement." />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {service.processSteps.map((step, index) => (
                <article key={`${step.title}-${index}`} className="rounded-2xl border border-border/70 bg-background p-5">
                  <span className="text-xs font-black tracking-[0.18em] text-primary">0{index + 1}</span>
                  <h2 className="mt-5 text-lg font-bold">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {(service.technologies.length || service.pricingNote) ? (
        <section className="py-18 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <SectionHeading eyebrow="Capability" title="Built with tools that fit the job." description="Technology choices support maintainability, integration and the user experience rather than becoming the product story." />
              <div className="mt-7 flex flex-wrap gap-2">
                {service.technologies.map((technology) => <span key={technology} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-semibold">{technology}</span>)}
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-foreground p-7 text-background">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-background/55">Commercial guidance</p>
              <p className="mt-4 text-2xl font-black tracking-tight">Scope first. Final price after review.</p>
              <p className="mt-4 leading-7 text-background/70">{service.pricingNote ?? "Final scope, delivery dates and custom pricing are confirmed after requirements are reviewed by the agency."}</p>
              <Button asChild className="mt-6 bg-background text-foreground hover:bg-background/90"><Link href={service.ctaHref}>{service.ctaLabel}</Link></Button>
            </div>
          </Container>
        </section>
      ) : null}

      {service.faqs.length ? (
        <section className="border-y border-border/60 bg-card/35 py-18 sm:py-24">
          <Container className="grid gap-10 lg:grid-cols-[.75fr_1.25fr]">
            <SectionHeading eyebrow="FAQ" title="Questions about this service." description="Service-specific answers maintained directly from the agency CMS." />
            <div className="grid gap-3">
              {service.faqs.map((faq) => (
                <details key={faq.id ?? faq.question} className="group rounded-2xl border border-border/70 bg-background p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                    {faq.question}<span className="text-xl text-muted-foreground transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{faq.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      {relatedCaseStudies.length ? (
        <section className="border-t border-border/60 py-18 sm:py-24">
          <Container>
            <SectionHeading eyebrow="Related work" title="Case studies connected to this service." description="Only published M07 case studies referenced by this service are shown here." />
            <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedCaseStudies.map((study) => <CaseStudyCard key={study.id} study={study} />)}
            </div>
          </Container>
        </section>
      ) : null}

      {service.relatedServices.length ? (
        <section className="py-18 sm:py-24">
          <Container>
            <SectionHeading eyebrow="Related capabilities" title="Services that connect naturally with this work." />
            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {service.relatedServices.map((related) => (
                <Link key={related.id} href={`/services/${related.slug}`} className="rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/30 hover:shadow-lg">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">{related.eyebrow ?? "Service"}</p>
                  <h2 className="mt-3 text-xl font-bold">{related.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{related.shortDescription}</p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      ) : null}
    </>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="rounded-[1.75rem] border border-border/70 bg-card p-6">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      <ul className="mt-5 grid gap-3">
        {items.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-muted-foreground"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />{item}</li>)}
      </ul>
    </article>
  );
}
