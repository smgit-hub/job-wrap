"use client";

// ---------------------------------------------------------------------------
// FreeformRecordingFlow
// One continuous recording — speak naturally, AI structures the report.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ArrowRight, Mic, Square, Loader2, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import type { JobDetails, VoiceNotes } from "@/types/report";
import { EMPTY_VOICE_NOTES } from "@/types/report";
import { saveDraft } from "@/lib/storage";
import { cn } from "@/lib/utils";
import StepIndicator, { REPORT_STEPS } from "@/components/StepIndicator";

// ── Hint dots ────────────────────────────────────────────────────────────────
// Green when the transcript appears to cover that topic.
// Informational only — never block progress.

const HINTS = [
  {
    key: "jobinfo",
    label: "Job info & equipment",
    match: (t: string) =>
      /\b(carrier|lennox|trane|daikin|goodman|bryant|rheem|york|mitsubishi|fujitsu|bosch|amana|ruud|heil)\b|\b\d+(?:\.\d+)?\s*ton\b|\bheat pump\b|\bfurnace\b|\bsplit system\b|\bmini[\s-]?split\b|\bair handler\b|\bboiler\b/i.test(t) ||
      /\bat\s+\d+|\bfor\s+[a-z]+\s+[a-z]+|\bcustomer\b|\bhomeowner\b/i.test(t),
  },
  {
    key: "work",
    label: "Work performed",
    match: (t: string) => t.trim().length > 20,
  },
  {
    key: "diagnostics",
    label: "Diagnostics & findings",
    match: (t: string) =>
      /\d+\s*°|\bpsi\b|\bamps?\b|\bvolts?\b|\bµf\b|\bpressure\b|\breading\b|\brefrig|\bdiagnos|\bfinding|\btest|\binspect|\bcondition|\bfault|\berror|\bleaking|\bfailed|\bnormal|\bwithin spec/i.test(t),
  },
  {
    key: "recommendations",
    label: "Recommendations",
    match: (t: string) =>
      /\brecommend|\bsuggest|\bshould\b|\bbook\b|\bschedul|\breplac|\bnext service|\bfollow.?up|\bmonitor/i.test(t),
  },
] as const;

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
  const [text, setText] = useState(job.voiceNotes.workCompleted);
  const [confirmBack, setConfirmBack] = useState(false);
  const speech = useSpeechRecognition();

  const textBeforeRecordingRef = useRef("");
  const pendingCompleteRef = useRef(false);

  // Persist draft on every text change
  useEffect(() => {
    saveDraft({
      job: { ...job, voiceNotes: { ...EMPTY_VOICE_NOTES, workCompleted: text } },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // Commit transcript + handle deferred navigation when recording stops
  useEffect(() => {
    if (speech.isListening) return;

    let committed = text;
    if (speech.transcript) {
      const base = textBeforeRecordingRef.current.trim();
      const added = speech.transcript.trim();
      committed = base ? `${base}\n${added}` : added;
      setText(committed);
      speech.resetTranscript();
    }
    textBeforeRecordingRef.current = "";

    if (pendingCompleteRef.current) {
      pendingCompleteRef.current = false;
      onComplete({ ...EMPTY_VOICE_NOTES, workCompleted: committed });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.isListening]);

  function handleMicPress() {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      textBeforeRecordingRef.current = text;
      speech.startListening();
    }
  }

  function handleContinue() {
    if (speech.isListening || speech.state === "stopping") {
      pendingCompleteRef.current = true;
      speech.stopListening();
      return;
    }
    onComplete({ ...EMPTY_VOICE_NOTES, workCompleted: text });
  }

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const hasEnoughText = text.trim().length >= 5;
  const isStopping = speech.state === "stopping";

  // While recording, show committed text + live transcript directly in the textarea.
  // Reading textBeforeRecordingRef.current during render is intentional — the ref
  // captures the pre-recording snapshot and doesn't need to trigger re-renders.
  /* eslint-disable react-hooks/refs */
  const displayValue = speech.isListening
    ? (() => {
        const base = textBeforeRecordingRef.current.trim();
        const live = (speech.transcript + speech.interimTranscript).trim();
        return base && live ? `${base}\n${live}` : base || live;
      })()
    : text;
  /* eslint-enable react-hooks/refs */

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col animate-screen-enter">

      {/* ── Header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-10 shrink-0">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          <button
            onClick={() => {
              if (speech.isListening) speech.stopListening();
              if (text.trim()) {
                setConfirmBack(true);
              } else {
                onBack();
              }
            }}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 active:bg-slate-200 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="flex-1 text-center font-bold text-slate-900">Job Notes</span>
          {/* Spacer to keep title centred */}
          <div className="w-9 h-9 shrink-0" />
        </div>

        <StepIndicator steps={REPORT_STEPS} currentStep={1} />
      </header>

      {/* ── Main ── */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-28 flex flex-col gap-6">

        {/* ── Intro ── */}
        <p className="text-center text-sm text-slate-500">
          Speak naturally about the job — JobWrap will structure your report.
        </p>

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

        {/* Hint dots */}
        <div className="bg-white rounded-2xl px-4 py-4 shadow-card space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cover these topics</p>
          {HINTS.map((hint) => {
            const covered = hint.match(displayValue);
            return (
              <div key={hint.key} className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300",
                    covered ? "bg-green-100" : "bg-slate-100"
                  )}
                >
                  <div
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors duration-300",
                      covered ? "bg-green-500" : "bg-slate-300"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm transition-colors duration-300",
                    covered ? "text-slate-800 font-medium" : "text-slate-400"
                  )}
                >
                  {hint.label}
                </span>
              </div>
            );
          })}
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
            {wordCount > 0 && !speech.isListening && (
              <button
                type="button"
                onClick={() => {
                  speech.resetTranscript();
                  textBeforeRecordingRef.current = "";
                  setText("");
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
            onChange={(e) => !speech.isListening && setText(e.target.value)}
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
        <div className="max-w-lg mx-auto px-4 pt-3 sticky-footer">
          <button
            onClick={handleContinue}
            disabled={!hasEnoughText || isStopping}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-bold text-white flex items-center justify-center gap-2 transition-all",
              hasEnoughText && !isStopping
                ? "bg-slate-900 active:bg-slate-800 shadow-md shadow-slate-200"
                : "bg-slate-300"
            )}
          >
            Next
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
