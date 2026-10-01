import "server-only";

import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/db/admin";

const funnelNames = [
  "primary_cta_click",
  "project_brief_start",
  "project_brief_submit",
  "booking_complete",
] as const;

export async function getAnalyticsAdminData(days = 30) {
  const admin = getSupabaseAdminClient();
  const environment = env.ANALYTICS_ENVIRONMENT || env.NODE_ENV;
  const since = new Date(
    Date.now() - Math.max(1, Math.min(days, 365)) * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [eventsResult, leadsResult] = await Promise.all([
    admin
      .from("analytics_events")
      .select(
        "id,event_name,environment,source,session_id,lead_id,entity_type,entity_id,path,referrer_host,attribution,properties,occurred_at",
      )
      .eq("environment", environment)
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false })
      .limit(2000),
    admin
      .from("leads")
      .select(
        "id,attribution_source,utm_source,utm_medium,utm_campaign,initial_referrer_host,created_at",
      )
      .gte("created_at", since)
      .is("archived_at", null)
      .limit(1000),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (leadsResult.error) throw new Error(leadsResult.error.message);

  const events = eventsResult.data ?? [];
  const leads = leadsResult.data ?? [];

  const counts = Object.fromEntries(
    [
      "primary_cta_click",
      "project_brief_start",
      "project_brief_step",
      "project_brief_submit",
      "contact_submit",
      "booking_click",
      "booking_complete",
      "case_study_view",
      "case_study_cta_click",
    ].map((name) => [
      name,
      events.filter((event) => event.event_name === name).length,
    ]),
  ) as Record<string, number>;

  const sourceCounts = new Map<string, number>();

  for (const lead of leads) {
    const source =
      lead.utm_source ||
      lead.attribution_source ||
      lead.initial_referrer_host ||
      "unattributed";

    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }

  const topSources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source))
    .slice(0, 10);

  const starts = counts.project_brief_start ?? 0;
  const submits = counts.project_brief_submit ?? 0;
  const bookings = counts.booking_complete ?? 0;

  const funnel = funnelNames.map((name) => ({
    name,
    count: counts[name] ?? 0,
  }));

  return {
    environment,
    since,
    days,
    provider: env.ANALYTICS_PROVIDER,
    consentRequired: env.ANALYTICS_CONSENT_REQUIRED,
    externalProviderEnabled:
      env.NODE_ENV === "production" ||
      env.ANALYTICS_ENABLE_IN_NON_PRODUCTION,
    externalDashboardUrl: env.ANALYTICS_EXTERNAL_DASHBOARD_URL ?? null,
    events,
    counts,
    leads,
    topSources,
    funnel,
    conversion: {
      briefStartToSubmit:
        starts > 0 ? Math.round((submits / starts) * 1000) / 10 : null,
      submitToBooking:
        submits > 0 ? Math.round((bookings / submits) * 1000) / 10 : null,
      attributedLeadRate:
        leads.length > 0
          ? Math.round(
              (leads.filter(
                (lead) =>
                  lead.attribution_source ||
                  lead.utm_source ||
                  lead.initial_referrer_host,
              ).length /
                leads.length) *
                1000,
            ) / 10
          : null,
    },
    quality: {
      browserEventsWithoutSession: events.filter(
        (event) => event.source === "browser" && !event.session_id,
      ).length,
      eventsWithoutPath: events.filter(
        (event) => event.source === "browser" && !event.path,
      ).length,
      totalEvents: events.length,
    },
  };
}
