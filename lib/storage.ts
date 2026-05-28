import type { ServiceReport, BusinessProfile, Customer, JobDetails } from "@/types/report";

const DRAFT_KEY = "jobwrap_draft";
const REPORTS_KEY = "jobwrap_reports";
const BUSINESS_KEY = "jobwrap_business";
const CUSTOMERS_KEY = "jobwrap_customers";
const SEEDED_KEY = "jobwrap_seeded_v3"; // bump version to re-seed when sample data changes

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

// Saved reports
export function getReports(): ServiceReport[] {
  return safeGet<ServiceReport[]>(REPORTS_KEY, []);
}

export function saveReport(report: ServiceReport): void {
  const existing = getReports();
  const idx = existing.findIndex((r) => r.id === report.id);
  if (idx >= 0) {
    existing[idx] = report;
  } else {
    existing.unshift(report);
  }
  safeSet(REPORTS_KEY, existing);
}

export function deleteReport(id: string): void {
  const updated = getReports().filter((r) => r.id !== id);
  safeSet(REPORTS_KEY, updated);
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
export function seedSampleData(): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(SEEDED_KEY)) return; // already seeded once
  if (getReports().length > 0) {
    // Real data exists — mark as seeded and skip
    localStorage.setItem(SEEDED_KEY, "1");
    return;
  }
  // Lazy import to avoid bundling sample data in every page load
  import("@/lib/sampleData").then(({ SAMPLE_REPORTS, SAMPLE_CUSTOMERS, SAMPLE_BUSINESS }) => {
    SAMPLE_REPORTS.forEach((r) => saveReport(r));
    SAMPLE_CUSTOMERS.forEach((c) => saveCustomer(c));
    // Only seed business profile if the user hasn't configured one yet
    if (!getBusinessProfile().businessName) {
      saveBusinessProfile(SAMPLE_BUSINESS);
    }
    localStorage.setItem(SEEDED_KEY, "1");
  });
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
