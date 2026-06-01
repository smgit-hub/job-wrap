// ── AppGild license gate ──────────────────────────────────────────────────────
// When ready to submit to AppGild:
//   1. Go to appgild.ai/apps/new, reach Step 5
//   2. Copy the customised ~20-line JS snippet they provide
//   3. Add it here as a <Script> tag (next/script, strategy="beforeInteractive")
//   4. Redeploy, then click "Run integration check" in the wizard
//   5. Once it passes the submit button unlocks
//
// Example shape (exact snippet comes from AppGild wizard):
//   import Script from "next/script";
//   <Script id="appgild-gate" strategy="beforeInteractive" dangerouslySetInnerHTML={{
//     __html: `/* AppGild snippet here */`
//   }} />
// ── end AppGild TODO ──────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
