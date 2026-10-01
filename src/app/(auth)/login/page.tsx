import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { safeInternalPath } from "@/lib/auth/redirects";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeInternalPath(params.next, "");

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-primary">Secure access</p>
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <CardDescription>Use your agency staff or client account.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <AuthMessage code={params.error} success={params.success} />
          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" autoComplete="current-password" minLength={8} required />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            Accounts are created by agency administrators. Public self-registration is intentionally disabled at the app layer.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
