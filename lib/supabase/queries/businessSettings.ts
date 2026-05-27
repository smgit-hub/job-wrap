// ---------------------------------------------------------------------------
// Supabase business_settings queries
//
// One row per user (enforced by UNIQUE(user_id) in the schema).
// Falls back gracefully to null when Supabase is not configured.
//
// TODO (integration): call loadBusinessSettingsFromDb() on app startup when
// the user is authenticated, replacing the localStorage getBusinessProfile()
// call. Merge strategy: DB wins over localStorage if both exist.
//
// TODO (future): support multiple business profiles per user (for technicians
// who work across multiple companies or service verticals).
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BusinessSettingsRow, BusinessSettingsInsert } from "@/types/database";
import type { BusinessProfile } from "@/types/report";

// ── Converters ───────────────────────────────────────────────────────────────

export function toBusinessSettingsInsert(
  profile: BusinessProfile,
  userId: string
): BusinessSettingsInsert {
  return {
    user_id: userId,
    business_name: profile.businessName,
    technician_name: profile.technicianName,
    phone: profile.phone,
    email: profile.email,
    // TODO(schema): add licence1_label, licence1_number, licence2_label, licence2_number columns.
    // For now, serialise both into the existing license_number column.
    license_number: [
      profile.licence1Label && profile.licence1Number ? `${profile.licence1Label}: ${profile.licence1Number}` : "",
      profile.licence2Label && profile.licence2Number ? `${profile.licence2Label}: ${profile.licence2Number}` : "",
    ].filter(Boolean).join(" · ") || "",
    brand_color: profile.brandColor,
    logo_url: profile.logoUrl ?? null,
  };
}

export function toBusinessProfile(row: BusinessSettingsRow): BusinessProfile {
  return {
    businessName: row.business_name,
    technicianName: row.technician_name,
    phone: row.phone,
    email: row.email,
    // TODO(schema): read from dedicated columns once DB migration is applied.
    licence1Label: row.license_number ? "Licence" : "",
    licence1Number: row.license_number ?? "",
    licence2Label: "",
    licence2Number: "",
    brandColor: row.brand_color,
    logoUrl: row.logo_url ?? undefined,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function loadBusinessSettingsFromDb(
  userId: string
): Promise<BusinessProfile | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("business_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[businessSettings] load:", error.message);
    return null;
  }

  return data ? toBusinessProfile(data) : null;
}

export async function saveBusinessSettingsToDb(
  profile: BusinessProfile,
  userId: string
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const insert = toBusinessSettingsInsert(profile, userId);

  const { error } = await client
    .from("business_settings")
    .upsert(insert, { onConflict: "user_id" });

  if (error) {
    console.error("[businessSettings] save:", error.message);
    return false;
  }

  return true;
}
