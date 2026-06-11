import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { safeBrandColor } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function jobNumber(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, "");
  return "JW-" + clean.slice(-6).toUpperCase();
}

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

function InfoLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-400">
      {children}
    </p>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h3
      className="text-[11px] font-bold uppercase tracking-widest mb-3"
      style={{ color }}
    >
      {children}
    </h3>
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
  const brandColor = safeBrandColor(business.brandColor);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-0">

        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">

          {/* Branded header */}
          <div className="px-5 py-5" style={{ backgroundColor: brandColor }}>
            <div className="flex items-center gap-3">
              {business.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt=""
                  className="w-16 h-16 rounded-xl object-contain shrink-0"
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

          {/* Info grid */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">

              {/* Row 1: Customer | Job Number */}
              <div>
                <InfoLabel>Customer</InfoLabel>
                <p className="text-sm font-bold text-slate-900">{job.customerName || "—"}</p>
                {job.serviceAddress && (
                  <p className="text-xs text-slate-500 mt-0.5">{job.serviceAddress}</p>
                )}
              </div>
              <div>
                <InfoLabel>Job Number</InfoLabel>
                <p className="text-sm font-mono font-semibold text-slate-700">{jobNumber(report.id)}</p>
              </div>

              {/* Row 2: Date | Service Address (if no address shown above) */}
              <div>
                <InfoLabel>Date of Service</InfoLabel>
                <p className="text-sm font-semibold text-slate-700">{formatDate(job.jobDate)}</p>
              </div>
              <div>
                <InfoLabel>Service Type</InfoLabel>
                <p className="text-sm font-semibold text-slate-700">{SERVICE_TYPE_LABELS[job.serviceType]}</p>
              </div>

              {/* Next Service Due — full width highlighted box */}
              {job.nextServiceDate && (
                <div
                  className="col-span-2 rounded-lg px-3 py-2.5 border"
                  style={{
                    backgroundColor: `${brandColor}12`,
                    borderColor: `${brandColor}40`,
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: brandColor }}>
                    Next Service Due
                  </p>
                  <p className="text-sm font-bold" style={{ color: brandColor }}>
                    {formatDate(job.nextServiceDate)}
                  </p>
                </div>
              )}

              {/* Equipment — full width */}
              {job.equipment?.trim() && (
                <div className="col-span-2">
                  <InfoLabel>Equipment / System</InfoLabel>
                  <p className="text-sm font-semibold text-slate-600">{job.equipment.trim()}</p>
                </div>
              )}

            </div>
          </div>

          {/* Summary */}
          {rpt.customerSummary && (
            <div
              className="px-5 py-4 border-b border-slate-100 border-l-4"
              style={{ borderLeftColor: brandColor, backgroundColor: "#f1f5f9" }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: brandColor }}
              >
                Summary
              </p>
              <p className="text-sm text-slate-700 leading-relaxed">{rpt.customerSummary}</p>
            </div>
          )}

          {/* Report sections */}
          <div className="px-5 py-5 space-y-5">

            {rpt.findings && (
              <div>
                <SectionHeading color={brandColor}>Observations</SectionHeading>
                <BulletSection text={rpt.findings} />
              </div>
            )}

            {rpt.workPerformed && (
              <>
                {rpt.findings && <hr className="border-slate-100" />}
                <div>
                  <SectionHeading color={brandColor}>Work Performed</SectionHeading>
                  <BulletSection text={rpt.workPerformed} />
                </div>
              </>
            )}

            {rpt.recommendations && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <SectionHeading color={brandColor}>Recommendations</SectionHeading>
                  <BulletSection text={rpt.recommendations} />
                </div>
              </>
            )}

            {/* Photos */}
            {photos.length > 0 && (
              <>
                <hr className="border-slate-100" />
                <div>
                  <SectionHeading color={brandColor}>Job Photos</SectionHeading>
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative aspect-video rounded-xl overflow-hidden bg-slate-100"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.dataUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <hr className="border-slate-100" />

            {/* Thank you */}
            <div className="text-center py-2">
              <p className="text-base font-semibold text-slate-700">
                Thank you for choosing{" "}
                <span className="font-bold text-slate-900">{business.businessName}</span>.
              </p>
              <p className="text-sm text-slate-400 mt-1">
                We appreciate your business and look forward to serving you again.
              </p>
            </div>

            <hr className="border-slate-100" />

            {/* Business contact footer */}
            <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center">
              {[
                business.businessName,
                business.technicianName ? `Technician: ${business.technicianName}` : null,
                business.licence1Label && business.licence1Number ? `${business.licence1Label}: ${business.licence1Number}` : null,
                business.licence2Label && business.licence2Number ? `${business.licence2Label}: ${business.licence2Number}` : null,
                business.phone || null,
                business.email || null,
                business.website || null,
              ].filter(Boolean).map((item, i, arr) => (
                <span key={i} className="flex items-center gap-x-2">
                  <span className="text-xs text-slate-400">{item}</span>
                  {i < arr.length - 1 && <span className="text-xs text-slate-200">·</span>}
                </span>
              ))}
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
