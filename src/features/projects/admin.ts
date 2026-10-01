import "server-only";
import { getSupabaseAdminClient } from "@/lib/db/admin";

export async function listAdminProjects(){const a=getSupabaseAdminClient();const {data,error}=await a.from("projects").select("*").is("archived_at",null).order("updated_at",{ascending:false});if(error)throw new Error(error.message);return data??[];}
export async function getAdminProject(id:string){const a=getSupabaseAdminClient();const [project,members,milestones,files,requests,approvals,activities]=await Promise.all([
 a.from("projects").select("*").eq("id",id).single(),
 a.from("project_members").select("*").eq("project_id",id).order("created_at"),
 a.from("milestones").select("*").eq("project_id",id).order("sort_order"),
 a.from("project_files").select("*").eq("project_id",id).order("created_at",{ascending:false}),
 a.from("client_requests").select("*").eq("project_id",id).order("created_at",{ascending:false}),
 a.from("approvals").select("*").eq("project_id",id).order("created_at",{ascending:false}),
 a.from("project_activities").select("*").eq("project_id",id).order("created_at",{ascending:false}).limit(80),
 ]);for(const r of [project,members,milestones,files,requests,approvals,activities])if(r.error)throw new Error(r.error.message);
 if(!project.data)throw new Error("Project not found.");
 const projectData=project.data;
 const memberUsers=[];for(const m of members.data??[]){const {data}=await a.auth.admin.getUserById(m.user_id);memberUsers.push({...m,email:data.user?.email??null,displayName:data.user?.user_metadata?.display_name??null});}
 const mediaIds=(files.data??[]).map(x=>x.media_asset_id);const {data:media,error:mediaError}=mediaIds.length?await a.from("media_assets").select("id,display_name,original_name,mime_type,size_bytes").in("id",mediaIds):{data:[],error:null};if(mediaError)throw new Error(mediaError.message);const mm=new Map((media??[]).map(x=>[x.id,x]));
 return {project:projectData,members:memberUsers,milestones:milestones.data??[],files:(files.data??[]).map(x=>({...x,asset:mm.get(x.media_asset_id)??null})),requests:requests.data??[],approvals:approvals.data??[],activities:activities.data??[]};}
