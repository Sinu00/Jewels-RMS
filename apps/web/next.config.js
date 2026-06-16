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
      // Mirror production routing: in prod Caddy serves /uploads from the API,
      // so proxy it the same way in dev. This lets the API return relative
      // /uploads URLs that resolve identically in both environments.
      {
        source: '/uploads/:path*',
        destination: 'http://localhost:3001/uploads/:path*',
      },
    ]
  },
  images: {
    // The API now returns same-origin relative URLs (/uploads/...), which
    // <Image> treats as internal and serves without a remote-host allowlist.
    // These remotePatterns are kept only as a fallback for any absolute URLs.
    remotePatterns: [
      // Dev: API serves /uploads directly on :3001
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      // Prod: Caddy serves /uploads under the public domain
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
