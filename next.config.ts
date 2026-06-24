import type { NextConfig } from "next";

const securityHeaders = [
  // Prevents the page from being embedded in an iframe (clickjacking protection)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Stops the browser from MIME-sniffing a response away from the declared content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controls how much referrer information is sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Basic permissions policy — restricts access to camera/mic to same-origin
  // The app uses microphone (Web Speech API) so it is allowed for same-origin.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  // Content Security Policy — restricts what resources the browser will load.
  // unsafe-inline is required by Next.js (hydration scripts) and Tailwind (inline styles).
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js hydration + Stripe + Google Analytics/Tag Manager
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com",
      // Tailwind inline styles + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Images: self, data URIs, blobs, Supabase storage, Google
      "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://www.googletagmanager.com",
      // Fonts: self + Google Fonts
      "font-src 'self' data: https://fonts.gstatic.com",
      // API calls: self + Supabase + Stripe + GA4 + Vercel Analytics
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://vitals.vercel-insights.com https://vitals.vercel-analytics.com",
      // Stripe iframes for hosted checkout
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      // Service workers
      "worker-src 'self' blob:",
      // Prevent base tag hijacking
      "base-uri 'self'",
      // Only allow form submissions to self
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  images: { unoptimized: true },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
