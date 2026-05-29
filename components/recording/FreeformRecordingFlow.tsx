"use client";

// ---------------------------------------------------------------------------
// FreeformRecordingFlow — single recording screen.
//
// The technician records everything in one take:
//   • What they found / diagnosed
//   • Every task they completed
//   • Any recommendations for the customer
//
// The AI extracts all three areas from the single narrative.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from "react";
import {
  ChevronLeft,
  Sparkles,
  Mic,
  Square,
  Loader2,
  MicOff,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { JobDetails, VoiceNotes } from "@/types/report";
import { EMPTY_VOICE_NOTES } from "@/types/report";
import { saveDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";

const CUES = [
  "What you found — faults, observations, readings",
  "Every task you completed",
  "Any recommendations or follow-up for the customer",
];

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
  const [notes, setNotes] = useState(job.voiceNotes.jobNotes);
  const [confirmBack, setConfirmBack] = useState(false);
  const speech = useSpeechRecognition();

  const textBeforeRecordingRef = useRef("");

  // Persist draft on text change
  useEffect(() => {
    saveDraft({
      job: {
        ...job,
        voiceNotes: { ...EMPTY_VOICE_NOTES, jobNotes: notes },
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Commit transcript when recording stops
  useEffect(() => {
    if (speech.isListening) return;

    if (speech.transcript) {
      const base = textBeforeRecordingRef.current.trim();
      const added = speech.transcript.trim();
      const committed = base ? `${base}\n${added}` : added;
      setNotes(committed);
      speech.resetTranscript();
    }
    textBeforeRecordingRef.current = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening]);

  function handleMicPress() {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      textBeforeRecordingRef.current = notes;
      speech.startListening();
    }
  }

  function handleDone() {
    if (speech.isListening || speech.state === "stopping") {
      // Stop recording first, then complete via the isListening effect
      // We can't defer here easily — just stop and let them tap Done again
      speech.stopListening();
      return;
    }
    onComplete({ jobNotes: notes.trim(), recommendations: "" });
  }

  function handleBack() {
    if (speech.isListening) speech.stopListening();
    if (notes.trim()) {
      setConfirmBack(true);
    } else {
      onBack();
    }
  }

  const isStopping = speech.state === "stopping";
  const hasEnoughText = notes.trim().length >= 20;

  // During recording, notes is frozen (textarea is readOnly), so it equals the
  // pre-recording baseline. Combine it with the live transcript for display.
  const liveTranscript = (speech.transcript + speech.interimTranscript).trim();
  const displayValue = speech.isListening && liveTranscript
    ? (notes.trim() ? `${notes.trim()}\n${liveTranscript}` : liveTranscript)
    : notes;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">
      {/* ── Header ── */}
      {/* ── Main ── */}
      <main className="flex-1 max-w-lg lg:max-w-4xl mx-auto w-full px-4 pt-10 lg:pt-8 pb-28 flex flex-col gap-4">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex-1">Job Notes</h1>
        </div>
        <StepIndicator steps={REPORT_STEPS} currentStep={2} />
        {/* ── Prompt ── */}
        <div className="text-center">
          <p className="text-xl font-bold text-slate-900">
            What happened today?
          </p>
        </div>

        {/* ── Cue card ── */}
        <div className="bg-white rounded-2xl px-4 py-3.5 shadow-card space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Speak naturally — cover
          </p>
          <ul className="space-y-2">
            {CUES.map((cue) => (
              <li key={cue} className="flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                <span className="text-sm text-slate-600">{cue}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Circular mic button ── */}
        <div className="flex flex-col items-center gap-3">
          {speech.isSupported && speech.state !== "unsupported" ? (
            <>
              <button
                onClick={handleMicPress}
                disabled={isStopping}
                aria-label={
                  speech.isListening ? "Stop recording" : "Start recording"
                }
                className={cn(
                  "w-36 h-36 rounded-full flex items-center justify-center shadow-lg transition-all select-none",
                  speech.isListening
                    ? "bg-red-500 animate-pulse-subtle shadow-red-200"
                    : "bg-slate-900 active:scale-95 shadow-slate-300",
                  isStopping && "opacity-60 pointer-events-none",
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
                {isStopping
                  ? "Finishing…"
                  : speech.isListening
                    ? "Tap to stop"
                    : "Tap mic to start"}
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
            {notes.trim() && !speech.isListening && (
              <button
                type="button"
                onClick={() => {
                  speech.resetTranscript();
                  textBeforeRecordingRef.current = "";
                  setNotes("");
                }}
                className="text-orange-500 text-sm font-semibold active:text-orange-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <Textarea
            placeholder="Tap the mic to start, or type here…"
            value={displayValue}
            onChange={(e) => !speech.isListening && setNotes(e.target.value)}
            readOnly={speech.isListening}
            enterKeyHint="done"
            className={cn(
              "min-h-[140px] text-base leading-relaxed resize-none bg-white border-slate-200 rounded-xl",
              speech.isListening &&
                "border-red-300 bg-red-50/30 caret-transparent",
            )}
          />
        </div>
      </main>

      {/* ── Discard confirmation ── */}
      {confirmBack && (
        <div className="fixed inset-0 z-30 bg-black/40 flex items-end justify-center">
          <div className="w-full max-w-lg bg-white rounded-t-2xl px-5 pt-5 pb-8 space-y-4">
            <p className="text-base font-bold text-slate-900">
              Discard these notes?
            </p>
            <p className="text-sm text-slate-500">
              Your notes will be lost if you go back now.
            </p>
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
        <div className="max-w-lg lg:max-w-4xl mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handleDone}
            disabled={!hasEnoughText || isStopping}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
              hasEnoughText && !isStopping
                ? "bg-orange-500 active:bg-orange-600 shadow-md shadow-orange-200"
                : "bg-slate-300",
            )}
          >
            <Sparkles className="w-5 h-5" />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}
