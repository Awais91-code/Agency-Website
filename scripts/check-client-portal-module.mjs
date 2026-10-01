import fs from "node:fs"; import path from "node:path";
const root=process.cwd();
const required=["supabase/migrations/20260923002000_m14_client_portal.sql","src/app/portal/page.tsx","src/app/portal/projects/[id]/page.tsx","src/app/portal/files/page.tsx","src/app/admin/projects/page.tsx","src/app/admin/projects/[id]/page.tsx","src/features/portal/queries.ts","scripts/test-client-portal-isolation.mjs","docs/CLIENT_PORTAL.md"];
const missing=required.filter(f=>!fs.existsSync(path.join(root,f)));if(missing.length){console.error("M14 missing files",missing);process.exit(1);}
const migration=fs.readFileSync(path.join(root,required[0]),"utf8");for(const token of ["project_members","milestones","project_files","client_requests","approvals","project_activities","user_is_project_member","user_can_access_media","meetings_client_select_m14"])if(!migration.includes(token)){console.error("M14 migration missing",token);process.exit(1);}
const portal=fs.readFileSync(path.join(root,"src/features/portal/queries.ts"),"utf8");if(!portal.includes('createClient')||portal.includes('getSupabaseAdminClient')){console.error("Portal reads must exercise authenticated RLS, not service-role reads.");process.exit(1);}
const actions=fs.readFileSync(path.join(root,"src/app/portal/actions.ts"),"utf8");for(const token of ["createClientRequestAction","decideApprovalAction","project_activities"])if(!actions.includes(token)){console.error("Portal actions missing",token);process.exit(1);}
console.log("M14 Client Portal structural checks passed.");
