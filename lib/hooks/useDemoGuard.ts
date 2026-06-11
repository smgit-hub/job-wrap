"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

const DEMO_EMAIL = "demo@jobwrap.app";
const DEMO_GEN_LIMIT = 2;
const DEMO_GEN_KEY = "demo_gen_count";

export function getDemoGenCount(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(DEMO_GEN_KEY) ?? "0", 10);
}

export function incrementDemoGenCount(): number {
  const next = getDemoGenCount() + 1;
  localStorage.setItem(DEMO_GEN_KEY, String(next));
  return next;
}

export function demoAtLimit(): boolean {
  return getDemoGenCount() >= DEMO_GEN_LIMIT;
}

/**
 * Returns helpers for managing demo user access.
 *
 * Demo users can generate up to DEMO_GEN_LIMIT AI reports.
 * After that, the signup wall is shown automatically.
 *
 * Usage:
 *   const { isDemo, wallVisible, hideWall, guardAction, checkDemoGenLimit } = useDemoGuard();
 *
 *   // Before generating:
 *   if (!checkDemoGenLimit()) return; // wall shown automatically
 *
 *   // After successful generation:
 *   incrementDemoGenCount();
 *
 *   // In JSX:
 *   {wallVisible && <DemoSignupWall ... onClose={hideWall} />}
 */
export function useDemoGuard() {
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;
  const [wallVisible, setWallVisible] = useState(false);
  const [wallReason, setWallReason] = useState<"limit" | "action">("action");

  /** Wraps an action — blocks demo users entirely (for non-generate actions like download/share). */
  function guardAction(action: () => void) {
    if (isDemo) {
      setWallReason("action");
      setWallVisible(true);
      return;
    }
    action();
  }

  /**
   * Call before an AI generation. Returns true if allowed, false if at limit.
   * Shows the signup wall automatically if at limit.
   */
  function checkDemoGenLimit(): boolean {
    if (!isDemo) return true;
    if (demoAtLimit()) {
      setWallReason("limit");
      setWallVisible(true);
      return false;
    }
    return true;
  }

  return {
    isDemo,
    wallVisible,
    wallReason,
    showWall: () => setWallVisible(true),
    hideWall: () => setWallVisible(false),
    guardAction,
    checkDemoGenLimit,
  };
}
