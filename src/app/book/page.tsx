import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  buildBookingUrl,
  chooseBookingType,
  listActiveBookingTypes,
  resolveBookingContext,
} from "@/features/booking/server";

export const metadata: Metadata = {
  title: "Book a consultation",
  description: "Choose a consultation type and book a time that works in your timezone.",
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    type?: string;
    context?: string;
  }>;
};

export default async function BookPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const [types, context] = await Promise.all([
    listActiveBookingTypes(),
    resolveBookingContext(query.context),
  ]);

  const selected = chooseBookingType(types, query.type, context);
  const bookingUrl = selected ? buildBookingUrl(selected, context) : null;

  return (
    <main className="py-14 sm:py-20">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Consultation booking</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Choose the right call and book in your timezone.
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Availability is managed by our scheduling provider. Your existing project brief stays intact even if the scheduler is temporarily unavailable.
            </p>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {types.map((item) => {
              const href = `/book?type=${encodeURIComponent(item.slug)}${context ? `&context=${encodeURIComponent(context.token)}` : ""}`;
              const active = selected?.slug === item.slug;
              return (
                <Link
                  key={item.id}
                  href={href}
                  className={`rounded-2xl border p-5 transition ${active ? "border-primary bg-primary/8" : "border-border bg-card hover:border-primary/40"}`}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{item.duration_minutes} min</p>
                  <h2 className="mt-2 text-lg font-black">{item.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </Link>
              );
            })}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <Card className="overflow-hidden rounded-[2rem]">
              <CardHeader className="border-b border-border/70">
                <CardTitle>{selected?.label ?? "Consultation"}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {bookingUrl ? (
                  <iframe
                    title={`${selected?.label ?? "Consultation"} scheduler`}
                    src={bookingUrl}
                    className="min-h-[760px] w-full bg-background"
                    allow="camera; microphone; fullscreen; clipboard-write"
                    loading="eager"
                  />
                ) : (
                  <div className="p-8 sm:p-12">
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/8 p-5">
                      <p className="font-bold">Scheduler is not configured yet.</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        The booking module is installed, but this meeting type does not have a provider URL yet. An administrator can add the Cal.com event link in Admin → Bookings.
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button asChild><Link href="/contact">Contact us instead</Link></Button>
                      <Button asChild variant="outline"><Link href="/start-a-project">Send project brief</Link></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Booking context</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {context ? (
                    <>
                      <p><span className="font-semibold">Lead:</span> {context.leadName || context.leadEmail || "Linked project enquiry"}</p>
                      <p className="text-muted-foreground">Your lead is linked through an opaque booking token; the public URL does not expose the CRM lead ID.</p>
                    </>
                  ) : (
                    <p className="text-muted-foreground">General booking. If you submitted a project brief first, use the booking button on its success page to keep the meeting linked automatically.</p>
                  )}
                  <p><span className="font-semibold">Timezone:</span> the scheduler displays availability in the booker’s local timezone.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Need another route?</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">If the scheduler is unavailable, your original lead/project brief is not affected.</p>
                  <Button asChild variant="outline" className="mt-4 w-full"><Link href="/contact">Contact the team</Link></Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </Container>
    </main>
  );
}
