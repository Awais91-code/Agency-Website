import {
  retryEmailAction,
  saveNotificationSettingsAction,
  sendTestEmailAction,
} from "@/app/admin/notifications/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getNotificationAdminData } from "@/features/notifications/admin";
import {
  emailTemplateLabels,
  renderEmailTemplate,
  sampleTemplateData,
} from "@/features/notifications/templates";
import {
  emailTemplateKeys,
  type EmailTemplateKey,
} from "@/features/notifications/types";
import { formatDateTime } from "@/features/leads/format";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
    template?: string;
  }>;
};

function statusClass(status: string) {
  if (["delivered", "sent"].includes(status)) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (["failed", "bounced", "complained", "suppressed"].includes(status)) return "bg-red-500/10 text-red-700 dark:text-red-300";
  if (status === "skipped") return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-slate-500/10 text-slate-700 dark:text-slate-300";
}

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const [query, data] = await Promise.all([searchParams, getNotificationAdminData()]);
  const selectedTemplate = emailTemplateKeys.includes(query.template as EmailTemplateKey)
    ? (query.template as EmailTemplateKey)
    : "enquiry-confirmation";
  const preview = renderEmailTemplate(selectedTemplate, sampleTemplateData(selectedTemplate));

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-primary">M12 · Email & notifications</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Centralized transactional email, non-production safety, provider delivery visibility and idempotent retry controls.
        </p>
      </div>

      {query.error ? <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{query.error}</div> : null}
      {query.saved ? <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">{query.saved}</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sent / delivered", data.summary.sent],
          ["Failures", data.summary.failed],
          ["Safety-skipped", data.summary.skipped],
          ["Pending / delayed", data.summary.pending],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Provider & environment safety</CardTitle>
            <CardDescription>Secrets remain server-only. Development/staging is blocked from real recipients unless you explicitly configure a safe path.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><strong>Environment:</strong> {data.safety.environment}</p>
            <p><strong>Resend send config:</strong> {data.providerConfigured ? "configured" : "not configured"}</p>
            <p><strong>Resend webhook secret:</strong> {data.webhookConfigured ? "configured" : "not configured"}</p>
            <p><strong>Non-production redirect:</strong> {data.safety.redirectTo || "not configured"}</p>
            <p><strong>Allowlist:</strong> {data.safety.allowlist || "empty"}</p>
            <p><strong>External non-production sends:</strong> {data.safety.externalAllowed ? "explicitly enabled" : "blocked by default"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification rules</CardTitle>
            <CardDescription>Internal recipients are merged with optional NOTIFICATION_ADMIN_EMAILS from the server environment.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={saveNotificationSettingsAction} className="space-y-4">
              <label className="block text-sm font-semibold">
                Internal recipient emails
                <textarea
                  name="adminRecipients"
                  rows={4}
                  defaultValue={data.settings.admin_recipients.join(", ")}
                  placeholder="ops@example.com, sales@example.com"
                  className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal"
                />
              </label>
              {[
                ["sendEnquiryConfirmations", "Client enquiry confirmations", data.settings.send_enquiry_confirmations],
                ["sendNewLeadAlerts", "Internal new-lead alerts", data.settings.send_new_lead_alerts],
                ["sendBookingNotifications", "Client booking notifications", data.settings.send_booking_notifications],
                ["sendBookingAdminAlerts", "Internal booking alerts", data.settings.send_booking_admin_alerts],
              ].map(([name, label, checked]) => (
                <label key={String(name)} className="flex items-center gap-2 text-sm font-semibold">
                  <input name={String(name)} type="checkbox" defaultChecked={Boolean(checked)} />
                  {String(label)}
                </label>
              ))}
              <Button type="submit">Save notification rules</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Template preview & safe test send</CardTitle>
          <CardDescription>The same server-side template catalogue is used by live workflows and this preview tool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm font-semibold">
              Template
              <select name="template" defaultValue={selectedTemplate} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal">
                {emailTemplateKeys.map((key) => <option key={key} value={key}>{emailTemplateLabels[key]}</option>)}
              </select>
            </label>
            <Button type="submit" variant="outline">Preview</Button>
          </form>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Subject</p>
            <p className="mt-1 font-semibold">{preview.subject}</p>
          </div>

          <iframe
            title={`${emailTemplateLabels[selectedTemplate]} preview`}
            srcDoc={preview.html}
            sandbox=""
            className="min-h-[620px] w-full rounded-2xl border border-border bg-white"
          />

          <form action={sendTestEmailAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="templateKey" value={selectedTemplate} />
            <label className="flex-1 text-sm font-semibold">
              Test recipient
              <input name="recipient" type="email" required placeholder="your-test-inbox@example.com" className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" />
            </label>
            <Button type="submit">Send safe test</Button>
          </form>
          <p className="text-xs leading-5 text-muted-foreground">
            In development/staging this still obeys the redirect/allowlist safety rules. The UI cannot bypass server protections.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email delivery log</CardTitle>
          <CardDescription>Latest 150 canonical outbound events with provider ID, status, retries and actionable failure text.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.events.length === 0 ? <p className="text-sm text-muted-foreground">No email events yet.</p> : data.events.map((event) => (
            <article key={event.id} className="rounded-xl border border-border/70 p-4">
              <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr_8rem_1fr_auto] xl:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{emailTemplateLabels[event.template_key as EmailTemplateKey] ?? event.template_key}</p>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(event.status)}`}>{event.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{event.subject}</p>
                  {event.last_error ? <p className="mt-2 text-xs text-red-600">{event.last_error}</p> : null}
                </div>
                <div className="text-sm">
                  <p className="font-semibold">{event.recipient}</p>
                  {event.original_recipient !== event.recipient ? <p className="mt-1 text-xs text-muted-foreground">Original: {event.original_recipient}</p> : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Retries</p>
                  <p className="mt-1 font-bold">{event.retry_count}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>{formatDateTime(event.created_at)}</p>
                  <p className="mt-1 break-all">{event.provider_message_id || "No provider ID"}</p>
                </div>
                {["failed", "skipped"].includes(event.status) ? (
                  <form action={retryEmailAction}>
                    <input type="hidden" name="id" value={event.id} />
                    <Button type="submit" size="sm" variant="outline">Retry</Button>
                  </form>
                ) : null}
              </div>
            </article>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent provider webhook events</CardTitle>
          <CardDescription>Verified Resend events are stored independently so duplicate deliveries can be ignored safely.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.providerEvents.length === 0 ? <p className="text-sm text-muted-foreground">No provider webhook events yet.</p> : data.providerEvents.map((event) => (
            <div key={event.id} className="grid gap-2 rounded-xl border border-border/70 p-3 text-sm md:grid-cols-[1fr_1fr_1fr_auto] md:items-center">
              <p className="font-semibold">{event.event_type}</p>
              <p className="truncate text-muted-foreground">{event.recipient || "No recipient"}</p>
              <p className="truncate text-xs text-muted-foreground">{event.provider_message_id || "No provider message ID"}</p>
              <p className="text-xs text-muted-foreground">{event.processing_error ? `Error: ${event.processing_error}` : formatDateTime(event.processed_at || event.created_at)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
