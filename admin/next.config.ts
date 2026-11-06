import type { NextConfig } from "next";

/**
 * Admin dashboard — a deployment of its own, pointed at the same database as
 * the public site.
 *
 * Cache Components stays off for the same reason as the public app, only more
 * strongly: an editor must see exactly what they just saved, on the next
 * request, with no cache in between.
 */
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  serverExternalPackages: ["@prisma/client", "pg"],

  // The dashboard is private. Nothing here should ever be indexed, linked as a
  // referrer, or framed.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          // The admin renders editor-authored HTML in previews; this limits the
          // damage if anything slips past the sanitiser.
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              // React's dev build uses eval() for stack reconstruction; the
              // production bundle never does, so the allowance is dev-only.
              process.env.NODE_ENV === "development"
                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                : "script-src 'self' 'unsafe-inline'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  images: {
    // Previews of whatever the public site is serving.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
