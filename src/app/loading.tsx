import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/loading-state";

export default function Loading() {
  return (
    <Container className="py-16">
      <LoadingState />
    </Container>
  );
}
