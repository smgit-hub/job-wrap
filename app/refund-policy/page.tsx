import LandingFooter from "@/components/landing/LandingFooter";
import Link from "next/link";

export const metadata = {
  title: "Refund Policy — JobWrap",
  description: "JobWrap refund and cancellation policy.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Refund Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: June 2026</p>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <Section title="Cancellation">
            <p>You can cancel your JobWrap subscription at any time — no lock-in, no questions asked.</p>
            <p>When you cancel, your subscription remains active until the end of the current billing period. You won&apos;t be charged again after that, and you&apos;ll retain full access until the period ends.</p>
          </Section>

          <Section title="Refunds">
            <p>If you&apos;ve been charged and haven&apos;t used JobWrap during that billing period, <a href="/contact" className="text-orange-500 hover:underline font-medium">contact us</a> within 7 days of the charge and we&apos;ll issue a full refund.</p>
            <p>Outside of that window, refunds are not provided for partially used subscription periods. If you cancel mid-month, you keep access until the end of the period but are not refunded the remaining days.</p>
          </Section>

          <Section title="Free trial">
            <p>If JobWrap offers a free trial period, you will not be charged until the trial ends. You can cancel before the trial ends and you won&apos;t be charged at all.</p>
          </Section>

          <Section title="Exceptional circumstances">
            <p>We&apos;re a small team and we treat every customer fairly. If something went wrong — a billing error, a technical issue that prevented you from using the service, or any other exceptional circumstance — <a href="/contact" className="text-orange-500 hover:underline font-medium">get in touch</a> and we&apos;ll work something out.</p>
          </Section>

          <Section title="How to request a refund">
            <p>Email us via the <a href="/contact" className="text-orange-500 hover:underline font-medium">contact page</a> with your account email and a brief description of the issue. We&apos;ll respond within 2 business days.</p>
          </Section>

          <div className="border-t border-slate-100 pt-8 space-y-3 text-sm text-slate-500">
            <p>JobWrap is operated by Level Design Australia Pty Ltd.</p>
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="space-y-3 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-slate-800 [&_strong]:font-semibold [&_p]:text-slate-600">
        {children}
      </div>
    </div>
  );
}
