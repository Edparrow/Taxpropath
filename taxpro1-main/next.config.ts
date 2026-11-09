import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Local dev is accessed via 127.0.0.1 (this machine's `localhost` is taken
  // by an unrelated project's dev server) — Next.js 16 blocks cross-origin
  // HMR requests by default, which silently breaks client-side hydration.
  allowedDevOrigins: ["127.0.0.1"],

  // This folder is the project root. Without this, a stray package-lock.json
  // in a parent folder makes Next.js treat that folder as the root, which
  // breaks next/font (Google fonts) in production builds.
  turbopack: {
    root: path.join(__dirname),
  },

  // Admin image uploads (WebP/PNG, max 5 MB) go through a server action,
  // whose default 1 MB body limit would reject them.
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },

  // The webinar section was retired for self-study courses; keep old links,
  // bookmarks and search results landing somewhere useful.
  async redirects() {
    return [
      { source: "/webinar", destination: "/courses", permanent: true },
      { source: "/webinar/:path*", destination: "/courses", permanent: true },
      { source: "/webinars", destination: "/courses", permanent: true },
      // Blog and Gallery were removed from the site.
      { source: "/blog", destination: "/", permanent: true },
      { source: "/blog/:path*", destination: "/", permanent: true },
      { source: "/gallery", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
