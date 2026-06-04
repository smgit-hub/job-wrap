"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2, Loader2, AlertCircle, Mail, Download, Pencil } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import type { ServiceReport, JobPhoto } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { getPhotosForReport } from "@/lib/photoStorage";

interface ReportPreviewProps {
  report: ServiceReport;
  isNewReport: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDone: () => void;
}

type ExportState = "idle" | "generating" | "done" | "error";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}


function BulletSection({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2 text-sm text-gray-700 leading-relaxed">
          <span className="shrink-0 text-slate-500 w-3 text-center">•</span>
          <span>{line.replace(/^[•\-]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}

const TILE_CLASS = "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 active:bg-slate-200 transition-colors";

function ActionTile({
  icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${TILE_CLASS} disabled:opacity-50`}
    >
      {icon}
      <span className="text-xs font-semibold text-slate-600 leading-none">{label}</span>
    </button>
  );
}


export default function ReportPreview({ report, isNewReport, onBack, onEdit, onDone }: ReportPreviewProps) {
  const { business, job, report: rpt } = report;
  const HEADER_COLOR = business.brandColor || "#0f172a";

  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [emailState, setEmailState] = useState<"idle" | "generating" | "error">("idle");
  const [photos, setPhotos] = useState<JobPhoto[]>([]);


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotos(getPhotosForReport(report.id));
  }, [report.id]);



  async function handleEmail() {
    if (emailState === "generating") return;
    setEmailState("generating");
    const subject = `Service Report – ${job.customerName || business.businessName}`;
    try {
      // Generate the PDF
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, photos }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `${subject}.pdf`;
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "application/pdf" });

      // Share the PDF — on iOS/Android this opens the share sheet; pick Mail to attach
      await navigator.share({ files: [file], title: subject });
      setEmailState("idle");
    } catch (err) {
      // User cancelled the share sheet — not a real error
      if (err instanceof Error && err.name === "AbortError") {
        setEmailState("idle");
        return;
      }
      // Fallback: open mail app with just the subject (no attachment)
      // Show error state briefly so the user knows PDF attachment failed
      setEmailState("error");
      setTimeout(() => setEmailState("idle"), 2500);
      const a = document.createElement("a");
      a.href = `mailto:?subject=${encodeURIComponent(subject)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }

  async function handleExportPdf() {
    if (exportState === "generating") return;
    setExportState("generating");
    setExportError(null);
    try {
      const res = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, photos }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "PDF generation failed");
      }
      // Extract filename from Content-Disposition header before consuming body
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "Service Report.pdf";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Use a hidden <a download> so the browser saves with the correct filename.
      // window.open(blobUrl) loses the Content-Disposition name and falls back to the UUID.
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 15_000);
      setExportState("done");
      setTimeout(() => setExportState("idle"), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF export failed";
      setExportError(msg);
      setExportState("error");
    }
  }

  return (
    <>
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-72">

        {/* Page title */}
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex-1">Service Report</h1>
          {!isNewReport && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700 active:text-slate-900 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        {isNewReport && <StepIndicator steps={REPORT_STEPS} currentStep={4} />}
        {/* ── Report card ── */}
        <div className="bg-white rounded-2xl shadow-card-hover overflow-hidden border border-slate-100">

          {/* Branded business header */}
          <div className="px-5 py-5" style={{ backgroundColor: HEADER_COLOR }}>
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
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">Service Report</p>
                <p className="text-lg font-bold text-white leading-tight">{business.businessName}</p>
                {business.technicianName && (
                  <p className="text-white/70 text-sm mt-0.5">Technician: {business.technicianName}</p>
                )}
                {business.tagline && (
                  <p className="text-white/50 text-xs mt-1.5">{business.tagline}</p>
                )}
              </div>
            </div>
          </div>

          {/* Info grid — mirrors PDF layout */}
          <div className="px-5 pt-5 pb-4 border-b border-slate-100">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Customer</p>
                <p className="text-sm font-bold text-slate-900">{job.customerName || "—"}</p>
                {job.serviceAddress && <p className="text-xs text-slate-500 mt-0.5">{job.serviceAddress}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Job Number</p>
                <p className="text-sm font-medium font-mono text-slate-700">{"JW-" + report.id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date of Service</p>
                <p className="text-sm font-medium text-slate-700">{formatDate(job.jobDate)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Service Type</p>
                <p className="text-sm font-medium text-slate-700">{SERVICE_TYPE_LABELS[job.serviceType]}</p>
              </div>
              {job.equipment?.trim() && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Equipment / System</p>
                  <p className="text-sm font-medium text-slate-700">{job.equipment.trim()}</p>
                </div>
              )}
              {job.nextServiceDate && (
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Next Service Due</p>
                  <p className="text-sm font-medium text-slate-700">{formatDate(job.nextServiceDate)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer summary — plain-English intro */}
          {rpt.customerSummary && (
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Summary</p>
              <p className="text-sm text-slate-700 leading-relaxed">{rpt.customerSummary}</p>
            </div>
          )}

          {/* Report sections */}
          <div className="px-5 py-5 space-y-5">
            {rpt.findings && (
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                  Observations
                </h3>
                <BulletSection text={rpt.findings} />
              </div>
            )}

            {rpt.workPerformed && (
              <>
                {rpt.findings && <Separator />}
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                    Work Performed
                  </h3>
                  <BulletSection text={rpt.workPerformed} />
                </div>
              </>
            )}

            {rpt.recommendations && (
              <>
                <Separator />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                    Recommendations
                  </h3>
                  <BulletSection text={rpt.recommendations} />
                </div>
              </>
            )}

            {/* Job photos */}
            {photos.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">
                    Job Photos
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.dataUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Thank you line */}
            <p className="text-xs text-slate-500 text-center leading-relaxed mb-3">
              Thank you for choosing{" "}
              <span className="font-bold text-slate-700">{business.businessName}</span>
              . We appreciate your business and look forward to serving you again.
            </p>

            {/* Dot-separated contact footer */}
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 border-t border-slate-100 pt-3">
              {[
                business.businessName,
                business.technicianName ? `Technician: ${business.technicianName}` : null,
                business.licence1Label && business.licence1Number ? `${business.licence1Label}: ${business.licence1Number}` : null,
                business.licence2Label && business.licence2Number ? `${business.licence2Label}: ${business.licence2Number}` : null,
                business.phone || null,
                business.email || null,
                business.website || null,
              ].filter(Boolean).map((item, i, arr) => (
                <span key={i} className="flex items-center gap-x-1.5">
                  <span className="text-[10px] text-slate-400">{item}</span>
                  {i < arr.length - 1 && <span className="text-[10px] text-slate-300">·</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Export error */}
        {exportState === "error" && exportError && (
          <div className="mt-4 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">PDF export failed</p>
              <p className="text-xs text-red-600 mt-0.5">{exportError}</p>
            </div>
          </div>
        )}
      </main>
    </div>

      {/* ── Sticky action bar ── */}
      <div className="fixed left-0 right-0 z-20 bg-white border-t border-slate-100 above-nav">
        <div className="lg:pl-60">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer space-y-2">

          {/* Primary: Download PDF */}
          <button
            onClick={handleExportPdf}
            disabled={exportState === "generating"}
            className="w-full h-14 rounded-2xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-60 transition-colors shadow-md shadow-orange-200/50 flex items-center justify-center gap-2"
          >
            {exportState === "generating" ? (
              <><Loader2 className="w-5 h-5 text-white animate-spin" /><span className="text-base font-bold text-white">Building…</span></>
            ) : exportState === "done" ? (
              <><CheckCircle2 className="w-5 h-5 text-white" /><span className="text-base font-bold text-white">PDF Saved!</span></>
            ) : (
              <><Download className="w-5 h-5 text-white" /><span className="text-base font-bold text-white">Download PDF</span></>
            )}
          </button>
          {/* Secondary: Send to Customer */}
          <button
            onClick={handleEmail}
            disabled={emailState === "generating"}
            className="w-full h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
          >
            {emailState === "generating" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {emailState === "generating" ? "Preparing…" : "Send to Customer"}
          </button>
          {isNewReport && (
            <button
              onClick={onDone}
              className="w-full h-10 text-sm font-semibold text-slate-500 hover:text-slate-600 active:text-slate-800 transition-colors flex items-center justify-center"
            >
              Back to dashboard
            </button>
          )}

        </div>
        </div>
      </div>
    </>
  );
}
