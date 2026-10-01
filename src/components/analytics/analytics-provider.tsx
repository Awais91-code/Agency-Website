"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useState } from "react";

import {
  captureAttribution,
  getAnalyticsConsent,
  setAnalyticsConsent,
  trackAnalyticsEvent,
} from "@/features/analytics/client";

type Props = {
  provider: "internal" | "plausible" | "ga4" | "none";
  enabled: boolean;
  externalProviderEnabled: boolean;
  consentRequired: boolean;
  plausibleDomain?: string | null;
  gaMeasurementId?: string | null;
};

export function AnalyticsProvider({
  provider,
  enabled,
  externalProviderEnabled,
  consentRequired,
  plausibleDomain,
  gaMeasurementId,
}: Props) {
  const [consent, setConsent] = useState<
    "granted" | "denied" | "unknown"
  >("unknown");

  useEffect(() => {
    window.__agencyAnalytics = {
      enabled,
      consentRequired,
      provider,
    };

    captureAttribution();
    setConsent(getAnalyticsConsent());

    const sync = () => setConsent(getAnalyticsConsent());
    window.addEventListener("agency:analytics-consent", sync);

    const clickHandler = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const element = target.closest<HTMLElement>("[data-analytics-event]");
      if (!element) return;

      const eventName = element.dataset.analyticsEvent;
      if (
        !eventName ||
        ![
          "primary_cta_click",
          "booking_click",
          "case_study_cta_click",
        ].includes(eventName)
      ) {
        return;
      }

      const href =
        element instanceof HTMLAnchorElement
          ? element.getAttribute("href") || undefined
          : element.dataset.analyticsHref;

      void trackAnalyticsEvent(
        eventName as
          | "primary_cta_click"
          | "booking_click"
          | "case_study_cta_click",
        {
          location: element.dataset.analyticsLocation,
          case_study_slug: element.dataset.analyticsCaseStudy,
          cta_href: href?.slice(0, 120),
        },
      );
    };

    document.addEventListener("click", clickHandler);

    return () => {
      window.removeEventListener("agency:analytics-consent", sync);
      document.removeEventListener("click", clickHandler);
    };
  }, [consentRequired, enabled, provider]);

  const providerAllowed =
    enabled &&
    externalProviderEnabled &&
    provider !== "none" &&
    provider !== "internal" &&
    (!consentRequired || consent === "granted");

  return (
    <>
      {providerAllowed && provider === "plausible" && plausibleDomain ? (
        <>
          <Script id="agency-plausible-init" strategy="afterInteractive">
            {`window.plausible = window.plausible || function(){(window.plausible.q = window.plausible.q || []).push(arguments);};`}
          </Script>
          <Script
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
            data-domain={plausibleDomain}
          />
        </>
      ) : null}

      {providerAllowed && provider === "ga4" && gaMeasurementId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
              gaMeasurementId,
            )}`}
            strategy="afterInteractive"
          />
          <Script id="agency-ga4" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              window.gtag = function(){window.dataLayer.push(arguments);}
              window.gtag('js', new Date());
              window.gtag('config', '${gaMeasurementId.replace(/'/g, "")}', {
                anonymize_ip: true,
                send_page_view: true
              });
            `}
          </Script>
        </>
      ) : null}

      {enabled && consentRequired && consent === "unknown" ? (
        <aside className="fixed bottom-4 left-4 z-[60] max-w-md rounded-[1.5rem] border border-border bg-background p-5 shadow-2xl">
          <p className="text-sm font-black">Analytics preference</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Allow privacy-conscious conversion analytics. We do not send contact
            messages, private project files or sensitive free-text answers to
            analytics.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAnalyticsConsent("granted")}
              className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              Allow analytics
            </button>
            <button
              type="button"
              onClick={() => setAnalyticsConsent("denied")}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              Decline
            </button>
            <Link
              href="/privacy"
              className="px-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
          </div>
        </aside>
      ) : null}
    </>
  );
}
