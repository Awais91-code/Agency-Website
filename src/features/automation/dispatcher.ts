import "server-only";
import { env } from "@/config/env";
import { workflowKeyForEvent } from "@/features/automation/catalogue";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import type { Json } from "@/types/database";

const retryAt=(attempt:number)=>new Date(Date.now()+Math.min(5*2**Math.max(0,attempt-1),360)*60000).toISOString();

async function deadLetter(id:string,key:string|null,reason:string,payload:Json) {
  const admin=getSupabaseAdminClient();
  await admin.from("automation_events").update({status:"dead_letter",completed_at:new Date().toISOString(),last_error:reason,locked_at:null}).eq("id",id);
  await admin.from("automation_dead_letters").upsert({automation_event_id:id,workflow_key:key,reason,payload_snapshot:payload,manual_review_status:"open"},{onConflict:"automation_event_id"});
  try {
    const { getNotificationPreferences, sendTransactionalEmail } = await import("@/features/notifications/service");
    const pref=await getNotificationPreferences();
    for(const to of pref.adminRecipients) await sendTransactionalEmail({
      templateKey:"admin-alert",to,idempotencyKey:`automation/${id}/dead-letter/${to}`,contextType:"automation_event",contextId:id,
      data:{agencyName:env.NEXT_PUBLIC_APP_NAME,appUrl:env.NEXT_PUBLIC_APP_URL,alertTitle:"Automation needs manual review",alertBody:reason,adminUrl:`${env.NEXT_PUBLIC_APP_URL}/admin/automation-logs`}
    });
  } catch {}
}

async function dispatchOne(event:any) {
  const admin=getSupabaseAdminClient();
  const workflowKey=workflowKeyForEvent(event.event_type);
  if(!workflowKey){ await deadLetter(event.id,null,`No workflow for ${event.event_type}.`,event.payload); return {id:event.id,ok:false,deadLetter:true};}
  const {data:w}=await admin.from("automation_workflows").select("*").eq("workflow_key",workflowKey).maybeSingle();
  if(!w){ await deadLetter(event.id,workflowKey,"Workflow configuration missing.",event.payload); return {id:event.id,ok:false,deadLetter:true};}
  if(!w.is_enabled){ await admin.from("automation_events").update({status:"cancelled",completed_at:new Date().toISOString(),last_error:"Workflow disabled."}).eq("id",event.id); return {id:event.id,ok:false,cancelled:true};}
  const attempt=event.attempt_count+1;
  await admin.from("automation_events").update({status:"dispatching",attempt_count:attempt,locked_at:new Date().toISOString(),last_error:null}).eq("id",event.id).in("status",["pending","failed"]);
  if(!env.N8N_WEBHOOK_URL||!env.N8N_WEBHOOK_SECRET){
    const reason="n8n is not configured. Set N8N_WEBHOOK_URL and N8N_WEBHOOK_SECRET.";
    if(attempt>w.retry_limit){await deadLetter(event.id,workflowKey,reason,event.payload);return {id:event.id,ok:false,deadLetter:true};}
    await admin.from("automation_events").update({status:"failed",next_attempt_at:retryAt(attempt),locked_at:null,last_error:reason}).eq("id",event.id);
    return {id:event.id,ok:false,retryable:true};
  }
  const body={contractVersion:1,eventId:event.id,eventKey:event.event_key,eventType:event.event_type,entityType:event.entity_type,entityId:event.entity_id,workflowKey,workflowVersion:w.version,attempt,occurredAt:event.created_at,callbackUrl:`${env.NEXT_PUBLIC_APP_URL}/api/automation/callback`,payload:event.payload};
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),w.timeout_seconds*1000);
  try{
    const res=await fetch(env.N8N_WEBHOOK_URL,{method:"POST",headers:{"content-type":"application/json","x-agency-automation-secret":env.N8N_WEBHOOK_SECRET,"x-agency-event-id":event.id,"x-agency-event-key":event.event_key},body:JSON.stringify(body),signal:controller.signal,cache:"no-store"});
    const raw=await res.text(); if(!res.ok) throw new Error(`n8n ${res.status}: ${raw.slice(0,400)}`);
    let parsed:any={}; try{parsed=raw?JSON.parse(raw):{}}catch{}
    const runId=typeof parsed.executionId==="string"?parsed.executionId:typeof parsed.runId==="string"?parsed.runId:null;
    await admin.from("automation_events").update({status:"dispatched",dispatched_at:new Date().toISOString(),locked_at:null,n8n_execution_id:runId}).eq("id",event.id);
    await admin.from("automation_runs").insert({automation_event_id:event.id,workflow_key:workflowKey,workflow_version:w.version,external_run_id:runId,status:"queued",result:{dispatch_http_status:res.status}});
    return {id:event.id,ok:true,externalRunId:runId};
  }catch(err){
    const reason=err instanceof Error?(err.name==="AbortError"?`n8n request timed out after ${w.timeout_seconds}s.`:err.message):"Unknown dispatch failure.";
    if(attempt>w.retry_limit){await deadLetter(event.id,workflowKey,reason,event.payload);return {id:event.id,ok:false,deadLetter:true};}
    await admin.from("automation_events").update({status:"failed",next_attempt_at:retryAt(attempt),locked_at:null,last_error:reason}).eq("id",event.id);
    await admin.from("automation_runs").insert({automation_event_id:event.id,workflow_key:workflowKey,workflow_version:w.version,status:"failed",finished_at:new Date().toISOString(),error_message:reason,retryable:true});
    return {id:event.id,ok:false,retryable:true};
  }finally{clearTimeout(timer);}
}

export async function dispatchDueAutomationEvents(limit=20){
  const admin=getSupabaseAdminClient();
  const {data,error}=await admin.from("automation_events").select("id,event_key,event_type,entity_type,entity_id,payload,attempt_count,created_at").in("status",["pending","failed"]).lte("next_attempt_at",new Date().toISOString()).order("created_at").limit(Math.max(1,Math.min(limit,100)));
  if(error) throw new Error(error.message);
  const out=[]; for(const event of data??[]) out.push(await dispatchOne(event)); return out;
}
