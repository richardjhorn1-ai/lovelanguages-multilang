import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';
import path from 'path';

/**
 * Enhanced Sitemap Configuration
 * - Includes all content pages (/learn/, /compare/, /dictionary/, /tools/)
 * - Sets appropriate priorities based on page type
 * - Configures change frequencies based on content type
 */
function getSitemapPriority(url) {
  // Homepage and main hubs - highest priority
  if (url.endsWith('/learn/') || url === 'https://www.lovelanguages.io/') {
    return 1.0;
  }
  // Native language hubs (e.g., /learn/en/, /learn/es/)
  if (/\/learn\/[a-z]{2}\/$/.test(url)) {
    return 0.9;
  }
  // Language pair hubs (e.g., /learn/en/pl/)
  if (/\/learn\/[a-z]{2}\/[a-z]{2}\/$/.test(url)) {
    return 0.85;
  }
  // Special pages (easiest-languages, romance-languages, etc.)
  if (url.includes('/learn/') && !url.match(/\/learn\/[a-z]{2}\/[a-z]{2}\//)) {
    return 0.8;
  }
  // Compare pages - high value for conversions
  if (url.includes('/compare/')) {
    return 0.75;
  }
  // Tools pages
  if (url.includes('/tools/')) {
    return 0.7;
  }
  // Dictionary pages
  if (url.includes('/dictionary/')) {
    return 0.6;
  }
  // Individual articles
  return 0.7;
}

function getSitemapChangefreq(url) {
  // Hubs change frequently as content is added
  if (url.endsWith('/learn/') || /\/learn\/[a-z]{2}\/$/.test(url)) {
    return 'daily';
  }
  // Language pair pages
  if (/\/learn\/[a-z]{2}\/[a-z]{2}\/$/.test(url)) {
    return 'weekly';
  }
  // Compare pages - updated periodically
  if (url.includes('/compare/')) {
    return 'monthly';
  }
  // Articles and other content
  return 'weekly';
}

export default defineConfig({
  site: 'https://www.lovelanguages.io',
  output: 'hybrid',
  adapter: vercel(),
  vite: {
    resolve: {
      alias: {
        '@components': path.resolve('./src/components'),
        '@layouts': path.resolve('./src/layouts'),
      }
    }
  },
  integrations: [
    mdx(),
    sitemap({
      // Include all content pages (removed restrictive filter)
      filter: (page) => {
        // Exclude internal/utility pages
        if (page.includes('/_') || page.includes('/404')) {
          return false;
        }
        // Include all content sections
        return page.includes('/learn/') ||
               page.includes('/compare/') ||
               page.includes('/dictionary/') ||
               page.includes('/tools/');
      },
      serialize: (item) => ({
        ...item,
        lastmod: new Date().toISOString(),
        changefreq: getSitemapChangefreq(item.url),
        priority: getSitemapPriority(item.url)
      }),
      // Generate multiple sitemaps if content exceeds 45k URLs
      entryLimit: 45000,
    }),
    tailwind({
      // Use a separate config file for the blog
      configFile: './tailwind.config.cjs'
    })
  ],
  build: {
    format: 'directory'
  }
});
