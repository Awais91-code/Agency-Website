"use client";

import { Container } from "@/components/ui/container";
import { ErrorState } from "@/components/ui/error-state";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container className="py-16">
      <ErrorState onRetry={reset} />
      {error.digest ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Error reference: <code>{error.digest}</code>
        </p>
      ) : null}
    </Container>
  );
}
