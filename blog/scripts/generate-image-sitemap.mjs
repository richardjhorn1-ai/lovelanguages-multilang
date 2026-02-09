/**
 * Image Sitemap Generator
 *
 * Generates a sitemap-images.xml file containing all blog images
 * with their associated article URLs for better image SEO.
 *
 * Run: node scripts/generate-image-sitemap.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '..');
const IMAGES_DIR = path.join(BLOG_DIR, 'public', 'blog');
const DIST_DIR = path.join(BLOG_DIR, 'dist');
const SITE_URL = 'https://www.lovelanguages.io';

// Load env from .env.local for local dev (Vercel has process.env set)
function loadEnv() {
  const env = { ...process.env };
  const envPath = path.join(__dirname, '../../.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const [key, ...vals] = line.split('=');
      if (key && vals.length) {
        env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
  }
  return env;
}

const env = loadEnv();

// Get all blog images
function getBlogImages() {
  if (!fs.existsSync(IMAGES_DIR)) {
    console.log('No blog images directory found');
    return [];
  }

  return fs.readdirSync(IMAGES_DIR)
    .filter(file => /\.(jpg|jpeg|png|webp|gif)$/i.test(file))
    .map(file => ({
      filename: file,
      url: `${SITE_URL}/blog/${file}`,
      // Extract article slug from filename (remove extension)
      articleSlug: file.replace(/\.(jpg|jpeg|png|webp|gif)$/i, '')
    }));
}

// Find the article URL for an image based on filename matching
function findArticleUrl(imageSlug, articleUrls) {
  // Try exact match first
  const exactMatch = articleUrls.find(url => url.includes(`/${imageSlug}/`));
  if (exactMatch) return exactMatch;

  // Try partial match (image slug might be shorter than article slug)
  const partialMatch = articleUrls.find(url => {
    const urlSlug = url.split('/').filter(Boolean).pop();
    return urlSlug && (urlSlug.includes(imageSlug) || imageSlug.includes(urlSlug));
  });

  return partialMatch || null;
}

// Get all article URLs by querying Supabase directly
async function getArticleUrls() {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log('Supabase credentials not found, using default article patterns');
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const allUrls = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('native_lang, target_lang, slug')
      .eq('published', true)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching article URLs from Supabase:', error.message);
      return allUrls;
    }

    if (!data || data.length === 0) break;

    for (const row of data) {
      allUrls.push(`${SITE_URL}/learn/${row.native_lang}/${row.target_lang}/${row.slug}/`);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allUrls;
}

// Generate image sitemap XML
function generateImageSitemap(images, articleUrls) {
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
`;

  // Group images by article URL
  const imagesByArticle = new Map();

  for (const image of images) {
    const articleUrl = findArticleUrl(image.articleSlug, articleUrls);

    if (articleUrl) {
      if (!imagesByArticle.has(articleUrl)) {
        imagesByArticle.set(articleUrl, []);
      }
      imagesByArticle.get(articleUrl).push(image);
    } else {
      // For images without matching articles, create a standalone entry
      // pointing to the English Polish learning hub as a fallback
      const fallbackUrl = `${SITE_URL}/learn/en/pl/`;
      if (!imagesByArticle.has(fallbackUrl)) {
        imagesByArticle.set(fallbackUrl, []);
      }
      imagesByArticle.get(fallbackUrl).push(image);
    }
  }

  // Generate XML entries
  for (const [articleUrl, articleImages] of imagesByArticle) {
    xml += `  <url>
    <loc>${articleUrl}</loc>
`;

    for (const img of articleImages) {
      // Generate caption from filename
      const caption = img.articleSlug
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());

      xml += `    <image:image>
      <image:loc>${img.url}</image:loc>
      <image:caption>${escapeXml(caption)}</image:caption>
      <image:title>${escapeXml(caption)}</image:title>
    </image:image>
`;
    }

    xml += `  </url>
`;
  }

  xml += `</urlset>`;

  return xml;
}

// Escape XML special characters
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Main execution
async function main() {
  console.log('Generating image sitemap...');

  const images = getBlogImages();
  console.log(`Found ${images.length} blog images`);

  const articleUrls = await getArticleUrls();
  console.log(`Found ${articleUrls.length} article URLs`);

  const xml = generateImageSitemap(images, articleUrls);

  // Ensure dist directory exists
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  // Write image sitemap
  const outputPath = path.join(DIST_DIR, 'sitemap-images.xml');
  fs.writeFileSync(outputPath, xml);
  console.log(`Image sitemap written to: ${outputPath}`);

  console.log('Done!');
}

main().catch(console.error);
