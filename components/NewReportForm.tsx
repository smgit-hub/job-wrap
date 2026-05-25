"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FreeformRecordingFlow from "@/components/recording/FreeformRecordingFlow";
import type { JobDetails, VoiceNotes, ServiceType, Customer } from "@/types/report";
import { EMPTY_VOICE_NOTES } from "@/types/report";
import { saveDraft, getDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";
import { extractJobInfo } from "@/lib/extractJobInfo";

interface NewReportFormProps {
  initialCustomer?: Customer | null;
  onBack: () => void;
  onGenerate: (job: JobDetails) => Promise<void>;
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

export default function NewReportForm({ initialCustomer, onBack, onGenerate }: NewReportFormProps) {
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
    setJob(raw as JobDetails);
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

  // ── Step 1: Recording ────────────────────────────────────────────────────────
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
          <p className="text-sm text-slate-500 mt-0.5">We've filled in what we caught — correct anything that's wrong.</p>
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

        {/* Service Type chips */}
        <div className="space-y-2">
          <Label className="text-slate-700 font-semibold text-sm">Service Type</Label>
          <div className="grid grid-cols-2 gap-2">
            {SERVICE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setJob((prev) => ({
                    ...prev,
                    serviceType: type,
                    customServiceType: type !== "other" ? undefined : prev.customServiceType,
                  }))
                }
                className={cn(
                  "h-11 rounded-xl text-sm font-semibold transition-all border",
                  job.serviceType === type
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 text-slate-600 active:bg-slate-50"
                )}
              >
                {SERVICE_CHIP_LABELS[type]}
              </button>
            ))}
          </div>
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
          <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Couldn&apos;t generate report</p>
              <p className="text-xs text-red-600 mt-0.5">{generateError}</p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky Generate button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
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
        </div>
      </div>
    </div>
  );
}
