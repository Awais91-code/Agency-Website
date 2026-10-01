import { NextResponse } from "next/server";
import { env } from "@/config/env";
export const dynamic="force-dynamic";
export async function GET(){return NextResponse.json({ok:true,automation:{n8nWebhookConfigured:Boolean(env.N8N_WEBHOOK_URL&&env.N8N_WEBHOOK_SECRET),callbackConfigured:Boolean(env.N8N_CALLBACK_SECRET),dispatchProtectionConfigured:Boolean(env.AUTOMATION_DISPATCH_SECRET)}});}
