"use client";

import { useAuth } from "@/components/auth/AuthProvider";

interface Props {
  action?: "record" | "download" | "send";
  reason?: "limit" | "action";
  onClose: () => void;
}

const ACTION_COPY: Record<NonNullable<Props["action"]>, { title: string; body: string }> = {
  record: {
    title: "Ready to record your first job?",
    body: "Create a free account to record voice notes and generate your own reports.",
  },
  download: {
    title: "Want to keep this report?",
    body: "Create a free account to download branded PDFs and send them to your customers.",
  },
  send: {
    title: "Want to send this to a customer?",
    body: "Create a free account to send professional service reports directly from the app.",
  },
};

const LIMIT_COPY = {
  title: "You've used your 2 free reports",
  body: "Create a free account to keep generating reports, download PDFs, and send them to your customers.",
};

export default function DemoSignupWall({ action = "record", reason = "action", onClose }: Props) {
  const { signOut } = useAuth();
  const { title, body } = reason === "limit" ? LIMIT_COPY : ACTION_COPY[action];

  function handleSignup() {
    signOut().then(() => { window.location.href = "/signup"; });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl px-5 pt-3 pb-10 w-full max-w-lg mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-6" />

        <div className="text-center space-y-2 mb-7">
          <p className="text-xl font-bold text-slate-900">{title}</p>
          <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSignup}
            className="w-full h-14 rounded-2xl bg-orange-500 active:bg-orange-600 transition-colors text-base font-bold text-white"
          >
            Create free account
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 text-sm font-semibold text-slate-400"
          >
            {reason === "limit" ? "Back to demo" : "Keep exploring the demo"}
          </button>
        </div>
      </div>
    </div>
  );
}
