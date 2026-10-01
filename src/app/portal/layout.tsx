import Link from "next/link";

import { signOutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireUser } from "@/lib/auth/server";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireUser("/portal");
  return (
    <main className="min-h-screen bg-muted/20">
      <Container className="py-6 sm:py-8">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/portal" className="text-lg font-black tracking-tight">Client workspace</Link>
            <p className="mt-1 text-sm text-muted-foreground">{auth.displayName ?? auth.email ?? "Signed-in client"}</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline"><Link href="/portal">Projects</Link></Button>
            <Button asChild size="sm" variant="outline"><Link href="/portal/files">Files</Link></Button>
            <form action={signOutAction}><Button type="submit" size="sm" variant="ghost">Sign out</Button></form>
          </nav>
        </header>
        {children}
      </Container>
    </main>
  );
}
