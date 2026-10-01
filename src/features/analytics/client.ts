"use client";

import type {
  AnalyticsEventName,
  AnalyticsSafeProperties,
} from "@/features/analytics/taxonomy";

const ATTRIBUTION_KEY = "agency-attribution-v1";
const CONSENT_KEY = "agency-analytics-consent-v1";
const SESSION_KEY = "agency-analytics-session-v1";
const ONCE_PREFIX = "agency-analytics-once:";

export type BrowserAttribution = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_path?: string;
  referrer_host?: string;
};

declare global {
  interface Window {
    __agencyAnalytics?: {
      enabled: boolean;
      consentRequired: boolean;
      provider: "internal" | "plausible" | "ga4" | "none";
    };
    plausible?: (
      eventName: string,
      options?: { props?: Record<string, string | number | boolean> },
    ) => void;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function clean(value: string | null, max = 240) {
  const trimmed = value?.trim().slice(0, max);
  return trimmed || undefined;
}

function safeReferrerHost() {
  if (!document.referrer) return undefined;

  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin === window.location.origin) return undefined;
    return clean(referrer.hostname, 255);
  } catch {
    return undefined;
  }
}

export function captureAttribution(): BrowserAttribution {
  if (typeof window === "undefined") return {};

  let existing: BrowserAttribution = {};
  try {
    existing = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
  } catch {
    existing = {};
  }

  const params = new URLSearchParams(window.location.search);
  const incoming: BrowserAttribution = {
    utm_source: clean(params.get("utm_source")),
    utm_medium: clean(params.get("utm_medium")),
    utm_campaign: clean(params.get("utm_campaign")),
    utm_term: clean(params.get("utm_term")),
    utm_content: clean(params.get("utm_content")),
    landing_path: clean(window.location.pathname, 500),
    referrer_host: safeReferrerHost(),
  };

  const firstTouch: BrowserAttribution = {
    utm_source: existing.utm_source ?? incoming.utm_source,
    utm_medium: existing.utm_medium ?? incoming.utm_medium,
    utm_campaign: existing.utm_campaign ?? incoming.utm_campaign,
    utm_term: existing.utm_term ?? incoming.utm_term,
    utm_content: existing.utm_content ?? incoming.utm_content,
    landing_path: existing.landing_path ?? incoming.landing_path,
    referrer_host: existing.referrer_host ?? incoming.referrer_host,
  };

  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(firstTouch));
  } catch {
    // Attribution storage is best effort.
  }

  return firstTouch;
}

export function getStoredAttribution(): BrowserAttribution {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(sessionStorage.getItem(ATTRIBUTION_KEY) || "{}");
    if (
      parsed &&
      typeof parsed === "object" &&
      Object.keys(parsed as Record<string, unknown>).length
    ) {
      return parsed;
    }
    return captureAttribution();
  } catch {
    return captureAttribution();
  }
}

export function getAnalyticsConsent() {
  if (typeof window === "undefined") return "unknown" as const;

  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "granted" || stored === "denied") return stored;
  return "unknown" as const;
}

export function setAnalyticsConsent(value: "granted" | "denied") {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, value);
  window.dispatchEvent(new CustomEvent("agency:analytics-consent"));
}

function sessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);

  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }

  return id;
}

function trackingAllowed() {
  const config = window.__agencyAnalytics;
  if (!config?.enabled || config.provider === "none") return false;
  if (!config.consentRequired) return true;
  return getAnalyticsConsent() === "granted";
}

function externalProviderEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsSafeProperties,
) {
  const provider = window.__agencyAnalytics?.provider;

  if (provider === "plausible" && typeof window.plausible === "function") {
    const props = Object.fromEntries(
      Object.entries(properties).filter(
        ([, value]) =>
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean",
      ),
    ) as Record<string, string | number | boolean>;

    window.plausible(eventName, { props });
  }

  if (provider === "ga4" && typeof window.gtag === "function") {
    window.gtag("event", eventName, properties);
  }
}

export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  properties: AnalyticsSafeProperties = {},
  options: { onceKey?: string } = {},
) {
  if (typeof window === "undefined" || !trackingAllowed()) return false;

  const sid = sessionId();
  const onceKey = options.onceKey
    ? `${ONCE_PREFIX}${options.onceKey}`
    : null;

  if (onceKey && sessionStorage.getItem(onceKey) === "1") return false;
  if (onceKey) sessionStorage.setItem(onceKey, "1");

  const eventKey = [
    sid,
    eventName,
    options.onceKey || crypto.randomUUID(),
  ]
    .join(":")
    .slice(0, 240);

  externalProviderEvent(eventName, properties);

  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventKey,
        eventName,
        sessionId: sid,
        path: window.location.pathname,
        attribution: getStoredAttribution(),
        properties,
      }),
    });

    return true;
  } catch {
    return false;
  }
}
