"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Eye, AlertTriangle, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import type { ServiceReport, GeneratedReport, JobPhoto, JobDetails } from "@/types/report";
import { SERVICE_TYPE_LABELS } from "@/types/report";
import { saveReport } from "@/lib/storage";
import { dbSaveReport } from "@/lib/db";
import { getPhotosForReport, savePhotosForReport } from "@/lib/photoStorage";
import PhotoSection from "@/components/PhotoSection";
import BulletEditor from "@/components/BulletEditor";
import DatePicker from "@/components/ui/DatePicker";

interface ReportEditorProps {
  report: ServiceReport;
  isNewReport: boolean;
  onBack: () => void;
  onPreview: (report: ServiceReport) => void;
  onRegenerate?: (job: JobDetails) => Promise<GeneratedReport>;
  readOnly?: boolean;
}


export default function ReportEditor({ report, isNewReport, onBack, onPreview, onRegenerate, readOnly = false }: ReportEditorProps) {
  const [draft, setDraft] = useState<ServiceReport>(report);
  const [movingBullet, setMovingBullet] = useState<{ text: string; from: keyof GeneratedReport } | null>(null);
  const [photos, setPhotos] = useState<JobPhoto[]>([]);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [equipmentExpanded, setEquipmentExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Keep a ref to the latest draft so handlePreview always captures fresh state
  const latestDraft = useRef<ServiceReport>(draft);
  useEffect(() => { latestDraft.current = draft; }, [draft]);

  // Auto-save on every draft change — localStorage instantly, Supabase async
  useEffect(() => {
    saveReport(draft);
    void dbSaveReport(draft, photos);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhotos(getPhotosForReport(draft.id));
  }, [draft.id]);

  const isUngenerated = !draft.report.customerSummary && !draft.report.workPerformed;

  function handlePhotosChange(updated: JobPhoto[]) {
    setPhotos(updated);
    savePhotosForReport(draft.id, updated);   // localStorage cache
    void dbSaveReport(draft, updated);         // Supabase — uploads new photos
  }

  async function handleRegenerate() {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    setRegenError(null);
    setConfirmRegen(false);
    try {
      const newReport = await onRegenerate(draft.job);
      setDraft((prev) => ({
        ...prev,
        report: newReport,
        updatedAt: new Date().toISOString(),
      }));
    } catch (err) {
      setRegenError(err instanceof Error ? err.message : "Regeneration failed. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }

  function updateField(key: keyof GeneratedReport, value: string) {
    setDraft((prev) => ({
      ...prev,
      report: { ...prev.report, [key]: value },
    }));
  }

  function updateFieldAndSave(key: keyof GeneratedReport, value: string) {
    setDraft((prev) => ({
      ...prev,
      report: { ...prev.report, [key]: value },
    }));
  }

  function updateJobField(field: keyof JobDetails, value: string) {
    setDraft((prev) => ({ ...prev, job: { ...prev.job, [field]: value } }));
  }

  function updateVoiceNote(field: keyof typeof draft.job.voiceNotes, value: string) {
    setDraft((prev) => ({
      ...prev,
      job: { ...prev.job, voiceNotes: { ...prev.job.voiceNotes, [field]: value } },
    }));
  }

  function handlePreview() {
    const current = latestDraft.current;
    const completed: ServiceReport = {
      ...current,
      status: "complete",
      updatedAt: new Date().toISOString(),
    };
    saveReport(completed);
    setDraft(completed);
    onPreview(completed);
  }

  // Cross-section bullet move
  function handleStartMove(text: string, from: keyof GeneratedReport) {
    setMovingBullet({ text, from });
  }

  function handleMoveToSection(target: keyof GeneratedReport) {
    if (!movingBullet) return;
    const { text, from } = movingBullet;
    setMovingBullet(null);
    setDraft((prev) => {
      const sourceItems = prev.report[from]
        .split("\n")
        .filter((l) => l.replace(/^[•\-]\s*/, "").trim() !== text.trim());
      const targetItems = prev.report[target].split("\n").filter(Boolean);
      targetItems.push(`• ${text.trim()}`);
      return {
        ...prev,
        report: {
          ...prev.report,
          [from]: sourceItems.join("\n"),
          [target]: targetItems.join("\n"),
        },
      };
    });
  }

  return (
    <>
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-52 lg:pb-32 space-y-4">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex-1">Edit Report</h1>
        </div>
        {isNewReport && <StepIndicator steps={REPORT_STEPS} currentStep={3} />}

        {/* ── Generating spinner (first-time generation from draft) ─────── */}
        {isUngenerated && isRegenerating && (
          <div className="flex flex-col items-center gap-5 text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-orange-50 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-orange-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-slate-900 text-lg">Generating Report…</p>
              <p className="text-sm text-slate-500">This usually takes 10–20 seconds.</p>
            </div>
            <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
          </div>
        )}

        {/* ── Ungenerated banner ─────────────────────────────────────────── */}
        {isUngenerated && onRegenerate && !isRegenerating && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 shadow-card px-5 py-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">No report generated yet</p>
              <p className="text-xs text-slate-500 mt-1">Tap below to generate the report from your saved notes.</p>
            </div>
            <button
              onClick={handleRegenerate}
              className="h-11 px-6 rounded-xl bg-orange-500 text-sm font-bold text-white active:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
            >
              Generate Report
            </button>
          </div>
        )}

        {/* ── Report sections ────────────────────────────────────────────── */}
        {!isUngenerated && (
          <>
            {/* Customer Summary */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer Summary</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-normal tracking-normal normal-case">Plain English — written for the customer</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <Textarea
                  id="ed-summary"
                  aria-label="Customer summary"
                  value={draft.report.customerSummary}
                  onChange={(e) => updateField("customerSummary", e.target.value)}
                  rows={3}
                  enterKeyHint="done"
                  className="text-base leading-relaxed resize-none w-full border-slate-200 focus:border-orange-300"
                />
              </CardContent>
            </Card>

            {/* Observations */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Observations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-normal tracking-normal normal-case">What was noticed — not what was done</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <BulletEditor
                  value={draft.report.findings}
                  onChange={(v) => updateFieldAndSave("findings", v)}
                  onMove={(text) => handleStartMove(text, "findings")}
                  emptyState="No observations — tap + to add one"
                />
              </CardContent>
            </Card>

            {/* Work Performed */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Work Performed</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-normal tracking-normal normal-case">Everything completed during the visit</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <BulletEditor
                  value={draft.report.workPerformed}
                  onChange={(v) => updateFieldAndSave("workPerformed", v)}
                  onMove={(text) => handleStartMove(text, "workPerformed")}
                  emptyState="No tasks added yet"
                />
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border border-slate-100 shadow-card">
              <CardHeader className="pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Recommendations</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-normal tracking-normal normal-case">Next steps for the customer</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <BulletEditor
                  value={draft.report.recommendations}
                  onChange={(v) => updateFieldAndSave("recommendations", v)}
                  onMove={(text) => handleStartMove(text, "recommendations")}
                  emptyState="No recommendations — tap + to add one"
                />
              </CardContent>
            </Card>

            {/* Regenerate — below the content it affects */}
            {onRegenerate && (
              isRegenerating ? (
                <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-200 text-slate-500 text-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Regenerating…
                </div>
              ) : confirmRegen ? (
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
              ) : regenError ? (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{regenError}</p>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRegen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm hover:border-orange-300 hover:text-orange-500 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate with AI
                </button>
              )
            )}
          </>
        )}

        {/* ── Job Details ────────────────────────────────────────────────── */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">

            {/* Customer */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setCustomerExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Customer</p>
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
                      placeholder="e.g. 142 Birchwood Drive"
                      className="h-11 text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Date / Next Service */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ed-date">Date</Label>
                <DatePicker
                  id="ed-date"
                  value={draft.job.jobDate}
                  onChange={(iso) => updateJobField("jobDate", iso)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ed-next-service">Next Service</Label>
                <DatePicker
                  id="ed-next-service"
                  value={draft.job.nextServiceDate ?? ""}
                  onChange={(iso) => updateJobField("nextServiceDate", iso)}
                  placeholder="Optional"
                />
              </div>
            </div>

            {/* Service type */}
            <div className="space-y-1.5">
              <Label htmlFor="ed-service">Service type</Label>
              <select
                id="ed-service"
                value={draft.job.serviceType}
                onChange={(e) => updateJobField("serviceType", e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {draft.job.serviceType === "other" && (
                <Input
                  aria-label="Custom service type description"
                  value={draft.job.customServiceType ?? ""}
                  onChange={(e) => updateJobField("customServiceType", e.target.value)}
                  placeholder="e.g. Plumbing, Electrical…"
                  className="h-11 text-base mt-2"
                />
              )}
            </div>

            {/* Equipment */}
            <div className="rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setEquipmentExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Equipment</p>
                  {!equipmentExpanded && (
                    <p className="text-sm font-semibold text-slate-700 mt-0.5 truncate">
                      {draft.job.equipment?.trim() || "—"}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-orange-500 shrink-0 ml-3">
                  {equipmentExpanded ? "Done" : "Edit"}
                </span>
              </button>
              {equipmentExpanded && (
                <div className="px-3 pb-3 pt-2">
                  <Input
                    id="ed-equipment"
                    aria-label="Equipment / system description"
                    value={draft.job.equipment ?? ""}
                    onChange={(e) => updateJobField("equipment", e.target.value)}
                    placeholder="e.g. Daikin FTXM50W 6kW, installed 2018"
                    className="h-11 text-base"
                  />
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* ── Job Notes ──────────────────────────────────────────────────── */}
        {draft.job.voiceNotes.jobNotes && (
          <Card className="border border-slate-100 shadow-card">
            <button
              type="button"
              onClick={() => setNotesExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left active:bg-slate-50 transition-colors"
            >
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">Original Job Notes</CardTitle>
              <span className="text-xs font-semibold text-orange-500 shrink-0 ml-3">
                {notesExpanded ? "Hide" : "Show"}
              </span>
            </button>
            {notesExpanded && (
              <CardContent className="px-4 pb-4 pt-0">
                <Textarea
                  id="notes-job"
                  value={draft.job.voiceNotes.jobNotes}
                  onChange={(e) => updateVoiceNote("jobNotes", e.target.value)}
                  rows={4}
                  className="text-sm leading-relaxed resize-none w-full border-slate-200 focus:border-orange-300"
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* ── Photos ─────────────────────────────────────────────────────── */}
        <Card className="border border-slate-100 shadow-card">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Job Photos
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5 normal-case tracking-normal font-normal">
              Before / after shots — included in the report and PDF
            </p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <PhotoSection photos={photos} onChange={handlePhotosChange} />
          </CardContent>
        </Card>

      </main>
    </div>

      {/* Move bullet bottom sheet */}
      {movingBullet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
          onClick={() => setMovingBullet(null)}
        >
          <div
            className="bg-white rounded-t-3xl px-4 pt-3 pb-above-nav w-full max-w-lg mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 text-center mb-1">Move to…</p>
            <p className="text-xs text-slate-500 text-center mb-5 px-4 truncate">&ldquo;{movingBullet.text}&rdquo;</p>
            <div className="space-y-2">
              {(
                [
                  { key: "findings", label: "Observations" },
                  { key: "workPerformed", label: "Work Performed" },
                  { key: "recommendations", label: "Recommendations" },
                ] as { key: keyof GeneratedReport; label: string }[]
              )
                .filter((s) => s.key !== movingBullet.from)
                .map((section) => (
                  <button
                    key={section.key}
                    onClick={() => handleMoveToSection(section.key)}
                    className="w-full h-14 rounded-2xl bg-slate-50 border border-slate-100 text-base font-semibold text-slate-700 active:bg-orange-50 active:border-orange-200 active:text-orange-600 transition-colors"
                  >
                    {section.label}
                  </button>
                ))}
            </div>
            <button
              onClick={() => setMovingBullet(null)}
              className="w-full h-12 mt-3 text-sm font-semibold text-slate-500 active:text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sticky footer */}
      <div className="fixed left-0 lg:left-60 right-0 z-20 bg-white border-t border-slate-100 above-nav">
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer">
          {readOnly ? (
            <button
              onClick={handlePreview}
              className="w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-md shadow-orange-200/50 transition-colors"
            >
              Preview Report
              <Eye className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handlePreview}
              className="w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-md shadow-orange-200/50 transition-colors"
            >
              Save & Preview
              <Eye className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
