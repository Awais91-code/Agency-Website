"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { getStoredAttribution } from "@/features/analytics/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    key: string;
    title: string;
    href: string | null;
  }>;
};

const hiddenPrefixes = [
  "/admin",
  "/portal",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
];

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AssistantWidget() {
  const pathname = usePathname();
  const hidden = hiddenPrefixes.some((prefix) => pathname.startsWith(prefix));

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I’m an AI assistant. I answer from approved public agency content. I can’t set final prices, contracts or guaranteed delivery dates, and I don’t have access to private client/admin data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [consentToLogging, setConsentToLogging] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [handoffSuggested, setHandoffSuggested] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  const [handoffBusy, setHandoffBusy] = useState(false);
  const [handoffDone, setHandoffDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const history = useMemo(
    () =>
      messages
        .filter((message) => message.id !== "welcome")
        .slice(-8)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages],
  );

  if (hidden) return null;

  async function submit(event: FormEvent) {
    event.preventDefault();

    const message = input.trim();
    if (!message || busy) return;

    setInput("");
    setError(null);
    setBusy(true);
    setMessages((current) => [
      ...current,
      { id: newId(), role: "user", content: message },
    ]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message,
          history,
          conversationId,
          sessionToken,
          consentToLogging,
          sourcePage: pathname,
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        answer?: string;
        conversationId?: string;
        sessionToken?: string;
        sources?: Array<{ key: string; title: string; href: string | null }>;
        handoffSuggested?: boolean;
        detail?: string;
      };

      if (payload.conversationId) setConversationId(payload.conversationId);
      if (payload.sessionToken) setSessionToken(payload.sessionToken);
      if (payload.handoffSuggested) setHandoffSuggested(true);

      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content:
            payload.answer ||
            payload.detail ||
            "I couldn’t complete that request. You can still contact a human.",
          sources: payload.sources,
        },
      ]);

      if (!response.ok && payload.detail) setError(payload.detail);
    } catch {
      setError("The assistant is temporarily unavailable.");
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content:
            "The assistant is temporarily unavailable. Please use the contact page if you need help now.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function submitHandoff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !sessionToken || handoffBusy) return;

    const form = new FormData(event.currentTarget);

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Complete the bot-protection check before sending your details.");
      return;
    }

    setHandoffBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/assistant/handoff", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversationId,
          sessionToken,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          company: String(form.get("company") ?? "") || null,
          serviceType: String(form.get("serviceType") ?? "") || null,
          projectSummary: String(form.get("projectSummary") ?? ""),
          privacyAccepted: form.get("privacyAccepted") === "on",
          attribution: getStoredAttribution(),
          turnstileToken: turnstileToken || "",
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        detail?: string;
      };

      if (!response.ok || !payload.ok) {
        setTurnstileToken(null);
        setTurnstileResetKey((current) => current + 1);
        setError(payload.detail || "Could not hand this enquiry to the team.");
        return;
      }

      setHandoffDone(true);
      setHandoffOpen(false);
      setMessages((current) => [
        ...current,
        {
          id: newId(),
          role: "assistant",
          content:
            payload.message ||
            "Your project details were handed to the agency team.",
        },
      ]);
    } catch {
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
      setError("Could not hand this enquiry to the team.");
    } finally {
      setHandoffBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed bottom-5 right-5 z-50 rounded-full border border-border bg-foreground px-5 py-3 text-sm font-black text-background shadow-xl transition hover:opacity-90"
        aria-expanded={open}
        aria-controls="agency-ai-assistant"
      >
        {open ? "Close AI" : "Ask AI"}
      </button>

      {open ? (
        <section
          id="agency-ai-assistant"
          className="fixed bottom-20 right-4 z-50 flex h-[min(700px,calc(100vh-7rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-border bg-background shadow-2xl"
          aria-label="Agency AI assistant"
        >
          <header className="border-b border-border bg-card px-5 py-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">
              AI assistant
            </p>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Grounded in approved public website content. Human review is required
              for pricing, contracts and delivery commitments.
            </p>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-8 rounded-2xl bg-primary p-3 text-sm leading-6 text-primary-foreground"
                    : "mr-5 rounded-2xl border border-border bg-card p-3 text-sm leading-6"
                }
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.sources?.length ? (
                  <div className="mt-3 border-t border-border/60 pt-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                      Public sources
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {message.sources.map((source) =>
                        source.href ? (
                          <Link
                            key={source.key}
                            href={source.href}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            {source.title}
                          </Link>
                        ) : (
                          <span key={source.key} className="text-xs text-muted-foreground">
                            {source.title}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}
              </article>
            ))}

            {busy ? (
              <p className="text-sm text-muted-foreground">Checking approved content…</p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-700">
                {error}
              </p>
            ) : null}

            {(handoffSuggested || conversationId) && !handoffDone ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-bold">Have a real project?</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  You can explicitly share contact and project details with the team.
                  Nothing is submitted until you send the handoff form.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setHandoffOpen((current) => !current)}
                    className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
                  >
                    Share project details
                  </button>
                  <Link
                    href="/contact"
                    className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold"
                  >
                    Talk to a human
                  </Link>
                </div>
              </div>
            ) : null}

            {handoffDone ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm">
                Your enquiry has been handed to the agency team.
              </div>
            ) : null}

            {handoffOpen && conversationId && sessionToken ? (
              <form onSubmit={submitHandoff} className="space-y-3 rounded-2xl border border-border p-4">
                <p className="font-bold">Project handoff</p>
                <input
                  name="name"
                  required
                  minLength={2}
                  maxLength={160}
                  placeholder="Your name"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
                <input
                  name="company"
                  maxLength={200}
                  placeholder="Company (optional)"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                />
                <select
                  name="serviceType"
                  defaultValue=""
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value="">Service area (optional)</option>
                  <option value="Web platform">Web platform</option>
                  <option value="UI/UX design">UI/UX design</option>
                  <option value="Automation">Automation</option>
                  <option value="AI solution">AI solution</option>
                </select>
                <textarea
                  name="projectSummary"
                  required
                  minLength={20}
                  maxLength={4000}
                  rows={4}
                  placeholder="What are you trying to build or improve?"
                  className="w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
                <label className="flex gap-2 text-xs leading-5 text-muted-foreground">
                  <input name="privacyAccepted" type="checkbox" required className="mt-1" />
                  I agree to submit these contact/project details to the agency team
                  for follow-up.
                </label>
                {TURNSTILE_SITE_KEY ? (
                  <TurnstileWidget
                    key={turnstileResetKey}
                    siteKey={TURNSTILE_SITE_KEY}
                    action="assistant_handoff"
                    onToken={setTurnstileToken}
                  />
                ) : null}
                <button
                  type="submit"
                  disabled={handoffBusy}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
                >
                  {handoffBusy ? "Sending…" : "Send to team"}
                </button>
              </form>
            ) : null}
          </div>

          <form onSubmit={submit} className="border-t border-border bg-card p-4">
            {!conversationId ? (
              <label className="mb-3 flex gap-2 text-[11px] leading-4 text-muted-foreground">
                <input
                  type="checkbox"
                  checked={consentToLogging}
                  onChange={(event) => setConsentToLogging(event.target.checked)}
                />
                Allow this chat’s messages to be stored temporarily for staff review
                and service improvement. If unchecked, message text is not saved by
                the website.
              </label>
            ) : null}

            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                maxLength={1500}
                rows={2}
                placeholder="Ask about services, process or published work…"
                className="min-h-11 flex-1 resize-none rounded-xl border border-border bg-background p-3 text-sm"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="self-end rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
              <span>AI can make mistakes. Important terms require human confirmation.</span>
              <Link href="/privacy" className="font-semibold hover:underline">
                Privacy
              </Link>
            </div>
          </form>
        </section>
      ) : null}
    </>
  );
}
