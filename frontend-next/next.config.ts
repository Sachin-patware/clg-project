import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://clg-project-1-e193.onrender.com/:path*',
      },
    ];
  },
};

export default nextConfig;
