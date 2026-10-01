import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/features/leads/format";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const [
    { count: newCount },
    { count: qualifiedCount },
    { count: activeCount },
    { count: overdueCount },
    { count: upcomingMeetingCount },
    { count: serviceDrafts },
    { count: caseStudyDrafts },
    { count: faqDrafts },
    { count: testimonialDrafts },
    { count: blogDrafts },
    { count: emailFailureCount },
    { count: automationFailureCount },
    { data: upcomingMeetings },
  ] = await Promise.all([
    admin.from("leads").select("*", { count: "exact", head: true }).eq("status", "new").is("archived_at", null),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("status", "qualified").is("archived_at", null),
    admin.from("leads").select("*", { count: "exact", head: true }).not("status", "in", '("won","lost")').is("archived_at", null),
    admin.from("leads").select("*", { count: "exact", head: true }).lt("next_action_at", now).is("archived_at", null),
    admin.from("meetings").select("*", { count: "exact", head: true }).eq("status", "scheduled").gte("starts_at", now),
    admin.from("services").select("*", { count: "exact", head: true }).eq("status", "draft").is("archived_at", null),
    admin.from("case_studies").select("*", { count: "exact", head: true }).eq("status", "draft").is("archived_at", null),
    admin.from("faqs").select("*", { count: "exact", head: true }).eq("status", "draft").is("archived_at", null),
    admin.from("testimonials").select("*", { count: "exact", head: true }).eq("status", "draft").is("archived_at", null),
    admin.from("blog_posts").select("*", { count: "exact", head: true }).eq("status", "draft").is("archived_at", null),
    admin.from("email_events").select("*", { count: "exact", head: true }).in("status", ["failed", "bounced", "complained", "suppressed"]),
    admin.from("automation_events").select("*", { count: "exact", head: true }).in("status", ["failed", "dead_letter"]),
    admin.from("meetings").select("id,lead_id,title,attendee_name,starts_at,timezone").eq("status", "scheduled").gte("starts_at", now).order("starts_at").limit(5),
  ]);

  const totalDrafts = (serviceDrafts ?? 0) + (caseStudyDrafts ?? 0) + (faqDrafts ?? 0) + (testimonialDrafts ?? 0) + (blogDrafts ?? 0);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-primary">Operations</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin overview</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">Leads, consultations and content publishing are now visible from one operational dashboard. Email delivery and automation-run telemetry are available from the operations modules.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-8">
        {[
          ["New leads", newCount ?? 0],
          ["Qualified", qualifiedCount ?? 0],
          ["Open pipeline", activeCount ?? 0],
          ["Overdue actions", overdueCount ?? 0],
          ["Upcoming calls", upcomingMeetingCount ?? 0],
          ["Email failures", emailFailureCount ?? 0],
          ["Automation failures", automationFailureCount ?? 0],
          ["Content drafts", totalDrafts],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-3xl">{value}</CardTitle></CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Lead CRM</CardTitle><CardDescription>Qualification, ownership, internal notes, follow-up tasks and activity history.</CardDescription></CardHeader>
          <CardContent><Button asChild><Link href="/admin/leads">Open leads</Link></Button></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Content management</CardTitle><CardDescription>Homepage sections, testimonials, FAQs, team, services, case studies, blog and media.</CardDescription></CardHeader>
          <CardContent><Button asChild variant="outline"><Link href="/admin/content">Open content</Link></Button></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Transactional email status, safe test sends, delivery failures and notification rules.</CardDescription></CardHeader>
          <CardContent><Button asChild variant="outline"><Link href="/admin/notifications">Open notifications</Link></Button></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Upcoming consultations</CardTitle><CardDescription>Next scheduled meetings synchronized by M10.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {(upcomingMeetings ?? []).length === 0 ? <p className="text-sm text-muted-foreground">No upcoming synchronized meetings.</p> : upcomingMeetings!.map((meeting) => (
            <div key={meeting.id} className="flex flex-col gap-2 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{meeting.title || meeting.attendee_name || "Consultation"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(meeting.starts_at)} · {meeting.timezone || "Timezone not supplied"}</p>
              </div>
              {meeting.lead_id ? <Button asChild size="sm" variant="outline"><Link href={`/admin/leads/${meeting.lead_id}`}>Open lead</Link></Button> : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
