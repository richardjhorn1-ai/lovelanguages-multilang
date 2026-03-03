import redirectsData from './lib/redirects.json' with { type: 'json' };

/** @type {import('next').NextConfig} */
const nextConfig = {
  // All URLs must use trailing slashes (matches existing vercel.json behavior)
  trailingSlash: true,

  // Allow Supabase storage images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wfunhsvacrhirucqlyov.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Migrate redirects from vercel.json (445 static redirects)
  // 1 conditional redirect (story.lovelanguages.io) needs middleware — handled in Phase 2
  async redirects() {
    return redirectsData;
  },

  // Headers from vercel.json — cache-control for blog/compare, security headers globally
  async headers() {
    return [
      {
        source: '/learn/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/compare/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://vercel.live https://cdn.tailwindcss.com https://www.googletagmanager.com https://us.i.posthog.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://api.stripe.com https://api.gladia.io wss://api.gladia.io wss://*.gladia.net https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://fonts.googleapis.com https://fonts.gstatic.com https://us.i.posthog.com; frame-src https://js.stripe.com https://checkout.stripe.com https://vercel.live; media-src 'self' blob: https://*.supabase.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), geolocation=(), payment=(self)',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
