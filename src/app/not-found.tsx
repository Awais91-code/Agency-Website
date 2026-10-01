import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function NotFound() {
  return (
    <Container className="grid min-h-[62vh] place-items-center py-20 text-center">
      <div className="max-w-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">404 · Not found</p>
        <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-5xl">This page is not part of the system.</h1>
        <p className="mt-5 leading-7 text-muted-foreground">The link may be outdated, the page may have moved, or the module that owns it may not be live yet.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild><Link href="/">Back home</Link></Button>
          <Button asChild variant="outline"><Link href="/contact">Contact us</Link></Button>
        </div>
      </div>
    </Container>
  );
}
