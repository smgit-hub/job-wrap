"use client";

// ---------------------------------------------------------------------------
// useSpeechRecognition
// Wraps the browser Web Speech API for job notes voice capture.
//
// STAGE 3+ REPLACEMENT POINT:
// If you want server-side transcription (Whisper, Deepgram, AssemblyAI),
// replace the SpeechRecognition usage below with a MediaRecorder that streams
// audio chunks to POST /api/transcribe. The hook's public API (isListening,
// transcript, interimTranscript, startListening, stopListening) should stay
// identical so consumers need no changes.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef, useCallback } from "react";

export type SpeechState = "idle" | "listening" | "stopping" | "error" | "unsupported";

export interface UseSpeechRecognitionReturn {
  /** False when the browser doesn't support SpeechRecognition at all */
  isSupported: boolean;
  isListening: boolean;
  state: SpeechState;
  /** Finalized words from the current recording session */
  transcript: string;
  /** Unstable in-progress words — not yet confirmed by the engine */
  interimTranscript: string;
  /** Human-readable error message, null when no error */
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  /** Clear transcript and error — call between sessions */
  resetTranscript: () => void;
}

function getSpeechRecognitionConstructor(): (new () => SpeechRecognition) | null {
  // Guard: never run on the server
  if (typeof window === "undefined") return null;
  return (
    (window as typeof window & { SpeechRecognition?: new () => SpeechRecognition })
      .SpeechRecognition ??
    (window as typeof window & { webkitSpeechRecognition?: new () => SpeechRecognition })
      .webkitSpeechRecognition ??
    null
  );
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [state, setState] = useState<SpeechState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // When true, onend will auto-restart — handles Chrome's silence timeout cutoff
  const shouldBeListeningRef = useRef(false);
  // Accumulates all finalized text during the current session
  const sessionTranscriptRef = useRef("");

  // Initialise the recognition instance once on the client
  useEffect(() => {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }

    setIsSupported(true);

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let newFinals = "";
      let currentInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        if (result.isFinal) {
          newFinals += text;
        } else {
          currentInterim += text;
        }
      }

      if (newFinals) {
        sessionTranscriptRef.current += newFinals;
        setTranscript(sessionTranscriptRef.current);
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") {
        // User-initiated stop — not a real error
        return;
      }
      if (event.error === "no-speech") {
        // Silence timeout — auto-restart handles this in onend
        return;
      }

      shouldBeListeningRef.current = false;

      const messages: Partial<Record<SpeechRecognitionErrorCode, string>> = {
        "not-allowed": "Microphone access was denied. Check your browser permissions.",
        "audio-capture": "No microphone found. Check that a microphone is connected.",
        network: "A network error occurred. Check your connection and try again.",
        "language-not-supported": "Language not supported.",
        "service-not-allowed": "Speech recognition is not allowed in this context.",
      };

      setError(messages[event.error] ?? `Speech recognition error: ${event.error}`);
      setState("error");
    };

    recognition.onend = () => {
      setInterimTranscript("");

      if (shouldBeListeningRef.current) {
        // Auto-restart after silence cutoff or brief service interruption.
        // Delay avoids "recognition already started" errors in Chrome.
        setTimeout(() => {
          if (shouldBeListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // start() throws if already running — safe to ignore
            }
          }
        }, 150);
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      shouldBeListeningRef.current = false;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.onstart = null;
      try {
        recognition.abort();
      } catch {
        // May throw if never started — safe to ignore
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Reset this session
    sessionTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);

    shouldBeListeningRef.current = true;
    setState("listening");

    try {
      recognitionRef.current.start();
    } catch {
      // Already running — no action needed
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false;
    setState("stopping");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Not running — safe to ignore
      }
    }

    // Flush any interim text: discard it (incomplete sentence mid-breath)
    setInterimTranscript("");
  }, []);

  const resetTranscript = useCallback(() => {
    sessionTranscriptRef.current = "";
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return {
    isSupported,
    isListening: state === "listening" || state === "stopping",
    state,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
