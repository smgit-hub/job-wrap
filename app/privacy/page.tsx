import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — JobWrap",
  description: "How JobWrap handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="JobWrap" className="w-9 h-9 rounded-xl shrink-0 object-cover" />
          <span className="font-bold text-slate-900">JobWrap</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mt-1">Last updated: June 2026</p>
        </div>

        <Section title="What we collect">
          <p>
            JobWrap collects only what it needs to work:
          </p>
          <ul>
            <li><strong>Your email address</strong> — used to create and secure your account.</li>
            <li><strong>Job records</strong> (customer names, addresses, service notes, photos) — synced securely to our servers so your data is available across devices.</li>
            <li><strong>Business profile</strong> (business name, phone, logo, licence numbers, etc.) — stored on our servers and used to brand your reports.</li>
            <li><strong>Shared report links</strong> — if you create a shareable link, the report content is stored on our servers to serve that link. Links expire after 90 days.</li>
          </ul>
        </Section>

        <Section title="AI report generation">
          <p>
            When you tap <strong>Generate Report</strong>, your job notes — including the customer name, address, and work details you recorded — are sent to a third-party AI provider (Anthropic, Google, or OpenAI) to produce the report text.
          </p>
          <p>
            AI providers process this data under their own privacy policies and do not retain it for model training purposes under standard API terms.
          </p>
          <p>
            If you prefer not to send job data to an AI service, do not use the Generate Report feature.
          </p>
        </Section>

        <Section title="How we store data">
          <p>
            Your reports, customers, photos, and business settings are stored securely in the cloud (Supabase) so you can access them from any device. Data is also cached locally on your device for fast access and offline use.
          </p>
          <p>
            Account credentials and all cloud data are managed by Supabase, protected by encryption at rest and in transit.
          </p>
        </Section>

        <Section title="Sharing">
          <p>
            We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is only shared with:
          </p>
          <ul>
            <li><strong>AI providers</strong> (Anthropic, Google, OpenAI) — for report generation, as described above.</li>
            <li><strong>Supabase</strong> — for authentication, data storage, and shared report link hosting.</li>
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

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link href="/login" className="text-sm text-orange-500 font-semibold hover:underline">
            ← Back to sign in
          </Link>
          <Link href="/terms" className="text-sm text-slate-500 hover:underline">
            Terms of Service
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
