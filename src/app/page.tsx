import Link from "next/link";

import { CtaBand } from "@/components/marketing/cta-band";
import { CaseStudyCard } from "@/components/case-studies/case-study-card";
import { SectionHeading } from "@/components/marketing/section-heading";
import { ServiceCard } from "@/components/marketing/service-card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { capabilities, principles, processSteps, services } from "@/content/marketing";
import { getPublishedSection, listPublishedFaqs, listPublishedTestimonials } from "@/features/content/queries";
import { listPublishedCaseStudies } from "@/features/case-studies/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featuredWork, hero, homeFaqs, testimonials] = await Promise.all([
    listPublishedCaseStudies({ featuredOnly: true, limit: 3 }),
    getPublishedSection("home.hero"),
    listPublishedFaqs("general"),
    listPublishedTestimonials(6),
  ]);

  return (
    <>
      <section className="hero-grid relative overflow-hidden border-b border-border/60">
        <div className="page-orb page-orb-one" />
        <div className="page-orb page-orb-two" />
        <Container className="relative grid gap-12 py-20 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:gap-14 lg:py-28 xl:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3 py-1.5 text-xs font-bold text-muted-foreground shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_color-mix(in_oklab,#10b981_15%,transparent)]" />
              {hero?.eyebrow ?? "Design · Development · Automation"}
            </div>
            <h1 className="mt-7 text-[clamp(2.9rem,7vw,6.2rem)] font-black leading-[0.94] tracking-[-0.065em]">
              {hero?.title ?? "Digital products that work beyond the screen."}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {hero?.body ?? "We design and build modern web experiences, product interfaces and automation systems that turn attention into action and repetitive work into reliable workflows."}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href={hero?.ctaHref ?? "/start-a-project"} data-analytics-event="primary_cta_click" data-analytics-location="home-hero">{hero?.ctaLabel ?? "Start a project"} <span aria-hidden="true">→</span></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#work">Explore selected work</Link>
              </Button>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-border/70 pt-6">
              <div>
                <p className="text-xl font-black tracking-tight sm:text-2xl">Strategy → Launch</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">One connected delivery flow</p>
              </div>
              <div>
                <p className="text-xl font-black tracking-tight sm:text-2xl">Mobile-first</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Every critical path responsive</p>
              </div>
              <div>
                <p className="text-xl font-black tracking-tight sm:text-2xl">Automation-ready</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Built for connected operations</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[38rem] lg:mx-0">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" />
            <div className="hero-dashboard relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/88 p-3 shadow-[0_32px_80px_-28px_color-mix(in_oklab,var(--foreground)_28%,transparent)] backdrop-blur-xl sm:p-4">
              <div className="flex items-center justify-between border-b border-border/70 px-2 pb-3">
                <div className="flex gap-1.5" aria-hidden="true">
                  <span className="size-2.5 rounded-full bg-red-400" />
                  <span className="size-2.5 rounded-full bg-amber-400" />
                  <span className="size-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Live system</span>
              </div>
              <div className="grid gap-3 pt-3 sm:grid-cols-[1.25fr_.75fr]">
                <div className="rounded-2xl border border-border/70 bg-background p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Qualified opportunities</p>
                      <p className="mt-2 text-4xl font-black tracking-[-0.05em]">24</p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600">+18%</span>
                  </div>
                  <div className="mt-8 flex h-32 items-end gap-2" aria-label="Decorative growth chart">
                    {[28, 42, 36, 52, 48, 72, 66, 92, 78, 108].map((height, index) => (
                      <span key={index} className="w-full rounded-t-md bg-gradient-to-t from-primary/85 to-primary/35" style={{ height: `${height}px` }} />
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {["New lead", "Booked", "Qualified"].map((label, index) => (
                      <div key={label} className="rounded-xl bg-muted/75 px-3 py-3">
                        <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
                        <p className="mt-1 text-lg font-black">{[12, 7, 5][index]}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border/70 bg-background p-4">
                    <p className="text-xs font-semibold text-muted-foreground">Automation</p>
                    <div className="mt-5 grid gap-3">
                      {["Lead captured", "Team notified", "Follow-up queued"].map((label, index) => (
                        <div key={label} className="flex items-center gap-3">
                          <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">{index + 1}</span>
                          <span className="text-xs font-semibold">{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-foreground p-4 text-background">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-background/55">Next action</p>
                    <p className="mt-3 text-lg font-black leading-tight">Review high-intent project brief</p>
                    <div className="mt-5 h-2 rounded-full bg-background/15"><div className="h-full w-3/4 rounded-full bg-background" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-border/60 bg-card/35 py-7">
        <Container className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Built around a modern delivery stack</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-foreground/70">
            {capabilities.map((capability) => <span key={capability}>{capability}</span>)}
          </div>
        </Container>
      </section>

      <section id="services" className="scroll-mt-24 py-20 sm:py-24 lg:py-28">
        <Container>
          <SectionHeading eyebrow="What we build" title="A focused set of capabilities, connected end to end." description="Service detail pages are now CMS-driven in M06, with draft/publish control, SEO fields, FAQs and related-service navigation." />
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {services.map((service) => <ServiceCard key={service.title} {...service} />)}
          </div>
        </Container>
      </section>

      <section id="work" className="scroll-mt-24 border-y border-border/60 bg-card/35 py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading eyebrow="Selected work" title="Show the thinking, not only the screenshot." description="Published case studies now come from the M07 portfolio system, with clear project context, service relationships and approved public proof." />
            <Button asChild variant="outline"><Link href="/work">View all work</Link></Button>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {featuredWork.map((study) => <CaseStudyCard key={study.id} study={study} />)}
          </div>
        </Container>
      </section>

      <section className="py-20 sm:py-24 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-16">
          <SectionHeading eyebrow="How we work" title="Clear stages. Visible decisions. Less uncertainty." description="A strong process protects both sides: priorities stay clear, approvals happen at the right time and delivery does not rely on assumptions." />
          <div className="grid gap-3 sm:grid-cols-2">
            {processSteps.map((step) => (
              <div key={step.number} className="rounded-2xl border border-border/70 bg-card p-5">
                <span className="text-xs font-black tracking-[0.18em] text-primary">{step.number}</span>
                <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-y border-border/60 bg-foreground py-20 text-background sm:py-24">
        <Container>
          <SectionHeading eyebrow="Working principles" title="Premium does not mean complicated." description="The best agency experience is structured, responsive and easy to understand—before, during and after the project." className="[&_p]:text-background/65 [&_h2]:text-background" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map((principle, index) => (
              <div key={principle.title} className="rounded-[1.75rem] border border-background/15 bg-background/5 p-6 backdrop-blur">
                <span className="text-xs font-black tracking-[0.18em] text-background/45">0{index + 1}</span>
                <h3 className="mt-6 text-xl font-bold">{principle.title}</h3>
                <p className="mt-3 leading-7 text-background/65">{principle.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>


      {testimonials.length ? (
        <section className="border-y border-border/60 bg-card/35 py-20 sm:py-24">
          <Container>
            <SectionHeading eyebrow="Client proof" title="What approved clients say about the work." description="Only testimonials with explicit public permission are rendered here." />
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article key={item.id} className="rounded-[1.75rem] border border-border/70 bg-background p-6">
                  <p className="text-lg font-semibold leading-8">“{item.quote}”</p>
                  <div className="mt-6">
                    <p className="font-black">{item.clientName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {[item.roleTitle, item.companyName].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>
      ) : null}

      <section className="py-20 sm:py-24 lg:py-28">
        <Container className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
          <SectionHeading eyebrow="FAQ" title="Useful answers before the first call." description="These answers explain the current product roadmap honestly while later modules turn each capability into a live system." />
          <div className="grid gap-3">
            {homeFaqs.map((item) => (
              <details key={item.question} className="group rounded-2xl border border-border/70 bg-card p-5 open:shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="text-xl text-muted-foreground transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <CtaBand />
    </>
  );
}
