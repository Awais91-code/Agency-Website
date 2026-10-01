import type { Metadata } from "next";

import { ContactForm } from "@/components/marketing/contact-form";
import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";
import { getPublicSiteSettings } from "@/features/content/queries";

export const metadata: Metadata = {
  title: "Contact",
  description: "Start a conversation about a website, digital product, automation workflow or AI-enabled solution.",
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const settings = await getPublicSiteSettings();

  return (
    <>
      <PageHero eyebrow="Start a project" title="Tell us what you are trying to change, build or improve." description="A useful first message does not need perfect requirements. Share the goal, current situation and any important constraint; use the structured project brief when you are ready to share scope, timing and budget." />

      <section className="py-20 sm:py-24">
        <Container className="grid gap-8 lg:grid-cols-[.65fr_1.35fr] lg:gap-12">
          <aside className="space-y-4">
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Email</p>
              <a href={`mailto:${settings.email}`} className="mt-4 block break-all text-xl font-black tracking-tight hover:text-primary">{settings.email}</a>
              {settings.phone ? <a href={`tel:${settings.phone}`} className="mt-3 block text-sm font-bold text-primary">{settings.phone}</a> : null}
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{settings.location}</p>
            </div>
            <div className="rounded-[1.75rem] border border-border/70 bg-card p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Good first message</p>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
                <li>• What you want to build or improve</li>
                <li>• Who it is for</li>
                <li>• Your ideal result</li>
                <li>• Any deadline or hard constraint</li>
              </ul>
            </div>
          </aside>
          <ContactForm />
        </Container>
      </section>
    </>
  );
}
