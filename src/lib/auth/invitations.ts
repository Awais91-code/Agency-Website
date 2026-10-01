import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function markInvitationAccepted(userId: string) {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("user_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("auth_user_id", userId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to mark invitation accepted", { userId, code: error.code });
    return;
  }

  if (data) {
    await admin.from("activity_events").insert({
      entity_type: "user_invitation",
      entity_id: data.id,
      event_type: "user.invitation_accepted",
      actor_user_id: userId,
      source: "app",
      metadata: { auth_user_id: userId },
    });
  }
}
