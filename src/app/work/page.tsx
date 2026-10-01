import type { Metadata } from "next";
import Link from "next/link";

import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { listPublishedCaseStudies } from "@/features/case-studies/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Work & Case Studies",
  description: "Explore selected agency work, internal concepts and case studies across web, product design, automation and AI.",
};

type PageProps = {
  searchParams: Promise<{ service?: string; industry?: string; technology?: string }>;
};

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b));
}

export default async function WorkPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const all = await listPublishedCaseStudies();

  const serviceOptions = unique(all.flatMap((study) => study.services.map((service) => service.slug)));
  const industryOptions = unique(all.map((study) => study.industry));
  const technologyOptions = unique(all.flatMap((study) => study.technologies));

  const filtered = all.filter((study) => {
    const serviceMatch = !query.service || study.services.some((service) => service.slug === query.service);
    const industryMatch = !query.industry || study.industry === query.industry;
    const technologyMatch = !query.technology || study.technologies.includes(query.technology);
    return serviceMatch && industryMatch && technologyMatch;
  });

  const hasFilters = Boolean(query.service || query.industry || query.technology);

  return (
    <>
      <PageHero
        eyebrow="Work"
        title="Case studies that explain the thinking behind the interface."
        description="Browse published client work and clearly labelled internal concepts. Public metrics and testimonials appear only when they are explicitly approved for publication."
      />

      <section className="border-b border-border/60 py-8">
        <Container className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FilterLink href="/work" active={!hasFilters}>All work</FilterLink>
            {serviceOptions.map((slug) => (
              <FilterLink key={slug} href={`/work?service=${encodeURIComponent(slug)}`} active={query.service === slug}>
                {all.flatMap((study) => study.services).find((service) => service.slug === slug)?.title ?? slug}
              </FilterLink>
            ))}
          </div>
          {(industryOptions.length > 1 || technologyOptions.length > 1) ? (
            <div className="flex flex-wrap gap-2 text-xs">
              {industryOptions.map((industry) => <FilterLink key={industry} href={`/work?industry=${encodeURIComponent(industry)}`} active={query.industry === industry}>{industry}</FilterLink>)}
              {technologyOptions.slice(0, 10).map((technology) => <FilterLink key={technology} href={`/work?technology=${encodeURIComponent(technology)}`} active={query.technology === technology}>{technology}</FilterLink>)}
            </div>
          ) : null}
        </Container>
      </section>

      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">{filtered.length} published {filtered.length === 1 ? "project" : "projects"}</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight">{hasFilters ? "Filtered work" : "Selected work"}</h2>
            </div>
            {hasFilters ? <Button asChild variant="outline"><Link href="/work">Clear filters</Link></Button> : null}
          </div>

          {filtered.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((study) => <CaseStudyCard key={study.id} study={study} />)}
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-border bg-card/50 p-10 text-center">
              <p className="text-lg font-bold">No published work matches this filter.</p>
              <p className="mt-2 text-sm text-muted-foreground">Clear the active filter or publish another case study from the admin CMS.</p>
              <Button asChild className="mt-5" variant="outline"><Link href="/work">Show all work</Link></Button>
            </div>
          )}
        </Container>
      </section>

      <CtaBand />
    </>
  );
}

function FilterLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 font-semibold transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </Link>
  );
}
