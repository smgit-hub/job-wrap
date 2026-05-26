"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, Eye, CheckCircle2, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import type { ServiceReport, GeneratedReport, JobPhoto, JobDetails } from "@/types/report";
import { saveReport } from "@/lib/storage";
import { getPhotosForReport, savePhotosForReport } from "@/lib/photoStorage";
import PhotoSection from "@/components/PhotoSection";
import { cn } from "@/lib/utils";

interface ReportEditorProps {
  report: ServiceReport;
  isNewReport: boolean;
  wasMock?: boolean;
  onBack: () => void;
  onPreview: (report: ServiceReport) => void;
  onRegenerate?: (job: JobDetails) => Promise<GeneratedReport>;
}

type SectionKey = keyof GeneratedReport;

const SECTIONS: { key: SectionKey; label: string; rows: number; hint?: string }[] = [
  {
    key: "customerSummary",
    label: "Customer Summary",
    rows: 3,
    hint: "Plain-English intro for the customer — no jargon, warm tone",
  },
  {
    key: "workCompleted",
    label: "Work Performed",
    rows: 5,
    hint: "Use bullet points (•) for each completed task",
  },
  {
    key: "diagnostics",
    label: "Diagnostics & Findings",
    rows: 4,
    hint: "Readings, test results, and system condition",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    rows: 4,
    hint: "Suggested actions and next service for the customer",
  },
];

export default function ReportEditor({ report, isNewReport, wasMock = false, onBack, onPreview, onRegenerate }: ReportEditorProps) {
  const [draft, setDraft] = useState<ServiceReport>(report);
  const [autoSaved, setAutoSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotos(getPhotosForReport(draft.id));
  }, [draft.id]);

  function handlePhotosChange(updated: JobPhoto[]) {
    setPhotos(updated);
    savePhotosForReport(draft.id, updated);
  }

  async function handleRegenerate() {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    setRegenError(null);
    setConfirmRegen(false);
    try {
      const newReport = await onRegenerate(draft.job);
      const updated: ServiceReport = {
        ...draft,
        report: newReport,
        updatedAt: new Date().toISOString(),
      };
      setDraft(updated);
      saveReport(updated);
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Regeneration failed. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  function updateField(key: SectionKey, value: string) {
    setAutoSaved(false);
    setDraft((prev) => ({
      ...prev,
      report: { ...prev.report, [key]: value },
    }));
  }

  const handleBlur = useCallback((current: ServiceReport) => {
    try {
      const updated: ServiceReport = {
        ...current,
        updatedAt: new Date().toISOString(),
      };
      saveReport(updated);
      setAutoSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setAutoSaved(false), 2500);
    } catch {
      // Silent failure — localStorage full or unavailable
    }
  }, []);

  function handlePreview() {
    const completed: ServiceReport = {
      ...draft,
      status: "complete",
      updatedAt: new Date().toISOString(),
    };
    saveReport(completed);
    setDraft(completed);
    onPreview(completed);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 text-center font-bold text-slate-900">Edit Report</span>
          <div className="w-9 h-9 flex items-center justify-center shrink-0">
            {autoSaved && (
              <span className="text-xs text-green-600 flex items-center gap-1 whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </span>
            )}
          </div>
        </div>
        {isNewReport && <StepIndicator steps={REPORT_STEPS} currentStep={3} />}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-32 space-y-4">
        {/* Job summary chip */}
        <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 shadow-card flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">
              {draft.job.customerName || "Unknown customer"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {draft.job.serviceAddress
                ? `${draft.job.serviceAddress} · `
                : ""}
              {draft.job.jobDate}
            </p>
          </div>
          <Badge
            className={cn(
              "text-[11px] font-semibold border-0 shrink-0",
              draft.status === "complete"
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {draft.status === "complete" ? "Complete" : "Draft"}
          </Badge>
        </div>

        {/* Regenerate */}
        {onRegenerate && !isRegenerating && !confirmRegen && (
          <button
            onClick={() => setConfirmRegen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-400 text-sm hover:border-orange-200 hover:text-orange-400 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate with AI
          </button>
        )}

        {isRegenerating && (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Regenerating…
          </div>
        )}

        {confirmRegen && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 space-y-3">
            <p className="text-sm font-semibold text-amber-800">Regenerate this report?</p>
            <p className="text-xs text-amber-700">Your current edits will be replaced with a fresh AI-generated version.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmRegen(false)}
                className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 active:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                className="flex-1 h-10 rounded-xl bg-orange-500 text-sm font-semibold text-white active:bg-orange-600"
              >
                Regenerate
              </button>
            </div>
          </div>
        )}

        {regenError && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{regenError}</p>
          </div>
        )}

        {/* Mock fallback warning */}
        {wasMock && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              <span className="font-semibold">AI API not reached</span> — this report was generated using the local fallback. Check your API key in <code className="font-mono bg-amber-100 px-1 rounded">.env.local</code>.
            </p>
          </div>
        )}

        {/* Editable sections */}
        {SECTIONS.map(({ key, label, rows, hint }) => (
          <Card
            key={key}
            className="border border-slate-100 shadow-card"
          >
            <CardHeader className="pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {label}
              </CardTitle>
              {hint && (
                <p className="text-xs text-slate-400 mt-0.5 normal-case tracking-normal font-normal">
                  {hint}
                </p>
              )}
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                value={draft.report[key]}
                onChange={(e) => updateField(key, e.target.value)}
                onBlur={() => handleBlur(draft)}
                rows={rows}
                enterKeyHint="done"
                className="text-base leading-relaxed resize-none w-full border-slate-200 focus:border-orange-300"
              />
            </CardContent>
          </Card>
        ))}

        {/* Photos */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Job Photos
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5 normal-case tracking-normal font-normal">
              Before / after shots — included in the report and PDF
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <PhotoSection photos={photos} onChange={handlePhotosChange} />
          </CardContent>
        </Card>
      </main>

      {/* Sticky Preview CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handlePreview}
            className="w-full h-14 rounded-2xl text-base font-bold bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white flex items-center justify-center gap-2 transition-colors shadow-md shadow-orange-200/50"
          >
            <Eye className="w-5 h-5" />
            Preview Customer Report
          </button>
        </div>
      </div>
    </div>
  );
}
