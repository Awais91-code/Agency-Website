import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { requireSupabaseServerConfig } from "@/config/database";
import type { Database } from "@/types/database";

export async function createClient() {
  const config = requireSupabaseServerConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. The root proxy refreshes
          // auth cookies before protected Server Components render.
        }
      },
    },
  });
}
