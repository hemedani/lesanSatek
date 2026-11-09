import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackSourceMaps: false,
  },
  async redirects() {
    return [
      {
        source: "/docs/:path*",
        destination: "/doc/:path*",
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
