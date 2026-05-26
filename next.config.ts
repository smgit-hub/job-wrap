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
  // Upgrade insecure requests in production
  // TODO(security): add a proper Content-Security-Policy before public launch.
  // A CSP is the strongest XSS mitigation — requires careful policy crafting.
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],

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
