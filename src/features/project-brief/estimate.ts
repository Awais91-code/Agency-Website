import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Database, Json } from "@/types/database";
import type { EstimateAdjustment, EstimateInput, EstimateResult } from "@/features/project-brief/types";

type EstimateRuleRow = Database["public"]["Tables"]["estimate_rules"]["Row"];

const disclaimer = "This is an indicative planning range, not a binding quotation. Final scope, timing and price are confirmed after human review.";

function roundToHundred(value: number) {
  return Math.max(0, Math.round(value / 100) * 100);
}

function findRule(rules: EstimateRuleRow[], type: EstimateRuleRow["rule_type"], matchKey: string, serviceType?: string) {
  return rules.find(
    (rule) =>
      rule.rule_type === type &&
      rule.match_key === matchKey &&
      (!rule.service_type || !serviceType || rule.service_type === serviceType),
  );
}

export async function calculateEstimate(input: EstimateInput): Promise<EstimateResult> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("estimate_rules")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Could not load estimate rules: ${error.message}`);
  const rules = data ?? [];

  const base = findRule(rules, "base", "base", input.projectType);
  if (!base) throw new Error("No active base estimate rule is configured for this project type.");

  let min = base.amount_min;
  let max = base.amount_max;
  const adjustments: EstimateAdjustment[] = [
    { key: base.rule_key, label: base.label, kind: "base", min: base.amount_min, max: base.amount_max },
  ];
  const usedRules: EstimateRuleRow[] = [base];

  for (const feature of Array.from(new Set(input.features))) {
    const rule = findRule(rules, "feature", feature, input.projectType);
    if (!rule) continue;
    min += rule.amount_min;
    max += rule.amount_max;
    adjustments.push({ key: rule.rule_key, label: rule.label, kind: "add", min: rule.amount_min, max: rule.amount_max });
    usedRules.push(rule);
  }

  const subtotalMin = min;
  const subtotalMax = max;

  for (const [type, key] of [
    ["complexity", input.complexity],
    ["urgency", input.urgency],
  ] as const) {
    const rule = findRule(rules, type, key, input.projectType);
    if (!rule) continue;
    min *= Number(rule.multiplier);
    max *= Number(rule.multiplier);
    adjustments.push({ key: rule.rule_key, label: rule.label, kind: "multiplier", multiplier: Number(rule.multiplier) });
    usedRules.push(rule);
  }

  const supportRule = findRule(rules, "support", input.support, input.projectType);
  if (supportRule) {
    min += supportRule.amount_min;
    max += supportRule.amount_max;
    if (supportRule.amount_max > 0) {
      adjustments.push({ key: supportRule.rule_key, label: supportRule.label, kind: "add", min: supportRule.amount_min, max: supportRule.amount_max });
    }
    usedRules.push(supportRule);
  }

  return {
    currency: base.currency,
    subtotalMin,
    subtotalMax,
    finalMin: roundToHundred(min),
    finalMax: roundToHundred(max),
    adjustments,
    ruleKeys: usedRules.map((rule) => rule.rule_key),
    disclaimer,
  };
}

export function estimateSnapshot(result: EstimateResult): Json {
  return result.ruleKeys.map((ruleKey) => ({ ruleKey })) as Json;
}
