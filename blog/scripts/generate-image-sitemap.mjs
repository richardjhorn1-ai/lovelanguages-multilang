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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, '..');
const IMAGES_DIR = path.join(BLOG_DIR, 'public', 'blog');
const DIST_DIR = path.join(BLOG_DIR, 'dist');
const SITE_URL = 'https://lovelanguages.io';

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

// Get all article URLs from the built sitemap
function getArticleUrls() {
  const sitemapPath = path.join(DIST_DIR, 'sitemap-0.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.log('Main sitemap not found, using default article patterns');
    return [];
  }

  const content = fs.readFileSync(sitemapPath, 'utf-8');
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
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

// Update sitemap-index.xml to include the image sitemap
function updateSitemapIndex() {
  const indexPath = path.join(DIST_DIR, 'sitemap-index.xml');
  if (!fs.existsSync(indexPath)) {
    console.log('sitemap-index.xml not found');
    return;
  }

  let content = fs.readFileSync(indexPath, 'utf-8');

  // Check if image sitemap is already included
  if (content.includes('sitemap-images.xml')) {
    console.log('Image sitemap already in index');
    return;
  }

  // Add image sitemap reference before closing tag
  content = content.replace(
    '</sitemapindex>',
    `<sitemap><loc>${SITE_URL}/sitemap-images.xml</loc></sitemap>\n</sitemapindex>`
  );

  fs.writeFileSync(indexPath, content);
  console.log('Updated sitemap-index.xml to include image sitemap');
}

// Main execution
async function main() {
  console.log('Generating image sitemap...');

  const images = getBlogImages();
  console.log(`Found ${images.length} blog images`);

  const articleUrls = getArticleUrls();
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

  // Update sitemap index
  updateSitemapIndex();

  console.log('Done!');
}

main().catch(console.error);
