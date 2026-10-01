import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export async function getPortalDashboard() {
  const auth = await requireUser("/portal");
  const supabase = await createClient();

  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id,member_role,joined_at")
    .eq("user_id", auth.userId)
    .eq("is_active", true)
    .order("joined_at", { ascending: false });

  if (membershipError) throw new Error(membershipError.message);
  const projectIds = (memberships ?? []).map((row) => row.project_id);

  if (!projectIds.length) {
    return { auth, projects: [], activities: [], approvals: [], requests: [] };
  }

  const [projects, activities, approvals, requests] = await Promise.all([
    supabase.from("projects").select("*").in("id", projectIds).order("updated_at", { ascending: false }),
    supabase.from("project_activities").select("*").in("project_id", projectIds).eq("client_visible", true).order("created_at", { ascending: false }).limit(12),
    supabase.from("approvals").select("*").in("project_id", projectIds).eq("status", "pending").eq("client_visible", true).order("created_at", { ascending: false }).limit(10),
    supabase.from("client_requests").select("*").in("project_id", projectIds).order("created_at", { ascending: false }).limit(10),
  ]);

  for (const result of [projects, activities, approvals, requests]) {
    if (result.error) throw new Error(result.error.message);
  }

  return {
    auth,
    projects: projects.data ?? [],
    activities: activities.data ?? [],
    approvals: approvals.data ?? [],
    requests: requests.data ?? [],
  };
}

export async function getPortalProject(projectId: string) {
  await requireUser(`/portal/projects/${projectId}`);
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) throw new Error(projectError.message);
  if (!project) notFound();

  const [milestones, projectFiles, requests, approvals, activities, meetings] = await Promise.all([
    supabase.from("milestones").select("*").eq("project_id", projectId).eq("client_visible", true).order("sort_order").order("due_at"),
    supabase.from("project_files").select("*").eq("project_id", projectId).eq("client_visible", true).order("created_at", { ascending: false }),
    supabase.from("client_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("approvals").select("*").eq("project_id", projectId).eq("client_visible", true).order("created_at", { ascending: false }),
    supabase.from("project_activities").select("*").eq("project_id", projectId).eq("client_visible", true).order("created_at", { ascending: false }).limit(50),
    project.lead_id
      ? supabase.from("meetings").select("id,title,starts_at,ends_at,timezone,meeting_url,status,location_text").eq("lead_id", project.lead_id).order("starts_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [milestones, projectFiles, requests, approvals, activities, meetings]) {
    if (result.error) throw new Error(result.error.message);
  }

  const mediaIds = (projectFiles.data ?? []).map((row) => row.media_asset_id);
  const requestIds = (requests.data ?? []).map((row) => row.id);

  const [media, comments] = await Promise.all([
    mediaIds.length
      ? supabase.from("media_assets").select("id,display_name,original_name,mime_type,size_bytes,created_at").in("id", mediaIds)
      : Promise.resolve({ data: [], error: null }),
    requestIds.length
      ? supabase.from("client_request_comments").select("*").in("request_id", requestIds).eq("is_internal", false).order("created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (media.error) throw new Error(media.error.message);
  if (comments.error) throw new Error(comments.error.message);

  const mediaMap = new Map((media.data ?? []).map((row) => [row.id, row]));
  const commentsByRequest = new Map<string, typeof comments.data>();
  for (const comment of comments.data ?? []) {
    const list = commentsByRequest.get(comment.request_id) ?? [];
    list.push(comment);
    commentsByRequest.set(comment.request_id, list);
  }

  return {
    project,
    milestones: milestones.data ?? [],
    files: (projectFiles.data ?? []).map((row) => ({ ...row, asset: mediaMap.get(row.media_asset_id) ?? null })),
    requests: (requests.data ?? []).map((row) => ({ ...row, comments: commentsByRequest.get(row.id) ?? [] })),
    approvals: approvals.data ?? [],
    activities: activities.data ?? [],
    meetings: meetings.data ?? [],
  };
}

export async function getPortalFiles() {
  const auth = await requireUser("/portal/files");
  const supabase = await createClient();
  const { data: memberships, error } = await supabase.from("project_members").select("project_id").eq("user_id", auth.userId).eq("is_active", true);
  if (error) throw new Error(error.message);
  const ids = (memberships ?? []).map((row) => row.project_id);
  if (!ids.length) return [];

  const [{ data: files, error: fileError }, { data: projects, error: projectError }] = await Promise.all([
    supabase.from("project_files").select("*").in("project_id", ids).eq("client_visible", true).order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name").in("id", ids),
  ]);
  if (fileError) throw new Error(fileError.message);
  if (projectError) throw new Error(projectError.message);

  const mediaIds = (files ?? []).map((row) => row.media_asset_id);
  const { data: assets, error: assetError } = mediaIds.length
    ? await supabase.from("media_assets").select("id,display_name,original_name,mime_type,size_bytes,created_at").in("id", mediaIds)
    : { data: [], error: null };
  if (assetError) throw new Error(assetError.message);

  const projectMap = new Map((projects ?? []).map((row) => [row.id, row.name]));
  const assetMap = new Map((assets ?? []).map((row) => [row.id, row]));
  return (files ?? []).map((row) => ({ ...row, projectName: projectMap.get(row.project_id) ?? "Project", asset: assetMap.get(row.media_asset_id) ?? null }));
}
