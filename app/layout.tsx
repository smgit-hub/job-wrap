// TODO(error-handling): wrap AuthProvider (or the entire body) in an error
// boundary component so unhandled React render errors show a graceful fallback
// instead of a blank white screen. React 19 added improved error recovery but
// an explicit boundary is still required for production.
//
// TODO(offline): there is currently no offline detection or SW-based caching.
// Consider adding a basic service worker (Next.js PWA plugin or custom SW) that
// caches the app shell so the app is usable when the device has no network.
//

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
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
    "Turn rough job notes into polished customer-ready service reports. Built for HVAC technicians.",
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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
