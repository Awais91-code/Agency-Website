import "server-only";

import { env } from "@/config/env";

export type SupabaseServerConfig = {
  url: string;
  publishableKey: string;
  secretKey: string;
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
      env.SUPABASE_SECRET_KEY,
  );
}

export function getSupabaseServerConfig(): SupabaseServerConfig | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL!,
    publishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    secretKey: env.SUPABASE_SECRET_KEY!,
  };
}

export function requireSupabaseServerConfig(): SupabaseServerConfig {
  const config = getSupabaseServerConfig();

  if (!config) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.local.",
    );
  }

  return config;
}
