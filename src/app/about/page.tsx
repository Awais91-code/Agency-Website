import type { Metadata } from "next";

import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { SectionHeading } from "@/components/marketing/section-heading";
import { Container } from "@/components/ui/container";
import { capabilities, principles } from "@/content/marketing";
import { getPublishedSection, listPublishedTeam } from "@/features/content/queries";

export const metadata: Metadata = {
  title: "About",
  description: "How the agency approaches digital products, communication, systems and long-term maintainability.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [story, team] = await Promise.all([
    getPublishedSection("about.story"),
    listPublishedTeam(),
  ]);

  return (
    <>
      <PageHero
        eyebrow={story?.eyebrow ?? "About the agency"}
        title={story?.title ?? "A digital partner built around clarity, useful technology and maintainable systems."}
        description={story?.body ?? "We treat websites and digital products as working systems, not isolated screens."}
      />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <SectionHeading eyebrow="Our approach" title="Good digital work solves the right problem before it optimizes the interface." />
          <div className="space-y-5 text-base leading-8 text-muted-foreground">
            <p>We treat websites and digital products as working systems, not isolated screens. Strategy, content, interface design, code, data and automation should support one another.</p>
            <p>That means asking practical questions early: what should a visitor understand, what action matters, what information should be structured, what should remain human-controlled, and what can safely be automated?</p>
            <p>The result is a product that is easier to operate, easier to improve and more useful to the people on both sides of it.</p>
          </div>
        </Container>
      </section>

      {team.length ? (
        <section className="border-y border-border/60 bg-card/35 py-20 sm:py-24">
          <Container>
            <SectionHeading eyebrow="Team" title="The people behind the work." description="Only published public team profiles are shown." />
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {team.map((member) => (
                <article key={member.id} className="rounded-[1.75rem] border border-border/70 bg-background p-6">
                  {member.imageUrl ? <img src={member.imageUrl} alt={member.displayName} className="aspect-[4/3] w-full rounded-2xl object-cover" /> : null}
                  <h2 className="mt-5 text-xl font-black">{member.displayName}</h2>
                  <p className="mt-1 text-sm font-semibold text-primary">{member.roleTitle}</p>
                  {member.bio ? <p className="mt-4 leading-7 text-muted-foreground">{member.bio}</p> : null}
                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold">
                    {member.publicEmail ? <a href={`mailto:${member.publicEmail}`} className="text-primary hover:underline">Email</a> : null}
                    {member.linkedinUrl ? <a href={member.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn</a> : null}
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Principles" title="The standards behind the work." description="These principles shape design and engineering decisions across the platform." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {principles.map((principle, index) => (
              <article key={principle.title} className="rounded-[1.75rem] border border-border/70 bg-background p-6">
                <span className="text-xs font-black tracking-[0.18em] text-primary">0{index + 1}</span>
                <h2 className="mt-6 text-xl font-bold">{principle.title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{principle.description}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border/60 bg-card/35 py-20 sm:py-24">
        <Container>
          <SectionHeading eyebrow="Capability" title="Modern tools, chosen for the job they need to do." description="The stack is designed around fast public experiences, secure data, reliable operations and reusable interfaces." />
          <div className="mt-10 flex flex-wrap gap-3">
            {capabilities.map((capability) => <span key={capability} className="rounded-full border border-border bg-background px-4 py-2 text-sm font-bold">{capability}</span>)}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
