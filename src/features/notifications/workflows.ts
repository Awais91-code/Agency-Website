import "server-only";

import { env } from "@/config/env";
import { getPublicSiteSettings } from "@/features/content/queries";
import {
  getNotificationPreferences,
  sendTransactionalEmail,
} from "@/features/notifications/service";
import { getSupabaseAdminClient } from "@/lib/db/admin";

function safeDate(value: string | null) {
  if (!value) return "Time not supplied";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export async function notifyLeadCreated({
  leadId,
  briefId,
  bookingContext,
}: {
  leadId: string;
  briefId: string;
  bookingContext: string;
}) {
  try {
    const admin = getSupabaseAdminClient();
    const [preferences, site, leadResult, briefResult] = await Promise.all([
      getNotificationPreferences(),
      getPublicSiteSettings(),
      admin
        .from("leads")
        .select("id,full_name,email,company_name,lead_score,metadata")
        .eq("id", leadId)
        .single(),
      admin
        .from("project_briefs")
        .select("id,service_type,budget_band")
        .eq("id", briefId)
        .single(),
    ]);

    if (leadResult.error || !leadResult.data) return;
    if (briefResult.error || !briefResult.data) return;

    const lead = leadResult.data;
    const brief = briefResult.data;
    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const common = {
      agencyName: site.agencyName,
      appUrl,
    };

    if (preferences.send_enquiry_confirmations && lead.email) {
      await sendTransactionalEmail({
        templateKey: "enquiry-confirmation",
        to: lead.email,
        idempotencyKey: `lead/${leadId}/enquiry-confirmation`,
        contextType: "lead",
        contextId: leadId,
        data: {
          ...common,
          name: lead.full_name ?? "there",
          serviceType: brief.service_type ?? "your project",
          bookingUrl: `${appUrl}/book?context=${encodeURIComponent(bookingContext)}`,
        },
      });
    }

    if (preferences.send_new_lead_alerts) {
      for (const recipient of preferences.adminRecipients) {
        await sendTransactionalEmail({
          templateKey: "admin-new-lead",
          to: recipient,
          idempotencyKey: `lead/${leadId}/admin-new-lead/${recipient}`,
          contextType: "lead",
          contextId: leadId,
          data: {
            ...common,
            leadName: lead.full_name ?? "Unnamed lead",
            leadEmail: lead.email ?? "No email",
            company: lead.company_name ?? "No company",
            serviceType: brief.service_type ?? "General enquiry",
            leadScore: lead.lead_score,
            budgetBand: brief.budget_band ?? "Not supplied",
            crmUrl: `${appUrl}/admin/leads/${leadId}`,
          },
        });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications] lead workflow failed", error);
    }
  }
}

export async function notifyBookingChanged({
  meetingId,
  leadId,
}: {
  meetingId: string;
  leadId: string | null;
}) {
  try {
    const admin = getSupabaseAdminClient();
    const [preferences, site, meetingResult] = await Promise.all([
      getNotificationPreferences(),
      getPublicSiteSettings(),
      admin
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .single(),
    ]);

    if (meetingResult.error || !meetingResult.data) return;
    const meeting = meetingResult.data;

    if (!["scheduled", "cancelled"].includes(meeting.status)) return;

    const appUrl = env.NEXT_PUBLIC_APP_URL;
    const statusKey = `${meeting.status}/${meeting.starts_at ?? "no-start"}`;
    const common = {
      agencyName: site.agencyName,
      appUrl,
      bookingStatus: meeting.status,
      startsAt: safeDate(meeting.starts_at),
      timezone: meeting.timezone ?? "Timezone not supplied",
      meetingUrl: meeting.meeting_url ?? "",
    };

    if (preferences.send_booking_notifications && meeting.attendee_email) {
      await sendTransactionalEmail({
        templateKey: "booking",
        to: meeting.attendee_email,
        idempotencyKey: `meeting/${meeting.id}/client/${statusKey}`,
        contextType: leadId ? "lead" : "meeting",
        contextId: leadId ?? meeting.id,
        data: {
          ...common,
          name: meeting.attendee_name ?? "there",
        },
      });
    }

    if (preferences.send_booking_admin_alerts) {
      for (const recipient of preferences.adminRecipients) {
        await sendTransactionalEmail({
          templateKey: "admin-booking",
          to: recipient,
          idempotencyKey: `meeting/${meeting.id}/admin/${statusKey}/${recipient}`,
          contextType: leadId ? "lead" : "meeting",
          contextId: leadId ?? meeting.id,
          data: {
            ...common,
            attendeeName: meeting.attendee_name ?? "Prospect",
            attendeeEmail: meeting.attendee_email ?? "No email",
            crmUrl: leadId
              ? `${appUrl}/admin/leads/${leadId}`
              : `${appUrl}/admin/bookings`,
          },
        });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[notifications] booking workflow failed", error);
    }
  }
}
