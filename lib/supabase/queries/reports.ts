// ---------------------------------------------------------------------------
// Supabase report queries
//
// These replace localStorage reads/writes when Supabase is configured and
// a user session is active. The existing lib/storage.ts functions remain as
// the local fallback layer.
//
// TODO (integration): in app/page.tsx, after generateReport() succeeds,
// call saveReportToDb() in addition to (or instead of) saveReport() from
// lib/storage.ts when the user is authenticated.
//
// TODO (future): add pagination / cursor-based loading for large report lists
// TODO (future): add report sharing via a public read-only token
// TODO (future): add report templates per service vertical
// ---------------------------------------------------------------------------

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ReportRow, ReportInsert, ReportUpdate } from "@/types/database";
import type { ServiceReport } from "@/types/report";

// ── Converters ───────────────────────────────────────────────────────────────

/** Map the app's ServiceReport model to a database row for insert */
export function toReportInsert(report: ServiceReport, userId: string): ReportInsert {
  return {
    user_id: userId,
    status: report.status,
    customer_name: report.job.customerName,
    service_address: report.job.serviceAddress,
    service_type: report.job.serviceType,
    equipment_type: report.job.voiceNotes?.equipmentDetails ?? "",
    job_date: report.job.jobDate,
    rough_notes: report.job.voiceNotes?.workCompleted ?? "",
    // Store the full generated report + business profile as JSONB
    // This makes the row self-contained for PDF regeneration later
    report_data: {
      report: report.report,
      business: report.business,
    },
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getUserReports(userId: string): Promise<ReportRow[] | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[reports] getUserReports:", error.message);
    return null;
  }

  return data;
}

export async function saveReportToDb(
  report: ServiceReport,
  userId: string
): Promise<ReportRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const insert = toReportInsert(report, userId);

  // Use upsert so re-saving an edited report updates rather than duplicates.
  // The local id (rpt_xxx) is stored as a stable external reference in report_data.
  const { data, error } = await client
    .from("reports")
    .upsert(
      { ...insert, report_data: { ...insert.report_data, localId: report.id } },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[reports] saveReportToDb:", error.message);
    return null;
  }

  return data;
}

export async function updateReportInDb(
  id: string,
  update: ReportUpdate
): Promise<ReportRow | null> {
  const client = getSupabaseBrowserClient();
  if (!client) return null;

  const { data, error } = await client
    .from("reports")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[reports] updateReportInDb:", error.message);
    return null;
  }

  return data;
}

export async function deleteReportFromDb(id: string): Promise<boolean> {
  const client = getSupabaseBrowserClient();
  if (!client) return false;

  // TODO(security): RLS enforces user_id ownership for this DELETE, but the
  // client still sends the raw row UUID. Confirm RLS policy "reports: delete own"
  // in 002_rls_policies.sql is applied before exposing this to the internet.
  const { error } = await client.from("reports").delete().eq("id", id);

  if (error) {
    console.error("[reports] deleteReportFromDb:", error.message);
    return false;
  }

  return true;
}
