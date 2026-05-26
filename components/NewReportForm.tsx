"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, Loader2, AlertCircle, BookmarkCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FreeformRecordingFlow from "@/components/recording/FreeformRecordingFlow";
import type { JobDetails, VoiceNotes, ServiceType, Customer, ServiceReport } from "@/types/report";
import { EMPTY_VOICE_NOTES } from "@/types/report";
import { saveDraft, getDraft, saveReport, clearDraft, generateId, getBusinessProfile } from "@/lib/storage";
import { cn } from "@/lib/utils";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import { extractJobInfo } from "@/lib/extractJobInfo";

interface NewReportFormProps {
  initialCustomer?: Customer | null;
  onBack: () => void;
  onGenerate: (job: JobDetails) => Promise<void>;
  onSaveForLater: () => void;
}

const SERVICE_CHIP_LABELS: Record<ServiceType, string> = {
  "hvac-maintenance": "Maintenance",
  "hvac-emergency": "Emergency",
  "hvac-repair": "Repair",
  "hvac-install": "Installation",
  "hvac-seasonal": "Seasonal",
  "hvac-inspection": "Inspection",
  "hvac-warranty": "Warranty",
  other: "Other",
};

const SERVICE_TYPES = Object.keys(SERVICE_CHIP_LABELS) as ServiceType[];

const EMPTY_JOB: JobDetails = {
  customerName: "",
  serviceAddress: "",
  serviceType: "hvac-maintenance",
  jobDate: new Date().toISOString().split("T")[0],
  voiceNotes: EMPTY_VOICE_NOTES,
};

type FormStep = "recording" | "job-details";

export default function NewReportForm({ initialCustomer, onBack, onGenerate, onSaveForLater }: NewReportFormProps) {
  const [formStep, setFormStep] = useState<FormStep>("recording");
  const [job, setJob] = useState<JobDetails>(() => ({
    ...EMPTY_JOB,
    customerName: initialCustomer?.name ?? "",
    serviceAddress: initialCustomer?.address ?? "",
    voiceNotes: {
      ...EMPTY_VOICE_NOTES,
      equipmentDetails: initialCustomer?.equipmentDetails ?? "",
    },
  }));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Restore draft on mount — skip if a customer was pre-selected
  useEffect(() => {
    if (initialCustomer) return;
    const draft = getDraft();
    if (!draft?.job) return;
    const raw = draft.job as JobDetails & { roughNotes?: string; equipmentType?: string };
    if (raw.roughNotes !== undefined && !raw.voiceNotes) {
      raw.voiceNotes = { ...EMPTY_VOICE_NOTES, workCompleted: raw.roughNotes };
    }
    if (raw.equipmentType && raw.voiceNotes && !raw.voiceNotes.equipmentDetails) {
      raw.voiceNotes = { ...EMPTY_VOICE_NOTES, ...raw.voiceNotes, equipmentDetails: raw.equipmentType };
    }
    if (raw.voiceNotes) {
      raw.voiceNotes = { ...EMPTY_VOICE_NOTES, ...raw.voiceNotes };
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJob(raw as JobDetails);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveDraft({ job });
  }, [job]);

  function handleRecordingComplete(finalNotes: VoiceNotes) {
    const extracted = extractJobInfo(finalNotes.workCompleted);
    setJob((prev) => ({
      ...prev,
      customerName: extracted.customerName || prev.customerName,
      serviceAddress: extracted.serviceAddress || prev.serviceAddress,
      serviceType: extracted.serviceType || prev.serviceType,
      voiceNotes: {
        ...finalNotes,
        equipmentDetails: extracted.equipmentDetails || finalNotes.equipmentDetails || prev.voiceNotes.equipmentDetails,
      },
    }));
    setFormStep("job-details");
    window.scrollTo({ top: 0 });
  }

  // TODO(performance): if generation takes >15 s, show a "Still working…" message
  // to reassure the user. The AI providers all have 30 s timeouts server-side
  // (see lib/ai/providers/*) but no progress feedback is shown client-side.
  // Consider: add a useEffect that sets a "taking longer than expected" flag after
  // 12 s of isGenerating === true and renders a secondary status line.
  function handleSaveForLater() {
    const draft: ServiceReport = {
      id: generateId(),
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      business: getBusinessProfile(),
      job,
      report: { customerSummary: "", workCompleted: "", diagnostics: "", recommendations: "" },
    };
    saveReport(draft);
    clearDraft();
    onSaveForLater();
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      await onGenerate(job);
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Generation failed. Please try again."
      );
      setIsGenerating(false);
    }
  }

  if (formStep === "recording") {
    return (
      <FreeformRecordingFlow
        job={job}
        onBack={onBack}
        onComplete={handleRecordingComplete}
      />
    );
  }

  // ── Step 2: Job Details ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => { setFormStep("recording"); window.scrollTo({ top: 0 }); }}
            disabled={isGenerating}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors disabled:opacity-40"
            aria-label="Back to recording"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 text-center font-bold text-slate-900">Confirm Details</span>
          <div className="w-9 h-9 shrink-0" />
        </div>

        <StepIndicator steps={REPORT_STEPS} currentStep={2} />
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-32 space-y-5">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Confirm Details</h2>
          <p className="text-sm text-slate-500 mt-0.5">We&apos;ve filled in what we caught — correct anything that&apos;s wrong.</p>
        </div>

        {/* Customer Name */}
        <div className="space-y-1.5">
          <Label htmlFor="customerName" className="text-slate-700 font-semibold text-sm">Customer Name</Label>
          <Input
            id="customerName"
            placeholder="e.g. Sandra Kowalski"
            value={job.customerName}
            onChange={(e) => setJob((prev) => ({ ...prev, customerName: e.target.value }))}
            autoFocus
            autoComplete="off"
            inputMode="text"
            enterKeyHint="next"
            className="h-12 text-base bg-white border-slate-200"
          />
        </div>

        {/* Service Address */}
        <div className="space-y-1.5">
          <Label htmlFor="serviceAddress" className="text-slate-700 font-semibold text-sm">Service Address</Label>
          <Input
            id="serviceAddress"
            placeholder="e.g. 142 Birchwood Drive, Riverside"
            value={job.serviceAddress}
            onChange={(e) => setJob((prev) => ({ ...prev, serviceAddress: e.target.value }))}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="next"
            className="h-12 text-base bg-white border-slate-200"
          />
        </div>

        {/* Equipment Details */}
        <div className="space-y-1.5">
          <Label htmlFor="equipmentDetails" className="text-slate-700 font-semibold text-sm">
            Equipment <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="equipmentDetails"
            placeholder="e.g. Daikin 3-ton split system, model MXZ-AP50VGD"
            value={job.voiceNotes.equipmentDetails}
            onChange={(e) => setJob((prev) => ({
              ...prev,
              voiceNotes: { ...prev.voiceNotes, equipmentDetails: e.target.value },
            }))}
            autoComplete="off"
            inputMode="text"
            enterKeyHint="next"
            className="h-12 text-base bg-white border-slate-200"
          />
        </div>

        {/* Service Type */}
        <div className="space-y-1.5">
          <Label htmlFor="serviceType" className="text-slate-700 font-semibold text-sm">Service Type</Label>
          <select
            id="serviceType"
            value={job.serviceType}
            onChange={(e) => setJob((prev) => ({
              ...prev,
              serviceType: e.target.value as ServiceType,
              customServiceType: e.target.value !== "other" ? undefined : prev.customServiceType,
            }))}
            className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{SERVICE_CHIP_LABELS[type]}</option>
            ))}
          </select>
          {job.serviceType === "other" && (
            <Input
              placeholder="e.g. Boiler service, HRV maintenance, Gas fireplace"
              value={job.customServiceType ?? ""}
              onChange={(e) => setJob((prev) => ({ ...prev, customServiceType: e.target.value }))}
              autoComplete="off"
              inputMode="text"
              enterKeyHint="next"
              className="h-12 text-base bg-white border-slate-200 mt-1"
            />
          )}
        </div>

        {/* Date */}
        <div className="space-y-1.5">
          <Label htmlFor="jobDate" className="text-slate-700 font-semibold text-sm">Date</Label>
          <Input
            id="jobDate"
            type="date"
            value={job.jobDate}
            onChange={(e) => setJob((prev) => ({ ...prev, jobDate: e.target.value }))}
            className="h-12 text-base bg-white border-slate-200"
          />
        </div>

        {/* Generation error */}
        {generateError && (
          <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Couldn&apos;t generate report</p>
                <p className="text-xs text-red-600 mt-0.5">{generateError}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 h-10 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={handleSaveForLater}
                className="flex-1 h-10 rounded-xl bg-white border border-red-200 text-sm font-semibold text-red-700 active:bg-red-50 transition-colors"
              >
                Save for later
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Generate button */}
      {/* TODO(mobile): when a text input is focused on iOS the virtual keyboard pushes this
          bar up, which is correct, but the bar may obscure the focused input on short screens.
          Consider using the VirtualKeyboard API (Chrome) or a scroll-into-view workaround. */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
          <p className="text-center text-[11px] text-slate-400 mb-2">
            Job notes are sent to an AI service to generate the report.{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-500">Learn more</a>
          </p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
              isGenerating
                ? "bg-slate-300"
                : "bg-orange-500 hover:bg-orange-600 active:bg-orange-700 shadow-md shadow-orange-200"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Report…
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Report
              </>
            )}
          </button>
          <button
            onClick={handleSaveForLater}
            disabled={isGenerating}
            className="w-full h-10 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
          >
            <BookmarkCheck className="w-4 h-4" />
            Save for later
          </button>
        </div>
      </div>
    </div>
  );
}
