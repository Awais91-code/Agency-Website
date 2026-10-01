import { redirect } from "next/navigation";

import { resetPasswordAction } from "@/app/(auth)/actions";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getCurrentAuthContext } from "@/lib/auth/server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string }>;
}) {
  const [params, auth] = await Promise.all([searchParams, getCurrentAuthContext()]);

  if (!auth) {
    redirect("/forgot-password?error=reset_failed");
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-sm font-semibold text-primary">{params.invited ? "Finish account setup" : "Account recovery"}</p>
        <CardTitle className="text-2xl">Choose a new password</CardTitle>
        <CardDescription>Use at least 10 characters and avoid passwords used on other services.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <AuthMessage code={params.error} />
          <form action={resetPasswordAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} required />
            </div>
            <Button type="submit" className="w-full">Save password</Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
