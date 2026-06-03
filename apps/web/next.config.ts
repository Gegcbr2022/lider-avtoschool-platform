import type { NextConfig } from "next";

const API_URL = process.env.API_URL ?? "http://localhost:5001/lider-avtoschool-dev/europe-west1/api";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lider/ui", "@lider/shared", "@lider/config", "@lider/types"],
  images: {
    formats: ["image/avif", "image/webp"]
  },
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
    LIDER_BUILD_REV: "3",
  },
  // Proxy /api/leads to Firebase Functions directly.
  // This bypasses the webpack-cached Next.js API route bundle.
  // Firebase Functions handles: source normalization, validation, Firestore, Telegram, email.
  async rewrites() {
    const apiBase = API_URL.replace(/\/$/, "");
    return [
      {
        source: "/api/leads",
        destination: `${apiBase}/leads`,
      },
    ];
  },
};

export default nextConfig;
