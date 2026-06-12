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

import { useEffect } from "react";
import { DemoAuthProvider } from "@/components/auth/DemoAuthProvider";
import AppTopBanner from "@/components/AppTopBanner";
import AppShell from "@/components/AppShell";
import { installDemoInterceptor } from "@/lib/demo/fetchInterceptor";
import { markDemoSessionActive } from "@/lib/db";

function DemoApp() {
  useEffect(() => {
    markDemoSessionActive();
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
