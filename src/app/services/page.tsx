import type { Metadata } from "next";
import Link from "next/link";

import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { listPublishedServices } from "@/features/services/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore the agency's web development, product design, automation and AI service capabilities.",
};

export default async function ServicesPage() {
  const services = await listPublishedServices();

  return (
    <>
      <PageHero
        eyebrow="Services"
        title="Focused capabilities that connect strategy to delivery."
        description="Each service page explains the problems we solve, what gets delivered, how the engagement works and the next step to start a project."
      />
      <section className="py-16 sm:py-20 lg:py-24">
        <Container>
          {services.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No published services yet.</CardContent></Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {services.map((service, index) => (
                <article key={service.id} className="group rounded-[1.75rem] border border-border/70 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-black tracking-[0.2em] text-primary">{service.eyebrow ?? `0${index + 1}`}</span>
                    {service.isFeatured ? <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Featured</span> : null}
                  </div>
                  <h2 className="mt-7 text-2xl font-bold tracking-tight">{service.title}</h2>
                  <p className="mt-3 max-w-xl leading-7 text-muted-foreground">{service.shortDescription}</p>
                  <Button asChild variant="outline" className="mt-7">
                    <Link href={`/services/${service.slug}`}>Explore service <span aria-hidden="true">→</span></Link>
                  </Button>
                </article>
              ))}
            </div>
          )}
        </Container>
      </section>
      <CtaBand />
    </>
  );
}
