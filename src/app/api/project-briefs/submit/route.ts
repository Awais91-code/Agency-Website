import { apiFailure, apiSuccess } from "@/lib/api/response";
import { submitProjectBriefSchema } from "@/features/project-brief/schemas";
import { submitProjectBrief } from "@/features/project-brief/server";
import { recordSecurityEvent } from "@/lib/security/events";
import { checkPublicRateLimit } from "@/lib/security/rate-limit-server";
import { getRequestAddress } from "@/lib/security/rate-limit";
import { isTrustedMutationRequest } from "@/lib/security/request";
import { verifyTurnstile } from "@/lib/security/turnstile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTrustedMutationRequest(request)) {
    await recordSecurityEvent({
      eventType: "request.origin_rejected",
      severity: "warning",
      request,
      source: "project_brief",
    });
    return apiFailure("invalid_origin", "Request origin was rejected.", { status: 403 });
  }

  const rate = await checkPublicRateLimit({
    request,
    bucket: "brief-submit",
    limit: 6,
    windowSeconds: 15 * 60,
  });

  if (!rate.allowed) {
    await recordSecurityEvent({
      eventType: "rate_limit.project_brief_submit",
      severity: "warning",
      request,
      source: "project_brief",
      metadata: { distributed: rate.distributed },
    });
    return apiFailure(
      "rate_limited",
      "Too many submissions. Please wait before trying again.",
      { status: 429 },
    );
  }

  try {
    const parsed = submitProjectBriefSchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiFailure(
        "validation_error",
        "Review the highlighted project details before submitting.",
        {
          status: 422,
          fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        },
      );
    }

    if (parsed.data.honeypot) {
      await recordSecurityEvent({
        eventType: "bot.honeypot_triggered",
        severity: "warning",
        request,
        source: "project_brief",
      });
      return apiSuccess({ submitted: true });
    }

    if (Date.now() - parsed.data.startedAt < 2500) {
      await recordSecurityEvent({
        eventType: "bot.submission_too_fast",
        severity: "warning",
        request,
        source: "project_brief",
      });
      return apiFailure(
        "submission_too_fast",
        "Please review the project brief before submitting.",
        { status: 422 },
      );
    }

    const challenge = await verifyTurnstile({
      token: parsed.data.turnstileToken,
      remoteIp: getRequestAddress(request.headers),
    });

    if (!challenge.ok) {
      await recordSecurityEvent({
        eventType: "bot.turnstile_failed",
        severity: "warning",
        request,
        source: "project_brief",
        metadata: { errors: challenge.errors, configured: challenge.configured },
      });
      return apiFailure(
        "bot_verification_failed",
        "Bot verification could not be completed. Please retry.",
        { status: 403 },
      );
    }

    const result = await submitProjectBrief(parsed.data);

    return apiSuccess({
      submitted: true,
      alreadySubmitted: result.alreadySubmitted,
      estimate: result.estimate,
      bookingContext: result.bookingContext,
    });
  } catch (error) {
    return apiFailure(
      "brief_submit_failed",
      error instanceof Error ? error.message : "Could not submit the project brief.",
      { status: 500 },
    );
  }
}
