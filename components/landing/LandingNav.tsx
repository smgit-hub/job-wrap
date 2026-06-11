"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 60);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        transparent
          ? "bg-transparent border-transparent"
          : "bg-white/95 backdrop-blur-sm border-b border-slate-100 shadow-sm"
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-9 h-9 object-cover" />
          <span className={`font-bold text-lg tracking-tight transition-colors duration-300 ${transparent ? "text-white" : "text-slate-900"}`}>
            JobWrap
          </span>
        </Link>

        {/* Nav links — visible on all screen sizes */}
        <nav className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/login"
            className={`text-sm font-medium transition-colors duration-300 ${transparent ? "text-white/80 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Start free trial
          </Link>
        </nav>
      </div>
    </header>
  );
}
