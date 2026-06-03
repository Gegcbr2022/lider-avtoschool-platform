import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lider/ui", "@lider/shared", "@lider/config", "@lider/types"],
  images: {
    formats: ["image/avif", "image/webp"]
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? "http://localhost:5001/lider-avtoschool-dev/europe-west1/api",
    // Bust Vercel build cache — increment when route logic changes
    LIDER_BUILD_REV: "2",
  }
};

export default nextConfig;
