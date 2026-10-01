import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.rpc("purge_expired_operational_data");

if (error) {
  console.error("Security retention cleanup failed:", error.message);
  process.exit(1);
}

console.log("Security retention cleanup completed:", data);
