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
    // Serve photos as-is instead of running every one through Next's on-the-fly
    // image optimizer. That optimizer (sharp/wasm) runs inside the web process
    // and, on a small server, blows past the memory limit when the inventory
    // grid loads many photos at once — crashing the process (HTTP 502) and
    // dropping thumbnails. Photos are already small (compressed at upload) and
    // cached 30 days by Caddy, so optimization isn't needed.
    unoptimized: true,
  },
  transpilePackages: ['@rental/types'],
}

module.exports = withPWA(nextConfig)
