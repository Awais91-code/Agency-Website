import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { canManageSiteSettings } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireStaff();
  const canManageSettings = canManageSiteSettings(auth.role);

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Protected staff area</p>
          <p className="mt-1 font-semibold">{auth.displayName ?? auth.email ?? "Agency user"}</p>
          <p className="text-sm text-muted-foreground">Role: {auth.role.replace("_", " ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline"><Link href="/admin">Overview</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/leads">Leads</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/pipeline">Pipeline</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/bookings">Bookings</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/projects">Projects</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/content">Content</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/services">Services</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/case-studies">Work</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/blog">Blog</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/media">Media</Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/admin/quote-rules">Quote rules</Link></Button>
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/analytics">Analytics</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/ai">AI</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/automation-logs">Automation</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/notifications">Notifications</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/settings">Settings</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/audit">Audit</Link></Button> : null}
          {canManageSettings ? <Button asChild size="sm" variant="outline"><Link href="/admin/security">Security</Link></Button> : null}
          <Button asChild size="sm" variant="outline"><Link href="/">Public site</Link></Button>
          <form action={signOutAction}><Button type="submit" size="sm" variant="ghost">Sign out</Button></form>
        </div>
      </div>
      {children}
    </Container>
  );
}
