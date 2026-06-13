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
            <p>You are entitled to a full refund within 14 days of being charged. To request a refund, <a href="/contact" className="text-orange-500 hover:underline font-medium">contact us</a> with your account email and we will process it promptly.</p>
            <p>Payments are processed by Paddle, who acts as the merchant of record. Refunds are handled in accordance with <a href="https://www.paddle.com/legal/refund-policy" className="text-orange-500 hover:underline font-medium" target="_blank" rel="noopener noreferrer">Paddle&apos;s refund policy</a>.</p>
          </Section>

          <Section title="Free trial">
            <p>Your 14-day free trial starts when you create your account. You will not be charged until the trial ends. Cancel any time during the trial and you won&apos;t be charged at all.</p>
          </Section>

          <Section title="Cancellation">
            <p>You can cancel your subscription at any time. Your access continues until the end of the current billing period and you will not be charged again.</p>
          </Section>

          <Section title="How to request a refund">
            <p>Contact us via the <a href="/contact" className="text-orange-500 hover:underline font-medium">contact page</a> with your account email. We&apos;ll respond within 2 business days.</p>
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
