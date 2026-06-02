"use client";

import { useState, useEffect } from "react";
import { X, Share, MoreVertical } from "lucide-react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";

const STORAGE_KEY = "jobwrap_install_nudge_dismissed";

export default function InstallNudge() {
  const { isInstalled, platform, isMobile, promptInstall, canPromptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  // Don't show if: already installed, not mobile, dismissed, or desktop
  if (isInstalled || !isMobile || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:hidden">
      <div className="bg-slate-900 rounded-2xl px-4 py-4 shadow-xl flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png?v=3"
          alt=""
          className="w-11 h-11 rounded-xl shrink-0 object-cover"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">Add JobWrap to your home screen</p>
          {platform === "ios" ? (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Tap <Share className="inline w-3.5 h-3.5 mb-0.5" /> then{" "}
              <span className="text-white font-semibold">Add to Home Screen</span>
            </p>
          ) : canPromptInstall ? (
            <button
              onClick={async () => { await promptInstall(); dismiss(); }}
              className="mt-1.5 text-xs font-bold text-orange-400 active:text-orange-300"
            >
              Install now →
            </button>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Tap <MoreVertical className="inline w-3.5 h-3.5 mb-0.5" /> then{" "}
              <span className="text-white font-semibold">Add to Home Screen</span>
            </p>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 self-start"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
