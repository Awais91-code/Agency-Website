import type { Metadata, Viewport } from "next";

import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { AssistantWidget } from "@/components/ai/assistant-widget";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { env } from "@/config/env";
import { siteConfig } from "@/config/site";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <AssistantWidget />
          <AnalyticsProvider
            provider={env.ANALYTICS_PROVIDER}
            enabled={env.ANALYTICS_PROVIDER !== "none"}
            externalProviderEnabled={
              env.NODE_ENV === "production" ||
              env.ANALYTICS_ENABLE_IN_NON_PRODUCTION
            }
            consentRequired={env.ANALYTICS_CONSENT_REQUIRED}
            plausibleDomain={env.PLAUSIBLE_DOMAIN}
            gaMeasurementId={env.GA_MEASUREMENT_ID}
          />
        </div>
      </body>
    </html>
  );
}
