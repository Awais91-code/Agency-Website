import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title = "Nothing here yet",
  description = "This area is ready for a future module.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-44 flex-col items-center justify-center p-8 text-center">
        <p className="font-semibold">{title}</p>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
