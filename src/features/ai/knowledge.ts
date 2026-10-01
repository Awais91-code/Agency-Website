import "server-only";

import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { AssistantSource } from "@/features/ai/types";

type Candidate = Omit<AssistantSource, "score" | "excerpt"> & {
  content: string;
};

function tokens(value: string) {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3),
    ),
  ];
}

function scoreCandidate(query: string, candidate: Candidate) {
  const queryTokens = tokens(query);
  if (!queryTokens.length) return 0;

  const haystack = `${candidate.title} ${candidate.content}`.toLowerCase();
  const title = candidate.title.toLowerCase();

  return queryTokens.reduce((score, token) => {
    let next = score;
    if (title.includes(token)) next += 5;
    if (haystack.includes(token)) next += 2;
    return next;
  }, 0);
}

function compact(value: string, max = 900) {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export async function getApprovedKnowledge(query: string): Promise<AssistantSource[]> {
  const admin = getSupabaseAdminClient();

  const [
    servicesResult,
    serviceFaqsResult,
    workResult,
    faqResult,
    sectionResult,
    approvedResult,
  ] = await Promise.all([
    admin
      .from("services")
      .select("id,slug,title,short_description,hero_description,problems,deliverables,outcomes,technologies,pricing_note")
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order"),
    admin
      .from("service_faqs")
      .select("id,service_id,question,answer")
      .eq("visible", true)
      .order("sort_order"),
    admin
      .from("case_studies")
      .select("id,slug,title,short_description,problem,approach,solution,result_summary,technologies,tags")
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order"),
    admin
      .from("faqs")
      .select("id,category,question,answer")
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order"),
    admin
      .from("content_sections")
      .select("id,section_key,eyebrow,title,body,cta_label,cta_href")
      .eq("status", "published")
      .is("archived_at", null)
      .order("sort_order"),
    admin
      .from("ai_knowledge_items")
      .select("id,knowledge_key,category,title,content,href")
      .eq("is_approved", true)
      .order("sort_order"),
  ]);

  for (const result of [
    servicesResult,
    serviceFaqsResult,
    workResult,
    faqResult,
    sectionResult,
    approvedResult,
  ]) {
    if (result.error) throw new Error(`AI knowledge query failed: ${result.error.message}`);
  }

  const serviceMap = new Map((servicesResult.data ?? []).map((row) => [row.id, row]));
  const candidates: Candidate[] = [];

  for (const service of servicesResult.data ?? []) {
    candidates.push({
      key: `service:${service.id}`,
      type: "service",
      title: service.title,
      href: `/services/${service.slug}`,
      content: [
        service.short_description,
        service.hero_description,
        service.problems.length ? `Problems: ${service.problems.join("; ")}` : "",
        service.deliverables.length ? `Deliverables: ${service.deliverables.join("; ")}` : "",
        service.outcomes.length ? `Outcomes: ${service.outcomes.join("; ")}` : "",
        service.technologies.length ? `Technologies: ${service.technologies.join(", ")}` : "",
        service.pricing_note ? `Published pricing note: ${service.pricing_note}` : "",
      ].filter(Boolean).join("\n"),
    });
  }

  for (const faq of serviceFaqsResult.data ?? []) {
    const service = serviceMap.get(faq.service_id);
    if (!service) continue;
    candidates.push({
      key: `service-faq:${faq.id}`,
      type: "faq",
      title: `${service.title}: ${faq.question}`,
      href: `/services/${service.slug}`,
      content: faq.answer,
    });
  }

  for (const item of workResult.data ?? []) {
    candidates.push({
      key: `case-study:${item.id}`,
      type: "case_study",
      title: item.title,
      href: `/work/${item.slug}`,
      content: [
        item.short_description,
        `Problem: ${item.problem}`,
        `Approach: ${item.approach}`,
        `Solution: ${item.solution}`,
        `Published result: ${item.result_summary}`,
        item.technologies.length ? `Technologies: ${item.technologies.join(", ")}` : "",
        item.tags.length ? `Tags: ${item.tags.join(", ")}` : "",
      ].filter(Boolean).join("\n"),
    });
  }

  for (const faq of faqResult.data ?? []) {
    candidates.push({
      key: `faq:${faq.id}`,
      type: "faq",
      title: faq.question,
      href: "/#faq",
      content: faq.answer,
    });
  }

  for (const section of sectionResult.data ?? []) {
    candidates.push({
      key: `page:${section.id}`,
      type: "page",
      title: section.title,
      href: section.section_key.startsWith("about.") ? "/about" : "/",
      content: [section.eyebrow, section.body].filter(Boolean).join("\n"),
    });
  }

  for (const item of approvedResult.data ?? []) {
    const type =
      item.category === "policy"
        ? "policy"
        : item.category === "process"
          ? "process"
          : "page";

    candidates.push({
      key: `approved:${item.knowledge_key}`,
      type,
      title: item.title,
      href: item.href,
      content: item.content,
    });
  }

  return candidates
    .map((candidate) => ({
      key: candidate.key,
      type: candidate.type,
      title: candidate.title,
      href: candidate.href,
      excerpt: compact(candidate.content),
      score: scoreCandidate(query, candidate),
    }))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 8);
}
