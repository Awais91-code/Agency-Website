import { z } from "zod";

import { apiFailure, apiSuccess } from "@/lib/api/response";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { recordSecurityEvent } from "@/lib/security/events";
import { isTrustedMutationRequest } from "@/lib/security/request";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const profilePatchSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional(),
  timezone: z.string().trim().min(1).max(80).nullable().optional(),
  locale: z.string().trim().min(2).max(16).regex(/^[A-Za-z0-9_-]+$/).optional(),
});

export async function GET() {
  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,display_name,avatar_url,timezone,locale,created_at,updated_at")
    .eq("id", auth.userId)
    .single();

  if (error || !data) return apiFailure("PROFILE_NOT_FOUND", "Profile could not be loaded.", { status: 404 });
  return apiSuccess({ ...data, email: auth.email, role: auth.role });
}

export async function PATCH(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "profile" });
    return apiFailure("INVALID_ORIGIN", "Request origin was rejected.", { status: 403 });
  }

  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });

  const parsed = profilePatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFailure("INVALID_PROFILE", "Profile data is invalid.", { status: 400 });

  const changes = {
    ...(parsed.data.displayName !== undefined ? { display_name: parsed.data.displayName } : {}),
    ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {}),
    ...(parsed.data.locale !== undefined ? { locale: parsed.data.locale } : {}),
  };

  if (Object.keys(changes).length === 0) return apiFailure("NO_CHANGES", "No profile changes were provided.", { status: 400 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(changes)
    .eq("id", auth.userId)
    .select("id,display_name,avatar_url,timezone,locale,created_at,updated_at")
    .single();

  if (error || !data) return apiFailure("PROFILE_UPDATE_FAILED", "Profile could not be updated.", { status: 500 });

  const admin = getSupabaseAdminClient();
  await admin.from("activity_events").insert({
    entity_type: "profile",
    entity_id: auth.userId,
    event_type: "profile.updated",
    actor_user_id: auth.userId,
    source: "app",
    metadata: { changed_fields: Object.keys(changes) },
  });

  return apiSuccess(data);
}
