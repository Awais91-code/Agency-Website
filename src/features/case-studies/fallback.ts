import type { CaseStudyDetail } from "@/features/case-studies/types";

export const fallbackCaseStudies: CaseStudyDetail[] = [
  {
    id: "fallback-service-growth-platform",
    slug: "service-business-growth-platform",
    title: "Service Business Growth Platform",
    projectLabel: "Internal concept",
    clientName: null,
    industry: "Professional services",
    shortDescription:
      "A conversion-led agency concept connecting a premium marketing experience to structured enquiries and follow-up.",
    technologies: ["Next.js", "TypeScript", "Supabase", "n8n"],
    tags: ["Lead generation", "Marketing site", "Automation"],
    heroMediaUrl: null,
    isFeatured: true,
    sortOrder: 10,
    status: "published",
    services: [
      { id: "fallback-web-development", slug: "web-development", title: "Web Development" },
      { id: "fallback-automation", slug: "automation", title: "Automation" },
    ],
    heroTitle: "A marketing experience connected to the sales workflow behind it.",
    heroDescription:
      "This internal concept demonstrates how a modern agency site can capture structured project context, surface relevant work and prepare the next sales action without fabricating a client engagement.",
    problem:
      "Many service websites stop at a generic contact form. That creates unstructured enquiries, slower qualification and duplicated follow-up work across email, spreadsheets and calendars.",
    approach:
      "The concept treats the public website and early sales workflow as one connected product. Messaging, proof, project intake and operational handoff are designed around the same lead journey.",
    solution:
      "A modular Next.js marketing experience connects service pages, case studies, a future project brief, CRM records and automation-ready events while keeping pricing and contractual decisions under human control.",
    resultSummary:
      "The concept provides a reusable reference architecture for the agency platform itself. It is intentionally presented as an internal concept rather than as a completed client result.",
    testimonialQuote: null,
    testimonialAttribution: null,
    testimonialApproved: false,
    ctaLabel: "Plan a similar platform",
    ctaHref: "/contact?project=service-platform",
    seoTitle: "Service Business Growth Platform — Agency Concept",
    seoDescription:
      "An internal agency concept showing how a premium website can connect structured enquiries, CRM context and automation.",
    heroMediaId: null,
    publishedAt: null,
    gallery: [],
    metrics: [],
  },
  {
    id: "fallback-operations-command-center",
    slug: "operations-command-center",
    title: "Operations Command Center",
    projectLabel: "Internal concept",
    clientName: null,
    industry: "Business operations",
    shortDescription:
      "A focused dashboard concept bringing operational status, action queues and business signals into one workspace.",
    technologies: ["Next.js", "PostgreSQL", "Design systems"],
    tags: ["Dashboard", "Internal tooling", "UI/UX"],
    heroMediaUrl: null,
    isFeatured: true,
    sortOrder: 20,
    status: "published",
    services: [
      { id: "fallback-ui-ux-design", slug: "ui-ux-design", title: "UI/UX Design" },
      { id: "fallback-web-development", slug: "web-development", title: "Web Development" },
    ],
    heroTitle: "Operational context designed around the next decision.",
    heroDescription:
      "This internal product concept explores how dense operational information can be organized into a calmer interface with clear ownership, priority and next actions.",
    problem:
      "Operational teams often switch between disconnected tools and lose time rebuilding context before deciding what needs attention next.",
    approach:
      "The interface is structured around action priority, concise status signals and progressive detail instead of trying to show every possible metric at once.",
    solution:
      "A responsive dashboard shell combines status cards, prioritized queues, activity context and reusable interface patterns that can later connect to real data sources and permissions.",
    resultSummary:
      "The concept demonstrates the agency's product-design and dashboard architecture approach. It does not claim production metrics or a real client deployment.",
    testimonialQuote: null,
    testimonialAttribution: null,
    testimonialApproved: false,
    ctaLabel: "Discuss an internal tool",
    ctaHref: "/contact?project=dashboard",
    seoTitle: "Operations Command Center — Agency Concept",
    seoDescription: "An internal dashboard concept focused on operational clarity, prioritization and reusable interface architecture.",
    heroMediaId: null,
    publishedAt: null,
    gallery: [],
    metrics: [],
  },
  {
    id: "fallback-client-onboarding",
    slug: "client-onboarding-system",
    title: "Client Onboarding System",
    projectLabel: "Internal concept",
    clientName: null,
    industry: "Agency operations",
    shortDescription:
      "A connected onboarding concept coordinating forms, files, communication and internal handoffs without duplicate work.",
    technologies: ["n8n", "Supabase", "Webhooks", "Email APIs"],
    tags: ["Automation", "Client experience", "Workflow"],
    heroMediaUrl: null,
    isFeatured: true,
    sortOrder: 30,
    status: "published",
    services: [
      { id: "fallback-automation", slug: "automation", title: "Automation" },
      { id: "fallback-ai-solutions", slug: "ai-solutions", title: "AI Solutions" },
    ],
    heroTitle: "A smoother handoff from signed project to active delivery.",
    heroDescription:
      "This internal workflow concept shows how onboarding events can be coordinated while keeping the application database as the source of truth and important approvals visible to people.",
    problem:
      "Client onboarding commonly involves repeated requests for the same information, scattered files and manual internal reminders that are easy to miss.",
    approach:
      "The workflow is modeled as explicit business events with idempotent automation, human approval gates and a clear activity trail rather than as an opaque chain of tool-to-tool actions.",
    solution:
      "Structured onboarding data triggers notifications, checklist creation and secure file/request flows while retries and failures remain observable to staff.",
    resultSummary:
      "The concept documents an automation pattern that can be adapted to real agency onboarding after the exact tools and policies are confirmed.",
    testimonialQuote: null,
    testimonialAttribution: null,
    testimonialApproved: false,
    ctaLabel: "Map an onboarding workflow",
    ctaHref: "/contact?project=onboarding",
    seoTitle: "Client Onboarding System — Agency Concept",
    seoDescription: "An internal automation concept for coordinating onboarding forms, files, notifications and handoffs.",
    heroMediaId: null,
    publishedAt: null,
    gallery: [],
    metrics: [],
  },
];
