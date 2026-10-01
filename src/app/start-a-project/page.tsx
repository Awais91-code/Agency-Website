import type { Metadata } from "next";

import { ProjectBriefWizard } from "@/components/project-brief/project-brief-wizard";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Start a Project",
  description: "Share your project goals, scope, timing and budget to receive an indicative planning range and a structured agency review.",
};

export default async function StartProjectPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const service = typeof params.service === "string" ? params.service : "";

  return (
    <main>
      <section className="border-b border-border/70 bg-gradient-to-b from-primary/7 via-background to-background py-14 sm:py-18">
        <Container>
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">Smart project brief</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl lg:text-6xl">Tell us what you want to build, improve or automate.</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              The brief turns early requirements into structured project context and an indicative estimate range. Final scope, pricing and delivery commitments are always reviewed by a person.
            </p>
          </div>
        </Container>
      </section>
      <section className="py-10 sm:py-14 lg:py-16">
        <Container>
          <ProjectBriefWizard initialServiceSlug={service} />
        </Container>
      </section>
    </main>
  );
}
