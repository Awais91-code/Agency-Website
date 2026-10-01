"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { env } from "@/config/env";
import { safeInternalPath } from "@/lib/auth/redirects";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const emailSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
});

const passwordSchema = z
  .object({
    password: z.string().min(10, "Use at least 10 characters.").max(128),
    confirmPassword: z.string().max(128),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function value(formData: FormData, name: string) {
  const item = formData.get(name);
  return typeof item === "string" ? item : "";
}

function mapLoginError(code?: string, message?: string) {
  const normalizedCode = (code ?? "").toLowerCase();
  const normalizedMessage = (message ?? "").toLowerCase();

  if (
    normalizedCode.includes("email_not_confirmed") ||
    normalizedMessage.includes("email not confirmed")
  ) {
    return "email_not_confirmed";
  }

  if (
    normalizedCode.includes("invalid_credentials") ||
    normalizedMessage.includes("invalid login credentials")
  ) {
    return "invalid_credentials";
  }

  if (
    normalizedCode.includes("over_request_rate_limit") ||
    normalizedMessage.includes("rate limit")
  ) {
    return "too_many_requests";
  }

  return "auth_failed";
}

export async function signInAction(formData: FormData) {
  const parsed = credentialsSchema.safeParse({
    email: value(formData, "email"),
    password: value(formData, "password"),
  });
  const next = safeInternalPath(value(formData, "next"), "");

  if (!parsed.success) {
    redirect(`/login?error=invalid_credentials${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[auth] signInWithPassword failed", {
        code: error.code,
        status: error.status,
        message: error.message,
        email: parsed.data.email,
      });
    }

    const code = mapLoginError(error.code, error.message);
    redirect(`/login?error=${code}${next ? `&next=${encodeURIComponent(next)}` : ""}`);
  }

  const auth = await getCurrentAuthContext();
  const fallback = auth && auth.role !== "client" ? "/admin" : "/portal";
  redirect(next || fallback);
}

export async function forgotPasswordAction(formData: FormData) {
  const parsed = emailSchema.safeParse({ email: value(formData, "email") });

  if (parsed.success) {
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });
  }

  redirect(
    "/forgot-password?sent=If%20an%20account%20exists%20for%20that%20email%2C%20a%20password%20reset%20link%20has%20been%20sent.",
  );
}

export async function resetPasswordAction(formData: FormData) {
  const parsed = passwordSchema.safeParse({
    password: value(formData, "password"),
    confirmPassword: value(formData, "confirmPassword"),
  });

  if (!parsed.success) {
    redirect("/reset-password?error=reset_failed");
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  if (!claims?.sub) {
    redirect("/forgot-password?error=reset_failed");
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    redirect("/reset-password?error=reset_failed");
  }

  await supabase.auth.signOut();
  redirect("/login?success=Password%20updated.%20You%20can%20sign%20in%20now.");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
