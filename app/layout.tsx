// ---------------------------------------------------------------------------
// JobWrap — Root Layout
//
// TODO(error-handling): wrap AuthProvider in an error boundary so unhandled
// React render errors show a graceful fallback instead of a blank screen.
//
// TODO(offline): consider adding a basic service worker that caches the app
// shell so the app is usable when the device has no network.
// ---------------------------------------------------------------------------

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const font = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const BASE_URL = "https://jobwrap.app";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "JobWrap — Service Reports in Seconds",
    template: "%s — JobWrap",
  },
  description:
    "Talk through the job on site. JobWrap turns your voice notes into a professional, branded service report in seconds. Built for HVAC & AC technicians.",
  keywords: [
    "HVAC service report",
    "AC technician app",
    "service report generator",
    "voice to report",
    "HVAC software",
    "air conditioning report",
    "field service report",
    "HVAC job report",
  ],
  authors: [{ name: "JobWrap", url: BASE_URL }],
  creator: "JobWrap",
  publisher: "JobWrap",
  manifest: "/manifest.json",
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "JobWrap",
    title: "JobWrap — Service Reports in Seconds",
    description:
      "Talk through the job on site. JobWrap turns your voice notes into a professional, branded service report in seconds. Built for HVAC & AC technicians.",
    images: [
      {
        url: "/screenshots/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "JobWrap — AI-powered service reports for HVAC technicians",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "JobWrap — Service Reports in Seconds",
    description:
      "Talk through the job. JobWrap writes the report. Built for HVAC & AC technicians.",
    images: ["/screenshots/hero-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
      <body className="min-h-full bg-white font-sans">
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <GoogleAnalytics gaId="G-W9MJZ22VM8" />
      </body>
    </html>
  );
}
