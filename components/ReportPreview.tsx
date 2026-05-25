"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, CheckCircle2, Loader2, AlertCircle, Share2, Copy, Mail, Printer, Save, Link } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import PrintableReport from "@/components/PrintableReport";
import { exportReportPdf, generateFilename } from "@/lib/pdf/exportReportPdf";
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

function buildPlainText(report: ServiceReport): string {
  const { business, job, report: rpt } = report;
  const lines: string[] = [];

  lines.push("Service Report", "");
  lines.push(`${business.businessName}${business.technicianName ? ` · ${business.technicianName}` : ""}`);
  lines.push(`Date: ${formatDate(job.jobDate)}`);
  if (job.customerName) lines.push(`Customer: ${job.customerName}`);
  if (job.serviceAddress) lines.push(`Address: ${job.serviceAddress}`);
  lines.push("");

  if (rpt.customerSummary) {
    lines.push(rpt.customerSummary, "");
  }

  if (rpt.workCompleted) {
    lines.push("WORK PERFORMED");
    lines.push(rpt.workCompleted, "");
  }
  if (rpt.diagnostics) {
    lines.push("DIAGNOSTICS & FINDINGS");
    lines.push(rpt.diagnostics, "");
  }
  if (rpt.recommendations) {
    lines.push("RECOMMENDATIONS");
    lines.push(rpt.recommendations, "");
  }

  lines.push("---");
  lines.push(business.businessName);
  if (business.technicianName) lines.push(`Technician: ${business.technicianName}`);
  if (business.licenseNumber) lines.push(`Licence: ${business.licenseNumber}`);
  if (business.phone) lines.push(business.phone);
  if (business.email) lines.push(business.email);

  return lines.join("\n");
}

function BulletSection({ text, accentColor }: { text: string; accentColor?: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return (
    <ul className="space-y-2">
      {lines.map((line, i) => (
        <li key={i} className="flex gap-2.5 text-sm text-gray-700 leading-relaxed">
          <span className="shrink-0 mt-1 text-[8px]" style={{ color: accentColor ?? "#f97316" }}>
            ◆
          </span>
          <span>{line.replace(/^[•\-]\s*/, "")}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ReportPreview({ report, isNewReport, onBack, onEdit, onDone }: ReportPreviewProps) {
  const { business, job, report: rpt } = report;
  const HEADER_COLOR = "#0f172a"; // slate-900 — fixed
  const ACCENT_COLOR = "#f97316"; // orange-500 — fixed

  const printableRef = useRef<HTMLDivElement>(null);
  const [exportState, setExportState] = useState<ExportState>("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkState, setLinkState] = useState<"idle" | "generating" | "copied" | "error">("idle");
  const [photos, setPhotos] = useState<JobPhoto[]>([]);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
    setPhotos(getPhotosForReport(report.id));
  }, [report.id]);

  async function handleShare() {
    if (!canShare) return;
    try {
      await navigator.share({ title: "Service Report", text: buildPlainText(report) });
    } catch {
      // User dismissed
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(buildPlainText(report));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  async function handleCopyLink() {
    if (linkState === "generating") return;
    setLinkState("generating");
    try {
      const res = await fetch("/api/share-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, photos }),
      });
      if (!res.ok) throw new Error("Failed");
      const { url } = (await res.json()) as { url: string };
      await navigator.clipboard.writeText(url);
      setLinkState("copied");
      setTimeout(() => setLinkState("idle"), 3000);
    } catch {
      setLinkState("error");
      setTimeout(() => setLinkState("idle"), 3000);
    }
  }

  function handleEmail() {
    const subject = encodeURIComponent("Service Report");
    const body = encodeURIComponent(buildPlainText(report));
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  async function handleExportPdf() {
    if (exportState === "generating") return;
    if (!printableRef.current) return;
    setExportState("generating");
    setExportError(null);
    try {
      const filename = generateFilename(job.customerName, job.jobDate);
      await exportReportPdf(printableRef.current, { filename });
      setExportState("done");
      setTimeout(() => setExportState("idle"), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "PDF export failed";
      setExportError(msg);
      setExportState("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 text-center font-bold text-slate-900">Service Report</span>
          <div className="flex items-center gap-1">
            {!isNewReport && (
              <button
                onClick={onEdit}
                className="h-9 px-3 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 active:bg-slate-200 transition-colors"
              >
                Edit
              </button>
            )}
            {canShare && (
              <button
                onClick={handleShare}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        </div>
        {isNewReport && <StepIndicator steps={REPORT_STEPS} currentStep={4} />}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-72">
        {/* ── Report card ── */}
        <div className="bg-white rounded-2xl shadow-card-hover overflow-hidden border border-slate-100">

          {/* Branded business header */}
          <div className="px-5 py-5" style={{ backgroundColor: HEADER_COLOR }}>
            <p className="text-lg font-bold text-white leading-tight">{business.businessName}</p>
            {business.technicianName && (
              <p className="text-white/70 text-sm mt-0.5">Technician: {business.technicianName}</p>
            )}
            {business.tagline && (
              <p className="text-white/50 text-xs mt-1.5">{business.tagline}</p>
            )}
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
              <p className="text-sm text-slate-500 mt-1">{job.voiceNotes.equipmentDetails}</p>
            )}
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-3">
              {SERVICE_TYPE_LABELS[job.serviceType]}  ·  {formatDate(job.jobDate)}
            </p>
          </div>

          {/* Customer summary — plain-English intro */}
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
                <BulletSection text={rpt.workCompleted} accentColor={ACCENT_COLOR} />
              </div>
            )}

            {rpt.diagnostics && (
              <>
                <Separator />
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">
                    Diagnostics & Findings
                  </h3>
                  <BulletSection text={rpt.diagnostics} accentColor={ACCENT_COLOR} />
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
                  <BulletSection text={rpt.recommendations} accentColor={ACCENT_COLOR} />
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
                        <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/55">
                          {photo.label === "before" ? "Before" : "After"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="text-xs text-gray-400 space-y-0.5">
              <p className="font-semibold text-gray-600">{business.businessName}</p>
              {business.technicianName && <p>Technician: {business.technicianName}</p>}
              {business.licenseNumber && <p>Licence: {business.licenseNumber}</p>}
              {business.phone && <p>{business.phone}</p>}
              {business.email && <p>{business.email}</p>}
              {business.website && <p>{business.website}</p>}
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

      {/* ── Sticky action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer space-y-2.5">
          {/* Secondary actions — 2×2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Copy Link */}
            <button
              onClick={handleCopyLink}
              disabled={linkState === "generating"}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {linkState === "generating" ? (
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              ) : linkState === "copied" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : linkState === "error" ? (
                <AlertCircle className="w-5 h-5 text-red-400" />
              ) : (
                <Link className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-xs font-semibold text-slate-600">
                {linkState === "generating" ? "Creating…" : linkState === "copied" ? "Link Copied!" : linkState === "error" ? "Failed" : "Copy Link"}
              </span>
            </button>

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors"
            >
              {copied
                ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                : <Copy className="w-5 h-5 text-slate-500" />
              }
              <span className="text-xs font-semibold text-slate-600">
                {copied ? "Copied!" : "Copy Text"}
              </span>
            </button>

            {/* Email */}
            <button
              onClick={handleEmail}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors"
            >
              <Mail className="w-5 h-5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-600">Email</span>
            </button>

            {/* Print / PDF */}
            <button
              onClick={handleExportPdf}
              disabled={exportState === "generating"}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100 transition-colors disabled:opacity-50"
            >
              {exportState === "generating" ? (
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              ) : exportState === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Printer className="w-5 h-5 text-slate-500" />
              )}
              <span className="text-xs font-semibold text-slate-600">
                {exportState === "generating" ? "Building…" : exportState === "done" ? "Opened!" : "Print / PDF"}
              </span>
            </button>
          </div>

          {/* Primary CTA */}
          <button
            onClick={onDone}
            className="w-full h-14 rounded-2xl text-base font-bold text-white bg-orange-500 hover:bg-orange-600 active:bg-orange-700 flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200/50"
          >
            <Save className="w-5 h-5" />
            {isNewReport ? "Save Job & Done" : "Done"}
          </button>
        </div>
      </div>

      {/* Hidden PrintableReport — rasterized into PDF */}
      <div
        style={{ position: "absolute", left: "-9999px", top: 0, backgroundColor: "#ffffff" }}
        aria-hidden="true"
      >
        <PrintableReport ref={printableRef} report={report} photos={photos} />
      </div>
    </div>
  );
}
