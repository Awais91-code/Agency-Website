import "server-only";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

const schema=z.object({contractVersion:z.literal(1),eventId:z.string().uuid(),eventKey:z.string().min(4),workflowKey:z.string().min(3),workflowVersion:z.number().int().min(1),externalRunId:z.string().min(1),status:z.enum(["running","succeeded","failed","cancelled"]),retryable:z.boolean().optional(),result:z.unknown().optional(),error:z.string().nullable().optional()});
const retryAt=(a:number)=>new Date(Date.now()+Math.min(5*2**Math.max(0,a-1),360)*60000).toISOString();

export async function processAutomationCallback(raw:unknown){
  const p=schema.parse(raw), admin=getSupabaseAdminClient(), now=new Date().toISOString();
  const {data:event,error}=await admin.from("automation_events").select("*").eq("id",p.eventId).eq("event_key",p.eventKey).single();
  if(error||!event) throw new Error(error?.message??"Automation event not found.");
  const {data:w}=await admin.from("automation_workflows").select("*").eq("workflow_key",p.workflowKey).single(); if(!w) throw new Error("Workflow not found.");
  const runStatus=p.status==="succeeded"?"succeeded":p.status==="failed"?"failed":p.status==="cancelled"?"cancelled":"running";
  const {error:runError}=await admin.from("automation_runs").upsert({automation_event_id:event.id,workflow_key:p.workflowKey,workflow_version:p.workflowVersion,external_run_id:p.externalRunId,status:runStatus,started_at:p.status==="running"?now:event.dispatched_at??now,finished_at:p.status==="running"?null:now,result:(p.result??{}) as Json,error_message:p.error??null,retryable:p.retryable??true},{onConflict:"workflow_key,external_run_id"});
  if(runError) throw new Error(runError.message);
  if(p.status==="running") return {eventId:event.id,status:"running"};
  if(p.status==="succeeded"){
    await admin.from("automation_events").update({status:"completed",completed_at:now,last_error:null,n8n_execution_id:p.externalRunId,locked_at:null}).eq("id",event.id);
    if(event.entity_type==="lead") await admin.from("activity_events").insert({entity_type:"lead",entity_id:event.entity_id,event_type:"automation.completed",source:"n8n",metadata:{automation_event_id:event.id,workflow_key:p.workflowKey,external_run_id:p.externalRunId}});
    return {eventId:event.id,status:"completed"};
  }
  if(p.status==="cancelled"){await admin.from("automation_events").update({status:"cancelled",completed_at:now,last_error:p.error??"Workflow cancelled.",n8n_execution_id:p.externalRunId}).eq("id",event.id);return {eventId:event.id,status:"cancelled"};}
  const retryable=p.retryable??true, exhausted=event.attempt_count>=w.retry_limit, reason=p.error??"Workflow failed.";
  if(retryable&&!exhausted){await admin.from("automation_events").update({status:"failed",next_attempt_at:retryAt(event.attempt_count),last_error:reason,n8n_execution_id:p.externalRunId,locked_at:null}).eq("id",event.id);return {eventId:event.id,status:"retry_scheduled"};}
  await admin.from("automation_events").update({status:"dead_letter",completed_at:now,last_error:reason,n8n_execution_id:p.externalRunId,locked_at:null}).eq("id",event.id);
  await admin.from("automation_dead_letters").upsert({automation_event_id:event.id,workflow_key:p.workflowKey,reason,payload_snapshot:event.payload,manual_review_status:"open"},{onConflict:"automation_event_id"});
  if(event.entity_type==="lead") await admin.from("activity_events").insert({entity_type:"lead",entity_id:event.entity_id,event_type:"automation.dead_letter",source:"n8n",metadata:{automation_event_id:event.id,workflow_key:p.workflowKey,error:reason}});
  return {eventId:event.id,status:"dead_letter"};
}
