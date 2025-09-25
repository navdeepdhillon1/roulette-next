import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // ⚠️ Warning: This will not block production builds if lint errors exist
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
