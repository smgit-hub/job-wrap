import Link from "next/link";

export const metadata = {
  title: "Terms of Service — JobWrap",
  description: "Terms and conditions for using JobWrap.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-9 h-9 rounded-xl shrink-0 object-cover" />
          <span className="font-bold text-slate-900">JobWrap</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 pb-16 space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Terms of Service</h1>
          <p className="text-sm text-slate-500 mt-1">Last updated: June 2026</p>
        </div>

        <Section title="About JobWrap">
          <p>
            JobWrap is a voice-first service report tool for air conditioning and HVAC technicians. It helps you record job notes, generate structured service reports, and share them with customers.
          </p>
          <p>
            By creating an account or using JobWrap, you agree to these terms.
          </p>
        </Section>

        <Section title="Subscription and payment">
          <p>
            JobWrap is a paid service. By subscribing, you agree to pay the applicable monthly fee. Your subscription renews automatically each month until cancelled.
          </p>
          <p>
            You can cancel at any time. Cancellation takes effect at the end of your current billing period — you won&apos;t be charged again, and you retain access until that period ends.
          </p>
          <p>
            We reserve the right to change pricing with reasonable notice. Existing subscribers will be notified before any price change takes effect.
          </p>
        </Section>

        <Section title="Your data">
          <p>
            You own your data. Your reports, customers, and business information belong to you. We store them securely to provide the service, and we do not use them for any other purpose.
          </p>
          <p>
            You can request deletion of your account and all associated data at any time by contacting us at{" "}
            <a href="mailto:hello@jobwrap.app" className="text-orange-500 hover:underline font-medium">
              hello@jobwrap.app
            </a>.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>You agree not to:</p>
          <ul>
            <li>Use JobWrap for any unlawful purpose</li>
            <li>Attempt to access or tamper with another user&apos;s data</li>
            <li>Abuse or overload the service in a way that disrupts other users</li>
            <li>Reverse engineer or attempt to extract the source code</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </Section>

        <Section title="AI-generated content">
          <p>
            JobWrap uses AI to generate report text from your job notes. The generated content is a starting point — you are responsible for reviewing, editing, and verifying all report content before sharing it with customers.
          </p>
          <p>
            We make no warranty that AI-generated reports are accurate, complete, or suitable for any specific purpose.
          </p>
        </Section>

        <Section title="Shared report links">
          <p>
            When you create a share link, the report content is made publicly accessible via that URL for 90 days. Anyone with the link can view the report. Only share links with people you intend to share the report with.
          </p>
        </Section>

        <Section title="Availability">
          <p>
            We aim to keep JobWrap available at all times but cannot guarantee uninterrupted access. We may perform maintenance, apply updates, or experience outages. We will endeavour to minimise disruption.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            JobWrap is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including loss of data or business.
          </p>
          <p>
            Our total liability to you for any claim will not exceed the amount you paid us in the 3 months preceding the claim.
          </p>
        </Section>

        <Section title="Changes to these terms">
          <p>
            We may update these terms from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of JobWrap after changes take effect means you accept the updated terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about these terms? Email us at{" "}
            <a href="mailto:hello@jobwrap.app" className="text-orange-500 hover:underline font-medium">
              hello@jobwrap.app
            </a>
          </p>
        </Section>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <Link href="/login" className="text-sm text-orange-500 font-semibold hover:underline">
            ← Back to sign in
          </Link>
          <Link href="/privacy" className="text-sm text-slate-500 hover:underline">
            Privacy Policy
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
