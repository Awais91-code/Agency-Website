import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  title = "Something went wrong",
  description = "Please try again. If the problem continues, check the application logs.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <Card role="alert">
      <CardContent className="p-6">
        <p className="font-semibold">{title}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
        {onRetry ? (
          <Button type="button" variant="outline" className="mt-5" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
