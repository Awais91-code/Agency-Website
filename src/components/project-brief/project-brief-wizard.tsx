"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getStoredAttribution, trackAnalyticsEvent } from "@/features/analytics/client";
import { budgetOptions, createEmptyProjectBrief, featureOptions, projectTypeOptions } from "@/features/project-brief/config";
import type { EstimateResult, ProjectBriefFormState, ProjectType } from "@/features/project-brief/types";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "agency-project-brief-v1";
const IDEMPOTENCY_KEY = "agency-project-brief-idempotency-v1";
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const steps = ["Project", "Context", "Timing", "Budget", "Contact", "Review"];

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-sm font-medium text-red-600">{children}</p>;
}

function OptionCard({
  selected,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  title: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-primary/8 shadow-sm" : "border-border bg-card",
      )}
      aria-pressed={selected}
    >
      <span className="block font-bold">{title}</span>
      {description ? <span className="mt-1 block text-sm leading-6 text-muted-foreground">{description}</span> : null}
    </button>
  );
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as { ok: boolean; data?: T; error?: { message?: string; fieldErrors?: Record<string, string[]> } };
  if (!response.ok || !payload.ok || !payload.data) {
    const error = new Error(payload.error?.message || "Request failed.") as Error & { fieldErrors?: Record<string, string[]> };
    error.fieldErrors = payload.error?.fieldErrors;
    throw error;
  }
  return payload.data;
}

export function ProjectBriefWizard({ initialServiceSlug = "" }: { initialServiceSlug?: string }) {
  const router = useRouter();
  const [state, setState] = React.useState<ProjectBriefFormState>(() => createEmptyProjectBrief(initialServiceSlug));
  const [step, setStep] = React.useState(0);
  const [hydrated, setHydrated] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [estimateLoading, setEstimateLoading] = React.useState(false);
  const [estimate, setEstimate] = React.useState<EstimateResult | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = React.useState(0);

  React.useEffect(() => {
    const fallback = createEmptyProjectBrief(initialServiceSlug);
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      const parsed = stored ? (JSON.parse(stored) as Partial<ProjectBriefFormState>) : null;
      const next = { ...fallback, ...(parsed ?? {}) };
      if (!next.sessionToken) next.sessionToken = crypto.randomUUID();
      if (!next.startedAt) next.startedAt = Date.now();
      if (initialServiceSlug && !parsed?.serviceSlug) {
        next.serviceSlug = initialServiceSlug;
      }
      setState(next);
    } catch {
      fallback.sessionToken = crypto.randomUUID();
      setState(fallback);
    } finally {
      setHydrated(true);
    }
  }, [initialServiceSlug]);

  React.useEffect(() => {
    if (!hydrated || !state.sessionToken) return;

    void trackAnalyticsEvent(
      "project_brief_start",
      {
        location: "start-a-project",
        service_slug: state.serviceSlug || undefined,
      },
      { onceKey: `project-brief-start:${state.sessionToken}` },
    );
  }, [hydrated, state.sessionToken, state.serviceSlug]);

  React.useEffect(() => {
    if (!hydrated || !state.sessionToken) return;

    void trackAnalyticsEvent(
      "project_brief_step",
      {
        step,
        step_name: steps[step],
        service_slug: state.serviceSlug || undefined,
      },
      { onceKey: `project-brief-step:${state.sessionToken}:${step}` },
    );
  }, [hydrated, state.sessionToken, state.serviceSlug, step]);

  React.useEffect(() => {
    if (!hydrated) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    if (!state.sessionToken || !state.projectType) return;
    const timer = window.setTimeout(() => {
      setSaving(true);
      postJson<{ saved: boolean }>("/api/project-briefs/draft", { ...state, attribution: readAttribution() })
        .catch(() => undefined)
        .finally(() => setSaving(false));
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  React.useEffect(() => {
    if (step !== 5 || !state.projectType) return;
    void refreshEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function update<K extends keyof ProjectBriefFormState>(key: K, value: ProjectBriefFormState[K]) {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[String(key)];
      return next;
    });
    setState((current) => ({ ...current, [key]: value }));
    setEstimate(null);
  }

  function toggleFeature(feature: string) {
    setState((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
    setEstimate(null);
  }

  function validateCurrentStep() {
    const errors: Record<string, string[]> = {};
    if (step === 0 && !state.projectType) errors.projectType = ["Choose the closest project type."];
    if (step === 1 && state.objective.trim().length < 20) errors.objective = ["Add at least a short business objective."];
    if (step === 4) {
      if (state.contactName.trim().length < 2) errors.contactName = ["Enter your name."];
      if (!/^\S+@\S+\.\S+$/.test(state.contactEmail)) errors.contactEmail = ["Enter a valid email address."];
      if (state.requirements.trim().length < 20) errors.requirements = ["Add a short description of the required scope."];
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function goNext() {
    setMessage(null);
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(5, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setMessage(null);
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function refreshEstimate() {
    if (!state.projectType) return;
    setEstimateLoading(true);
    setMessage(null);
    try {
      const result = await postJson<EstimateResult>("/api/project-briefs/estimate", {
        projectType: state.projectType,
        features: state.features,
        complexity: state.complexity,
        urgency: state.urgency,
        support: state.support,
      });
      setEstimate(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Estimate is temporarily unavailable. You can still submit the brief.");
    } finally {
      setEstimateLoading(false);
    }
  }

  async function submit() {
    setMessage(null);
    setFieldErrors({});
    if (!state.privacyAccepted) {
      setFieldErrors({ privacyAccepted: ["Accept the privacy notice before submitting."] });
      return;
    }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setMessage("Complete the bot-protection check before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      let idempotencyKey = window.sessionStorage.getItem(IDEMPOTENCY_KEY);
      if (!idempotencyKey) {
        idempotencyKey = crypto.randomUUID();
        window.sessionStorage.setItem(IDEMPOTENCY_KEY, idempotencyKey);
      }

      const result = await postJson<{ submitted: boolean; bookingContext?: string }>("/api/project-briefs/submit", {
        ...state,
        idempotencyKey,
        attribution: readAttribution(),
        turnstileToken: turnstileToken || "",
      });

      window.sessionStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(IDEMPOTENCY_KEY);
      router.push(result.bookingContext ? `/quote/success?booking=${encodeURIComponent(result.bookingContext)}` : "/quote/success");
    } catch (error) {
      setTurnstileToken(null);
      setTurnstileResetKey((current) => current + 1);
      const typed = error as Error & { fieldErrors?: Record<string, string[]> };
      if (typed.fieldErrors) setFieldErrors(typed.fieldErrors);
      setMessage(typed.message || "Could not submit the project brief.");
    } finally {
      setSubmitting(false);
    }
  }

  const visibleFeatures = featureOptions.filter((feature) =>
    state.projectType ? feature.projectTypes.includes(state.projectType as ProjectType) : false,
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div>
        <div className="mb-6 overflow-x-auto pb-2" aria-label="Project brief progress">
          <ol className="flex min-w-[38rem] gap-2">
            {steps.map((label, index) => (
              <li key={label} className="flex-1">
                <button
                  type="button"
                  onClick={() => index < step && setStep(index)}
                  disabled={index > step}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 text-left text-xs font-bold transition",
                    index === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : index < step
                        ? "border-primary/30 bg-primary/8 text-foreground"
                        : "border-border bg-card text-muted-foreground",
                  )}
                >
                  <span className="mr-1.5 opacity-70">{index + 1}.</span>{label}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <Card className="rounded-[2rem]">
          <CardHeader className="border-b border-border/70 p-6 sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-primary">Step {step + 1} of {steps.length}</p>
            <CardTitle className="mt-2 text-2xl sm:text-3xl">{stepTitle(step)}</CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{stepDescription(step)}</p>
          </CardHeader>
          <CardContent className="space-y-6 p-6 sm:p-8">
            {step === 0 ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  {projectTypeOptions.map((option) => (
                    <OptionCard
                      key={option.value}
                      selected={state.projectType === option.value}
                      title={option.label}
                      description={option.description}
                      onClick={() => {
                        update("projectType", option.value);
                        setState((current) => ({
                          ...current,
                          features: current.features.filter((feature) =>
                            featureOptions.some((item) => item.value === feature && item.projectTypes.includes(option.value)),
                          ),
                        }));
                      }}
                    />
                  ))}
                </div>
                <FieldError>{fieldErrors.projectType?.[0]}</FieldError>
                {state.projectType && visibleFeatures.length ? (
                  <div className="border-t border-border/70 pt-6">
                    <Label className="text-base font-bold">Useful features</Label>
                    <p className="mt-1 text-sm text-muted-foreground">Select only what seems relevant. We can refine this during discovery.</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {visibleFeatures.map((feature) => (
                        <label key={feature.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background p-4">
                          <input
                            type="checkbox"
                            checked={state.features.includes(feature.value)}
                            onChange={() => toggleFeature(feature.value)}
                            className="mt-1 size-4 accent-[var(--primary)]"
                          />
                          <span className="font-semibold">{feature.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {step === 1 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company / organization" name="companyName" value={state.companyName} onChange={(value) => update("companyName", value)} />
                <Field label="Industry" name="industry" value={state.industry} onChange={(value) => update("industry", value)} />
                <Field label="Current website / product URL" name="currentUrl" value={state.currentUrl} onChange={(value) => update("currentUrl", value)} className="sm:col-span-2" />
                <div className="sm:col-span-2">
                  <Label htmlFor="objective">Main business objective</Label>
                  <textarea
                    id="objective"
                    value={state.objective}
                    onChange={(event) => update("objective", event.target.value)}
                    rows={5}
                    placeholder="Example: replace our current site, improve qualified enquiries, and connect project requests to our sales workflow."
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <FieldError>{fieldErrors.objective?.[0]}</FieldError>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-7">
                <div>
                  <Label className="text-base font-bold">Complexity</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["standard", "Standard", "Clear scope and common integrations."],
                      ["advanced", "Advanced", "More custom workflows or integrations."],
                      ["enterprise", "High complexity", "Multiple systems, roles or unusual constraints."],
                    ].map(([value, label, description]) => (
                      <OptionCard key={value} selected={state.complexity === value} title={label} description={description} onClick={() => update("complexity", value as ProjectBriefFormState["complexity"])} />
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-bold">Timeline</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["flexible", "Flexible", "No fixed launch pressure."],
                      ["standard", "Standard", "Normal planning and delivery window."],
                      ["urgent", "Urgent", "Compressed timeline or fixed near-term date."],
                    ].map(([value, label, description]) => (
                      <OptionCard key={value} selected={state.urgency === value} title={label} description={description} onClick={() => update("urgency", value as ProjectBriefFormState["urgency"])} />
                    ))}
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Preferred start date" name="desiredStart" type="date" value={state.desiredStart} onChange={(value) => update("desiredStart", value)} />
                  <Field label="Target deadline" name="deadline" type="date" value={state.deadline} onChange={(value) => update("deadline", value)} />
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="space-y-7">
                <div>
                  <Label htmlFor="budgetBand" className="text-base font-bold">Indicative project budget</Label>
                  <select id="budgetBand" value={state.budgetBand} onChange={(event) => update("budgetBand", event.target.value)} className="mt-3 h-12 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {budgetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-base font-bold">Post-launch support</Label>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <OptionCard selected={state.support === "none"} title="Not sure / none" description="Decide after scope review." onClick={() => update("support", "none")} />
                    <OptionCard selected={state.support === "launch-support"} title="Launch support" description="A defined stabilization period after launch." onClick={() => update("support", "launch-support")} />
                    <OptionCard selected={state.support === "monthly-retainer"} title="Ongoing retainer" description="Continued support, iteration or operations." onClick={() => update("support", "monthly-retainer")} />
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-6 text-muted-foreground">
                  The budget selection helps us qualify the right engagement model. The estimate shown later is generated from configurable rules and remains non-binding until a human reviews the scope.
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" name="contactName" value={state.contactName} onChange={(value) => update("contactName", value)} error={fieldErrors.contactName?.[0]} required />
                <Field label="Work email" name="contactEmail" type="email" value={state.contactEmail} onChange={(value) => update("contactEmail", value)} error={fieldErrors.contactEmail?.[0]} required />
                <Field label="Phone (optional)" name="contactPhone" value={state.contactPhone} onChange={(value) => update("contactPhone", value)} />
                <Field label="Country / timezone" name="timezoneCountry" value={state.timezoneCountry} onChange={(value) => update("timezoneCountry", value)} />
                <div className="sm:col-span-2">
                  <Label htmlFor="requirements">Anything else we should know?</Label>
                  <textarea
                    id="requirements"
                    value={state.requirements}
                    onChange={(event) => update("requirements", event.target.value)}
                    rows={6}
                    placeholder="Key pages, integrations, existing systems, content readiness, users, or constraints."
                    className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <FieldError>{fieldErrors.requirements?.[0]}</FieldError>
                </div>
                <div className="absolute left-[-9999px]" aria-hidden="true">
                  <label htmlFor="companyWebsiteFax">Leave this field empty</label>
                  <input id="companyWebsiteFax" tabIndex={-1} autoComplete="off" value={state.honeypot} onChange={(event) => update("honeypot", event.target.value)} />
                </div>
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Summary label="Project type" value={projectTypeOptions.find((item) => item.value === state.projectType)?.label ?? "Not selected"} />
                  <Summary label="Budget" value={budgetOptions.find((item) => item.value === state.budgetBand)?.label ?? state.budgetBand} />
                  <Summary label="Features" value={state.features.length ? `${state.features.length} selected` : "No additional features selected"} />
                  <Summary label="Contact" value={state.contactEmail || "Not provided"} />
                </div>

                <div className="rounded-2xl border border-primary/30 bg-primary/6 p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">Indicative estimate</p>
                      {estimate ? (
                        <p className="mt-2 text-3xl font-black tracking-tight">{formatMoney(estimate.finalMin, estimate.currency)} – {formatMoney(estimate.finalMax, estimate.currency)}</p>
                      ) : (
                        <p className="mt-2 text-lg font-bold">{estimateLoading ? "Calculating…" : "Estimate unavailable"}</p>
                      )}
                    </div>
                    <Button type="button" variant="outline" onClick={() => void refreshEstimate()} disabled={estimateLoading}>Recalculate</Button>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{estimate?.disclaimer ?? "You can submit the brief even if the estimate service is temporarily unavailable."}</p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm leading-6">
                  <input type="checkbox" checked={state.privacyAccepted} onChange={(event) => update("privacyAccepted", event.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
                  <span>I agree that the agency may use these details to review and respond to this project enquiry. <a href="/privacy" className="font-semibold text-primary hover:underline">Privacy notice</a>.</span>
                </label>
                <FieldError>{fieldErrors.privacyAccepted?.[0]}</FieldError>

                {TURNSTILE_SITE_KEY ? (
                  <TurnstileWidget
                    key={turnstileResetKey}
                    siteKey={TURNSTILE_SITE_KEY}
                    action="project_brief_submit"
                    onToken={setTurnstileToken}
                  />
                ) : null}

                <label className="flex items-start gap-3 text-sm leading-6 text-muted-foreground">
                  <input type="checkbox" checked={state.marketingConsent} onChange={(event) => update("marketingConsent", event.target.checked)} className="mt-1 size-4 accent-[var(--primary)]" />
                  <span>Optional: send me useful agency updates. This is separate from messages needed to respond to this enquiry.</span>
                </label>
              </div>
            ) : null}

            {message ? <div role="alert" className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-medium text-red-600">{message}</div> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-6">
              <div className="text-xs text-muted-foreground">{saving ? "Saving draft…" : hydrated ? "Draft saved in this browser and synced when available." : "Preparing form…"}</div>
              <div className="flex gap-2">
                {step > 0 ? <Button type="button" variant="outline" onClick={goBack}>Back</Button> : null}
                {step < 5 ? <Button type="button" onClick={() => void goNext()}>Continue <span aria-hidden="true">→</span></Button> : <Button type="button" onClick={() => void submit()} disabled={submitting}>{submitting ? "Submitting…" : "Submit project brief"}</Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <Card>
          <CardHeader><CardTitle className="text-base">What happens next?</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p><strong className="text-foreground">1.</strong> Your brief is saved as one structured enquiry.</p>
            <p><strong className="text-foreground">2.</strong> The estimate and lead score help the team review it efficiently.</p>
            <p><strong className="text-foreground">3.</strong> Final scope, price and delivery dates stay under human review.</p>
          </CardContent>
        </Card>
        <div className="rounded-2xl border border-border bg-muted/40 p-5 text-sm leading-6 text-muted-foreground">
          Not ready for the full brief? <a href="/contact" className="font-semibold text-foreground hover:text-primary">Send a general message instead.</a>
        </div>
      </aside>
    </div>
  );
}

function readAttribution() {
  if (typeof window === "undefined") return {};
  return getStoredAttribution();
}

function stepTitle(step: number) {
  return [
    "What are we building?",
    "What should the project change for the business?",
    "How complex and time-sensitive is it?",
    "What engagement range makes sense?",
    "Where should we send the response?",
    "Review the brief before sending it.",
  ][step];
}

function stepDescription(step: number) {
  return [
    "Choose the closest project type and the features you already know you need.",
    "A clear objective is more useful than a perfect technical specification.",
    "These answers adjust the estimate range without making a delivery promise.",
    "Budget and support preferences help us recommend a realistic scope.",
    "Contact details are used for this enquiry; optional marketing consent is separate.",
    "The range is indicative. A human reviews unusual scope, final pricing and commitments.",
  ][step];
}

function Field({ label, name, value, onChange, type = "text", className, error, required }: { label: string; name: string; value: string; onChange: (value: string) => void; type?: string; className?: string; error?: string; required?: boolean }) {
  return (
    <div className={className}>
      <Label htmlFor={name}>{label}{required ? " *" : ""}</Label>
      <Input id={name} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-2" aria-invalid={Boolean(error)} />
      <FieldError>{error}</FieldError>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-4"><p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-2 font-semibold">{value}</p></div>;
}
