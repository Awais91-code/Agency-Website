import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function getContentAdminData() {
  const admin = getSupabaseAdminClient();

  const [
    sections,
    testimonials,
    faqs,
    team,
    media,
  ] = await Promise.all([
    admin.from("content_sections").select("*").is("archived_at", null).order("sort_order"),
    admin.from("testimonials").select("*").is("archived_at", null).order("sort_order"),
    admin.from("faqs").select("*").is("archived_at", null).order("category").order("sort_order"),
    admin.from("team_members").select("*").is("archived_at", null).order("sort_order"),
    admin.from("media_assets").select("id,display_name,original_name").eq("visibility", "public").is("archived_at", null).order("display_name"),
  ]);

  for (const result of [sections, testimonials, faqs, team, media]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    sections: sections.data ?? [],
    testimonials: testimonials.data ?? [],
    faqs: faqs.data ?? [],
    team: team.data ?? [],
    media: media.data ?? [],
  };
}

export async function getSettingsAdminData() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("site_settings")
    .select("*")
    .order("group_name")
    .order("key");

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAuditLogs(limit = 150) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const userIds = [...new Set((data ?? []).map((row) => row.actor_user_id).filter((id): id is string => Boolean(id)))];
  const profileMap = new Map<string, string | null>();

  if (userIds.length) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id,display_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) profileMap.set(profile.id, profile.display_name);
  }

  return (data ?? []).map((row) => ({
    ...row,
    actorName: row.actor_user_id ? profileMap.get(row.actor_user_id) ?? null : null,
  }));
}
