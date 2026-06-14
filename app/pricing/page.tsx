import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

export const metadata = {
  title: "Pricing — JobWrap",
  description: "One simple plan. Everything included. Start your 14-day free trial.",
};

const PLAN_FEATURES = [
  "Unlimited reports",
  "AI report generation",
  "Branded PDF export",
  "Business branding on every report",
  "Customer & equipment history",
  "Next service date reminders",
  "Works on any phone — no app store needed",
];

const FAQ = [
  {
    q: "Do I need a credit card to start?",
    a: "Yes — a card is required to start your trial. You won't be charged until the 14 days are up. Cancel any time before then and you won't pay a thing.",
  },
  {
    q: "What happens after the trial?",
    a: "Your card is charged automatically when the 14-day trial ends. You can cancel any time before then and won't be charged.",
  },
  {
    q: "Can I cancel any time?",
    a: "Yes — cancel from your account settings at any time. Your subscription stays active until the end of the current billing period, and you won't be charged again.",
  },
  {
    q: "Is there a refund if I change my mind?",
    a: "You are entitled to a full refund within 14 days of being charged. See our refund policy for full details.",
    link: { href: "/refund-policy", label: "refund policy" },
  },
  {
    q: "What currencies do you accept?",
    a: "Pricing is in USD. Your card will be charged in USD — your bank may apply a conversion fee depending on your location.",
  },
  {
    q: "Is there a per-report limit?",
    a: "No. Generate as many reports as you need — there are no caps or usage limits.",
  },
  {
    q: "Does it work on iPhone and Android?",
    a: "Yes. JobWrap is a web app that works on any modern phone browser. You can add it to your home screen for a native app feel — no app store required.",
  },
  {
    q: "Will there be other plans?",
    a: "Right now there's one plan with everything included. Team and multi-technician plans are on the roadmap.",
  },
];

export default function PricingPage() {
  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      <LandingNav forcesolid />

      <main className="flex-1 pt-20">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-24 px-5 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Simple pricing.{" "}
            <span className="text-orange-500">No surprises.</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-md mx-auto">
            One plan. Everything included. 14-day free trial — cancel any time.
          </p>
        </section>

        {/* ── Pricing card ───────────────────────────────────────────────── */}
        <section className="px-5 pb-16 md:pb-24">
          <div className="max-w-md mx-auto bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
            <div className="bg-slate-900 px-8 py-8 text-white">
              <p className="text-slate-400 text-sm font-medium mb-1">Monthly subscription</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold">$12</span>
                <span className="text-slate-400 text-lg mb-1">/ month</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">USD · billed monthly · cancel any time</p>
            </div>
            <div className="px-8 py-8">
              <ul className="space-y-3 mb-8">
                {PLAN_FEATURES.map((feat) => (
                  <li key={feat} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-orange-600" />
                    </div>
                    <span className="text-slate-700 text-sm">{feat}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition-colors text-base"
              >
                Start 14-day free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-slate-400 text-sm mt-3">Cancel within 14 days for a full refund</p>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────────── */}
        <section className="bg-slate-50 border-t border-slate-100 py-16 md:py-24 px-5">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-10 text-center">
              Frequently asked questions
            </h2>
            <div className="space-y-8">
              {FAQ.map((item) => (
                <div key={item.q} className="border-b border-slate-100 pb-8 last:border-0 last:pb-0">
                  <h3 className="font-semibold text-slate-900 text-base mb-2">{item.q}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {item.link
                      ? item.a.replace(item.link.label, "")
                      : item.a}
                    {item.link && (
                      <>
                        See our{" "}
                        <Link href={item.link.href} className="text-orange-500 hover:underline font-medium">
                          {item.link.label}
                        </Link>
                        {" "}for full details.
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-16 md:py-20 px-5 text-center max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-4">
            Ready to give it a go?
          </h2>
          <p className="text-slate-500 text-base mb-8">
            14-day free trial. Cancel any time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-7 py-3.5 rounded-xl transition-colors text-base"
            >
              Try the demo first
            </Link>
          </div>
        </section>

      </main>

      <LandingFooter />
    </div>
  );
}
