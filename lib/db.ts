// ---------------------------------------------------------------------------
// lib/db.ts — Unified data layer
//
// All app data operations go through this file.
// When a Supabase session is active → reads/writes hit Supabase.
// When offline or unauthenticated → falls back to localStorage.
//
// This keeps the rest of the app unaware of the storage backend.
// ---------------------------------------------------------------------------

import {
  getReports as lsGetReports,
  getDeletedReports as lsGetDeletedReports,
  saveReport as lsSaveReport,
  deleteReport as lsDeleteReport,
  restoreReport as lsRestoreReport,
  purgeReport as lsPurgeReport,
  getCustomers as lsGetCustomers,
  saveCustomer as lsSaveCustomer,
  deleteCustomer as lsDeleteCustomer,
  getBusinessProfile as lsGetBusinessProfile,
  saveBusinessProfile as lsSaveBusinessProfile,
} from "@/lib/storage";
import {
  getPhotosForReport as lsGetPhotos,
  savePhotosForReport as lsSavePhotos,
  deletePhotosForReport as lsDeletePhotos,
} from "@/lib/photoStorage";
import {
  getUserReports,
  getDeletedUserReports,
  saveReportToDb,
  softDeleteReportInDb,
  restoreReportInDb,
  purgeReportFromDb,
  rowToReport,
  getStoredPhotos,
} from "@/lib/supabase/queries/reports";
import {
  getCustomersFromDb,
  saveCustomerToDb,
  deleteCustomerFromDb,
} from "@/lib/supabase/queries/customers";
import {
  uploadPhotosForReport,
  resolvePhotos,
  deletePhotosForReport as sbDeletePhotos,
  type StoredPhoto,
} from "@/lib/supabase/queries/photos";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ServiceReport, JobPhoto, Customer, BusinessProfile } from "@/types/report";

// ── Session helper ────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user?.id ?? null;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export async function dbGetReports(): Promise<ServiceReport[]> {
  const userId = await getUserId();
  if (userId) {
    const rows = await getUserReports(userId);
    if (rows) return rows.map(rowToReport);
  }
  return lsGetReports();
}

export async function dbGetDeletedReports(): Promise<ServiceReport[]> {
  const userId = await getUserId();
  if (userId) {
    const rows = await getDeletedUserReports(userId);
    if (rows) return rows.map(rowToReport);
  }
  return lsGetDeletedReports();
}

export async function dbSaveReport(
  report: ServiceReport,
  photos: JobPhoto[] = [],
): Promise<void> {
  const userId = await getUserId();

  // Always keep localStorage in sync as offline cache
  lsSaveReport(report);

  if (userId) {
    // Upload any new base64 photos to storage, get back storage paths
    const newPhotos = photos.filter((p) => p.dataUrl.startsWith("data:"));
    const existingStored = photos
      .filter((p) => !p.dataUrl.startsWith("data:"))
      .map((p) => ({ id: p.id, path: p.dataUrl, capturedAt: p.capturedAt } as StoredPhoto));

    let storedPhotos: StoredPhoto[] = existingStored;
    if (newPhotos.length > 0) {
      const uploaded = await uploadPhotosForReport(userId, report.id, newPhotos);
      storedPhotos = [...existingStored, ...uploaded];
    }

    await saveReportToDb(report, userId, storedPhotos);
  }
}

export async function dbDeleteReport(id: string): Promise<void> {
  lsDeleteReport(id);
  const userId = await getUserId();
  if (userId) await softDeleteReportInDb(id, userId);
}

export async function dbRestoreReport(id: string): Promise<void> {
  lsRestoreReport(id);
  const userId = await getUserId();
  if (userId) await restoreReportInDb(id, userId);
}

export async function dbPurgeReport(id: string): Promise<void> {
  lsPurgeReport(id);
  const userId = await getUserId();
  if (userId) await purgeReportFromDb(id, userId);
}

// ── Photos ────────────────────────────────────────────────────────────────────

/**
 * Load photos for a report. If the report has stored photos in Supabase,
 * resolves signed URLs. Falls back to localStorage base64 data.
 */
export async function dbGetPhotos(
  reportId: string,
  storedPhotos?: StoredPhoto[],
): Promise<JobPhoto[]> {
  if (storedPhotos && storedPhotos.length > 0) {
    const resolved = await resolvePhotos(storedPhotos);
    if (resolved.length > 0) return resolved;
  }
  // Fallback to localStorage
  return lsGetPhotos(reportId);
}

export async function dbSavePhotos(
  reportId: string,
  photos: JobPhoto[],
  userId?: string | null,
): Promise<StoredPhoto[]> {
  // Always cache in localStorage for offline access
  lsSavePhotos(reportId, photos);

  if (!userId) return [];

  const newPhotos = photos.filter((p) => p.dataUrl.startsWith("data:"));
  if (newPhotos.length === 0) return [];

  return uploadPhotosForReport(userId, reportId, newPhotos);
}

export async function dbDeletePhotos(
  reportId: string,
  photoIds: string[],
  userId?: string | null,
): Promise<void> {
  lsDeletePhotos(reportId);
  if (userId && photoIds.length > 0) {
    await sbDeletePhotos(userId, reportId, photoIds);
  }
}

// ── Customers ─────────────────────────────────────────────────────────────────

export async function dbGetCustomers(): Promise<Customer[]> {
  const userId = await getUserId();
  if (userId) {
    const customers = await getCustomersFromDb(userId);
    if (customers) return customers;
  }
  return lsGetCustomers();
}

export async function dbSaveCustomer(customer: Customer): Promise<void> {
  lsSaveCustomer(customer);
  const userId = await getUserId();
  if (userId) await saveCustomerToDb(customer, userId);
}

export async function dbDeleteCustomer(id: string): Promise<void> {
  const userId = await getUserId();
  // Delete from localStorage first
  const { deleteCustomer } = await import("@/lib/storage");
  deleteCustomer(id);
  if (userId) await deleteCustomerFromDb(id, userId);
}

// ── Business profile ──────────────────────────────────────────────────────────
// Business profile is already handled by BrandingSettings via the
// lib/supabase/queries/businessSettings.ts layer — no change needed here.
// These wrappers are provided for completeness.

export function dbGetBusinessProfile(): BusinessProfile {
  return lsGetBusinessProfile();
}

export function dbSaveBusinessProfile(profile: BusinessProfile): void {
  lsSaveBusinessProfile(profile);
}

// ── One-time migration: localStorage → Supabase ───────────────────────────────

const MIGRATION_KEY = "jobwrap_migrated_v1";

export async function migrateLocalStorageToSupabase(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATION_KEY)) return; // already done

  const userId = await getUserId();
  if (!userId) return; // not logged in yet

  const reports = lsGetReports();
  const customers = lsGetCustomers();

  if (reports.length === 0 && customers.length === 0) {
    localStorage.setItem(MIGRATION_KEY, "1");
    return;
  }

  console.log(`[migration] Migrating ${reports.length} reports and ${customers.length} customers to Supabase…`);

  // Import bulk migration helpers lazily to avoid bundling them everywhere
  const { migrateReportsToDb } = await import("@/lib/supabase/queries/reports");
  const { migrateCustomersToDb } = await import("@/lib/supabase/queries/customers");

  await Promise.all([
    migrateReportsToDb(reports, userId),
    migrateCustomersToDb(customers, userId),
  ]);

  // Note: photos are left in localStorage during migration — they'll be uploaded
  // to Supabase Storage the next time each report is opened and re-saved.

  localStorage.setItem(MIGRATION_KEY, "1");
  console.log("[migration] Migration complete.");
}

// Re-export getStoredPhotos for use in components that need to check stored state
export { getStoredPhotos };

// ── Sync: Supabase → localStorage cache ───────────────────────────────────────
//
// Called on app startup. Loads the user's data from Supabase and writes it
// into localStorage so all existing components work without modification.
// This is a one-way sync (cloud → local cache) — writes always go to both.

const SYNC_KEY = "jobwrap_last_sync";
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // re-sync at most every 5 minutes

export async function syncFromSupabase(): Promise<void> {
  if (typeof window === "undefined") return;

  const userId = await getUserId();
  if (!userId) return;

  // Throttle — don't re-sync if we just did it
  const lastSync = Number(localStorage.getItem(SYNC_KEY) ?? 0);
  if (Date.now() - lastSync < SYNC_INTERVAL_MS) return;

  try {
    const [reportRows, customers] = await Promise.all([
      getUserReports(userId),
      getCustomersFromDb(userId),
    ]);

    if (reportRows) {
      const { saveReport: lsSave } = await import("@/lib/storage");
      reportRows.forEach((row) => lsSave(rowToReport(row)));
    }

    if (customers) {
      const { saveCustomer: lsSaveCustomer } = await import("@/lib/storage");
      customers.forEach((c) => lsSaveCustomer(c));
    }

    localStorage.setItem(SYNC_KEY, String(Date.now()));
  } catch (err) {
    console.warn("[db] syncFromSupabase failed:", err);
  }
}
