import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function CtaBand() {
  return (
    <section className="py-8 sm:py-12">
      <Container>
        <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-foreground px-6 py-10 text-background shadow-2xl sm:px-10 sm:py-12 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
          <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-primary/35 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-background/65">Start with clarity</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Have a project in mind? Turn it into a clear next step.</h2>
            <p className="mt-4 max-w-xl leading-7 text-background/70">Share the goal, scope, timing and budget in the structured project brief, then receive an indicative planning range before human review.</p>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-3 lg:mt-0 lg:shrink-0">
            <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
              <Link href="/start-a-project" data-analytics-event="primary_cta_click" data-analytics-location="cta-band">Start a project</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-background/25 bg-transparent text-background hover:bg-background/10 hover:text-background">
              <Link href="/process">See the process</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
