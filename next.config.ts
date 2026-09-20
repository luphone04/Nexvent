import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: '/nexvent/:path*', destination: '/:path*', permanent: true }]
  },
};

export default nextConfig;
