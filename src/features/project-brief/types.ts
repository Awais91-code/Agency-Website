export type ProjectType =
  | "website"
  | "ecommerce"
  | "web-app"
  | "mobile-app"
  | "ui-ux"
  | "automation"
  | "ai-solution"
  | "other";

export type ComplexityLevel = "standard" | "advanced" | "enterprise";
export type UrgencyLevel = "flexible" | "standard" | "urgent";
export type SupportLevel = "none" | "launch-support" | "monthly-retainer";

export type ProjectBriefFormState = {
  sessionToken: string;
  projectType: ProjectType | "";
  features: string[];
  companyName: string;
  industry: string;
  currentUrl: string;
  objective: string;
  complexity: ComplexityLevel;
  urgency: UrgencyLevel;
  desiredStart: string;
  deadline: string;
  budgetBand: string;
  support: SupportLevel;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  timezoneCountry: string;
  requirements: string;
  marketingConsent: boolean;
  privacyAccepted: boolean;
  serviceSlug: string;
  honeypot: string;
  startedAt: number;
};

export type EstimateInput = {
  projectType: ProjectType;
  features: string[];
  complexity: ComplexityLevel;
  urgency: UrgencyLevel;
  support: SupportLevel;
};

export type EstimateAdjustment = {
  key: string;
  label: string;
  kind: "base" | "add" | "multiplier";
  min?: number;
  max?: number;
  multiplier?: number;
};

export type EstimateResult = {
  currency: string;
  subtotalMin: number;
  subtotalMax: number;
  finalMin: number;
  finalMax: number;
  adjustments: EstimateAdjustment[];
  ruleKeys: string[];
  disclaimer: string;
};

export type LeadScoreResult = {
  score: number;
  reasons: string[];
};
