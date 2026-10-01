import type { Metadata } from "next";
import Link from "next/link";

import { PageHero } from "@/components/marketing/page-hero";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { processSteps } from "@/content/marketing";

export const metadata: Metadata = {
  title: "Process",
  description: "A clear agency delivery process from discovery and scope through design, build, QA and launch.",
};

export default function ProcessPage() {
  return (
    <>
      <PageHero eyebrow="Delivery process" title="Know what happens next, what needs approval and what success looks like." description="The process is designed to reduce ambiguity without turning every project into bureaucracy. Each stage creates a clear output for the next one." />

      <section className="py-20 sm:py-24">
        <Container>
          <div className="relative grid gap-5">
            <div className="absolute bottom-8 left-6 top-8 hidden w-px bg-border md:block" />
            {processSteps.map((step) => (
              <article key={step.number} className="relative grid gap-4 rounded-[1.75rem] border border-border/70 bg-card p-6 shadow-sm md:grid-cols-[5rem_1fr_.7fr] md:items-start md:gap-8 md:p-8">
                <div className="relative z-10 grid size-12 place-items-center rounded-2xl bg-foreground text-sm font-black text-background md:size-14">{step.number}</div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">{step.title}</h2>
                  <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">{step.description}</p>
                </div>
                <div className="rounded-2xl bg-muted/65 p-4 text-sm leading-6 text-muted-foreground">
                  <span className="font-bold text-foreground">Stage output:</span> a clear decision, deliverable or approved handoff that keeps the next stage unblocked.
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-[2rem] border border-primary/20 bg-primary/5 p-7 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-9">
            <div>
              <h2 className="text-2xl font-black tracking-tight">Ready to define the first step?</h2>
              <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">Tell us the goal and the current problem. We can start with scope before talking about implementation details.</p>
            </div>
            <Button asChild size="lg" className="mt-6 shrink-0 sm:mt-0"><Link href="/contact">Start a conversation</Link></Button>
          </div>
        </Container>
      </section>
    </>
  );
}
