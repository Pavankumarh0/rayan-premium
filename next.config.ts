import type { NextConfig } from "next";

/**
 * Cache Components is deliberately left off.
 *
 * This is a CMS-backed site: when an editor publishes a change it must appear
 * on the next request without a rebuild or a cache-tag dance across ~40 routes.
 * Pages read SQLite directly, which is sub-millisecond, so request-time
 * rendering is the right trade here. Revisit if the site ever moves to a
 * high-latency remote database.
 */
const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root so Turbopack never walks up to a stray
    // package-lock.json in a parent directory.
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  // The Prisma client is Node-only; keep it out of the bundler's module graph.
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],

  images: {
    // Remote placeholder photography used by the seed data. Replace these with
    // the client's own CDN/host before launch.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 828, 1080, 1280, 1600, 1920, 2560],
    // 75 is the default for cards; 82 is used for full-bleed hero photography,
    // where banding in a large gradient is visible at 75.
    qualities: [75, 82],

    // The seed artwork in /public/placeholders is SVG. Serving SVG through the
    // image optimizer is only safe because (a) these files are ours, and (b)
    // the upload validator rejects image/svg+xml, so no visitor-supplied SVG
    // can ever reach this path. The CSP below sandboxes whatever is served.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  poweredByHeader: false,

  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Uploaded media is immutable once written — the filename carries a hash.
        source: "/uploads/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
