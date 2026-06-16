import Link from "next/link";

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-100 py-10 px-5 text-center">
      <div className="max-w-6xl mx-auto">
        <p className="font-bold text-slate-900 text-base mb-2">JobWrap</p>
        <p className="text-sm text-slate-500 mb-4">
          © {new Date().getFullYear()} JobWrap. All rights reserved.
        </p>
        <nav className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link>
          <Link href="/refund-policy" className="hover:text-slate-900 transition-colors">Refund Policy</Link>
          <Link href="/contact" className="hover:text-slate-900 transition-colors">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
