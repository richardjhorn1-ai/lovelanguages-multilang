#!/usr/bin/env node
/**
 * Canonicalize internal article links stored in Supabase content/content_html.
 *
 * Behavior:
 * 1. Rewrite known alias or stale article URLs to canonical article URLs.
 * 2. Remove unresolved HTML article anchors while preserving visible text.
 * 3. Update both content and content_html when needed.
 *
 * Usage:
 *   node fix-broken-internal-links.mjs --dry-run
 *   node fix-broken-internal-links.mjs
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchPublishedArticleLinkMap,
  resolveCanonicalArticlePath,
  rewriteCanonicalArticleLinks,
} from './article-link-map.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const dryRun = process.argv.includes('--dry-run');
const PAGE_SIZE = 200;
const LINK_REGEX = /<a\s[^>]*href=["'](\/learn\/[^"']+?)["'][^>]*>([\s\S]*?)<\/a>/gi;

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function unwrapBrokenAnchors(html, brokenLinks) {
  let nextHtml = html;

  for (const link of brokenLinks) {
    if (nextHtml.includes(link.fullTag)) {
      nextHtml = nextHtml.split(link.fullTag).join(link.anchorText);
    }
  }

  return nextHtml;
}

console.log('Loading canonical article and alias map...');
const linkMap = await fetchPublishedArticleLinkMap(supabase);
console.log(`  Published article rows: ${linkMap.articles.length}`);
console.log(`  Alias rows: ${linkMap.aliases.length}`);
console.log(`  Canonical article URLs: ${linkMap.canonicalByKey.size}`);
console.log(`  Alias URL mappings: ${linkMap.aliasByKey.size}`);

const issueSummary = Object.entries(linkMap.issues)
  .filter(([, value]) => value.length > 0)
  .map(([key, value]) => `${key}=${value.length}`)
  .join(', ');
if (issueSummary) {
  console.log(`  Integrity issues: ${issueSummary}`);
}

console.log('\nScanning articles for stale or broken internal links...');
const articlesToFix = [];
let totalArticlesScanned = 0;
let totalBrokenLinks = 0;
let totalCanonicalRewrites = 0;
let offset = 0;

while (true) {
  const { data, error } = await supabase
    .from('blog_articles')
    .select('id, native_lang, target_lang, slug, content, content_html')
    .eq('published', true)
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    console.error('Error fetching articles:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    break;
  }

  for (const article of data) {
    const originalContent = article.content || '';
    const originalContentHtml = article.content_html || '';
    const rewrittenContent = rewriteCanonicalArticleLinks(originalContent, linkMap);
    const rewrittenContentHtml = rewriteCanonicalArticleLinks(originalContentHtml, linkMap);
    const brokenLinks = [];

    let match;
    LINK_REGEX.lastIndex = 0;
    while ((match = LINK_REGEX.exec(rewrittenContentHtml)) !== null) {
      const fullTag = match[0];
      const href = match[1];
      const anchorText = match[2].replace(/<[^>]*>/g, '').trim();
      const canonicalPath = resolveCanonicalArticlePath(href, linkMap);

      if (!canonicalPath) {
        brokenLinks.push({ fullTag, href, anchorText });
      }
    }

    const finalContentHtml = brokenLinks.length > 0
      ? unwrapBrokenAnchors(rewrittenContentHtml, brokenLinks)
      : rewrittenContentHtml;

    const contentChanged = originalContent !== rewrittenContent;
    const contentHtmlChanged = originalContentHtml !== finalContentHtml;
    const articleRewriteCount =
      Number(contentChanged) +
      Number(originalContentHtml !== rewrittenContentHtml);

    if (contentChanged || contentHtmlChanged) {
      articlesToFix.push({
        id: article.id,
        native_lang: article.native_lang,
        target_lang: article.target_lang,
        slug: article.slug,
        content: originalContent,
        content_html: originalContentHtml,
        nextContent: rewrittenContent,
        nextContentHtml: finalContentHtml,
        brokenLinks,
        rewriteCount: articleRewriteCount,
      });

      totalCanonicalRewrites += articleRewriteCount;
      totalBrokenLinks += brokenLinks.length;
    }
  }

  totalArticlesScanned += data.length;
  process.stderr.write(`  Scanned ${totalArticlesScanned} articles...\r`);

  if (data.length < PAGE_SIZE) {
    break;
  }

  offset += PAGE_SIZE;
}

console.log(`\n\nScan complete:`);
console.log(`  Articles scanned: ${totalArticlesScanned}`);
console.log(`  Articles to update: ${articlesToFix.length}`);
console.log(`  Canonical rewrite surfaces changed: ${totalCanonicalRewrites}`);
console.log(`  Broken anchors removed: ${totalBrokenLinks}`);

if (articlesToFix.length === 0) {
  console.log('\nNo canonicalization work needed.');
  process.exit(0);
}

console.log('\n--- SAMPLES (first 10 articles) ---\n');
for (const article of articlesToFix.slice(0, 10)) {
  console.log(`${article.native_lang}/${article.target_lang}/${article.slug}:`);
  if (article.rewriteCount > 0) {
    console.log(`  ↪ Canonicalized stored links (${article.rewriteCount} surface changes)`);
  }
  for (const link of article.brokenLinks.slice(0, 5)) {
    console.log(`  ❌ Removed ${link.href} → "${link.anchorText.substring(0, 50)}"`);
  }
}

if (dryRun) {
  console.log(`\n[DRY RUN] Would update ${articlesToFix.length} articles.`);
  const report = articlesToFix.map(article => ({
    id: article.id,
    slug: `${article.native_lang}/${article.target_lang}/${article.slug}`,
    rewrote_links: article.rewriteCount,
    removed_broken_links: article.brokenLinks.map(link => ({
      path: link.href,
      text: link.anchorText,
    })),
  }));
  const reportPath = path.join(__dirname, 'data/broken-links-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report saved to ${reportPath}`);
  process.exit(0);
}

console.log(`\nUpdating ${articlesToFix.length} articles in Supabase...`);
let updated = 0;
let errors = 0;

for (let i = 0; i < articlesToFix.length; i += 10) {
  const batch = articlesToFix.slice(i, i + 10);

  const promises = batch.map(async (article) => {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (article.content !== article.nextContent) {
      updateData.content = article.nextContent;
    }

    if (article.content_html !== article.nextContentHtml) {
      updateData.content_html = article.nextContentHtml;
    }

    if (Object.keys(updateData).length === 1) {
      return;
    }

    const { error } = await supabase
      .from('blog_articles')
      .update(updateData)
      .eq('id', article.id);

    if (error) {
      console.error(`  Error updating ${article.id}: ${error.message}`);
      errors++;
    } else {
      updated++;
    }
  });

  await Promise.all(promises);
  process.stderr.write(`  ${updated + errors}/${articlesToFix.length} processed\r`);
}

console.log(`\n\nDone!`);
console.log(`  Updated: ${updated}`);
console.log(`  Errors: ${errors}`);
