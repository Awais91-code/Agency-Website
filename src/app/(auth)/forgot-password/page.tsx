import Link from "next/link";

import { forgotPasswordAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const params = await searchParams;

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-primary">Account recovery</p>
        <CardTitle className="text-2xl">Forgot password</CardTitle>
        <CardDescription>Enter your account email and we will send recovery instructions.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <AuthMessage code={params.error} success={params.sent} />
          <form action={forgotPasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="w-full">Send reset link</Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
