import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAnalyticsAdminData } from "@/features/analytics/admin";
import { formatDateTime } from "@/features/leads/format";
import { requireStaff } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ days?: string }>;
};

function percentage(value: number | null) {
  return value === null ? "—" : `${value}%`;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  await requireStaff();
  const query = await searchParams;
  const parsedDays = Number(query.days ?? 30);
  const days = Number.isFinite(parsedDays)
    ? Math.max(1, Math.min(Math.trunc(parsedDays), 365))
    : 30;

  const data = await getAnalyticsAdminData(days);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            M17 · Analytics & conversion tracking
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Conversion analytics
          </h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Minimal event telemetry, first-touch lead attribution and funnel
            visibility without exporting contact messages, project free text or
            private files.
          </p>
        </div>

        {data.externalDashboardUrl ? (
          <Button asChild variant="outline">
            <Link href={data.externalDashboardUrl} target="_blank" rel="noreferrer">
              External analytics dashboard
            </Link>
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="grid gap-4 p-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Environment
            </p>
            <p className="mt-1 font-semibold">{data.environment}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Provider
            </p>
            <p className="mt-1 font-semibold">{data.provider}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Consent
            </p>
            <p className="mt-1 font-semibold">
              {data.consentRequired ? "required" : "not required"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Window
            </p>
            <form className="mt-1 flex gap-2">
              <select
                name="days"
                defaultValue={String(days)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="7">7 days</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">365 days</option>
              </select>
              <Button type="submit" size="sm" variant="outline">
                Apply
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Primary CTA clicks", data.counts.primary_cta_click ?? 0],
          ["Brief starts", data.counts.project_brief_start ?? 0],
          ["Brief submits", data.counts.project_brief_submit ?? 0],
          ["Bookings complete", data.counts.booking_complete ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Brief → submit</CardTitle>
            <CardDescription>Project brief lifecycle conversion</CardDescription>
          </CardHeader>
          <CardContent className="text-4xl font-black">
            {percentage(data.conversion.briefStartToSubmit)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submit → booking</CardTitle>
            <CardDescription>Submitted enquiries that reached booking completion</CardDescription>
          </CardHeader>
          <CardContent className="text-4xl font-black">
            {percentage(data.conversion.submitToBooking)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attributed leads</CardTitle>
            <CardDescription>Recent leads with a known UTM/referrer source</CardDescription>
          </CardHeader>
          <CardContent className="text-4xl font-black">
            {percentage(data.conversion.attributedLeadRate)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funnel</CardTitle>
          <CardDescription>
            Counts are environment-scoped and use idempotent lifecycle events.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {data.funnel.map((item, index) => (
            <div key={item.name} className="rounded-xl border border-border/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                {index + 1}. {item.name.replaceAll("_", " ")}
              </p>
              <p className="mt-2 text-3xl font-black">{item.count}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Lead sources</CardTitle>
            <CardDescription>
              First-touch UTM source or referrer host when available.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.topSources.length ? (
              data.topSources.map((item) => (
                <div
                  key={item.source}
                  className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3 text-sm"
                >
                  <span className="font-semibold">{item.source}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No lead attribution has been recorded in this window.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data quality</CardTitle>
            <CardDescription>
              Fast checks for intended lifecycle data shape.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <QualityRow
              label="Browser events without session ID"
              value={data.quality.browserEventsWithoutSession}
            />
            <QualityRow
              label="Browser events without path"
              value={data.quality.eventsWithoutPath}
            />
            <QualityRow
              label="Total events in window"
              value={data.quality.totalEvents}
            />
            <p className="pt-2 text-xs leading-5 text-muted-foreground">
              The public event API accepts only documented structured fields. It
              rejects arbitrary contact/free-text analytics properties.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent conversion events</CardTitle>
          <CardDescription>
            Last events from the selected environment. No contact message or project
            free text is included.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.events.slice(0, 80).map((event) => (
            <div
              key={event.id}
              className="grid gap-2 rounded-xl border border-border/70 p-3 text-sm lg:grid-cols-[1fr_8rem_1fr_1fr_auto]"
            >
              <p className="font-semibold">{event.event_name}</p>
              <p className="text-xs text-muted-foreground">{event.source}</p>
              <p className="truncate text-xs text-muted-foreground">
                {event.path || "server event"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {event.entity_type && event.entity_id
                  ? `${event.entity_type}:${event.entity_id}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.occurred_at)}
              </p>
            </div>
          ))}
          {!data.events.length ? (
            <p className="text-sm text-muted-foreground">
              No analytics events in this environment/window.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

function QualityRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 px-4 py-3">
      <span>{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}
