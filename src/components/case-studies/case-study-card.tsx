import Link from "next/link";

import type { CaseStudySummary } from "@/features/case-studies/types";

export function CaseStudyCard({ study }: { study: CaseStudySummary }) {
  const serviceText = study.services.map((service) => service.title).join(" · ");

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
      <Link href={`/work/${study.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_34%),linear-gradient(145deg,color-mix(in_oklab,var(--card)_90%,var(--primary)_10%),var(--background))]">
          {study.heroMediaUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={study.heroMediaUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]" />
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_45%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_45%,transparent)_1px,transparent_1px)] bg-[size:38px_38px] opacity-45" />
              <div className="absolute inset-x-7 bottom-7 top-8 rounded-2xl border border-border/70 bg-background/82 p-5 shadow-2xl backdrop-blur-xl transition duration-500 group-hover:-translate-y-1 sm:inset-x-10">
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="size-2 rounded-full bg-red-400/80" />
                    <span className="size-2 rounded-full bg-amber-400/80" />
                    <span className="size-2 rounded-full bg-emerald-400/80" />
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">{study.projectLabel}</span>
                </div>
                <div className="mt-5 grid h-[calc(100%-2.5rem)] grid-cols-[1.2fr_.8fr] gap-3">
                  <div className="rounded-xl border border-border/70 bg-card p-4">
                    <div className="h-2 w-14 rounded-full bg-primary/60" />
                    <div className="mt-4 h-16 rounded-xl bg-gradient-to-br from-primary/16 to-primary/3" />
                    <div className="mt-3 h-2 w-4/5 rounded-full bg-muted" />
                    <div className="mt-2 h-2 w-2/3 rounded-full bg-muted" />
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-xl border border-border/70 bg-card p-3">
                      <div className="h-2 w-10 rounded-full bg-muted-foreground/30" />
                      <div className="mt-3 text-lg font-black tracking-tight text-primary">FLOW</div>
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card p-3">
                      <div className="h-2 w-12 rounded-full bg-muted-foreground/30" />
                      <div className="mt-3 grid grid-cols-3 gap-1.5">
                        {[1, 2, 3].map((item) => <span key={item} className="h-7 rounded-md bg-primary/12" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="p-6 sm:p-7">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="rounded-full border border-border px-3 py-1">{study.projectLabel}</span>
            {study.industry ? <span>{study.industry}</span> : null}
          </div>
          <h2 className="mt-5 text-2xl font-black tracking-tight">{study.title}</h2>
          {serviceText ? <p className="mt-2 text-xs font-bold text-primary">{serviceText}</p> : null}
          <p className="mt-3 leading-7 text-muted-foreground">{study.shortDescription}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary">
            Read case study <span aria-hidden="true">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
