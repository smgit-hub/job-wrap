// ---------------------------------------------------------------------------
// Browser-side Supabase client
//
// Used in "use client" components and client-side hooks.
// Returns null when Supabase is not configured so the app degrades gracefully
// to localStorage mode during development without credentials.
//
// TODO (live setup):
//   1. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
//   2. These two lines are the only change needed to activate Supabase:
//      NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//      NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
// ---------------------------------------------------------------------------

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

export function isSupabaseConfigured(): boolean {
  return (
    typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
    typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
  );
}

// Singleton — one client per browser tab
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;

  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return _client;
}
