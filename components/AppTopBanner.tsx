"use client";

import Link from "next/link";
import { Mic } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

const DEMO_EMAIL = "demo@jobwrap.app";

export default function AppTopBanner() {
  const { user } = useAuth();
  const isDemo = user?.email === DEMO_EMAIL;

  if (isDemo) {
    // Orange banner with signup CTA for demo users
    return (
      <div className="fixed top-0 left-0 right-0 h-10 z-40 bg-orange-500 px-4 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white truncate">
          <span className="sm:hidden">Enjoying the demo?</span>
          <span className="hidden sm:inline">You&apos;re exploring the demo — ready to join?</span>
        </p>
        <Link
          href="/signup"
          className="text-xs font-bold text-white bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1.5 transition-colors shrink-0"
        >
          Create free account →
        </Link>
      </div>
    );
  }

  // Slim neutral banner for real users — logo + website link
  return (
    <div className="fixed top-0 left-0 right-0 h-10 z-40 bg-white border-b border-slate-100 flex items-center px-4 justify-between">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center">
          <Mic className="w-3 h-3 text-white" />
        </div>
        <span className="text-sm font-bold text-slate-900 group-hover:text-orange-500 transition-colors">
          JobWrap
        </span>
      </Link>
      <Link
        href="/"
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
      >
        jobwrapp.app
      </Link>
    </div>
  );
}
