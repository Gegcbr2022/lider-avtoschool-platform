import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lider/ui", "@lider/shared", "@lider/types"]
};

export default nextConfig;
