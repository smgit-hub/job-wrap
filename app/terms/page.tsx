import LandingFooter from "@/components/landing/LandingFooter";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service — JobWrap",
  description: "Terms and conditions for using JobWrap.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-6 py-16 w-full">
        <Link href="/" className="flex items-center gap-2.5 mb-10 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png?v=3" alt="JobWrap" className="w-10 h-10 shrink-0 object-cover" />
          <span className="text-2xl font-bold text-slate-900">JobWrap</span>
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Terms of Service</h1>
        <p className="text-sm text-slate-400 mb-12">Last updated: June 2026</p>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <Section title="About JobWrap">
            <p>JobWrap is a voice-first service report tool for air conditioning and HVAC technicians. It helps you record job notes, generate structured service reports, and share them with customers.</p>
            <p>By creating an account or using JobWrap, you agree to these terms.</p>
          </Section>

          <Section title="Subscription and payment">
            <p>JobWrap is a paid service. By subscribing, you agree to pay the applicable monthly fee. Your subscription renews automatically each month until cancelled.</p>
            <p>You can cancel at any time. Cancellation takes effect at the end of your current billing period — you won&apos;t be charged again, and you retain access until that period ends.</p>
            <p>We reserve the right to change pricing with reasonable notice. Existing subscribers will be notified before any price change takes effect.</p>
          </Section>

          <Section title="Your data">
            <p>You own your data. Your reports, customers, and business information belong to you. We store them securely to provide the service and do not use them for any other purpose.</p>
            <p>You can request deletion of your account and all associated data at any time by <a href="/contact" className="text-orange-500 hover:underline font-medium">contacting us</a>.</p>
          </Section>

          <Section title="Acceptable use">
            <p>You agree not to:</p>
            <ul>
              <li>Use JobWrap for any unlawful purpose</li>
              <li>Attempt to access or tamper with another user&apos;s data</li>
              <li>Abuse or overload the service in a way that disrupts other users</li>
              <li>Reverse engineer or attempt to extract the source code</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
          </Section>

          <Section title="AI-generated content">
            <p>JobWrap uses AI to generate report text from your job notes. The generated content is a starting point — you are responsible for reviewing, editing, and verifying all report content before sharing it with customers.</p>
            <p>We make no warranty that AI-generated reports are accurate, complete, or suitable for any specific purpose.</p>
          </Section>

          <Section title="Shared report links">
            <p>When you create a share link, the report content is made publicly accessible via that URL for 90 days. Anyone with the link can view the report. Only share links with people you intend to share the report with.</p>
          </Section>

          <Section title="Availability">
            <p>We aim to keep JobWrap available at all times but cannot guarantee uninterrupted access. We may perform maintenance, apply updates, or experience outages. We will endeavour to minimise disruption.</p>
          </Section>

          <Section title="Limitation of liability">
            <p>JobWrap is provided &ldquo;as is&rdquo;. To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including loss of data or business.</p>
            <p>Our total liability to you for any claim will not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </Section>

          <Section title="Changes to these terms">
            <p>We may update these terms from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of JobWrap after changes take effect means you accept the updated terms.</p>
          </Section>

          <Section title="Contact">
            <p>Questions? <a href="/contact" className="text-orange-500 hover:underline font-medium">Get in touch</a></p>
          </Section>

          <div className="border-t border-slate-100 pt-8 space-y-3 text-sm text-slate-500">
            <p>These terms are provided for transparency and may be updated as JobWrap develops.</p>
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
