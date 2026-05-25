// ---------------------------------------------------------------------------
// Supabase profile queries
//
// A profile row is created automatically after sign-up via a Postgres trigger
// (see supabase/migrations/001_initial_schema.sql). These helpers are used for
// reads and for cases where manual upsert is needed.
//
// TODO (future): extend ProfileRow with display_name, avatar_url, etc.
// TODO (future): add team/organization support — a user belongs to one org,
// org has many users, reports and settings are scoped to org_id not user_id.
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/types/database";

export async function getProfile(userId: string): Promise<ProfileRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[profiles] getProfile:", error.message);
    return null;
  }

  return data;
}

export async function upsertProfile(
  userId: string,
  email: string
): Promise<ProfileRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("profiles")
    .upsert({ id: userId, email }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[profiles] upsertProfile:", error.message);
    return null;
  }

  return data;
}
