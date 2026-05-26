"use client";

// ---------------------------------------------------------------------------
// FreeformRecordingFlow — two guided recordings
//
// Step 1: "What happened today?" — job notes (findings + work in one narrative)
// Step 2: "Anything they need next?" — recommendations (optional, skippable)
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ArrowRight, Mic, Square, Loader2, MicOff, SkipForward } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { JobDetails, VoiceNotes } from "@/types/report";
import { EMPTY_VOICE_NOTES } from "@/types/report";
import { saveDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";

type RecordingStep = "job-notes" | "recommendations";

const STEP_CONFIG = {
  "job-notes": {
    title: "Job Notes",
    prompt: "What happened today?",
    hint: "Describe what you found and what you did — speak naturally.",
    placeholder: "Tap the mic to start, or type here…",
    nextLabel: "Next",
    skippable: false,
  },
  "recommendations": {
    title: "Recommendations",
    prompt: "Anything they need next?",
    hint: "Any follow-up actions or advice for the customer — or skip if nothing.",
    placeholder: "Tap the mic to start, or type here…",
    nextLabel: "Done",
    skippable: true,
  },
} as const;

interface FreeformRecordingFlowProps {
  job: JobDetails;
  onBack: () => void;
  onComplete: (notes: VoiceNotes) => void;
}

export default function FreeformRecordingFlow({
  job,
  onBack,
  onComplete,
}: FreeformRecordingFlowProps) {
  const [recordingStep, setRecordingStep] = useState<RecordingStep>("job-notes");
  const [jobNotes, setJobNotes] = useState(job.voiceNotes.jobNotes);
  const [recommendations, setRecommendations] = useState(job.voiceNotes.recommendations);
  const [confirmBack, setConfirmBack] = useState(false);
  const speech = useSpeechRecognition();

  const textBeforeRecordingRef = useRef("");
  const pendingActionRef = useRef<"next" | "skip" | null>(null);

  const currentText = recordingStep === "job-notes" ? jobNotes : recommendations;
  const setCurrentText = recordingStep === "job-notes" ? setJobNotes : setRecommendations;
  const config = STEP_CONFIG[recordingStep];

  // Persist draft on text change
  useEffect(() => {
    saveDraft({
      job: {
        ...job,
        voiceNotes: { jobNotes, recommendations },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobNotes, recommendations]);

  // Commit transcript + handle deferred navigation when recording stops
  useEffect(() => {
    if (speech.isListening) return;

    let committed = currentText;
    if (speech.transcript) {
      const base = textBeforeRecordingRef.current.trim();
      const added = speech.transcript.trim();
      committed = base ? `${base}\n${added}` : added;
      setCurrentText(committed);
      speech.resetTranscript();
    }
    textBeforeRecordingRef.current = "";

    if (pendingActionRef.current === "next") {
      pendingActionRef.current = null;
      handleAdvance(committed);
    } else if (pendingActionRef.current === "skip") {
      pendingActionRef.current = null;
      handleSkip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening]);

  function handleMicPress() {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      textBeforeRecordingRef.current = currentText;
      speech.startListening();
    }
  }

  function handleAdvance(text: string) {
    const finalJobNotes = recordingStep === "job-notes" ? text : jobNotes;
    const finalRecs = recordingStep === "recommendations" ? text : recommendations;

    if (recordingStep === "job-notes") {
      setJobNotes(finalJobNotes);
      setRecordingStep("recommendations");
      window.scrollTo({ top: 0 });
    } else {
      onComplete({ jobNotes: finalJobNotes, recommendations: finalRecs });
    }
  }

  function handleSkip() {
    onComplete({ jobNotes, recommendations: "" });
  }

  function handleNext() {
    if (speech.isListening || speech.state === "stopping") {
      pendingActionRef.current = "next";
      speech.stopListening();
      return;
    }
    handleAdvance(currentText);
  }

  function handleSkipClick() {
    if (speech.isListening || speech.state === "stopping") {
      pendingActionRef.current = "skip";
      speech.stopListening();
      return;
    }
    handleSkip();
  }

  function handleBack() {
    if (speech.isListening) speech.stopListening();
    if (recordingStep === "recommendations") {
      setRecordingStep("job-notes");
      window.scrollTo({ top: 0 });
    } else if (jobNotes.trim()) {
      setConfirmBack(true);
    } else {
      onBack();
    }
  }

  const isStopping = speech.state === "stopping";
  const hasEnoughText = currentText.trim().length >= 5;

  const displayValue = speech.isListening
    ? (() => {
        const base = textBeforeRecordingRef.current.trim();
        const live = (speech.transcript + speech.interimTranscript).trim();
        return base && live ? `${base}\n${live}` : base || live;
      })()
    : currentText;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 font-bold text-slate-900 ml-3">{config.title}</span>
        </div>
        <StepIndicator steps={REPORT_STEPS} currentStep={1} />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-28 flex flex-col gap-6">

        {/* ── Prompt ── */}
        <div className="text-center space-y-1">
          <p className="text-xl font-bold text-slate-900">{config.prompt}</p>
          <p className="text-sm text-slate-500">{config.hint}</p>
        </div>

        {/* ── Circular mic button ── */}
        <div className="flex flex-col items-center gap-3">
          {speech.isSupported && speech.state !== "unsupported" ? (
            <>
              <button
                onClick={handleMicPress}
                disabled={isStopping}
                aria-label={speech.isListening ? "Stop recording" : "Start recording"}
                className={cn(
                  "w-36 h-36 rounded-full flex items-center justify-center shadow-lg transition-all select-none",
                  speech.isListening
                    ? "bg-red-500 animate-pulse-subtle shadow-red-200"
                    : "bg-slate-900 active:scale-95 shadow-slate-300",
                  isStopping && "opacity-60 pointer-events-none"
                )}
              >
                {isStopping ? (
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                ) : speech.isListening ? (
                  <Square className="w-11 h-11 fill-white stroke-none" />
                ) : (
                  <Mic className="w-12 h-12 text-white" />
                )}
              </button>
              <span className="text-sm font-medium text-slate-500">
                {isStopping ? "Finishing…" : speech.isListening ? "Tap to stop" : "Tap mic to start"}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <MicOff className="w-4 h-4" />
              <span>Voice requires Chrome or Safari — type below instead</span>
            </div>
          )}
        </div>

        {/* ── Notes textarea ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-sm flex items-center gap-2">
              Notes
              {speech.isListening && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative rounded-full h-2 w-2 bg-red-500" />
                </span>
              )}
            </span>
            {currentText.trim() && !speech.isListening && (
              <button
                type="button"
                onClick={() => {
                  speech.resetTranscript();
                  textBeforeRecordingRef.current = "";
                  setCurrentText("");
                }}
                className="text-orange-500 text-sm font-semibold active:text-orange-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <Textarea
            placeholder={config.placeholder}
            value={displayValue}
            onChange={(e) => !speech.isListening && setCurrentText(e.target.value)}
            readOnly={speech.isListening}
            enterKeyHint="done"
            className={cn(
              "min-h-[140px] text-base leading-relaxed resize-none bg-white border-slate-200 rounded-xl",
              speech.isListening && "border-red-300 bg-red-50/30 caret-transparent"
            )}
          />
        </div>
      </main>

      {/* ── Discard confirmation ── */}
      {confirmBack && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-2xl px-5 pt-5 pb-8 space-y-4">
            <p className="text-base font-bold text-slate-900">Discard these notes?</p>
            <p className="text-sm text-slate-500">Your notes will be lost if you go back now.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBack(false)}
                className="flex-1 h-12 rounded-xl bg-slate-100 text-sm font-semibold text-slate-700 active:bg-slate-200 transition-colors"
              >
                Keep notes
              </button>
              <button
                onClick={onBack}
                className="flex-1 h-12 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-100">
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer space-y-2">
          <button
            onClick={handleNext}
            disabled={!hasEnoughText || isStopping}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
              hasEnoughText && !isStopping
                ? "bg-slate-900 active:bg-slate-800 shadow-md shadow-slate-200"
                : "bg-slate-300"
            )}
          >
            {config.nextLabel}
            <ArrowRight className="w-5 h-5" />
          </button>

          {config.skippable && (
            <button
              onClick={handleSkipClick}
              disabled={isStopping}
              className="w-full h-10 flex items-center justify-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip — no recommendations
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
