import LandingFooter from "@/components/landing/LandingFooter";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — JobWrap",
  description: "How JobWrap handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: June 2026</p>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <Section title="What we collect">
            <p>JobWrap collects only what it needs to work:</p>
            <ul>
              <li><strong>Your email address</strong> — used to create and secure your account.</li>
              <li><strong>Job records</strong> (customer names, addresses, service notes, photos) — synced securely to our servers so your data is available across devices.</li>
              <li><strong>Business profile</strong> (business name, phone, logo, licence numbers) — stored on our servers and used to brand your reports.</li>
              <li><strong>Shared report links</strong> — if you create a shareable link, the report content is stored on our servers to serve that link. Links expire after 90 days.</li>
            </ul>
          </Section>

          <Section title="AI report generation">
            <p>When you tap <strong>Generate Report</strong>, your job notes are sent to a third-party AI provider (Anthropic) to produce the report text.</p>
            <p>AI providers process this data under their own privacy policies and do not retain it for model training under standard API terms.</p>
            <p>If you prefer not to send job data to an AI service, do not use the Generate Report feature.</p>
          </Section>

          <Section title="How we store data">
            <p>Your reports, customers, photos, and business settings are stored securely in the cloud so you can access them from any device. Data is also cached locally on your device for fast access and offline use.</p>
            <p>Account credentials and all cloud data are protected by encryption at rest and in transit.</p>
          </Section>

          <Section title="Payments">
            <p>Payments are processed by <strong>Stripe</strong>, our payment provider. JobWrap does not store your card details — all payment information is handled directly by Stripe and subject to their privacy policy.</p>
            <p>Stripe may collect your name, email address, billing address, and payment method details in order to process your subscription.</p>
          </Section>

          <Section title="Sharing">
            <p>We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is only shared with:</p>
            <ul>
              <li><strong>Anthropic</strong> — for AI report generation, as described above.</li>
              <li><strong>Supabase</strong> — for authentication, data storage, and shared report link hosting.</li>
              <li><strong>Stripe</strong> — for payment processing and subscription management.</li>
            </ul>
          </Section>

          <Section title="Your rights">
            <p>You can delete your account and all associated data at any time by <a href="/contact" className="text-orange-500 hover:underline font-medium">contacting us</a>. Device-stored data can be removed by clearing your browser&apos;s local storage.</p>
          </Section>

          <Section title="Contact">
            <p>Questions? <a href="/contact" className="text-orange-500 hover:underline font-medium">Get in touch</a></p>
          </Section>

          <div className="border-t border-slate-100 pt-8 space-y-3 text-sm text-slate-500">
            <p>JobWrap does not sell user data.</p>
            <p>This privacy policy may be updated as JobWrap develops.</p>
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
