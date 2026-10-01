import Link from "next/link";

import { cn } from "@/lib/utils";

type ServiceCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: readonly string[];
  className?: string;
  href?: string;
};

export function ServiceCard({ eyebrow, title, description, bullets, className, href = "/services" }: ServiceCardProps) {
  return (
    <article className={cn("group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-7", className)}>
      <div className="absolute -right-16 -top-16 size-40 rounded-full bg-primary/7 blur-3xl transition duration-500 group-hover:bg-primary/12" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs font-black tracking-[0.22em] text-primary">{eyebrow}</span>
          <span aria-hidden="true" className="text-xl text-muted-foreground transition-transform duration-300 group-hover:translate-x-1">↗</span>
        </div>
        <h3 className="mt-7 text-2xl font-bold tracking-tight">{title}</h3>
        <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
        <ul className="mt-7 grid gap-3 text-sm text-foreground/85">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {bullet}
            </li>
          ))}
        </ul>
        <Link href={href} className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          Explore this service <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
