// ---------------------------------------------------------------------------
// JobWrap — Public Landing Page
// Route: /
// Public — no auth required. Middleware allows this route through.
// ---------------------------------------------------------------------------

import Image from "next/image";
import Link from "next/link";
import {
  Mic, FileText, Share2, CalendarCheck, Check, ArrowRight,
  Users, Palette, ShieldCheck, Camera, Hash, Heart, Phone,
  Sparkles, ClipboardList, Pencil,
} from "lucide-react";
import LandingNav from "@/components/landing/LandingNav";
import LandingFooter from "@/components/landing/LandingFooter";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const HOW_IT_WORKS = [
  { step: "1", title: "Your jobs, all in one place",        body: "Upcoming service reminders so nothing gets missed.",           src: "/screenshots/step-1-dashboard.png" },
  { step: "2", title: "Select a customer or add new",       body: "Service type, equipment, and date — quick to fill.",          src: "/screenshots/step-2-new-job.png" },
  { step: "3", title: "Talk through the job on site",       body: "One take, freeform — no typing.",                             src: "/screenshots/step-3-record.png" },
  { step: "4", title: "AI writes the report",               body: "Review and adjust before sending.",                           src: "/screenshots/step-4-edit.png" },
  { step: "5", title: "Professional report in seconds",     body: "Download PDF or send directly to your customer.",             src: "/screenshots/step-5-report.png" },
];

const FEATURES = [
  { icon: Mic,           title: "Record on site",                 body: "Speak naturally at the end of the job. JobWrap listens and handles the rest." },
  { icon: Sparkles,      title: "AI writes the report",           body: "Structured findings, work performed, and recommendations — generated in seconds." },
  { icon: Palette,       title: "Your branding on every report",  body: "Logo, business name, licence numbers, and contact details stamped automatically." },
  { icon: Users,         title: "Customer history",               body: "Track customers, equipment, and next service dates in one place." },
  { icon: Share2,        title: "Share instantly",                body: "Download a branded PDF or send it directly to your customer." },
  { icon: CalendarCheck, title: "Never miss a follow-up",         body: "Set next service dates and get reminded before they're due." },
];

const PLAN_FEATURES = [
  "Unlimited reports",
  "AI report generation",
  "Branded PDF export",
  "Business branding on every report",
  "Customer & equipment history",
  "Next service date reminders",
  "Works on any phone — no app store needed",
];

// ---------------------------------------------------------------------------
// Shared components
// ---------------------------------------------------------------------------

function PhoneFrame({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="relative bg-slate-900 rounded-[2rem] p-[5px] shadow-2xl shadow-slate-400/30">
      <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[30%] h-[10px] bg-slate-900 rounded-full z-10" />
      <div className="overflow-hidden rounded-[1.7rem]">
        <Image src={src} alt={alt} width={390} height={844} className="w-full h-auto" priority={priority} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="bg-white min-h-screen font-sans">
      <LandingNav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <Image src="/screenshots/hero-bg.jpg" alt="" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/20" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-5 pt-20 pb-8 md:pt-24 md:pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/10">
                <Mic className="w-3.5 h-3.5" />
                Built for HVAC &amp; AC technicians
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">
                Stop writing reports.<br />
                <span className="text-orange-400">Start talking.</span>
              </h1>
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Talk through the job on site. JobWrap turns your voice notes into a professional, branded service report in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base shadow-lg shadow-orange-900/40">
                  Start free — 14 days free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base backdrop-blur-sm border border-white/20">
                  Try the demo
                </Link>
              </div>
              <p className="text-sm text-slate-400 mt-4">14-day free trial. No credit card required.</p>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative w-44 md:w-56 lg:w-72">
                <PhoneFrame src="/screenshots/hero.png" alt="JobWrap — voice recording screen" priority />
                <div className="absolute -inset-4 bg-orange-500/20 rounded-[3rem] blur-2xl -z-10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <section className="bg-slate-50 border-y border-slate-100 py-4 px-5">
        <p className="text-center text-sm text-slate-500 font-medium tracking-wide">
          Trusted by HVAC &amp; AC technicians across the US, UK, Canada, and Australia
        </p>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            From on site to customer —{" "}
            <span className="text-orange-500">in seconds.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Talk through the job. We handle the rest.</p>
        </div>

        {/* Desktop: labels above phones, min-h ensures all phones start at same Y */}
        <div className="hidden lg:grid lg:grid-cols-5 gap-5">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="flex flex-col">
              <div className="text-center px-1 min-h-[130px] flex flex-col items-center mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold flex items-center justify-center mb-2">{item.step}</div>
                <p className="font-semibold text-slate-900 text-base leading-snug mb-1">{item.title}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
              </div>
              <PhoneFrame src={item.src} alt={item.title} />
            </div>
          ))}
        </div>

        {/* Mobile: 2 key phones + numbered steps */}
        <div className="lg:hidden">
          <div className="grid grid-cols-2 gap-4 mb-10 items-end">
            {[HOW_IT_WORKS[2], HOW_IT_WORKS[4]].map((item) => (
              <div key={item.src} className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-slate-600 text-center">{item.title}</p>
                <PhoneFrame src={item.src} alt={item.title} />
              </div>
            ))}
          </div>
          <div className="space-y-4 max-w-sm mx-auto">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</div>
                <div>
                  <p className="font-semibold text-slate-900 text-base">{item.title}</p>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Report preview ───────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24 px-5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Copy — second on mobile, right on desktop */}
          <div className="flex-1 order-2 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Professional reports{" "}
              <span className="text-orange-500">ready to send.</span>
            </h2>
            <p className="text-slate-500 text-lg mb-8 max-w-lg">
              Turn your voice notes into structured, customer-ready service reports. Review, edit, then send — all from your phone.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: Sparkles,      title: "AI writes the report",         body: "JobWrap creates a polished report from your voice notes in seconds." },
                { icon: ClipboardList, title: "Structured automatically",     body: "Summary, observations, work performed & recommendations — organised." },
                { icon: Pencil,        title: "Review and edit",              body: "Make any changes before you share with your customer." },
                { icon: Hash,          title: "Unique job number",            body: "Professional reference on every report." },
                { icon: CalendarCheck, title: "Next service date captured",   body: "Keep on top of follow-ups and customer maintenance." },
                { icon: Share2,        title: "Download PDF or send",         body: "Branded PDF ready to download or send directly to your customer." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-base">{f.title}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Phone — second on mobile, right on desktop */}
          <div className="order-1 lg:order-1 shrink-0">
            <div className="w-52 md:w-60 lg:w-72 mx-auto">
              <PhoneFrame src="/screenshots/step-5-report.png" alt="JobWrap service report preview" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Your branding ────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Copy */}
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Your branding.{" "}
              <span className="text-orange-500">On every report.</span>
            </h2>
            <p className="text-slate-500 text-lg mb-8 max-w-lg">
              Set it once. We'll include it automatically on every report you generate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[
                { icon: ShieldCheck,   title: "Logo & business name",       body: "Your branding appears automatically on every report." },
                { icon: Hash,          title: "Licence numbers stamped",     body: "Technician name and licence numbers included automatically." },
                { icon: Phone,         title: "Footer on every page",        body: "Phone, email, website and tagline on every page." },
                { icon: Palette,       title: "Live preview as you type",    body: "See your report branding update in real time." },
                { icon: Heart,         title: "Always professional",         body: "Every report reflects your business." },
                { icon: ShieldCheck,   title: "Set it once",                 body: "One setup — applied automatically to every job." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-base">{f.title}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Phone */}
          <div className="shrink-0">
            <div className="w-52 md:w-60 lg:w-72 mx-auto">
              <PhoneFrame src="/screenshots/branding.png" alt="JobWrap branding settings" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Professional reports (PDF) ───────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Professional reports your{" "}
              <span className="text-orange-500">customers keep.</span>
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Voice notes become a polished, branded service report in seconds.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-start">
            {/* Feature bullets */}
            <div className="flex flex-col gap-5 lg:w-64 shrink-0">
              {[
                { icon: ShieldCheck, color: "bg-slate-800",  title: "Branded with your logo and colors",        body: "Business branding appears automatically on every report." },
                { icon: FileText,    color: "bg-orange-500", title: "Professional document your customer keeps", body: "Clear, structured layout designed for customers." },
                { icon: Hash,        color: "bg-green-600",  title: "Full job details and unique job numbers",   body: "Customer, equipment, service history and reference number." },
                { icon: Camera,      color: "bg-purple-600", title: "Job photos attached",                      body: "Add before-and-after photos directly to the report." },
                { icon: Heart,       color: "bg-pink-500",   title: "Thank you message included",               body: "Professional closing section on every report." },
                { icon: Phone,       color: "bg-blue-500",   title: "Contact footer on every page",             body: "Business details, licence numbers, phone, email and website." },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${f.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-base leading-snug mb-0.5">{f.title}</p>
                    <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* PDF pages — show both on desktop, page 1 only on mobile */}
            <div className="flex-1 flex gap-4 items-start">
              <div className="flex-1 rounded-xl overflow-hidden shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 bg-white">
                <Image src="/screenshots/report-page1.png" alt="Service report page 1" width={565} height={800} className="w-full h-auto" />
              </div>
              <div className="hidden sm:block flex-1 rounded-xl overflow-hidden shadow-xl shadow-slate-300/50 ring-1 ring-slate-200 bg-white">
                <Image src="/screenshots/report-page2.png" alt="Service report page 2" width={565} height={800} className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Everything you need.{" "}
            <span className="text-orange-500">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            No CRM, no scheduling, no invoicing. Just fast, professional reports.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-orange-500" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1.5 text-base">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16 md:py-24 px-5" id="pricing">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Simple pricing.{" "}
            <span className="text-orange-500">No surprises.</span>
          </h2>
          <p className="text-slate-500 text-lg mb-10">One plan. Everything included. Cancel any time.</p>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden text-left">
            <div className="bg-slate-900 px-8 py-8 text-white">
              <p className="text-slate-400 text-sm font-medium mb-1">Monthly</p>
              <div className="flex items-end gap-1.5">
                <span className="text-5xl font-extrabold">$9</span>
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
              <Link href="/signup" className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 rounded-xl transition-colors text-base">
                Start 14-day free trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-center text-slate-400 text-sm mt-3">No credit card required · cancel any time</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-5 max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Ready to stop writing reports?
        </h2>
        <p className="text-slate-500 text-lg mb-8">
          Join technicians who finish their paperwork before they leave the job site.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors text-base">
            Start free — 14 days free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/demo" className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-7 py-3.5 rounded-xl transition-colors text-base">
            Try the demo first
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
