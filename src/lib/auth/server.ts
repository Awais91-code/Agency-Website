import "server-only";

import { redirect } from "next/navigation";

import { canManageSiteSettings, canViewAuditLog, isStaffRole } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import type { AppRole, AuthContext } from "@/types/auth";

export async function getCurrentAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;

  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (claimsError || !userId) {
    return null;
  }

  const [{ data: roleRow }, { data: profileRow }, { data: userData }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
    supabase.from("profiles").select("display_name").eq("id", userId).maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const role = (roleRow?.role ?? "client") as AppRole;

  return {
    userId,
    email: userData.user?.email ?? null,
    role,
    displayName: profileRow?.display_name ?? null,
  };
}

export async function requireUser(nextPath?: string) {
  const context = await getCurrentAuthContext();

  if (!context) {
    const suffix = nextPath ? `?next=${encodeURIComponent(nextPath)}` : "";
    redirect(`/login${suffix}`);
  }

  return context;
}

export async function requireStaff() {
  const context = await requireUser("/admin");

  if (!isStaffRole(context.role)) {
    redirect("/portal?error=forbidden");
  }

  return context;
}


export async function requireAdmin() {
  const context = await requireUser("/admin");

  if (!canManageSiteSettings(context.role)) {
    redirect("/admin?error=forbidden");
  }

  return context;
}

export async function requireAuditAccess() {
  const context = await requireUser("/admin");

  if (!canViewAuditLog(context.role)) {
    redirect("/admin?error=forbidden");
  }

  return context;
}
