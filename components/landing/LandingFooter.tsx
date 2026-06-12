import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 py-10 px-5 text-center">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center justify-center gap-2.5 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-7 h-7 object-cover" />
          <span className="font-bold text-slate-900 text-base">JobWrap</span>
        </Link>
        <p className="text-sm text-slate-500 mb-4">
          © {new Date().getFullYear()} JobWrap. All rights reserved.
        </p>
        <nav className="flex flex-col items-center gap-3 text-sm text-slate-500">
          <div className="flex items-center justify-center gap-6">
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/demo" className="hover:text-slate-900 transition-colors">Try demo</Link>
            <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
          </div>
          <div className="flex items-center justify-center gap-6">
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refunds</Link>
          </div>
        </nav>
      </div>
    </footer>
  );
}
