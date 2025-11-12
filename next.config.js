// Next.js config - AgileMind Platform
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION,
    NEXT_PUBLIC_PLATFORM_HOME_URL: process.env.NEXT_PUBLIC_PLATFORM_HOME_URL,
    NEXT_PUBLIC_AGILEMIND_PLATFORM_URL: process.env.NEXT_PUBLIC_AGILEMIND_PLATFORM_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
