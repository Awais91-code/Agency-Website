import {
  closeAiConversationAction,
  saveAiKnowledgeAction,
  saveAiSettingsAction,
} from "@/app/admin/ai/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAiAdminData } from "@/features/ai/admin";
import { formatDateTime } from "@/features/leads/format";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string; saved?: string }>;
};

export default async function AdminAiPage({ searchParams }: PageProps) {
  await requireAdmin();
  const [query, data] = await Promise.all([searchParams, getAiAdminData()]);
  const settings = data.settings;

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold text-primary">M15 · AI website assistant</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">AI assistant</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Public knowledge grounding, prompt/version controls, consent-aware review,
          abuse visibility and human handoff.
        </p>
      </div>

      {query.error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-700">
          {query.error}
        </div>
      ) : null}

      {query.saved ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
          Saved.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Responses", data.summary.responses],
          ["Handoffs", data.summary.handoffs],
          ["Safety blocks", data.summary.safetyBlocks],
          ["Rate limits", data.summary.rateLimits],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assistant configuration</CardTitle>
          <CardDescription>
            OpenAI key status: {data.providerConfigured ? "configured" : "not configured"}.
            Without a key, the widget uses a deterministic approved-content fallback.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={saveAiSettingsAction} className="grid gap-4 lg:grid-cols-2">
            <label className="text-sm font-semibold">
              Model
              <input
                name="model"
                defaultValue={settings.model}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Prompt version
              <input
                name="promptVersion"
                defaultValue={settings.prompt_version}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Retention days for consented chat logs
              <input
                name="retentionDays"
                type="number"
                min={1}
                max={365}
                defaultValue={settings.retention_days}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Max messages / conversation
              <input
                name="maxMessages"
                type="number"
                min={3}
                max={100}
                defaultValue={settings.max_messages_per_conversation}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Requests / 10 minutes
              <input
                name="rateLimit"
                type="number"
                min={1}
                max={200}
                defaultValue={settings.rate_limit_per_10m}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold">
              Human handoff label
              <input
                name="handoffLabel"
                defaultValue={settings.handoff_label}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <label className="text-sm font-semibold lg:col-span-2">
              Human handoff URL
              <input
                name="handoffHref"
                defaultValue={settings.handoff_href}
                className="mt-2 h-10 w-full rounded-xl border border-border bg-background px-3 font-normal"
              />
            </label>

            <div className="lg:col-span-2 grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="assistantEnabled" type="checkbox" defaultChecked={settings.assistant_enabled} />
                Assistant enabled
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="loggingEnabled" type="checkbox" defaultChecked={settings.logging_enabled} />
                Consent-based message logging enabled
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="reviewEnabled" type="checkbox" defaultChecked={settings.review_enabled} />
                Staff conversation review enabled
              </label>
            </div>

            <div className="lg:col-span-2">
              <Button type="submit">Save AI settings</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div id="knowledge" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-2xl font-black">Approved knowledge snippets</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These are used alongside published Services, FAQs, Case Studies and
            selected published page sections. Private admin/client tables are not
            queried by the public assistant.
          </p>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-lg">Add knowledge snippet</CardTitle></CardHeader>
          <CardContent>
            <form action={saveAiKnowledgeAction} className="grid gap-3 lg:grid-cols-2">
              <input name="knowledgeKey" required placeholder="policy.example-key" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
              <input name="category" required placeholder="policy or process" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
              <input name="title" required placeholder="Title" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
              <input name="href" placeholder="/terms" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
              <textarea name="content" required minLength={10} rows={4} placeholder="Approved public text" className="lg:col-span-2 rounded-xl border border-border bg-background p-3 text-sm" />
              <input name="sortOrder" type="number" defaultValue="100" className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input name="isApproved" type="checkbox" defaultChecked />
                Approved for AI grounding
              </label>
              <div className="lg:col-span-2"><Button type="submit" size="sm">Create snippet</Button></div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          {data.knowledge.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-5">
                <form action={saveAiKnowledgeAction} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input name="knowledgeKey" defaultValue={item.knowledge_key} className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
                    <input name="category" defaultValue={item.category} className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
                  </div>
                  <input name="title" defaultValue={item.title} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm" />
                  <textarea name="content" defaultValue={item.content} rows={4} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input name="href" defaultValue={item.href ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
                    <input name="sortOrder" type="number" defaultValue={item.sort_order} className="h-10 rounded-xl border border-border bg-background px-3 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input name="isApproved" type="checkbox" defaultChecked={item.is_approved} />
                    Approved
                  </label>
                  <Button type="submit" size="sm">Save snippet</Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consented conversation review</CardTitle>
          <CardDescription>
            Only chats where the visitor opted into website message logging are
            shown here. Metadata-only events can exist for non-consented sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!settings.review_enabled ? (
            <p className="text-sm text-muted-foreground">
              Conversation review is disabled in AI settings.
            </p>
          ) : data.conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No consented chats yet.</p>
          ) : (
            data.conversations.map((conversation) => (
              <details key={conversation.id} className="rounded-xl border border-border/70 p-4">
                <summary className="cursor-pointer font-semibold">
                  {formatDateTime(conversation.created_at)} · {conversation.status} ·
                  {" "}{conversation.message_count} turn(s)
                </summary>
                <div className="mt-4 space-y-3">
                  {conversation.messages.map((message) => (
                    <div key={message.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                        {message.role}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap leading-6">{message.body}</p>
                    </div>
                  ))}
                  <form action={closeAiConversationAction}>
                    <input type="hidden" name="id" value={conversation.id} />
                    <Button type="submit" size="sm" variant="outline">Close conversation</Button>
                  </form>
                </div>
              </details>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent AI events</CardTitle>
          <CardDescription>
            Operational metadata such as prompt/model, guardrail triggers, latency,
            handoff and rate-limit events. Raw non-consented message text is not
            stored here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.events.length === 0 ? (
            <p className="text-sm text-muted-foreground">No AI events yet.</p>
          ) : (
            data.events.map((event) => (
              <div key={event.id} className="grid gap-2 rounded-xl border border-border/70 p-3 text-sm md:grid-cols-[1fr_1fr_auto]">
                <p className="font-semibold">{event.event_type}</p>
                <p className="truncate text-xs text-muted-foreground">{JSON.stringify(event.metadata)}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.created_at)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </section>
  );
}
