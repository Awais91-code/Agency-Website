import { NextResponse } from "next/server";

import { apiFailure } from "@/lib/api/response";
import { getCurrentAuthContext } from "@/lib/auth/server";
import { getSupabaseAdminClient } from "@/lib/db/admin";
import { createPrivateDownloadUrl } from "@/lib/media/service";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await getCurrentAuthContext();
  if (!auth) return apiFailure("UNAUTHENTICATED", "Sign in is required.", { status: 401 });

  const { id } = await context.params;
  const supabase = await createClient();
  const { data: allowed, error: allowedError } = await supabase.rpc("user_can_access_media", { asset_id: id });

  if (allowedError) return apiFailure("FILE_ACCESS_CHECK_FAILED", allowedError.message, { status: 500 });
  if (!allowed) return apiFailure("FILE_NOT_FOUND", "File was not found or is not available to this account.", { status: 404 });

  const admin = getSupabaseAdminClient();
  const { data: asset, error } = await admin.from("media_assets").select("*").eq("id", id).is("archived_at", null).maybeSingle();
  if (error) return apiFailure("FILE_LOOKUP_FAILED", error.message, { status: 500 });
  if (!asset) return apiFailure("FILE_NOT_FOUND", "File was not found.", { status: 404 });

  const url = await createPrivateDownloadUrl(asset);
  if (!url) return apiFailure("FILE_URL_FAILED", "Could not create a download URL.", { status: 500 });

  return NextResponse.redirect(url, 302);
}
