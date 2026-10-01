import type { ProjectBriefFormState, ProjectType } from "@/features/project-brief/types";

export const projectTypeOptions: Array<{ value: ProjectType; label: string; description: string }> = [
  { value: "website", label: "Website", description: "Marketing, company or service website." },
  { value: "ecommerce", label: "Ecommerce", description: "Catalog, checkout and online selling experience." },
  { value: "web-app", label: "Web application", description: "Authenticated portal, dashboard or custom workflow." },
  { value: "mobile-app", label: "Mobile application", description: "Customer or internal iOS/Android product." },
  { value: "ui-ux", label: "UI/UX design", description: "Product flows, interface design or design system." },
  { value: "automation", label: "Automation", description: "n8n, API, CRM or operational workflow automation." },
  { value: "ai-solution", label: "AI solution", description: "Grounded assistant, RAG or AI-enabled workflow." },
  { value: "other", label: "Not sure / other", description: "Use discovery to define the right engagement." },
];

export const featureOptions: Array<{ value: string; label: string; projectTypes: ProjectType[] }> = [
  { value: "auth", label: "User accounts / login", projectTypes: ["website", "ecommerce", "web-app", "mobile-app"] },
  { value: "payments", label: "Online payments", projectTypes: ["ecommerce", "web-app", "mobile-app"] },
  { value: "admin-dashboard", label: "Admin dashboard", projectTypes: ["website", "ecommerce", "web-app", "mobile-app", "ai-solution"] },
  { value: "booking", label: "Booking / scheduling", projectTypes: ["website", "ecommerce", "web-app", "mobile-app"] },
  { value: "multilingual", label: "Multiple languages", projectTypes: ["website", "ecommerce", "web-app", "mobile-app"] },
  { value: "integrations", label: "External API integrations", projectTypes: ["website", "ecommerce", "web-app", "mobile-app", "automation", "ai-solution"] },
  { value: "ai-assistant", label: "AI assistant / RAG", projectTypes: ["website", "web-app", "mobile-app", "automation", "ai-solution"] },
  { value: "workflow-automation", label: "Workflow automation", projectTypes: ["website", "ecommerce", "web-app", "mobile-app", "automation", "ai-solution"] },
  { value: "data-migration", label: "Existing data/content migration", projectTypes: ["website", "ecommerce", "web-app", "mobile-app"] },
];

export const budgetOptions = [
  { value: "under-2k", label: "Under $2,000" },
  { value: "2k-5k", label: "$2,000 – $5,000" },
  { value: "5k-10k", label: "$5,000 – $10,000" },
  { value: "10k-25k", label: "$10,000 – $25,000" },
  { value: "25k-plus", label: "$25,000+" },
  { value: "need-guidance", label: "I need guidance" },
];

export const serviceSlugProjectTypeMap: Record<string, ProjectType> = {
  "web-development": "website",
  "ui-ux-design": "ui-ux",
  automation: "automation",
  "ai-solutions": "ai-solution",
};

export function createEmptyProjectBrief(serviceSlug = ""): ProjectBriefFormState {
  return {
    sessionToken: "",
    projectType: serviceSlugProjectTypeMap[serviceSlug] ?? "",
    features: [],
    companyName: "",
    industry: "",
    currentUrl: "",
    objective: "",
    complexity: "standard",
    urgency: "flexible",
    desiredStart: "",
    deadline: "",
    budgetBand: "need-guidance",
    support: "none",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    timezoneCountry: "",
    requirements: "",
    marketingConsent: false,
    privacyAccepted: false,
    serviceSlug,
    honeypot: "",
    startedAt: Date.now(),
  };
}
