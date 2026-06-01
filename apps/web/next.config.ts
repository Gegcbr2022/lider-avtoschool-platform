import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lider/ui", "@lider/shared", "@lider/config", "@lider/types"],
  images: {
    formats: ["image/avif", "image/webp"]
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.API_URL ?? "http://localhost:5001/lider-avtoschool/europe-west1/api"
  }
};

export default nextConfig;
