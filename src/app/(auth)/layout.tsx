import { Container } from "@/components/ui/container";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container className="grid min-h-[70vh] place-items-center py-12 sm:py-20">
      <div className="w-full max-w-md">{children}</div>
    </Container>
  );
}
