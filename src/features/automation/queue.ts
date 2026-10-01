import "server-only";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

export async function enqueueAutomationEvent(input: {
  eventKey: string; eventType: string; entityType: string; entityId: string; payload?: Json;
}) {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.from("automation_events").upsert({
    event_key: input.eventKey,
    event_type: input.eventType,
    entity_type: input.entityType,
    entity_id: input.entityId,
    payload: input.payload ?? {},
    status: "pending",
    next_attempt_at: new Date().toISOString(),
  }, { onConflict: "event_key", ignoreDuplicates: true }).select("id,event_key,status").maybeSingle();
  if (error) { console.error("[automation] enqueue failed", error.message); return null; }
  if (data) return data;
  const { data: existing } = await admin.from("automation_events").select("id,event_key,status").eq("event_key", input.eventKey).maybeSingle();
  return existing ?? null;
}

export const enqueueLeadCreatedAutomation = (leadId: string, briefId: string) =>
  enqueueAutomationEvent({ eventKey:`lead/${leadId}/created/v1`, eventType:"lead.created", entityType:"lead", entityId:leadId, payload:{lead_id:leadId,project_brief_id:briefId} });

export const enqueueMeetingScheduledAutomation = (x:{meetingId:string;leadId:string|null;startsAt:string|null}) =>
  enqueueAutomationEvent({ eventKey:`meeting/${x.meetingId}/scheduled/${x.startsAt ?? "no-start"}`, eventType:"meeting.scheduled", entityType:x.leadId?"lead":"meeting", entityId:x.leadId ?? x.meetingId, payload:{meeting_id:x.meetingId,lead_id:x.leadId,starts_at:x.startsAt} });
