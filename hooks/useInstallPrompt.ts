"use client";

import { useEffect, useState } from "react";

export type Platform = "ios" | "android" | "other";

interface InstallPrompt {
  /** True if running as an installed PWA already */
  isInstalled: boolean;
  /** Detected platform */
  platform: Platform;
  /** True on mobile (iOS or Android) */
  isMobile: boolean;
  /** True if on iOS Safari (the only browser that supports PWA install on iOS) */
  isIOSSafari: boolean;
  /** Call this to trigger the native Android install prompt (no-op on iOS) */
  promptInstall: () => Promise<void>;
  /** True if the native Android prompt is available */
  canPromptInstall: boolean;
}

// BeforeInstallPromptEvent is not in standard TS lib yet
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt(): InstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iphone|ipad|ipod/i.test(ua);
    const isAndroid = /android/i.test(ua);
    // iOS Safari: has WebKit but NOT Chrome/CriOS/Firefox
    const iosSafari = isIOS && /safari/i.test(ua) && !/crios|fxios|chrome/i.test(ua);
    setIsIOSSafari(iosSafari);
    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "other");

    // Installed if running in standalone mode (PWA) or iOS standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true);
    setIsInstalled(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  const isMobile = platform === "ios" || platform === "android";

  return { isInstalled, platform, isMobile, isIOSSafari, promptInstall, canPromptInstall: !!deferredPrompt };
}
