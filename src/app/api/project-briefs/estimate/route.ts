import { apiFailure, apiSuccess } from "@/lib/api/response";
import { estimateInputSchema } from "@/features/project-brief/schemas";
import { calculateEstimate } from "@/features/project-brief/estimate";
import { recordSecurityEvent } from "@/lib/security/events";
import { checkPublicRateLimit } from "@/lib/security/rate-limit-server";
import { isTrustedMutationRequest } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({ eventType: "request.origin_rejected", severity: "warning", request, source: "project_brief" });
    return apiFailure("invalid_origin", "Request origin was rejected.", { status: 403 });
  }

  const rate = await checkPublicRateLimit({ request, bucket: "brief-estimate", limit: 30, windowSeconds: 10 * 60 });
  if (!rate.allowed) {
    await recordSecurityEvent({ eventType: "rate_limit.project_brief_estimate", severity: "info", request, source: "project_brief" });
    return apiFailure("rate_limited", "Too many estimate requests. Please wait a moment.", { status: 429 });
  }

  try {
    const parsed = estimateInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiFailure("validation_error", "Complete the project type and estimate options first.", {
        status: 422,
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      });
    }

    const estimate = await calculateEstimate(parsed.data);
    return apiSuccess(estimate);
  } catch (error) {
    return apiFailure("estimate_failed", error instanceof Error ? error.message : "Estimate is temporarily unavailable.", { status: 503 });
  }
}
