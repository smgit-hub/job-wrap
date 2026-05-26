import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-CA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function BulletSection({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="shrink-0 text-slate-400 w-3 text-center">•</span>
          <span>{line.replace(/^[•\-]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { title: "Service Report" };

  const { data } = await supabase
    .from("shared_reports")
    .select("report_data")
    .eq("token", token)
    .single();

  if (!data) return { title: "Service Report" };

  const report = data.report_data as unknown as ServiceReport;
  return {
    title: `Service Report · ${report.job?.customerName ?? "Customer"} · ${report.business?.businessName ?? ""}`,
    description: `Service report prepared by ${report.business?.businessName ?? "your technician"}.`,
  };
}

export default async function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-semibold text-slate-700">Sharing is not configured</p>
          <p className="text-sm text-slate-500 mt-1">Please contact support.</p>
        </div>
      </main>
    );
  }

  const { data, error } = await supabase
    .from("shared_reports")
    .select("report_data, photos")
    .eq("token", token)
    .single();

  if (error || !data) notFound();

  const report = data.report_data as unknown as ServiceReport;
  const photos = (data.photos ?? []) as JobPhoto[];
  const { business, job, report: rpt } = report;
  const headerColor = business.brandColor || "#0f172a";

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-0">

        {/* Report card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">

          {/* Branded header */}
          <div className="px-5 py-5" style={{ backgroundColor: headerColor }}>
            <div className="flex items-center gap-3">
              {business.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl object-contain bg-white/10 shrink-0"
                />
              )}
              <div>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">
                  Service Report
                </p>
                <p className="text-lg font-bold text-white leading-tight">
                  {business.businessName}
                </p>
                {business.technicianName && (
                  <p className="text-white/70 text-sm mt-0.5">
                    Technician: {business.technicianName}
                  </p>
                )}
                {business.tagline && (
                  <p className="text-white/50 text-xs mt-1.5">{business.tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Prepared for */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Prepared for
            </p>
            <p className="text-2xl font-bold text-slate-900 leading-tight">
              {job.customerName || "—"}
            </p>
            {job.serviceAddress && (
              <p className="text-sm text-slate-500 mt-1">{job.serviceAddress}</p>
            )}
            {job.voiceNotes?.equipmentDetails && (
              <p className="text-sm text-slate-500 mt-1">
                {job.voiceNotes.equipmentDetails}
              </p>
            )}
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-3">
              {SERVICE_TYPE_LABELS[job.serviceType]} · {formatDate(job.jobDate)}
            </p>
          </div>

          {/* Customer summary */}
          {rpt.customerSummary && (
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{rpt.customerSummary}</p>
            </div>
          )}

          {/* Report sections */}
          <div className="px-5 py-5 space-y-5">
            {rpt.workCompleted && (
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                  Work Performed
                </h3>
                <BulletSection text={rpt.workCompleted} />
              </div>
            )}

            {rpt.diagnostics && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                    Diagnostics &amp; Findings
                  </h3>
                  <BulletSection text={rpt.diagnostics} />
                </div>
              </>
            )}

            {rpt.recommendations && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                    Recommendations
                  </h3>
                  <BulletSection text={rpt.recommendations} />
                </div>
              </>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Job Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-square rounded-xl overflow-hidden bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.dataUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/55">
                          {photo.label === "before" ? "Before" : "After"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <hr className="border-slate-100" />

            {/* Business contact footer */}
            <div className="text-xs text-gray-400 space-y-0.5">
              <p className="font-semibold text-gray-600">{business.businessName}</p>
              {business.technicianName && (
                <p>Technician: {business.technicianName}</p>
              )}
              {business.licenseNumber && <p>Licence: {business.licenseNumber}</p>}
              {business.phone && <p>{business.phone}</p>}
              {business.email && <p>{business.email}</p>}
              {business.website && <p>{business.website}</p>}
            </div>
          </div>
        </div>

        {/* Attribution */}
        <p className="text-center text-xs text-slate-400 pt-4 pb-6">
          Service report via{" "}
          <span className="font-semibold text-slate-500">JobWrap</span>
        </p>
      </div>
    </div>
  );
}
