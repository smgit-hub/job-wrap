// ---------------------------------------------------------------------------
// Server-side Supabase client
//
// Used in API routes, Server Components, and middleware.
// Reads and writes auth session cookies so the session persists across
// server-rendered requests.
//
// IMPORTANT: Only import this from server-side code (API routes, Server
// Components, middleware). Never import it in "use client" components —
// use lib/supabase/client.ts instead.
//
// Returns null when Supabase is not configured.
// ---------------------------------------------------------------------------

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { isSupabaseConfigured } from "./client";

export async function getSupabaseServerClient() {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can throw in read-only cookie contexts (e.g. Server Components).
            // Middleware handles cookie writes, so this is safe to ignore here.
          }
        },
      },
    }
  );
}
