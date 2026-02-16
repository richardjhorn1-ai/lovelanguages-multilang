#!/usr/bin/env node
/**
 * fix-broken-internal-links.mjs
 *
 * Scans all published articles for internal links pointing to deleted/non-existent articles.
 * Removes broken <a> tags while preserving their anchor text.
 *
 * Usage:
 *   node fix-broken-internal-links.mjs --dry-run    # Scan and report only
 *   node fix-broken-internal-links.mjs              # Apply fixes to Supabase
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const dryRun = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Step 1: Build a set of all valid (native_lang, target_lang, slug) combos
console.log('Loading all published article slugs...');
const validSlugs = new Set();
const PAGE_SIZE = 1000;
let offset = 0;
while (true) {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('native_lang, target_lang, slug')
    .eq('published', true)
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error('Error fetching slugs:', error.message);
    process.exit(1);
  }
  for (const a of data || []) {
    validSlugs.add(`${a.native_lang}/${a.target_lang}/${a.slug}`);
  }
  if (!data || data.length < PAGE_SIZE) break;
  offset += PAGE_SIZE;
}
console.log(`  ${validSlugs.size} valid article slugs loaded.\n`);

// Step 2: Scan all articles for internal links
console.log('Scanning articles for broken internal links...');
const LINK_REGEX = /<a\s[^>]*href=["']\/learn\/([^"']+?)["'][^>]*>([\s\S]*?)<\/a>/gi;
const articlesToFix = [];
let totalBrokenLinks = 0;
let totalArticlesScanned = 0;

const CONTENT_PAGE_SIZE = 200; // Smaller batches for content-heavy queries
offset = 0;
while (true) {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, native_lang, target_lang, slug, content, content_html')
    .eq('published', true)
    .range(offset, offset + CONTENT_PAGE_SIZE - 1);

  if (error) {
    console.error('Error fetching articles:', error.message);
    process.exit(1);
  }
  if (!data || data.length === 0) break;

  for (const article of data) {
    // Check both content and content_html
    const htmlContent = article.content_html || article.content || '';
    const brokenLinks = [];

    let match;
    LINK_REGEX.lastIndex = 0;
    while ((match = LINK_REGEX.exec(htmlContent)) !== null) {
      const fullTag = match[0];
      let linkPath = match[1];
      const anchorText = match[2];

      // Remove trailing slash for comparison
      linkPath = linkPath.replace(/\/$/, '');

      // Skip non-article links (hub pages, methodology, etc.)
      const parts = linkPath.split('/');
      if (parts.length < 3) continue; // Hub page links like /learn/en/pl/
      if (parts[1] === 'all') continue; // Methodology links
      if (parts[1] === 'couples-language-learning') continue;
      if (parts[1] === 'topics') continue;

      // Check if this slug exists
      if (!validSlugs.has(linkPath)) {
        brokenLinks.push({ fullTag, linkPath, anchorText: anchorText.replace(/<[^>]*>/g, '').trim() });
      }
    }

    if (brokenLinks.length > 0) {
      articlesToFix.push({
        id: article.id,
        native_lang: article.native_lang,
        target_lang: article.target_lang,
        slug: article.slug,
        brokenLinks,
        content: article.content,
        content_html: article.content_html,
      });
      totalBrokenLinks += brokenLinks.length;
    }
  }

  totalArticlesScanned += data.length;
  process.stderr.write(`  Scanned ${totalArticlesScanned} articles...\r`);

  if (data.length < CONTENT_PAGE_SIZE) break;
  offset += CONTENT_PAGE_SIZE;
}

console.log(`\n\nScan complete:`);
console.log(`  Articles scanned: ${totalArticlesScanned}`);
console.log(`  Articles with broken links: ${articlesToFix.length}`);
console.log(`  Total broken links: ${totalBrokenLinks}`);

if (articlesToFix.length === 0) {
  console.log('\n✅ No broken internal links found.');
  process.exit(0);
}

// Show samples
console.log('\n--- SAMPLES (first 10 articles) ---\n');
for (const article of articlesToFix.slice(0, 10)) {
  console.log(`${article.native_lang}/${article.target_lang}/${article.slug}:`);
  for (const link of article.brokenLinks) {
    console.log(`  ❌ /learn/${link.linkPath} → "${link.anchorText.substring(0, 50)}"`);
  }
}

if (dryRun) {
  console.log(`\n[DRY RUN] Would fix ${articlesToFix.length} articles (${totalBrokenLinks} broken links).`);

  // Save report
  const report = articlesToFix.map(a => ({
    id: a.id,
    slug: `${a.native_lang}/${a.target_lang}/${a.slug}`,
    brokenLinks: a.brokenLinks.map(l => ({ path: `/learn/${l.linkPath}`, text: l.anchorText })),
  }));
  const reportPath = path.join(__dirname, 'data/broken-links-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);
  process.exit(0);
}

// Step 3: Fix broken links by unwrapping <a> tags (keep text, remove link)
console.log(`\nFixing ${totalBrokenLinks} broken links in ${articlesToFix.length} articles...`);
let fixed = 0;
let errors = 0;

for (let i = 0; i < articlesToFix.length; i += 10) {
  const batch = articlesToFix.slice(i, i + 10);

  const promises = batch.map(async (article) => {
    let newContent = article.content || '';
    let newContentHtml = article.content_html || '';

    for (const link of article.brokenLinks) {
      // Replace the full <a> tag with just the anchor text (unwrap the link)
      if (newContent.includes(link.fullTag)) {
        newContent = newContent.split(link.fullTag).join(link.anchorText);
      }
      if (newContentHtml.includes(link.fullTag)) {
        newContentHtml = newContentHtml.split(link.fullTag).join(link.anchorText);
      }
    }

    const updateData = {};
    if (article.content && newContent !== article.content) {
      updateData.content = newContent;
    }
    if (article.content_html && newContentHtml !== article.content_html) {
      updateData.content_html = newContentHtml;
    }

    if (Object.keys(updateData).length === 0) return;

    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', article.id);

    if (error) {
      console.error(`  Error fixing ${article.id}: ${error.message}`);
      errors++;
    } else {
      fixed++;
    }
  });

  await Promise.all(promises);
  process.stderr.write(`  ${fixed + errors}/${articlesToFix.length} processed\r`);
}

console.log(`\n\nDone!`);
console.log(`  Fixed: ${fixed}`);
console.log(`  Errors: ${errors}`);
