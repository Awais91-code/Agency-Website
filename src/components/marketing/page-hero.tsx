import { Container } from "@/components/ui/container";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="page-orb page-orb-one" />
      <div className="page-orb page-orb-two" />
      <Container className="relative py-20 sm:py-24 lg:py-28">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.045em] sm:text-5xl lg:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
      </Container>
    </section>
  );
}
