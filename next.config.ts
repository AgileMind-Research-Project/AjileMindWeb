import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Optimize images
  images: {
    domains: ['localhost', 'agilemind.io', 'sha256-production-d1ee.up.railway.app'],
    unoptimized: process.env.NODE_ENV === 'development',
  },

  // Enable experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
