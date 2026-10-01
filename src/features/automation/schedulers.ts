import "server-only";
import { enqueueAutomationEvent } from "@/features/automation/queue";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function enqueueNoBookingFollowups(delayHours=48){
  const admin=getSupabaseAdminClient(), threshold=new Date(Date.now()-Math.max(1,delayHours)*3600000).toISOString();
  const {data,error}=await admin.from("leads").select("id,status,created_at").in("status",["qualified","contacted"]).is("archived_at",null).lte("created_at",threshold).limit(100);
  if(error) throw new Error(error.message);
  const queued=[];
  for(const lead of data??[]){
    const {count,error:meetingError}=await admin.from("meetings").select("*",{count:"exact",head:true}).eq("lead_id",lead.id).eq("status","scheduled");
    if(meetingError) throw new Error(meetingError.message); if((count??0)>0) continue;
    const event=await enqueueAutomationEvent({eventKey:`lead/${lead.id}/no-booking/${threshold.slice(0,10)}`,eventType:"lead.no_booking_due",entityType:"lead",entityId:lead.id,payload:{lead_id:lead.id,status:lead.status,delay_hours:delayHours}});
    if(event) queued.push(event);
  } return queued;
}
