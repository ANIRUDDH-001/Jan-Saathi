import withPWA from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/landing',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default withBundleAnalyzer(withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/jan-saathi\.vercel\.app\/schemes/,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'scheme-pages',
          expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/schemes/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'scheme-data',
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/(chat|voice)/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-calls',
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
        },
      },
    ],
  },
})(nextConfig));
