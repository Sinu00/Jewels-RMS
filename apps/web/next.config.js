/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ]
  },
  images: {
    remotePatterns: [
      // Dev: API serves /uploads directly on :3001
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Prod: Caddy serves /uploads under the public domain (BASE_URL)
      {
        protocol: 'https',
        hostname: 'jewels.rivaazbridal.in',
        pathname: '/uploads/**',
      },
    ],
  },
  transpilePackages: ['@rental/types'],
}

module.exports = withPWA(nextConfig)
