"use client";

import { FormEvent, useState } from "react";

import { trackAnalyticsEvent } from "@/features/analytics/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const email = "hello@agency.example";

export function ContactForm() {
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const company = String(form.get("company") ?? "").trim();
    const project = String(form.get("project") ?? "").trim();

    const subject = encodeURIComponent(`Project enquiry${company ? ` · ${company}` : ""}`);
    const body = encodeURIComponent(`Name: ${name}\nCompany: ${company || "Not provided"}\n\nProject:\n${project}`);

    void trackAnalyticsEvent(
      "contact_submit",
      { channel: "mailto", location: "contact-form" },
      { onceKey: "contact-form-mailto-submit" },
    );

    setMessage("Opening your email app. The structured project brief remains the CRM-backed intake path.");
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required autoComplete="name" placeholder="Your name" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" autoComplete="organization" placeholder="Company or team" />
        </div>
      </div>
      <div className="mt-5 grid gap-2">
        <Label htmlFor="project">What are you trying to build or improve?</Label>
        <textarea
          id="project"
          name="project"
          required
          rows={7}
          placeholder="A short description of the project, current problem, desired result and any important deadline."
          className="min-h-36 w-full resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
      </div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg">Prepare email enquiry</Button>
        <p className="text-xs leading-5 text-muted-foreground sm:max-w-xs sm:text-right">M05 uses an email fallback. Structured CRM-backed submission is introduced in M08/M09.</p>
      </div>
      {message ? <p role="status" className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
