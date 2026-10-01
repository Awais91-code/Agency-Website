export const workflowByEvent = {
  "lead.created": "lead.new-project-enquiry",
  "lead.no_booking_due": "lead.no-booking-followup",
  "meeting.scheduled": "meeting.booked",
  "automation.dead_letter": "automation.failure",
} as const;

export function workflowKeyForEvent(eventType: string) {
  return workflowByEvent[eventType as keyof typeof workflowByEvent] ?? null;
}
