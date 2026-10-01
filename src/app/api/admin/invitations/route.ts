import { z } from "zod";

import { env } from "@/config/env";
import { recordAuditLog } from "@/lib/audit/log";
import { apiFailure, apiSuccess } from "@/lib/api/response";
import { canAssignRole, canManageUsers } from "@/lib/auth/permissions";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";
import type { AppRole } from "@/types/auth";

export const dynamic = "force-dynamic";

const inviteSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  role: z.enum(["admin", "staff", "client"]),
});

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "admin_invitation" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const actor = await getCurrentAuthContext();
  if (!actor) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });
  if (!canManageUsers(actor.role)) return apiFailure("FORBIDDEN", "You do not have permission to invite users.", { status: 403 });

  const parsed = inviteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFailure("INVALID_INVITATION", "Provide a valid email and role.", { status: 400 });

  if (!canAssignRole(actor.role, parsed.data.role as Exclude<AppRole, "super_admin">)) {
    return apiFailure("ROLE_NOT_ALLOWED", "You cannot assign that role.", { status: 403 });
  }

  const admin = getSupabaseAdminClient();
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/auth/callback?next=${encodeURIComponent("/reset-password?invited=1")}`;
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo,
    data: { invited_by: actor.userId },
  });

  if (inviteError || !inviteData.user) return apiFailure("INVITE_FAILED", "The invitation could not be created.", { status: 502 });

  const userId = inviteData.user.id;
  const { error: roleError } = await admin.from("user_roles").upsert(
    { user_id: userId, role: parsed.data.role, assigned_by: actor.userId, assigned_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (roleError) return apiFailure("ROLE_ASSIGNMENT_FAILED", "The invitation was sent, but the assigned role could not be saved.", { status: 500 });

  const { data: invitation, error: invitationError } = await admin
    .from("user_invitations")
    .upsert(
      {
        email: parsed.data.email,
        role: parsed.data.role,
        invited_by: actor.userId,
        auth_user_id: userId,
        status: "pending",
        invited_at: new Date().toISOString(),
        accepted_at: null,
      },
      { onConflict: "normalized_email" },
    )
    .select("id,email,role,status,invited_at")
    .single();

  if (invitationError || !invitation) return apiFailure("INVITATION_LOG_FAILED", "The invitation was sent, but its audit record could not be saved.", { status: 500 });

  await admin.from("activity_events").insert({
    entity_type: "user_invitation",
    entity_id: invitation.id,
    event_type: "user.invited",
    actor_user_id: actor.userId,
    source: "app",
    metadata: { invited_email: parsed.data.email, assigned_role: parsed.data.role, auth_user_id: userId },
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: "user.invited",
    objectType: "user_invitation",
    objectId: invitation.id,
    metadata: { assigned_role: parsed.data.role, auth_user_id: userId },
  });

  return apiSuccess(invitation, { status: 201 });
}
