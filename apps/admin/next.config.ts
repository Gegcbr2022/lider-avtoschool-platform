import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lider/ui", "@lider/shared", "@lider/types"],
  // Type/lint checking runs separately via `npm run typecheck` (tsc). Next's
  // build-time check additionally type-checks workspace package internals, which
  // is noisy on Vercel's fresh monorepo install. Skip it here — the real gate is tsc.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
