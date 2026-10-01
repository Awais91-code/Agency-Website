import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/82 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/72">
      <Container className="flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="group inline-flex items-center gap-3 font-semibold tracking-tight" aria-label={`${siteConfig.name} home`}>
          <span className="relative grid size-10 place-items-center overflow-hidden rounded-2xl bg-foreground text-sm font-black text-background shadow-lg shadow-primary/10">
            <span className="absolute inset-0 bg-gradient-to-br from-primary/45 via-transparent to-transparent" />
            <span className="relative">A</span>
          </span>
          <span className="text-base font-black tracking-[-0.02em]">{siteConfig.shortName}</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
          {siteConfig.navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
            <Link href="/login">Client sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/start-a-project" data-analytics-event="primary_cta_click" data-analytics-location="site-header">Start a project</Link>
          </Button>
        </div>

        <details className="relative sm:hidden">
          <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl border border-border bg-card text-foreground [&::-webkit-details-marker]:hidden" aria-label="Open navigation">
            <span aria-hidden="true" className="text-xl leading-none">≡</span>
          </summary>
          <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-card p-3 shadow-2xl">
            <nav aria-label="Mobile navigation" className="grid gap-1">
              {siteConfig.navigation.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl px-4 py-3 text-sm font-semibold hover:bg-muted">
                  {item.label}
                </Link>
              ))}
              <Link href="/contact" data-analytics-event="primary_cta_click" data-analytics-location="mobile-header" className="mt-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-bold text-primary-foreground">
                Start a project
              </Link>
              <Link href="/login" className="rounded-xl px-4 py-3 text-center text-sm font-semibold text-muted-foreground hover:bg-muted">
                Client sign in
              </Link>
            </nav>
          </div>
        </details>
      </Container>
    </header>
  );
}
