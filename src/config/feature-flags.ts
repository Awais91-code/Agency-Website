/**
 * Feature flags keep incomplete modules disabled until their own delivery is merged.
 * Later module patches should update only the flags they own.
 */
export const featureFlags = {
  authentication: true,
  services: false,
  portfolio: false,
  smartQuote: false,
  crm: false,
  booking: false,
  admin: false,
  clientPortal: false,
  aiAssistant: false,
  blog: false,
  analytics: false,
} as const;

export type FeatureFlag = keyof typeof featureFlags;
