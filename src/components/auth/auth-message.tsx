const messages: Record<string, string> = {
  auth_unconfigured: "Authentication is not configured yet. Add the Supabase values to .env.local.",
  invalid_credentials: "Email or password is incorrect.",
  email_not_confirmed: "This account exists, but its email is not confirmed yet. Confirm it in Supabase Studio or run the local admin bootstrap command.",
  too_many_requests: "Too many sign-in attempts. Wait a moment and try again.",
  auth_failed: "Authentication failed. Check the terminal for the exact Supabase error.",
  reset_failed: "The password reset link is invalid or expired. Request a new reset email.",
  forbidden: "Your account does not have permission to access that area.",
  auth_callback_failed: "The authentication link could not be verified. Please try again.",
};

export function AuthMessage({ code, success }: { code?: string; success?: string }) {
  if (success) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm" role="status">
        {success}
      </div>
    );
  }

  if (!code) {
    return null;
  }

  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm" role="alert">
      {messages[code] ?? "Authentication request failed. Please try again."}
    </div>
  );
}
