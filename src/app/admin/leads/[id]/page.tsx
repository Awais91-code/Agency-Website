import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addLeadNoteAction,
  addLeadTaskAction,
  archiveLeadAction,
  changeLeadStatusAction,
  completeLeadTaskAction,
  mergeLeadAction,
  updateLeadAction,
  updateLeadTagsAction,
} from "@/app/admin/leads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  leadPriorities,
  leadPriorityLabels,
  leadStatuses,
  leadStatusLabels,
  priorityClass,
  statusClass,
} from "@/features/leads/constants";
import { formatDate, formatDateTime, jsonObject, jsonStringArray } from "@/features/leads/format";
import { getLeadDetail } from "@/features/leads/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
};

function Message({ error, saved }: { error?: string; saved?: string }) {
  if (error) return <div className="rounded-xl border border-red-500/30 bg-red-500/8 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (saved) return <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">CRM record updated.</div>;
  return null;
}

export default async function LeadDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const data = await getLeadDetail(id);
  if (!data) notFound();

  const { lead, brief, estimate, answers, notes, tasks, stageHistory, activity, meetings, tags, owners, duplicates } = data;
  const metadata = jsonObject(lead.metadata);
  const scoreReasons = jsonStringArray(lead.score_reasons);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/admin/leads" className="text-sm font-semibold text-primary">← Back to leads</Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{lead.full_name || lead.email || "Unnamed lead"}</h1>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(lead.status)}`}>{leadStatusLabels[lead.status]}</span>
            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${priorityClass(lead.priority)}`}>{leadPriorityLabels[lead.priority]}</span>
            {lead.archived_at ? <span className="rounded-full bg-muted px-3 py-1 text-[10px] font-black uppercase">Archived</span> : null}
          </div>
          <p className="mt-2 text-muted-foreground">{lead.company_name || "No company"} · {lead.email || "No email"} · {lead.source || "Unknown source"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/admin/pipeline">Pipeline</Link></Button>
          <form action={archiveLeadAction}>
            <input type="hidden" name="id" value={lead.id} />
            <input type="hidden" name="archive" value={lead.archived_at ? "no" : "yes"} />
            <Button type="submit" variant="outline">{lead.archived_at ? "Restore lead" : "Archive lead"}</Button>
          </form>
        </div>
      </div>

      <Message error={query.error} saved={query.saved} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(20rem,0.8fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Project brief & qualification</CardTitle></CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Service</p>
                <p className="mt-1 font-semibold">{brief?.service_type || (typeof metadata.service_type === "string" ? metadata.service_type : "General enquiry")}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Lead score</p>
                <p className="mt-1 text-2xl font-black">{lead.lead_score}/100</p>
                {scoreReasons.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{scoreReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : null}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Budget</p>
                <p className="mt-1 font-semibold">{brief?.budget_band || (typeof metadata.budget_band === "string" ? metadata.budget_band : "Not supplied")}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Indicative estimate</p>
                <p className="mt-1 font-semibold">{estimate ? `${estimate.currency} ${estimate.final_min.toLocaleString()} – ${estimate.final_max.toLocaleString()}` : "No active estimate"}</p>
              </div>
              {brief ? (
                <>
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Industry</p><p className="mt-1">{brief.industry || "—"}</p></div>
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Desired start / deadline</p><p className="mt-1">{formatDate(brief.desired_start)} / {formatDate(brief.deadline)}</p></div>
                  <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Objective</p><p className="mt-1 whitespace-pre-wrap leading-7">{brief.objective || "—"}</p></div>
                  <div className="md:col-span-2"><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Requirements</p><p className="mt-1 whitespace-pre-wrap leading-7">{brief.requirements || "—"}</p></div>
                  {answers.length ? (
                    <div className="md:col-span-2">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Conditional answers</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {answers.map((answer) => (
                          <div key={answer.answer_key} className="rounded-xl bg-muted/60 p-3 text-sm">
                            <p className="font-bold">{answer.answer_key.replaceAll("_", " ")}</p>
                            <p className="mt-1 break-words text-muted-foreground">{JSON.stringify(answer.answer_value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : <p className="md:col-span-2 text-sm text-muted-foreground">No structured M08 project brief is linked to this lead.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Lead attribution</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Source</p><p className="mt-1 font-semibold">{lead.attribution_source || lead.source || "Unattributed"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">UTM source / medium</p><p className="mt-1">{lead.utm_source || "—"} / {lead.utm_medium || "—"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Campaign</p><p className="mt-1">{lead.utm_campaign || "—"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Landing path</p><p className="mt-1 break-all">{lead.landing_path || "—"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Initial referrer</p><p className="mt-1 break-all">{lead.initial_referrer_host || "—"}</p></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Captured</p><p className="mt-1">{formatDateTime(lead.attribution_captured_at)}</p></div>
            </CardContent>
          </Card>


          <Card>
            <CardHeader><CardTitle>Consultation meetings</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {meetings.length === 0 ? (
                <div>
                  <p className="text-sm text-muted-foreground">No synchronized booking yet.</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link href="/book" target="_blank">Open booking page</Link>
                  </Button>
                </div>
              ) : meetings.map((meeting) => (
                <div key={meeting.id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{meeting.title || "Consultation"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(meeting.starts_at)} · {meeting.timezone || "Timezone not supplied"}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]">{meeting.status}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{meeting.attendee_email || "No attendee email"} · provider ID {meeting.provider_booking_id}</p>
                  {meeting.meeting_url ? <Button asChild size="sm" className="mt-3"><a href={meeting.meeting_url} target="_blank" rel="noreferrer">Join meeting</a></Button> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
            <CardContent>
              <form action={addLeadNoteAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
                <textarea name="body" required maxLength={6000} rows={4} placeholder="Private sales note. This is never exposed to the client." className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
                <Button type="submit" size="sm">Add note</Button>
              </form>

              <div className="mt-6 space-y-3">
                {notes.length === 0 ? <p className="text-sm text-muted-foreground">No internal notes yet.</p> : notes.map((note) => (
                  <article key={note.id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                      <span className="font-semibold">{note.authorName || "Staff"}</span>
                      <span>{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.body}</p>
                  </article>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Follow-up tasks</CardTitle></CardHeader>
            <CardContent>
              <form action={addLeadTaskAction} className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-end">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
                <label className="text-sm font-semibold">Task<input name="title" required maxLength={300} placeholder="Call about project scope" className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" /></label>
                <label className="text-sm font-semibold">Due<input name="dueAt" type="datetime-local" className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" /></label>
                <label className="text-sm font-semibold">Owner<select name="assignedTo" className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.userId} value={owner.userId}>{owner.displayName || owner.userId.slice(0, 8)}</option>)}</select></label>
                <Button type="submit" size="sm" className="h-10">Create</Button>
              </form>

              <div className="mt-6 space-y-3">
                {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No follow-up tasks.</p> : tasks.map((task) => (
                  <div key={task.id} className={`flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center sm:justify-between ${task.completed_at ? "opacity-60" : ""}`}>
                    <div>
                      <p className={`font-semibold ${task.completed_at ? "line-through" : ""}`}>{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{task.assigneeName || "Unassigned"} · due {formatDateTime(task.due_at)}{task.completed_at ? ` · completed ${formatDateTime(task.completed_at)}` : ""}</p>
                    </div>
                    {!task.completed_at ? (
                      <form action={completeLeadTaskAction}>
                        <input type="hidden" name="id" value={lead.id} />
                        <input type="hidden" name="taskId" value={task.id} />
                        <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
                        <Button type="submit" size="sm" variant="outline">Complete</Button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Activity timeline</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {activity.length === 0 ? <p className="text-sm text-muted-foreground">No activity events yet.</p> : activity.map((event) => (
                <div key={event.id} className="border-l-2 border-border pl-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold">{event.event_type.replaceAll(".", " ")}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.occurred_at)}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{event.actorName || event.source}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Pipeline stage</CardTitle></CardHeader>
            <CardContent>
              <form action={changeLeadStatusAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
                <select name="status" defaultValue={lead.status} className="h-11 w-full rounded-xl border border-border bg-background px-3">
                  {leadStatuses.map((status) => <option key={status} value={status}>{leadStatusLabels[status]}</option>)}
                </select>
                <textarea name="reason" rows={2} maxLength={1000} placeholder="Optional reason / context" className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                <Button type="submit" className="w-full">Update stage</Button>
              </form>

              <div className="mt-5 space-y-3">
                {stageHistory.slice(0, 8).map((entry) => (
                  <div key={entry.id} className="text-sm">
                    <p className="font-semibold">{entry.from_status ? leadStatusLabels[entry.from_status] : "—"} → {leadStatusLabels[entry.to_status]}</p>
                    <p className="text-xs text-muted-foreground">{entry.actorName || "Staff"} · {formatDateTime(entry.created_at)}</p>
                    {entry.reason ? <p className="mt-1 text-xs text-muted-foreground">{entry.reason}</p> : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ownership & next action</CardTitle></CardHeader>
            <CardContent>
              <form action={updateLeadAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />

                <label className="block text-sm font-semibold">Owner<select name="ownerUserId" defaultValue={lead.owner_user_id ?? ""} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"><option value="">Unassigned</option>{owners.map((owner) => <option key={owner.userId} value={owner.userId}>{owner.displayName || owner.userId.slice(0, 8)} · {owner.role}</option>)}</select></label>
                <label className="block text-sm font-semibold">Priority<select name="priority" defaultValue={lead.priority} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal">{leadPriorities.map((priority) => <option key={priority} value={priority}>{leadPriorityLabels[priority]}</option>)}</select></label>
                <label className="block text-sm font-semibold">Next action<input name="nextAction" maxLength={500} defaultValue={lead.next_action ?? ""} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" /></label>
                <label className="block text-sm font-semibold">Next action due<input name="nextActionAt" type="datetime-local" defaultValue={lead.next_action_at ? new Date(lead.next_action_at).toISOString().slice(0, 16) : ""} className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal" /></label>
                <label className="block text-sm font-semibold">Lost reason<textarea name="lostReason" maxLength={1000} rows={3} defaultValue={lead.lost_reason ?? ""} className="mt-2 w-full rounded-xl border border-border bg-background p-3 font-normal" /></label>
                <Button type="submit" className="w-full">Save lead</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Tags</CardTitle></CardHeader>
            <CardContent>
              <form action={updateLeadTagsAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <input type="hidden" name="returnTo" value={`/admin/leads/${lead.id}`} />
                <textarea name="tags" rows={3} defaultValue={tags.join(", ")} placeholder="hot, referral, website" className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                <p className="text-xs text-muted-foreground">Comma, semicolon or new line separated.</p>
                <Button type="submit" size="sm">Save tags</Button>
              </form>
            </CardContent>
          </Card>

          {duplicates.length ? (
            <Card>
              <CardHeader><CardTitle>Possible duplicates</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Exact normalized email matches. Review both records before merging.</p>
                {duplicates.map((duplicate) => (
                  <div key={duplicate.id} className="rounded-xl border border-border/70 p-3">
                    <Link href={`/admin/leads/${duplicate.id}`} className="font-semibold text-primary">{duplicate.full_name || duplicate.email}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">{duplicate.company_name || "No company"} · {leadStatusLabels[duplicate.status]} · score {duplicate.lead_score}</p>
                    {!duplicate.archived_at && !lead.archived_at ? (
                      <form action={mergeLeadAction} className="mt-3">
                        <input type="hidden" name="sourceId" value={duplicate.id} />
                        <input type="hidden" name="targetId" value={lead.id} />
                        <Button type="submit" size="sm" variant="outline">Merge this into current lead</Button>
                      </form>
                    ) : null}
                  </div>
                ))}
                <p className="text-[11px] leading-5 text-muted-foreground">Merge is non-destructive: the source lead is archived and records are moved to the current lead.</p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
