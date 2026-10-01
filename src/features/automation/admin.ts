import "server-only";
import { env } from "@/config/env";
import { getSupabaseAdminClient } from "@/lib/db/admin";
export async function getAutomationAdminData(){
 const a=getSupabaseAdminClient();
 const [w,e,r,d]=await Promise.all([a.from("automation_workflows").select("*").order("workflow_key"),a.from("automation_events").select("*").order("created_at",{ascending:false}).limit(150),a.from("automation_runs").select("*").order("created_at",{ascending:false}).limit(150),a.from("automation_dead_letters").select("*").order("created_at",{ascending:false}).limit(100)]);
 for(const x of [w,e,r,d])if(x.error)throw new Error(x.error.message);
 const events=e.data??[],runs=r.data??[],dlq=d.data??[];
 return {workflows:w.data??[],events,runs,deadLetters:dlq,config:{n8nWebhookUrl:env.N8N_WEBHOOK_URL??null,webhookSecretConfigured:Boolean(env.N8N_WEBHOOK_SECRET),callbackSecretConfigured:Boolean(env.N8N_CALLBACK_SECRET),dispatchSecretConfigured:Boolean(env.AUTOMATION_DISPATCH_SECRET)},summary:{pending:events.filter(x=>["pending","dispatching","dispatched","failed"].includes(x.status)).length,completed:events.filter(x=>x.status==="completed").length,deadLetter:dlq.filter(x=>x.manual_review_status==="open").length,failedRuns:runs.filter(x=>x.status==="failed").length}};
}
