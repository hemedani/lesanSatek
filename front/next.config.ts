import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
