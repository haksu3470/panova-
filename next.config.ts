import type { NextConfig } from 'next';
import { securityHeaders } from './lib/securityHeaders';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders(),
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/',
        has: [{ type: 'host', value: 'panova-xi.vercel.app' }],
        destination: 'https://panovagroup.org',
        permanent: true,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'panova-xi.vercel.app' }],
        destination: 'https://panovagroup.org/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
