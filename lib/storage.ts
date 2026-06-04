import type { ServiceReport, BusinessProfile, Customer, JobDetails } from "@/types/report";

const DRAFT_KEY = "jobwrap_draft";
const REPORTS_KEY = "jobwrap_reports";
const BUSINESS_KEY = "jobwrap_business";
const CUSTOMERS_KEY = "jobwrap_customers";
const SEEDED_KEY = "jobwrap_seeded_v6"; // bump version to re-seed when sample data changes

export const DEFAULT_BUSINESS: BusinessProfile = {
  businessName: "",
  technicianName: "",
  phone: "",
  email: "",
  licence1Label: "",
  licence1Number: "",
  licence2Label: "",
  licence2Number: "",
  brandColor: "#0f172a",
  tagline: "",
  website: "",
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // QuotaExceededError: storage full (common when base64 photos accumulate).
    // Log a visible warning so the developer/user is aware data was not saved.
    // TODO(performance): consider evicting the oldest reports when quota is
    // exceeded, or moving photo storage to IndexedDB (larger quota, binary).
    if (err instanceof DOMException && err.name === "QuotaExceededError") {
      console.warn(
        `[storage] localStorage quota exceeded — could not save key "${key}". ` +
        "Consider clearing old reports or moving photos to IndexedDB."
      );
    } else {
      // Other failures (e.g. private mode / security restrictions) — still log
      console.warn(`[storage] localStorage.setItem("${key}") failed:`, err);
    }
  }
}

// Draft (in-progress report)
export function getDraft(): Partial<ServiceReport> | null {
  return safeGet<Partial<ServiceReport> | null>(DRAFT_KEY, null);
}

export function saveDraft(draft: Partial<ServiceReport>): void {
  safeSet(DRAFT_KEY, draft);
}

export function clearDraft(): void {
  if (typeof window !== "undefined") localStorage.removeItem(DRAFT_KEY);
}

const TRASH_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getAllReports(): ServiceReport[] {
  return safeGet<ServiceReport[]>(REPORTS_KEY, []);
}

// Saved reports — excludes soft-deleted
export function getReports(): ServiceReport[] {
  return getAllReports().filter((r) => !r.deletedAt);
}

// Soft-deleted reports still within the 7-day window
export function getDeletedReports(): ServiceReport[] {
  const now = Date.now();
  return getAllReports().filter(
    (r) => r.deletedAt && now - new Date(r.deletedAt).getTime() < TRASH_TTL_MS
  );
}

export function saveReport(report: ServiceReport): void {
  const existing = getAllReports();
  const idx = existing.findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    existing[idx] = report;
  } else {
    existing.unshift(report);
  }
  safeSet(REPORTS_KEY, existing);
}

// Soft delete — moves to trash, recoverable for 7 days
export function deleteReport(id: string): void {
  const all = getAllReports();
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], deletedAt: new Date().toISOString() };
    safeSet(REPORTS_KEY, all);
  }
}

// Restore from trash — clears deletedAt, original status preserved
export function restoreReport(id: string): void {
  const all = getAllReports();
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], deletedAt: undefined };
    safeSet(REPORTS_KEY, all);
  }
}

// Permanent delete — cannot be undone
export function purgeReport(id: string): void {
  safeSet(REPORTS_KEY, getAllReports().filter((r) => r.id !== id));
}

// Called on app load — permanently removes reports that have been in trash > 7 days
export function purgeExpiredDeletedReports(): void {
  const now = Date.now();
  safeSet(
    REPORTS_KEY,
    getAllReports().filter(
      (r) => !r.deletedAt || now - new Date(r.deletedAt).getTime() < TRASH_TTL_MS
    )
  );
}

// Business profile
export function getBusinessProfile(): BusinessProfile {
  const raw = safeGet<BusinessProfile & { licenseNumber?: string }>(BUSINESS_KEY, DEFAULT_BUSINESS);
  // Migrate legacy single licenseNumber field → licence1
  if (raw.licenseNumber && !raw.licence1Number) {
    raw.licence1Label = raw.licence1Label || "Licence";
    raw.licence1Number = raw.licenseNumber;
  }
  return { ...DEFAULT_BUSINESS, ...raw };
}

export function saveBusinessProfile(profile: BusinessProfile): void {
  safeSet(BUSINESS_KEY, profile);
}

export function generateId(): string {
  return `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ── Customers ─────────────────────────────────────────────────────────────────

export function getCustomers(): Customer[] {
  return safeGet<Customer[]>(CUSTOMERS_KEY, []);
}

export function saveCustomer(customer: Customer): void {
  const all = getCustomers();
  const idx = all.findIndex((c) => c.id === customer.id);
  if (idx >= 0) {
    all[idx] = customer;
  } else {
    all.unshift(customer);
  }
  safeSet(CUSTOMERS_KEY, all);
}

export function deleteCustomer(id: string): void {
  safeSet(CUSTOMERS_KEY, getCustomers().filter((c) => c.id !== id));
}

export function clearCustomers(): void {
  if (typeof window !== "undefined") localStorage.removeItem(CUSTOMERS_KEY);
}

// One-time sample data seed — only runs on the very first launch.
// Skipped if the user already has real reports or has previously dismissed the samples.
export async function seedSampleData(): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY)) return; // already seeded once
  if (getReports().length > 0) {
    // Real data exists — mark as seeded and skip
    localStorage.setItem(SEEDED_KEY, "1");
    return;
  }
  // Lazy import to avoid bundling sample data in every page load
  const { SAMPLE_REPORTS, SAMPLE_CUSTOMERS, SAMPLE_BUSINESS } = await import("@/lib/sampleData");
  SAMPLE_REPORTS.forEach((r) => saveReport(r));
  SAMPLE_CUSTOMERS.forEach((c) => saveCustomer(c));
  // Always seed the sample business profile so it stays in sync with sample data
  saveBusinessProfile(SAMPLE_BUSINESS);
  localStorage.setItem(SEEDED_KEY, "1");
}

// One-time migration: seed customer records from all existing saved reports.
// Safe to call repeatedly — skips customers that already exist by name.
export function migrateCustomersFromReports(): void {
  const reports = getReports();
  if (reports.length === 0) return;
  reports.forEach((r) => {
    if (r.job?.customerName?.trim()) {
      upsertCustomerFromJob(r.job);
    }
  });
}

// Create or update a customer record from a completed job.
// Matches by name (case-insensitive). Never overwrites with empty strings.
export function upsertCustomerFromJob(job: JobDetails): void {
  if (!job.customerName.trim()) return;
  const all = getCustomers();
  const existing = all.find(
    (c) => c.name.toLowerCase() === job.customerName.trim().toLowerCase()
  );
  const now = new Date().toISOString();
  if (existing) {
    saveCustomer({
      ...existing,
      address: job.serviceAddress || existing.address,
      // Update equipment only when a non-empty value was recorded for this job
      equipment: job.equipment?.trim() || existing.equipment,
      updatedAt: now,
    });
  } else {
    saveCustomer({
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: job.customerName.trim(),
      address: job.serviceAddress,
      siteNotes: "",
      equipment: job.equipment?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    });
  }
}
