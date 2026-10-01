"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { dispatchDueAutomationEvents } from "@/features/automation/dispatcher";
import { recordAuditLog } from "@/lib/audit/log";
import { requireAdmin } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function dispatchAutomationNowAction(){const auth=await requireAdmin();try{const x=await dispatchDueAutomationEvents(20);await recordAuditLog({actorUserId:auth.userId,action:"automation.dispatch_manual",objectType:"automation_queue",objectId:"default",metadata:{processed:x.length}});revalidatePath("/admin/automation-logs");redirect(`/admin/automation-logs?saved=Processed%20${x.length}%20event(s).`);}catch(e){redirect(`/admin/automation-logs?error=${encodeURIComponent(e instanceof Error?e.message:"Dispatch failed.")}`);}}
export async function retryAutomationEventAction(formData:FormData){const auth=await requireAdmin(),id=String(formData.get("id")??"");if(!z.string().uuid().safeParse(id).success)redirect("/admin/automation-logs?error=Invalid%20event");const a=getSupabaseAdminClient();const {error}=await a.from("automation_events").update({status:"pending",next_attempt_at:new Date().toISOString(),locked_at:null,completed_at:null,last_error:null}).eq("id",id).in("status",["failed","dead_letter"]);if(error)redirect(`/admin/automation-logs?error=${encodeURIComponent(error.message)}`);await a.from("automation_dead_letters").update({manual_review_status:"resolved",resolved_by:auth.userId,resolved_at:new Date().toISOString(),resolution_note:"Administrator queued manual retry."}).eq("automation_event_id",id).eq("manual_review_status","open");await recordAuditLog({actorUserId:auth.userId,action:"automation.retry_manual",objectType:"automation_event",objectId:id});revalidatePath("/admin/automation-logs");redirect("/admin/automation-logs?saved=Event%20queued%20for%20retry.");}
