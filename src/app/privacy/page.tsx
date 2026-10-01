import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Privacy" };

const sections = [
  ["Information collected", "The final policy should describe the contact, project, account, analytics and technical information actually collected by the production system."],
  ["How information is used", "Data should be used only for clearly defined business purposes such as responding to enquiries, delivering projects, operating accounts, securing the service and measuring website performance."],
  ["Service providers", "List production processors that receive information, such as hosting, database, email, scheduling, analytics or automation providers."],
  ["Retention and requests", "Define how long lead, client and operational records are kept and how people can request correction or deletion where applicable."],
] as const;

export default function PrivacyPage() {
  return (
    <>
      <PageHero eyebrow="Privacy" title="Privacy policy starter structure." description="This is a development placeholder, not final legal text. It must be reviewed and adapted to the agency's jurisdiction, production integrations and actual data practices before launch." />
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
