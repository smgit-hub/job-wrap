"use client";

/**
 * /demo — Standalone demo page.
 *
 * No Supabase session. No login. No backend calls.
 *
 * - DemoAuthProvider supplies a fake user so useAuth() works everywhere
 * - installDemoInterceptor() catches /api/* calls and returns mock responses
 * - markDemoSessionActive() flags localStorage so real login clears demo data
 * - AppTopBanner shows the demo upgrade banner (reads isDemo from context)
 * - AppShell renders the full app UI
 */

import { useEffect, useRef } from "react";
import { DemoAuthProvider } from "@/components/auth/DemoAuthProvider";
import AppTopBanner from "@/components/AppTopBanner";
import AppShell from "@/components/AppShell";
import { installDemoInterceptor } from "@/lib/demo/fetchInterceptor";
import { markDemoSessionActive, clearDemoSession } from "@/lib/db";

function DemoApp() {
  // Clear synchronously during render so AppShell's useEffect seeds fresh data
  // (child effects run before parent effects, so clearing in useEffect was wiping
  // data that AppShell had just seeded)
  const cleared = useRef(false);
  if (!cleared.current) {
    cleared.current = true;
    clearDemoSession();
    markDemoSessionActive();
  }

  useEffect(() => {
    const uninstall = installDemoInterceptor();
    return uninstall;
  }, []);

  return (
    <>
      <AppTopBanner />
      <AppShell />
    </>
  );
}

export default function DemoPage() {
  return (
    <DemoAuthProvider>
      <DemoApp />
    </DemoAuthProvider>
  );
}
