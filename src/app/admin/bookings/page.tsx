import Link from "next/link";

import { updateBookingTypeAction } from "@/app/admin/bookings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/features/leads/format";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminBookingsPage({ searchParams }: PageProps) {
  const query = await searchParams;
  const admin = getSupabaseAdminClient();

  const [{ data: types, error: typesError }, { data: meetings, error: meetingsError }] = await Promise.all([
    admin.from("booking_types").select("*").is("archived_at", null).order("sort_order"),
    admin
      .from("meetings")
      .select("id,lead_id,title,attendee_name,attendee_email,starts_at,ends_at,timezone,status,provider_booking_id,meeting_url,created_at")
      .order("starts_at", { ascending: true, nullsFirst: false })
      .limit(100),
  ]);

  if (typesError) throw new Error(typesError.message);
  if (meetingsError) throw new Error(meetingsError.message);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">M10 · Consultation booking</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Bookings</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Configure public meeting links and review provider-synchronized meeting records.
          </p>
        </div>
        <Button asChild variant="outline"><Link href="/book" target="_blank">Open booking page</Link></Button>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div> : null}
      {query.saved ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">Booking configuration saved.</div> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {(types ?? []).map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <CardTitle className="text-lg">{type.label}</CardTitle>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{type.slug} · {type.duration_minutes} min</p>
            </CardHeader>
            <CardContent>
              <form action={updateBookingTypeAction} className="space-y-3">
                <input type="hidden" name="id" value={type.id} />
                <label className="block text-sm font-semibold">Label
                  <input name="label" defaultValue={type.label} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Description
                  <textarea name="description" defaultValue={type.description} rows={3} className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Duration
                  <input name="durationMinutes" type="number" min={10} max={240} defaultValue={type.duration_minutes} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" />
                </label>
                <label className="block text-sm font-semibold">Cal.com event URL
                  <input name="providerUrl" type="url" placeholder="https://cal.com/your-team/discovery" defaultValue={type.provider_url ?? ""} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" />
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input name="isActive" type="checkbox" defaultChecked={type.is_active} />
                  Active on public booking page
                </label>
                <Button type="submit" size="sm">Save</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent synchronized meetings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(meetings ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No booking webhooks have created meetings yet.</p>
          ) : (
            (meetings ?? []).map((meeting) => (
              <div key={meeting.id} className="grid gap-3 rounded-xl border border-border/70 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
                <div>
                  <p className="font-semibold">{meeting.title || meeting.attendee_name || meeting.attendee_email || "Consultation"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{meeting.attendee_email || "No attendee email"} · {meeting.timezone || "Timezone not supplied"}</p>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{formatDateTime(meeting.starts_at)}</p>
                  <p className="text-xs text-muted-foreground">{meeting.status}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Provider ID: {meeting.provider_booking_id}
                </div>
                <div className="flex gap-2">
                  {meeting.lead_id ? <Button asChild size="sm" variant="outline"><Link href={`/admin/leads/${meeting.lead_id}`}>Lead</Link></Button> : null}
                  {meeting.meeting_url ? <Button asChild size="sm"><a href={meeting.meeting_url} target="_blank" rel="noreferrer">Join</a></Button> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
