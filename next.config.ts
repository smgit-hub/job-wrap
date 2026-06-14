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
  // TODO(security): tighten this once a formal feature set is finalised.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  // Content Security Policy — restricts what resources the browser will load.
  // script-src: self + Next.js inline scripts (required for hydration) + Stripe.js
  // style-src: self + unsafe-inline (required by Tailwind/CSS-in-JS)
  // img-src: self + data URIs (base64 photos) + Supabase storage
  // connect-src: self + Supabase + Stripe APIs
  // frame-src: Stripe hosted checkout
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
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
