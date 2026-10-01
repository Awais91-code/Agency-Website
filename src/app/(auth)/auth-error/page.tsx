import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthErrorPage() {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-red-600">Authentication link failed</p>
        <CardTitle className="text-2xl">This link cannot be used</CardTitle>
        <CardDescription>It may have expired, already been used, or been opened with an invalid token.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild><Link href="/forgot-password">Request a new reset link</Link></Button>
        <Button asChild variant="outline"><Link href="/login">Back to sign in</Link></Button>
      </CardContent>
    </Card>
  );
}
