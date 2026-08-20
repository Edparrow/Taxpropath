import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Local dev is accessed via 127.0.0.1 (this machine's `localhost` is taken
  // by an unrelated project's dev server) — Next.js 16 blocks cross-origin
  // HMR requests by default, which silently breaks client-side hydration.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
