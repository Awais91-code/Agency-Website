import type { Database } from "@/types/database";

export type BookingTypeRow = Database["public"]["Tables"]["booking_types"]["Row"];
export type MeetingRow = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingStatus = Database["public"]["Enums"]["meeting_status"];

export type BookingContext = {
  token: string;
  leadId: string;
  leadName: string | null;
  leadEmail: string | null;
  source: string | null;
  serviceType: string | null;
  attribution: Record<string, unknown>;
};

export type ParsedBookingWebhook = {
  eventKey: string;
  triggerEvent: string;
  bookingId: string;
  bookingTypeHint: string | null;
  attendeeName: string | null;
  attendeeEmail: string | null;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  title: string | null;
  meetingUrl: string | null;
  locationText: string | null;
  rescheduledFromProviderId: string | null;
  bookingContextToken: string | null;
  safeMetadata: Record<string, unknown>;
};
