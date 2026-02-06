/**
 * App Sitemap Generator
 *
 * Generates a sitemap-app.xml file containing main app pages
 * that aren't part of the Astro blog build.
 *
 * Run: node scripts/generate-app-sitemap.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const SITE_URL = 'https://www.lovelanguages.io';

// Main app pages that should be in the sitemap
// These are pages from the React app that aren't built by Astro
const APP_PAGES = [
  // Homepage - highest priority
  { url: '/', priority: 1.0, changefreq: 'daily' },

  // Legal pages
  { url: '/terms', priority: 0.3, changefreq: 'monthly' },
  { url: '/privacy', priority: 0.3, changefreq: 'monthly' },

  // These pages require auth but might still be indexed
  // Uncomment if you want them indexed:
  // { url: '/chat', priority: 0.6, changefreq: 'daily' },
  // { url: '/play', priority: 0.6, changefreq: 'daily' },
  // { url: '/log', priority: 0.5, changefreq: 'daily' },
  // { url: '/progress', priority: 0.5, changefreq: 'daily' },
];

// Generate app sitemap XML
function generateAppSitemap() {
  const today = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const page of APP_PAGES) {
    xml += `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
  }

  xml += `</urlset>`;

  return xml;
}

// Update sitemap-index.xml to include the app sitemap
function updateSitemapIndex() {
  const indexPath = path.join(DIST_DIR, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    console.log('sitemap-index.xml not found, creating new one');

    // Create a new sitemap index
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<sitemap><loc>${SITE_URL}/sitemap-0.xml</loc></sitemap>
<sitemap><loc>${SITE_URL}/sitemap-app.xml</loc></sitemap>
<sitemap><loc>${SITE_URL}/sitemap-images.xml</loc></sitemap>
</sitemapindex>`;

    fs.writeFileSync(indexPath, xml);
    return;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');

  // Check if app sitemap is already included
  if (content.includes('sitemap-app.xml')) {
    console.log('App sitemap already in index');
    return;
  }

  // Add app sitemap reference before closing tag
  content = content.replace(
    '</sitemapindex>',
    `<sitemap><loc>${SITE_URL}/sitemap-app.xml</loc></sitemap>\n</sitemapindex>`
  );

  fs.writeFileSync(indexPath, content);
  console.log('Updated sitemap-index.xml to include app sitemap');
}

// Main execution
async function main() {
  console.log('Generating app sitemap...');

  const xml = generateAppSitemap();

  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Write app sitemap
  const outputPath = path.join(DIST_DIR, 'sitemap-app.xml');
  fs.writeFileSync(outputPath, xml);
  console.log(`App sitemap written to: ${outputPath}`);
  console.log(`Included ${APP_PAGES.length} app pages`);

  // Update sitemap index
  updateSitemapIndex();

  console.log('Done!');
}

main().catch(console.error);
