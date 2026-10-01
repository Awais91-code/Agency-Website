import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { getPublicSiteSettings } from "@/features/content/queries";

export async function SiteFooter() {
  const settings = await getPublicSiteSettings();

  return (
    <footer className="mt-16 border-t border-border/70 bg-card/40">
      <Container className="py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_.8fr] lg:items-start">
          <div className="max-w-xl">
            <Link href="/" className="inline-flex items-center gap-3 font-black tracking-tight">
              <span className="grid size-10 place-items-center rounded-2xl bg-foreground text-background">A</span>
              {settings.agencyName}
            </Link>
            <p className="mt-5 max-w-md leading-7 text-muted-foreground">{settings.agencyDescription}</p>
            <a href={`mailto:${settings.email}`} className="mt-5 inline-flex text-sm font-bold text-primary hover:underline">{settings.email}</a>
            <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-muted-foreground">
              {settings.linkedin ? <a href={settings.linkedin} target="_blank" rel="noreferrer" className="hover:text-foreground">LinkedIn</a> : null}
              {settings.github ? <a href={settings.github} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a> : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:justify-self-end">
            {siteConfig.footerNavigation.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {settings.agencyName}. All rights reserved.</p>
          <p>M11 · Admin CMS</p>
        </div>
      </Container>
    </footer>
  );
}
