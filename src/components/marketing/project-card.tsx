import Link from "next/link";

import { cn } from "@/lib/utils";

type ProjectCardProps = {
  label: string;
  title: string;
  category: string;
  description: string;
  accent: "violet" | "cyan" | "amber";
};

const accentClasses = {
  violet: "from-violet-500/22 via-fuchsia-500/8 to-transparent",
  cyan: "from-cyan-500/20 via-blue-500/8 to-transparent",
  amber: "from-amber-500/20 via-orange-500/8 to-transparent",
} as const;

export function ProjectCard({ label, title, category, description, accent }: ProjectCardProps) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/5">
      <div className={cn("relative aspect-[16/10] overflow-hidden bg-gradient-to-br", accentClasses[accent])}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--border)_52%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--border)_52%,transparent)_1px,transparent_1px)] bg-[size:36px_36px] opacity-50" />
        <div className="absolute inset-x-6 bottom-6 top-8 rounded-2xl border border-white/10 bg-background/78 p-4 shadow-2xl backdrop-blur-xl transition-transform duration-500 group-hover:-translate-y-1 sm:inset-x-10 sm:p-5">
          <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
            <div className="flex gap-1.5" aria-hidden="true">
              <span className="size-2 rounded-full bg-red-400/80" />
              <span className="size-2 rounded-full bg-amber-400/80" />
              <span className="size-2 rounded-full bg-emerald-400/80" />
            </div>
            <div className="h-2 w-24 rounded-full bg-muted" />
          </div>
          <div className="mt-4 grid grid-cols-[1.15fr_.85fr] gap-3">
            <div className="rounded-xl border border-border/70 bg-card p-3">
              <div className="h-2 w-16 rounded-full bg-primary/60" />
              <div className="mt-4 h-20 rounded-lg bg-gradient-to-br from-primary/16 to-primary/3" />
              <div className="mt-3 h-2 w-4/5 rounded-full bg-muted" />
              <div className="mt-2 h-2 w-2/3 rounded-full bg-muted" />
            </div>
            <div className="grid gap-3">
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <div className="h-2 w-10 rounded-full bg-muted-foreground/30" />
                <div className="mt-3 text-2xl font-black tracking-tight text-primary">+24%</div>
              </div>
              <div className="rounded-xl border border-border/70 bg-card p-3">
                <div className="h-2 w-12 rounded-full bg-muted-foreground/30" />
                <div className="mt-3 flex items-end gap-1" aria-hidden="true">
                  {[30, 46, 38, 68, 56, 82].map((height, index) => (
                    <span key={index} className="w-full rounded-sm bg-primary/45" style={{ height: `${height / 2}px` }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="rounded-full border border-border px-3 py-1">{label}</span>
          <span>{category}</span>
        </div>
        <h3 className="mt-5 text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
        <Link href="/contact" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          Build something similar <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
