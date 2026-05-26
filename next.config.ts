import path from "node:path";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Permissive in dev (webpack/HMR needs eval), tightened in prod.
// For nonce-based script-src we'd need proxy.ts middleware to inject nonces;
// deferred until we have a real prod deploy.
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' in prod is a known compromise: Next inlines small bootstrap
  // scripts. Migrate to nonces when we add prod-only proxy middleware.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // Logos: finnhub-static.s3.amazonaws.com, static2.finnhub.io, logo.clearbit.com.
  // Google avatars (OAuth): *.googleusercontent.com. Allow https: broadly here.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  // Browser hits our /api/* + Supabase (auth, realtime if added later).
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  // Pin workspace root so the parent /Users/admn/package.json doesn't confuse Next.
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
