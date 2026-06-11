"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

const DEMO_EMAIL = "demo@jobwrap.app";

export default function AppTopBanner() {
  const { user } = useAuth();

  if (user?.email !== DEMO_EMAIL) return null;

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
