/**
 * Articles Sitemap Generator
 *
 * Generates sitemap XML files for all blog articles in Supabase.
 * Splits into multiple files (50k URLs max per sitemap per Google spec).
 *
 * Run: node scripts/generate-articles-sitemap.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'blog', 'dist');
const SITE_URL = 'https://www.lovelanguages.io';
const URLS_PER_SITEMAP = 45000; // Keep under 50k limit

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getAllArticles() {
  const allArticles = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('slug, native_lang, target_lang, updated_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allArticles.push(...data);
    offset += limit;
    console.log(`Fetched ${allArticles.length} articles...`);

    if (data.length < limit) break;
  }

  return allArticles;
}

function generateSitemapXml(articles) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  for (const article of articles) {
    const lastmod = article.updated_at
      ? new Date(article.updated_at).toISOString().split('T')[0]
      : today;

    xml += `  <url>
    <loc>${SITE_URL}/learn/${article.native_lang}/${article.target_lang}/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
  }

  xml += `</urlset>`;
  return xml;
}

function updateSitemapIndex(sitemapFiles) {
  const indexPath = path.join(DIST_DIR, 'sitemap-index.xml');
  const today = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE_URL}/sitemap-0.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-app.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE_URL}/sitemap-images.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;

  for (const file of sitemapFiles) {
    xml += `  <sitemap>
    <loc>${SITE_URL}/${file}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
`;
  }

  xml += `</sitemapindex>`;

  fs.writeFileSync(indexPath, xml);
  console.log(`Updated sitemap-index.xml with ${sitemapFiles.length + 3} total sitemaps`);
}

async function main() {
  console.log('Generating article sitemaps from Supabase...\n');

  const articles = await getAllArticles();
  console.log(`\nTotal articles: ${articles.length}\n`);

  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Split into multiple sitemaps if needed
  const sitemapFiles = [];
  const chunks = [];

  for (let i = 0; i < articles.length; i += URLS_PER_SITEMAP) {
    chunks.push(articles.slice(i, i + URLS_PER_SITEMAP));
  }

  for (let i = 0; i < chunks.length; i++) {
    const filename = `sitemap-articles-${i + 1}.xml`;
    const xml = generateSitemapXml(chunks[i]);
    const outputPath = path.join(DIST_DIR, filename);

    fs.writeFileSync(outputPath, xml);
    sitemapFiles.push(filename);
    console.log(`Written ${filename} with ${chunks[i].length} URLs`);
  }

  // Update sitemap index
  updateSitemapIndex(sitemapFiles);

  console.log(`\n✅ Done! Generated ${sitemapFiles.length} sitemap file(s) with ${articles.length} total URLs`);
}

main().catch(console.error);
