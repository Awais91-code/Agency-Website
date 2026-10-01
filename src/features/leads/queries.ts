import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import { jsonObject } from "@/features/leads/format";
import type { LeadPriority, LeadStatus } from "@/features/leads/constants";

export type LeadListFilters = {
  q?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  owner?: string;
  source?: string;
  archived?: "yes";
};

function escapeLike(value: string) {
  return value.replace(/[%_]/g, "\\$&").replace(/,/g, " ");
}

async function getProfileMap(ids: Array<string | null | undefined>) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (!unique.length) return new Map<string, { display_name: string | null }>();

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("profiles").select("id,display_name").in("id", unique);
  if (error) throw new Error(`Could not load staff profiles: ${error.message}`);
  return new Map((data ?? []).map((profile) => [profile.id, profile]));
}

export async function getLeadList(filters: LeadListFilters = {}) {
  const admin = getSupabaseAdminClient();
  let query = admin
    .from("leads")
    .select("id,full_name,email,company_name,source,status,priority,lead_score,owner_user_id,next_action,next_action_at,metadata,created_at,updated_at,archived_at")
    .order("lead_score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(250);

  query = filters.archived === "yes" ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.owner === "unassigned") query = query.is("owner_user_id", null);
  else if (filters.owner) query = query.eq("owner_user_id", filters.owner);
  if (filters.source) query = query.eq("source", filters.source);

  if (filters.q?.trim()) {
    const q = escapeLike(filters.q.trim()).slice(0, 120);
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,company_name.ilike.%${q}%`);
  }

  const { data: leads, error } = await query;
  if (error) throw new Error(`Could not load leads: ${error.message}`);

  const leadIds = (leads ?? []).map((lead) => lead.id);
  const [profileMap, tagLinksResult, tagsResult, ownersResult] = await Promise.all([
    getProfileMap((leads ?? []).map((lead) => lead.owner_user_id)),
    leadIds.length
      ? admin.from("lead_tag_links").select("lead_id,tag_id").in("lead_id", leadIds)
      : Promise.resolve({ data: [], error: null }),
    admin.from("lead_tags").select("id,name").order("name"),
    admin
      .from("user_roles")
      .select("user_id,role")
      .in("role", ["super_admin", "admin", "staff"]),
  ]);

  if (tagLinksResult.error) throw new Error(`Could not load lead tags: ${tagLinksResult.error.message}`);
  if (tagsResult.error) throw new Error(`Could not load tag definitions: ${tagsResult.error.message}`);
  if (ownersResult.error) throw new Error(`Could not load lead owners: ${ownersResult.error.message}`);

  const ownerIds = (ownersResult.data ?? []).map((row) => row.user_id);
  const ownerProfiles = await getProfileMap(ownerIds);
  const tagMap = new Map((tagsResult.data ?? []).map((tag) => [tag.id, tag.name]));
  const tagsByLead = new Map<string, string[]>();

  for (const link of tagLinksResult.data ?? []) {
    const current = tagsByLead.get(link.lead_id) ?? [];
    const name = tagMap.get(link.tag_id);
    if (name) current.push(name);
    tagsByLead.set(link.lead_id, current);
  }

  const sources = [...new Set((leads ?? []).map((lead) => lead.source).filter((value): value is string => Boolean(value)))].sort();

  return {
    leads: (leads ?? []).map((lead) => {
      const metadata = jsonObject(lead.metadata);
      return {
        ...lead,
        serviceType: typeof metadata.service_type === "string" ? metadata.service_type : null,
        budgetBand: typeof metadata.budget_band === "string" ? metadata.budget_band : null,
        ownerName: profileMap.get(lead.owner_user_id ?? "")?.display_name ?? null,
        tags: tagsByLead.get(lead.id) ?? [],
      };
    }),
    owners: (ownersResult.data ?? []).map((row) => ({
      userId: row.user_id,
      role: row.role,
      displayName: ownerProfiles.get(row.user_id)?.display_name ?? null,
    })),
    sources,
  };
}

export async function getLeadDetail(id: string) {
  const admin = getSupabaseAdminClient();

  const { data: lead, error } = await admin.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load lead: ${error.message}`);
  if (!lead) return null;

  const { data: brief, error: briefError } = await admin
    .from("project_briefs")
    .select("*")
    .eq("lead_id", id)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (briefError) throw new Error(`Could not load project brief: ${briefError.message}`);

  const [notesResult, tasksResult, historyResult, activityResult, meetingsResult, tagLinksResult, tagsResult, ownerRolesResult, duplicatesResult] =
    await Promise.all([
      admin.from("lead_notes").select("*").eq("lead_id", id).is("archived_at", null).order("created_at", { ascending: false }),
      admin.from("lead_tasks").select("*").eq("lead_id", id).order("completed_at", { ascending: true }).order("due_at", { ascending: true, nullsFirst: false }),
      admin.from("lead_stage_history").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      admin.from("activity_events").select("*").eq("entity_type", "lead").eq("entity_id", id).order("occurred_at", { ascending: false }).limit(100),
      admin.from("meetings").select("*").eq("lead_id", id).order("starts_at", { ascending: false, nullsFirst: false }),
      admin.from("lead_tag_links").select("tag_id").eq("lead_id", id),
      admin.from("lead_tags").select("id,name").order("name"),
      admin.from("user_roles").select("user_id,role").in("role", ["super_admin", "admin", "staff"]),
      lead.normalized_email
        ? admin
            .from("leads")
            .select("id,full_name,email,company_name,status,lead_score,created_at,archived_at")
            .eq("normalized_email", lead.normalized_email)
            .neq("id", id)
            .order("created_at")
            .limit(10)
        : Promise.resolve({ data: [], error: null }),
    ]);

  for (const result of [notesResult, tasksResult, historyResult, activityResult, meetingsResult, tagLinksResult, tagsResult, ownerRolesResult, duplicatesResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const ownerIds = (ownerRolesResult.data ?? []).map((row) => row.user_id);
  const actorIds = [
    lead.owner_user_id,
    ...(notesResult.data ?? []).map((row) => row.author_user_id),
    ...(tasksResult.data ?? []).flatMap((row) => [row.assigned_to, row.created_by, row.completed_by]),
    ...(historyResult.data ?? []).map((row) => row.changed_by),
    ...(activityResult.data ?? []).map((row) => row.actor_user_id),
    ...ownerIds,
  ];

  const profiles = await getProfileMap(actorIds);

  let answers: Array<{ answer_key: string; answer_value: import("@/types/database").Json }> = [];
  let estimate: {
    currency: string;
    final_min: number;
    final_max: number;
    created_at: string;
  } | null = null;

  if (brief) {
    const [answersResult, estimateResult] = await Promise.all([
      admin.from("brief_answers").select("answer_key,answer_value").eq("brief_id", brief.id).order("answer_key"),
      admin
        .from("estimate_results")
        .select("currency,final_min,final_max,created_at")
        .eq("brief_id", brief.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (answersResult.error) throw new Error(answersResult.error.message);
    if (estimateResult.error) throw new Error(estimateResult.error.message);
    answers = answersResult.data ?? [];
    estimate = estimateResult.data ?? null;
  }

  const tagNameById = new Map((tagsResult.data ?? []).map((tag) => [tag.id, tag.name]));
  const selectedTags = (tagLinksResult.data ?? [])
    .map((link) => tagNameById.get(link.tag_id))
    .filter((value): value is string => Boolean(value));

  return {
    lead,
    brief,
    answers,
    estimate,
    notes: (notesResult.data ?? []).map((note) => ({
      ...note,
      authorName: profiles.get(note.author_user_id ?? "")?.display_name ?? null,
    })),
    tasks: (tasksResult.data ?? []).map((task) => ({
      ...task,
      assigneeName: profiles.get(task.assigned_to ?? "")?.display_name ?? null,
    })),
    stageHistory: (historyResult.data ?? []).map((entry) => ({
      ...entry,
      actorName: profiles.get(entry.changed_by ?? "")?.display_name ?? null,
    })),
    activity: (activityResult.data ?? []).map((event) => ({
      ...event,
      actorName: profiles.get(event.actor_user_id ?? "")?.display_name ?? null,
    })),
    meetings: meetingsResult.data ?? [],
    tags: selectedTags,
    owners: (ownerRolesResult.data ?? []).map((row) => ({
      userId: row.user_id,
      role: row.role,
      displayName: profiles.get(row.user_id)?.display_name ?? null,
    })),
    duplicates: duplicatesResult.data ?? [],
  };
}

export async function getPipelineBoard() {
  const { leads, owners } = await getLeadList();
  return { leads, owners };
}
