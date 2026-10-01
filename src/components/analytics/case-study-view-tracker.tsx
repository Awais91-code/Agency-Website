"use client";

import { useEffect } from "react";

import { trackAnalyticsEvent } from "@/features/analytics/client";

export function CaseStudyViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    void trackAnalyticsEvent(
      "case_study_view",
      { case_study_slug: slug, location: "case-study-detail" },
      { onceKey: `case-study-view:${slug}` },
    );
  }, [slug]);

  return null;
}
