// ---------------------------------------------------------------------------
// Supabase Storage helpers — logos bucket
//
// The "logos" bucket stores business logo images.
// Bucket must be created before use — see supabase/migrations/003_storage_buckets.sql
//
// TODO (future): "report-images" bucket for before/after job photos
// TODO (future): signed URLs with expiry for customer-shared report links
// TODO (future): image compression client-side before upload (browser Canvas API)
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const LOGOS_BUCKET = "logos";

/** Upload a logo file and return its public URL, or null on failure */
export async function uploadLogo(
  userId: string,
  file: File
): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  // File path: logos/{userId}/logo.{ext}
  // One logo per user — uploading again overwrites the previous file
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${userId}/logo.${ext}`;

  const { error: uploadError } = await client.storage
    .from(LOGOS_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    console.error("[storage] uploadLogo:", uploadError.message);
    return null;
  }

  const { data } = client.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Delete a user's logo from storage */
export async function deleteLogo(userId: string, ext = "png"): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const path = `${userId}/logo.${ext}`;
  const { error } = await client.storage.from(LOGOS_BUCKET).remove([path]);

  if (error) {
    console.error("[storage] deleteLogo:", error.message);
    return false;
  }

  return true;
}

/** Get the public URL for a user's logo without making a network request */
export function getLogoPublicUrl(userId: string, ext = "png"): string | null {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const path = `${userId}/logo.${ext}`;
  const { data } = client.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
