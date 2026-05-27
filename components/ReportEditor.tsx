"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { ChevronLeft, Eye, CheckCircle2, AlertTriangle, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import type { ServiceReport, GeneratedReport, JobPhoto, JobDetails } from "@/types/report";
import { saveReport } from "@/lib/storage";
import { getPhotosForReport, savePhotosForReport } from "@/lib/photoStorage";
import PhotoSection from "@/components/PhotoSection";
import { cn } from "@/lib/utils";

interface ReportEditorProps {
  report: ServiceReport;
  isNewReport: boolean;
  onBack: () => void;
  onPreview: (report: ServiceReport) => void;
  onRegenerate?: (job: JobDetails) => Promise<GeneratedReport>;
}

type SectionKey = keyof GeneratedReport;

const SERVICE_TYPE_LABELS: Record<string, string> = {
  "hvac-maintenance": "Maintenance",
  "hvac-emergency": "Emergency",
  "hvac-repair": "Repair",
  "hvac-install": "Installation",
  "hvac-seasonal": "Seasonal",
  "hvac-inspection": "Inspection",
  "hvac-warranty": "Warranty",
  other: "Other",
};

const SECTIONS: { key: SectionKey; label: string; rows: number; hint?: string }[] = [
  {
    key: "customerSummary",
    label: "Customer Summary",
    rows: 3,
    hint: "Plain English, warm tone — written for the customer, not the trade",
  },
  {
    key: "findings",
    label: "Findings",
    rows: 4,
    hint: "Faults, observations, and anything worth noting",
  },
  {
    key: "workPerformed",
    label: "Work Performed",
    rows: 5,
    hint: "List each task — include the outcome",
  },
  {
    key: "recommendations",
    label: "Recommendations",
    rows: 3,
    hint: "Next steps and anything the customer should keep in mind",
  },
];

export default function ReportEditor({ report, isNewReport, onBack, onPreview, onRegenerate }: ReportEditorProps) {
  const [draft, setDraft] = useState<ServiceReport>(report);
  const [autoSaved, setAutoSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [equipmentExpanded, setEquipmentExpanded] = useState(false);

  const originalNotes = draft.job.voiceNotes.jobNotes.trim();
  const originalRecs = draft.job.voiceNotes.recommendations.trim();
  const isUngenerated =
    !draft.report.customerSummary &&
    !draft.report.workPerformed;

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

  function updateJobField(field: keyof JobDetails, value: string) {
    setAutoSaved(false);
    setDraft((prev) => {
      const updated = { ...prev, job: { ...prev.job, [field]: value } };
      return updated;
    });
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
          <span className="flex-1 font-bold text-slate-900 ml-3">Edit Report</span>
        </div>
        {isNewReport && <StepIndicator steps={REPORT_STEPS} currentStep={3} />}
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-32 space-y-4">
        {/* Job Details card — editable */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">

            {/* ── Customer ── */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setCustomerExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</p>
                  {!customerExpanded && (
                    <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                      {[draft.job.customerName, draft.job.serviceAddress].filter(Boolean).join(" · ") || "—"}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-orange-500 shrink-0 ml-3">
                  {customerExpanded ? "Done" : "Edit"}
                </span>
              </button>
              {customerExpanded && (
                <div className="px-3 pb-3 pt-2 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-customer">Customer name</Label>
                    <Input
                      id="ed-customer"
                      value={draft.job.customerName}
                      onChange={(e) => updateJobField("customerName", e.target.value)}
                      onBlur={() => handleBlur(draft)}
                      placeholder="e.g. Sandra Kowalski"
                      className="h-11 text-base"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-address">Service address</Label>
                    <Input
                      id="ed-address"
                      value={draft.job.serviceAddress}
                      onChange={(e) => updateJobField("serviceAddress", e.target.value)}
                      onBlur={() => handleBlur(draft)}
                      placeholder="e.g. 142 Birchwood Drive"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Date / Service type ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ed-date">Date</Label>
                <Input
                  id="ed-date"
                  type="date"
                  value={draft.job.jobDate}
                  onChange={(e) => updateJobField("jobDate", e.target.value)}
                  onBlur={() => handleBlur(draft)}
                  className="h-11 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-service">Service type</Label>
                <select
                  id="ed-service"
                  value={draft.job.serviceType}
                  onChange={(e) => updateJobField("serviceType", e.target.value)}
                  onBlur={() => handleBlur(draft)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Next Service Due ── */}
            <div className="space-y-1.5">
              <Label htmlFor="ed-next-service">Next Service Due</Label>
              <Input
                id="ed-next-service"
                type="date"
                value={draft.job.nextServiceDate ?? ""}
                onChange={(e) => updateJobField("nextServiceDate", e.target.value)}
                onBlur={() => handleBlur(draft)}
                className="h-11 text-base"
              />
            </div>

            {/* ── Equipment ── */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setEquipmentExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Equipment</p>
                  {!equipmentExpanded && (
                    <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                      {[draft.job.equipmentBrand, draft.job.equipmentModel, draft.job.equipmentCapacity].filter(Boolean).join(" ") || "—"}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-orange-500 shrink-0 ml-3">
                  {equipmentExpanded ? "Done" : "Edit"}
                </span>
              </button>
              {equipmentExpanded && (
                <div className="px-3 pb-3 pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-equip-brand" className="text-xs text-slate-400">Brand</Label>
                      <Input
                        id="ed-equip-brand"
                        value={draft.job.equipmentBrand ?? ""}
                        onChange={(e) => updateJobField("equipmentBrand", e.target.value)}
                        onBlur={() => handleBlur(draft)}
                        placeholder="e.g. Daikin"
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-equip-model" className="text-xs text-slate-400">Model</Label>
                      <Input
                        id="ed-equip-model"
                        value={draft.job.equipmentModel ?? ""}
                        onChange={(e) => updateJobField("equipmentModel", e.target.value)}
                        onBlur={() => handleBlur(draft)}
                        placeholder="e.g. FTXM50W"
                        className="h-11 text-base"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-equip-capacity" className="text-xs text-slate-400">Capacity</Label>
                      <Input
                        id="ed-equip-capacity"
                        value={draft.job.equipmentCapacity ?? ""}
                        onChange={(e) => updateJobField("equipmentCapacity", e.target.value)}
                        onBlur={() => handleBlur(draft)}
                        placeholder="e.g. 6kW"
                        className="h-11 text-base"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ed-equip-year" className="text-xs text-slate-400">Install Year</Label>
                      <Input
                        id="ed-equip-year"
                        value={draft.job.equipmentInstallYear ?? ""}
                        onChange={(e) => updateJobField("equipmentInstallYear", e.target.value)}
                        onBlur={() => handleBlur(draft)}
                        placeholder="e.g. 2018"
                        inputMode="numeric"
                        className="h-11 text-base"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ed-equip-details" className="text-xs text-slate-400">Additional details</Label>
                    <Input
                      id="ed-equip-details"
                      value={draft.job.equipmentDetails ?? ""}
                      onChange={(e) => updateJobField("equipmentDetails", e.target.value)}
                      onBlur={() => handleBlur(draft)}
                      placeholder="Serial number, system type, other notes…"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Original notes */}
        {(originalNotes || isUngenerated) && (
          <Card className="border border-slate-100 shadow-card">
            <CardHeader className="pb-2 px-4 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Job Notes</CardTitle>
                {!isUngenerated && (
                  <button
                    onClick={() => setShowNotes((v) => !v)}
                    className="text-xs text-orange-500 font-semibold"
                  >
                    {showNotes ? "Hide" : "Show"}
                  </button>
                )}
              </div>
              {!showNotes && !isUngenerated && originalNotes && (
                <p className="text-sm text-slate-500 mt-1 truncate normal-case tracking-normal font-normal">
                  {originalNotes.slice(0, 80)}{originalNotes.length > 80 ? "…" : ""}
                </p>
              )}
            </CardHeader>
            {(showNotes || isUngenerated) && (
              <CardContent className="px-4 pb-4">
                <Textarea
                  value={draft.job.voiceNotes.jobNotes}
                  onChange={(e) => {
                    setDraft((prev) => ({
                      ...prev,
                      job: {
                        ...prev.job,
                        voiceNotes: { ...prev.job.voiceNotes, jobNotes: e.target.value },
                      },
                    }));
                  }}
                  onBlur={() => handleBlur(draft)}
                  rows={5}
                  placeholder="Add or edit your job notes here…"
                  enterKeyHint="done"
                  className="text-base leading-relaxed resize-none w-full border-slate-200 focus:border-orange-300"
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* Recommendation notes — always visible so techs can add notes after generation */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommendation Notes</CardTitle>
                  <button
                onClick={() => setShowRecs((v) => !v)}
                className="text-xs text-orange-500 font-semibold"
              >
                {showRecs ? "Hide" : "Show"}
              </button>
            </div>
            {originalRecs && !showRecs && (
              <p className="text-sm text-slate-500 mt-1 truncate normal-case tracking-normal font-normal">
                {originalRecs.slice(0, 80)}{originalRecs.length > 80 ? "…" : ""}
              </p>
            )}
          </CardHeader>
          {showRecs && (
            <CardContent className="px-4 pb-4">
              <Textarea
                value={draft.job.voiceNotes.recommendations}
                onChange={(e) => {
                  setDraft((prev) => ({
                    ...prev,
                    job: {
                      ...prev.job,
                      voiceNotes: { ...prev.job.voiceNotes, recommendations: e.target.value },
                    },
                  }));
                }}
                onBlur={() => handleBlur(draft)}
                rows={3}
                placeholder="Add recommendation notes here…"
                enterKeyHint="done"
                className="text-base leading-relaxed resize-none w-full border-slate-200 focus:border-orange-300"
              />
            </CardContent>
          )}
        </Card>

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

        {/* Ungenerated banner */}
        {isUngenerated && onRegenerate && !isRegenerating && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-card px-5 py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">No report generated yet</p>
              <p className="text-xs text-slate-400 mt-1">Tap below to generate the report from your saved notes.</p>
            </div>
            <button
              onClick={handleRegenerate}
              className="h-11 px-6 rounded-xl bg-orange-500 text-sm font-bold text-white active:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
            >
              Generate Report
            </button>
          </div>
        )}

        {/* Editable sections */}
        {(!isUngenerated) && SECTIONS.map(({ key, label, rows, hint }) => (
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

      {/* Save toast */}
      <div
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900 text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-lg transition-all duration-300",
          autoSaved ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        )}
      >
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        Changes saved
      </div>

      {/* Sticky Preview CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handlePreview}
            disabled={isUngenerated}
            className="w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-md shadow-orange-200/50"
          >
            <Eye className="w-5 h-5" />
            Save & Preview
          </button>
        </div>
      </div>
    </div>
  );
}
