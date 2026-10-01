import type { SubmitProjectBriefPayload } from "@/features/project-brief/schemas";
import type { LeadScoreResult } from "@/features/project-brief/types";

export function scoreProjectBrief(input: SubmitProjectBriefPayload): LeadScoreResult {
  let score = 20;
  const reasons: string[] = ["Structured project brief completed"];

  const budgetScores: Record<string, number> = {
    "under-2k": 4,
    "2k-5k": 10,
    "5k-10k": 18,
    "10k-25k": 24,
    "25k-plus": 28,
    "need-guidance": 10,
  };
  score += budgetScores[input.budgetBand] ?? 6;
  reasons.push(`Budget band: ${input.budgetBand || "not specified"}`);

  if (input.companyName) {
    score += 8;
    reasons.push("Company context provided");
  }

  if (input.objective.length >= 80) {
    score += 10;
    reasons.push("Clear business objective");
  }

  if (input.requirements.length >= 120) {
    score += 10;
    reasons.push("Detailed scope context");
  }

  if (input.features.length >= 2) {
    score += 6;
    reasons.push("Feature needs identified");
  }

  if (input.deadline || input.desiredStart) {
    score += 6;
    reasons.push("Timing context provided");
  }

  if (input.urgency === "urgent") {
    score += 3;
    reasons.push("Urgent timeline requires fast review");
  }

  if (!/@(gmail|yahoo|hotmail|outlook)\./i.test(input.contactEmail)) {
    score += 7;
    reasons.push("Business-domain email");
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}
