import { apiFailure, apiSuccess } from "@/lib/api/response";
import { draftProjectBriefSchema } from "@/features/project-brief/schemas";
import { saveProjectBriefDraft } from "@/features/project-brief/server";
import { recordSecurityEvent } from "@/lib/security/events";
import { checkPublicRateLimit } from "@/lib/security/rate-limit-server";
import { isTrustedMutationRequest } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "project_brief" });
    return apiFailure("invalid_origin", "Request origin was rejected.", { status: 403 });
  }

  const rate = await checkPublicRateLimit({ request, bucket: "brief-draft", limit: 60, windowSeconds: 10 * 60 });
  if (!rate.allowed) {
    await recordSecurityEvent({ eventType: "rate_limit.project_brief_draft", severity: "info", request, source: "project_brief" });
    return apiFailure("rate_limited", "Too many draft updates. Please wait a moment.", { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = draftProjectBriefSchema.safeParse(body);
    if (!parsed.success) {
      return apiFailure("validation_error", "Some project brief fields are invalid.", {
        status: 422,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    if (parsed.data.honeypot) return apiSuccess({ saved: true });

    const brief = await saveProjectBriefDraft(parsed.data);
    return apiSuccess({ saved: true, briefId: brief.id, status: brief.status });
  } catch (error) {
    return apiFailure("brief_save_failed", error instanceof Error ? error.message : "Could not save the project brief.", { status: 500 });
  }
}
