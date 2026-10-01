import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseServerConfig } from "@/config/database";
import type { Database } from "@/types/database";

let adminClient: SupabaseClient<Database> | null = null;

export function getSupabaseAdminClient(): SupabaseClient<Database> {
  if (adminClient) {
    return adminClient;
  }

  const config = requireSupabaseServerConfig();

  adminClient = createClient<Database>(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return adminClient;
}
