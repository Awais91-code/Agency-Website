export const analyticsEventNames = [
  "primary_cta_click",
  "project_brief_start",
  "project_brief_step",
  "project_brief_submit",
  "contact_submit",
  "booking_click",
  "booking_complete",
  "case_study_view",
  "case_study_cta_click",
] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];

export type AnalyticsSafeProperties = {
  location?: string;
  step?: number;
  step_name?: string;
  service_slug?: string;
  case_study_slug?: string;
  channel?: string;
  booking_type?: string;
  cta_href?: string;
  result?: string;
};
