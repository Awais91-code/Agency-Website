import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(1);
}

const supabase = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase.rpc("purge_expired_ai_conversations");

if (error) {
  console.error("AI retention cleanup failed:", error.message);
  process.exit(1);
}

console.log(`AI retention cleanup completed. Deleted ${data ?? 0} expired conversation(s).`);
