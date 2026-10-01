import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Project brief received" };

type PageProps = {
  searchParams: Promise<{ booking?: string }>;
};

export default async function QuoteSuccessPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const bookingHref = query.booking
    ? `/book?context=${encodeURIComponent(query.booking)}`
    : "/book";

  return (
    <main className="py-20 sm:py-28">
      <Container>
        <Card className="mx-auto max-w-2xl rounded-[2rem]">
          <CardContent className="p-8 text-center sm:p-12">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-2xl text-primary" aria-hidden="true">✓</div>
            <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-primary">Project brief received</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Thanks. Your enquiry is now in the review queue.</h1>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">
              The brief and estimate snapshot were saved together. You can now book a consultation; when the scheduler webhook is configured, the meeting will be synchronized back to the same CRM lead.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild><Link href={bookingHref} data-analytics-event="booking_click" data-analytics-location="quote-success">Book consultation</Link></Button>
              <Button asChild variant="outline"><Link href="/work">View our work</Link></Button>
              <Button asChild variant="ghost"><Link href="/">Back to home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </Container>
    </main>
  );
}
