import Link from "next/link";
import { Wrench } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — JobWrap",
  description: "How JobWrap handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900">JobWrap</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-1">Last updated: May 2025</p>
        </div>

        <Section title="What we collect">
          <p>
            JobWrap collects only what it needs to work:
          </p>
          <ul>
            <li><strong>Your email address</strong> — used to create and secure your account.</li>
            <li><strong>Job records</strong> (customer names, addresses, service notes, photos) — stored locally on your device. They never leave your device unless you use the Share Link feature.</li>
            <li><strong>Business profile</strong> (business name, phone, logo, etc.) — stored locally on your device.</li>
            <li><strong>Shared report links</strong> — if you choose to create a shareable link, the report content is stored securely on our servers solely to serve that link.</li>
          </ul>
        </Section>

        <Section title="AI report generation">
          <p>
            When you tap <strong>Generate Report</strong>, your job notes — including the customer name, address, and work details you recorded — are sent to a third-party AI provider (Anthropic or OpenAI) to produce the report text.
          </p>
          <p>
            This is the only time your job data leaves your device during normal use. AI providers process this data under their own privacy policies and do not retain it for training purposes under standard API terms.
          </p>
          <p>
            If you prefer not to send job data to an AI service, do not use the Generate Report feature.
          </p>
        </Section>

        <Section title="How we store data">
          <p>
            All reports, customers, photos, and settings are stored in your browser&apos;s local storage — on your device, not on our servers. Clearing your browser data or switching devices will remove this data.
          </p>
          <p>
            Account credentials are managed by Supabase, an industry-standard authentication platform, and are protected by encryption at rest and in transit.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is only shared with:
          </p>
          <ul>
            <li><strong>AI providers</strong> — for report generation, as described above.</li>
            <li><strong>Supabase</strong> — for authentication and shared report link storage.</li>
          </ul>
        </Section>

        <Section title="Your rights">
          <p>
            You can delete your account and all associated server-side data at any time by contacting us. Device-stored data (reports, photos, customers) can be removed by clearing your browser&apos;s local storage.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions? Email us at{" "}
            <a href="mailto:hello@jobwrap.app" className="text-orange-500 hover:underline font-medium">
              hello@jobwrap.app
            </a>
          </p>
        </Section>

        <div className="pt-4 border-t border-slate-200">
          <Link
            href="/login"
            className="text-sm text-orange-500 font-semibold hover:underline"
          >
            ← Back to sign in
          </Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl px-5 py-5 shadow-sm border border-slate-100 space-y-3">
      <h2 className="font-bold text-slate-900 text-base">{title}</h2>
      <div className="text-sm text-slate-600 leading-relaxed space-y-2 [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:text-slate-800 [&_strong]:font-semibold">
        {children}
      </div>
    </section>
  );
}
