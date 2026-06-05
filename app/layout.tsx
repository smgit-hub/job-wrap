// ---------------------------------------------------------------------------
// JobWrap — Root Layout
//
// ── AppGild licence snippet (Layer 1 access control) ─────────────────────────
// Implemented via <AppGildGate /> component — gates the entire app behind a
// valid AppGild licence key. See components/AppGildGate.tsx for the snippet.
// All routes are gated — no public exceptions (see middleware.ts for Layer 2).
//
// TODO(error-handling): wrap AuthProvider (or the entire body) in an error
// boundary component so unhandled React render errors show a graceful fallback
// instead of a blank white screen.
//
// TODO(offline): consider adding a basic service worker that caches the app
// shell so the app is usable when the device has no network.
// ---------------------------------------------------------------------------

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import AppGildGate from "@/components/AppGildGate";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JobWrap — Service Reports in Seconds",
  description:
    "Talk through the job. JobWrap writes the report. Built for HVAC technicians.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "JobWrap",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  other: {
    // Allow PWA install prompt on Android Chrome
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  // Prevents content from being obscured by the virtual keyboard on mobile
  interactiveWidget: "resizes-content",
  // Ensures content respects the iPhone notch / home indicator
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 font-sans">
        {/* AppGild licence gate — Layer 1 access control (see component for details) */}
        <AppGildGate />
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
