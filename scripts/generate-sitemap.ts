/**
 * Sitemap Generator Script
 *
 * Run with: npx ts-node scripts/generate-sitemap.ts
 * Or add to package.json: "sitemap": "ts-node scripts/generate-sitemap.ts"
 *
 * This generates a sitemap.xml that includes all blog articles.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import articles from content folder
// Note: For this to work at build time, we read the articles.ts file directly
const articlesPath = path.join(__dirname, '../content/articles.ts');
const articlesContent = fs.readFileSync(articlesPath, 'utf8');

// Parse article slugs from the file (simple regex extraction)
const slugMatches = articlesContent.matchAll(/slug:\s*['"]([^'"]+)['"]/g);
const articleSlugs: string[] = [];
for (const match of slugMatches) {
  articleSlugs.push(match[1]);
}

const BASE_URL = 'https://lovelanguages.io';
const TODAY = new Date().toISOString().split('T')[0];

// Static pages
const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'weekly' },
  { url: '/#/terms', priority: '0.3', changefreq: 'monthly' },
  { url: '/#/privacy', priority: '0.3', changefreq: 'monthly' },
  { url: '/#/learn', priority: '0.8', changefreq: 'daily' },
];

// Generate sitemap XML
let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

// Add static pages
for (const page of staticPages) {
  sitemap += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>${page.priority}</priority>
    <changefreq>${page.changefreq}</changefreq>
  </url>
`;
}

// Add blog articles
for (const slug of articleSlugs) {
  sitemap += `  <url>
    <loc>${BASE_URL}/#/learn/${slug}</loc>
    <lastmod>${TODAY}</lastmod>
    <priority>0.7</priority>
    <changefreq>monthly</changefreq>
  </url>
`;
}

sitemap += `</urlset>
`;

// Write sitemap
const outputPath = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(outputPath, sitemap);

console.log(`✅ Sitemap generated with ${staticPages.length + articleSlugs.length} URLs`);
console.log(`   - ${staticPages.length} static pages`);
console.log(`   - ${articleSlugs.length} blog articles`);
console.log(`   → ${outputPath}`);
