import "server-only";

import { env } from "@/config/env";
import { getPublicSiteSettings } from "@/features/content/queries";
import { getNotificationPreferences, sendTransactionalEmail } from "@/features/notifications/service";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function notifyProjectMembers(projectId: string, update: string, key: string) {
  try {
    const admin = getSupabaseAdminClient();
    const [{ data: project }, { data: members }, site] = await Promise.all([
      admin.from("projects").select("id,name").eq("id", projectId).single(),
      admin.from("project_members").select("user_id").eq("project_id", projectId).eq("is_active", true),
      getPublicSiteSettings(),
    ]);
    if (!project) return;

    for (const member of members ?? []) {
      const { data } = await admin.auth.admin.getUserById(member.user_id);
      const email = data.user?.email;
      if (!email) continue;
      await sendTransactionalEmail({
        templateKey: "project-update",
        to: email,
        idempotencyKey: `project/${projectId}/${key}/${member.user_id}`,
        contextType: "project",
        contextId: projectId,
        data: {
          agencyName: site.agencyName,
          appUrl: env.NEXT_PUBLIC_APP_URL,
          projectName: project.name,
          update,
          projectUrl: `${env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}`,
        },
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[portal] project notification failed", error);
  }
}

export async function notifyClientOnboarding(userId: string, projectId: string) {
  try {
    const admin = getSupabaseAdminClient();
    const [{ data: userData }, { data: project }, site] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("projects").select("name").eq("id", projectId).single(),
      getPublicSiteSettings(),
    ]);
    const email = userData.user?.email;
    if (!email || !project) return;
    await sendTransactionalEmail({
      templateKey: "onboarding",
      to: email,
      idempotencyKey: `project/${projectId}/onboarding/${userId}`,
      contextType: "project",
      contextId: projectId,
      data: {
        agencyName: site.agencyName,
        appUrl: env.NEXT_PUBLIC_APP_URL,
        name: userData.user?.user_metadata?.display_name ?? "there",
        portalUrl: `${env.NEXT_PUBLIC_APP_URL}/portal/projects/${projectId}`,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[portal] onboarding notification failed", error);
  }
}

export async function notifyAdminsOfClientAction(projectId: string, title: string, body: string, key: string) {
  try {
    const [preferences, site] = await Promise.all([getNotificationPreferences(), getPublicSiteSettings()]);
    for (const recipient of preferences.adminRecipients) {
      await sendTransactionalEmail({
        templateKey: "admin-alert",
        to: recipient,
        idempotencyKey: `project/${projectId}/admin-alert/${key}/${recipient}`,
        contextType: "project",
        contextId: projectId,
        data: {
          agencyName: site.agencyName,
          appUrl: env.NEXT_PUBLIC_APP_URL,
          alertTitle: title,
          alertBody: body,
          adminUrl: `${env.NEXT_PUBLIC_APP_URL}/admin/projects/${projectId}`,
        },
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("[portal] admin notification failed", error);
  }
}
