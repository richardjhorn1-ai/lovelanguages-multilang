#!/usr/bin/env node
/**
 * Fix broken internal links in blog articles
 *
 * Strategy:
 * 1. Build index of all valid articles by language pair
 * 2. Scan each article's content_html for /learn/ links
 * 3. For broken links, fuzzy match to find best existing article
 * 4. Update content_html with corrected links
 */

import { createClient } from '../blog/node_modules/@supabase/supabase-js/dist/index.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env manually
function loadEnv(filepath) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch (e) {}
}

loadEnv(path.join(__dirname, '../.env.local'));
loadEnv(path.join(__dirname, '../blog/.env'));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Tokenize slug into keywords for matching
function tokenize(slug) {
  return slug
    .replace(/-/g, ' ')
    .replace(/[0-9]+/g, '')
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// Calculate similarity score between two slugs
function similarity(slug1, slug2) {
  const tokens1 = new Set(tokenize(slug1));
  const tokens2 = new Set(tokenize(slug2));

  let matches = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) matches++;
  }

  const total = Math.max(tokens1.size, tokens2.size);
  return total > 0 ? matches / total : 0;
}

// Find best matching article for a broken link
function findBestMatch(brokenSlug, candidates) {
  let bestMatch = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarity(brokenSlug, candidate);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestScore >= 0.3 ? { slug: bestMatch, score: bestScore } : null;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const limit = process.argv.includes('--limit')
    ? parseInt(process.argv[process.argv.indexOf('--limit') + 1])
    : null;

  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  if (limit) console.log(`Limit: ${limit} articles`);

  // Step 1: Build index of all articles by language pair
  console.log('\n📚 Loading all articles...');

  // Paginate to get all articles (Supabase default limit is 1000)
  const allArticles = [];
  const pageSize = 1000;
  let page = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, slug, native_lang, target_lang, content_html')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Failed to load articles:', error);
      process.exit(1);
    }

    allArticles.push(...data);
    console.log(`  Loaded page ${page + 1}: ${data.length} articles (total: ${allArticles.length})`);

    if (data.length < pageSize) break;
    page++;
  }

  console.log(`Loaded ${allArticles.length} articles total`);

  // Build lookup: { "no/es": ["spanish-greetings-...", "spanish-pet-names-..."] }
  const articlesByLangPair = {};
  for (const art of allArticles) {
    const key = `${art.native_lang}/${art.target_lang}`;
    if (!articlesByLangPair[key]) articlesByLangPair[key] = [];
    articlesByLangPair[key].push(art.slug);
  }

  // Build valid paths set for quick lookup
  const validPaths = new Set();
  for (const art of allArticles) {
    validPaths.add(`/learn/${art.native_lang}/${art.target_lang}/${art.slug}`);
  }

  // Step 2: Process articles with internal links
  console.log('\n🔍 Scanning for broken links...');

  const linkRegex = /href="(\/learn\/([a-z]{2})\/([a-z]{2})\/([^"\/]+))\/?"/g;

  let totalBroken = 0;
  let totalFixed = 0;
  let totalFallback = 0;
  let articlesToUpdate = [];

  const articlesToProcess = limit ? allArticles.slice(0, limit) : allArticles;

  for (const article of articlesToProcess) {
    if (!article.content_html) continue;

    let html = article.content_html;
    let modified = false;
    let match;

    // Reset regex
    linkRegex.lastIndex = 0;

    const fixes = [];

    while ((match = linkRegex.exec(article.content_html)) !== null) {
      const [fullMatch, path, nativeLang, targetLang, slug] = match;
      const cleanPath = path.replace(/\/$/, ''); // Remove trailing slash

      // Check if valid
      if (validPaths.has(cleanPath)) continue;

      totalBroken++;

      // Try to find a match in same language pair
      const langKey = `${nativeLang}/${targetLang}`;
      const candidates = articlesByLangPair[langKey] || [];

      const bestMatch = findBestMatch(slug, candidates);

      if (bestMatch) {
        const newPath = `/learn/${nativeLang}/${targetLang}/${bestMatch.slug}`;
        fixes.push({
          old: path,
          new: newPath,
          score: bestMatch.score,
          type: 'fuzzy'
        });
        totalFixed++;
      } else {
        // Fallback: link to language pair landing page
        const fallbackPath = `/learn/${nativeLang}/${targetLang}`;
        fixes.push({
          old: path,
          new: fallbackPath,
          score: 0,
          type: 'fallback'
        });
        totalFallback++;
        if (totalFallback <= 10) {
          console.log(`  ⚠️  Fallback to landing: ${path} → ${fallbackPath}`);
        }
      }
    }

    // Apply fixes to HTML
    if (fixes.length > 0) {
      for (const fix of fixes) {
        // Replace both with and without trailing slash
        html = html.replace(
          new RegExp(`href="${fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?"`),
          `href="${fix.new}"`
        );
      }

      articlesToUpdate.push({
        id: article.id,
        content_html: html,
        fixes: fixes.length
      });
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`   Broken links found: ${totalBroken}`);
  console.log(`   Fixed (fuzzy match): ${totalFixed}`);
  console.log(`   Fixed (fallback to landing): ${totalFallback}`);
  console.log(`   Articles to update: ${articlesToUpdate.length}`);

  // Step 3: Update articles
  if (!dryRun && articlesToUpdate.length > 0) {
    console.log('\n💾 Updating articles...');

    let updated = 0;
    for (const art of articlesToUpdate) {
      const { error } = await supabase
        .from('blog_articles')
        .update({ content_html: art.content_html })
        .eq('id', art.id);

      if (error) {
        console.error(`Failed to update article ${art.id}:`, error);
      } else {
        updated++;
        if (updated % 100 === 0) {
          console.log(`   Updated ${updated}/${articlesToUpdate.length}`);
        }
      }
    }

    console.log(`\n✅ Done! Updated ${updated} articles.`);
  } else if (dryRun) {
    console.log('\n⚠️  Dry run - no changes made. Run without --dry-run to apply fixes.');

    // Show sample fixes
    console.log('\n📝 Sample fixes:');
    for (const art of articlesToUpdate.slice(0, 3)) {
      console.log(`\n   Article ID: ${art.id} (${art.fixes} fixes)`);
    }
  }
}

main().catch(console.error);
