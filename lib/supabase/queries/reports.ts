// ---------------------------------------------------------------------------
// Supabase report queries
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReportRow, ReportInsert } from "@/types/database";
import type { ServiceReport } from "@/types/report";
import type { StoredPhoto } from "@/lib/supabase/queries/photos";

// ── Converters ───────────────────────────────────────────────────────────────

/**
 * Serialise a ServiceReport into a database row.
 * The full report is stored in report_data (JSONB) so it's self-contained.
 * Indexed columns allow fast filtering without parsing JSON.
 */
export function reportToInsert(
  report: ServiceReport,
  userId: string,
  storedPhotos: StoredPhoto[] = [],
): ReportInsert {
  return {
    user_id: userId,
    local_id: report.id,
    status: report.status,
    customer_name: report.job.customerName,
    service_address: report.job.serviceAddress ?? "",
    service_type: report.job.serviceType,
    equipment_type: report.job.equipment ?? "",
    job_date: report.job.jobDate,
    next_service_date: report.job.nextServiceDate ?? null,
    rough_notes: report.job.voiceNotes?.jobNotes ?? "",
    deleted_at: report.deletedAt ?? null,
    report_data: {
      // Full snapshot — used for PDF generation, preview, etc.
      report: report.report,
      job: report.job,
      business: report.business,
      // Photo storage paths — used to fetch signed URLs on load
      storedPhotos,
    },
  };
}

/**
 * Deserialise a database row back into a ServiceReport.
 */
export function rowToReport(row: ReportRow): ServiceReport {
  const data = row.report_data as {
    report?: ServiceReport["report"];
    job?: ServiceReport["job"];
    business?: ServiceReport["business"];
    storedPhotos?: StoredPhoto[];
  };

  return {
    id: row.local_id ?? row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    business: data.business ?? ({} as ServiceReport["business"]),
    job: data.job ?? {
      customerName: row.customer_name,
      serviceAddress: row.service_address,
      serviceType: row.service_type as ServiceReport["job"]["serviceType"],
      jobDate: row.job_date,
      voiceNotes: { jobNotes: row.rough_notes, recommendations: "" },
    },
    report: data.report ?? {
      customerSummary: "",
      findings: "",
      workPerformed: "",
      recommendations: "",
    },
    // Expose supabase row UUID separately so callers can use it for storage ops
    _supabaseId: row.id,
  } as ServiceReport & { _supabaseId: string };
}

/** Extract stored photos from a row (used when loading report + photos together). */
export function getStoredPhotos(row: ReportRow): StoredPhoto[] {
  const data = row.report_data as { storedPhotos?: StoredPhoto[] };
  return data.storedPhotos ?? [];
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getUserReports(userId: string): Promise<ReportRow[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reports] getUserReports:", error.message);
    return null;
  }

  return data;
}

export async function getDeletedUserReports(userId: string): Promise<ReportRow[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  // Return soft-deleted reports from the last 7 days
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .order("deleted_at", { ascending: false });

  if (error) {
    console.error("[reports] getDeletedUserReports:", error.message);
    return null;
  }

  return data;
}

export async function saveReportToDb(
  report: ServiceReport,
  userId: string,
  storedPhotos: StoredPhoto[] = [],
): Promise<ReportRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const insert = reportToInsert(report, userId, storedPhotos);

  const { data, error } = await client
    .from("reports")
    .upsert(insert, { onConflict: "local_id" })
    .select()
    .single();

  if (error) {
    console.error("[reports] saveReportToDb:", error.message);
    return null;
  }

  return data;
}

export async function softDeleteReportInDb(
  localId: string,
  userId: string,
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from("reports")
    .update({ deleted_at: new Date().toISOString() })
    .eq("local_id", localId)
    .eq("user_id", userId);

  if (error) {
    console.error("[reports] softDeleteReportInDb:", error.message);
    return false;
  }

  return true;
}

export async function restoreReportInDb(
  localId: string,
  userId: string,
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from("reports")
    .update({ deleted_at: null })
    .eq("local_id", localId)
    .eq("user_id", userId);

  if (error) {
    console.error("[reports] restoreReportInDb:", error.message);
    return false;
  }

  return true;
}

export async function purgeReportFromDb(
  localId: string,
  userId: string,
): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  const { error } = await client
    .from("reports")
    .delete()
    .eq("local_id", localId)
    .eq("user_id", userId);

  if (error) {
    console.error("[reports] purgeReportFromDb:", error.message);
    return false;
  }

  return true;
}

/**
 * Bulk upsert — used for the one-time localStorage → Supabase migration.
 */
export async function migrateReportsToDb(
  reports: ServiceReport[],
  userId: string,
): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client || reports.length === 0) return;

  const rows = reports.map((r) => reportToInsert(r, userId));

  const { error } = await client
    .from("reports")
    .upsert(rows, { onConflict: "local_id" });

  if (error) {
    console.error("[reports] migrateReportsToDb:", error.message);
  }
}
