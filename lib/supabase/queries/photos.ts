// ---------------------------------------------------------------------------
// Supabase Storage helpers — report-images bucket
//
// Photos are stored as JPEG files under:
//   report-images/{userId}/{reportId}/{photoId}.jpg
//
// The bucket is private — signed URLs are used for display.
// Photos are compressed client-side before upload (see lib/photoStorage.ts).
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { JobPhoto } from "@/types/report";

const BUCKET = "report-images";
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

function photoPath(userId: string, reportId: string, photoId: string): string {
  return `${userId}/${reportId}/${photoId}.jpg`;
}

/**
 * Upload a single photo (base64 data URL) to Supabase Storage.
 * Returns the photo with its dataUrl replaced by a signed URL, or null on failure.
 */
export async function uploadPhoto(
  userId: string,
  reportId: string,
  photo: JobPhoto,
): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  // Convert base64 data URL → Blob
  const base64 = photo.dataUrl.split(",")[1];
  if (!base64) return null;
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "image/jpeg" });

  const path = photoPath(userId, reportId, photo.id);
  const { error } = await client.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });

  if (error) {
    console.error("[photos] uploadPhoto:", error.message);
    return null;
  }

  return path;
}

/**
 * Upload all photos for a report. Returns an array of StoredPhoto records
 * (id + storage path) for saving alongside the report row.
 */
export async function uploadPhotosForReport(
  userId: string,
  reportId: string,
  photos: JobPhoto[],
): Promise<StoredPhoto[]> {
  const results: StoredPhoto[] = [];
  for (const photo of photos) {
    const path = await uploadPhoto(userId, reportId, photo);
    if (path) {
      results.push({ id: photo.id, path, capturedAt: photo.capturedAt });
    }
  }
  return results;
}

/**
 * Get a signed URL for a stored photo path. Valid for 7 days.
 */
export async function getSignedUrl(path: string): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    console.error("[photos] getSignedUrl:", error?.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Resolve stored photo paths → JobPhoto[] with signed URLs as dataUrl.
 */
export async function resolvePhotos(storedPhotos: StoredPhoto[]): Promise<JobPhoto[]> {
  const resolved: JobPhoto[] = [];
  for (const sp of storedPhotos) {
    const url = await getSignedUrl(sp.path);
    if (url) {
      resolved.push({ id: sp.id, dataUrl: url, capturedAt: sp.capturedAt });
    }
  }
  return resolved;
}

/**
 * Delete all photos for a report from storage.
 */
export async function deletePhotosForReport(
  userId: string,
  reportId: string,
  photoIds: string[],
): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) return;

  const paths = photoIds.map((id) => photoPath(userId, reportId, id));
  if (paths.length === 0) return;

  const { error } = await client.storage.from(BUCKET).remove(paths);
  if (error) {
    console.error("[photos] deletePhotosForReport:", error.message);
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

/** Lightweight photo reference stored in report_data alongside the report. */
export type StoredPhoto = {
  id: string;        // matches JobPhoto.id
  path: string;      // storage path: {userId}/{reportId}/{photoId}.jpg
  capturedAt: string;
};
