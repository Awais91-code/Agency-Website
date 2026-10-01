import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Terms" };

const sections = [
  ["Website use", "Define acceptable use of the public website, content and interactive features."],
  ["Project enquiries", "Clarify that website forms, estimate ranges and initial discussions do not create a binding project agreement until approved commercial terms are accepted."],
  ["Intellectual property", "Document ownership and permitted use of website content as well as the separate contract rules that apply to client deliverables."],
  ["Liability and governing terms", "Final wording should be prepared for the agency's legal entity, jurisdiction, services and risk profile."],
] as const;

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Terms" title="Terms of use starter structure." description="This page is intentionally a development template, not final legal advice. Replace it with reviewed terms that match the agency's actual legal entity and services before production launch." />
      <section className="py-16 sm:py-20">
        <Container className="max-w-4xl">
          <div className="grid gap-4">
            {sections.map(([title, body]) => (
              <section key={title} className="rounded-2xl border border-border/70 bg-card p-6">
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
              </section>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
