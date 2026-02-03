/**
 * Auto Internal Linking Script v2
 *
 * Builds keyword map from actual article titles, then links mentions.
 *
 * Usage:
 *   npx ts-node scripts/auto-internal-links.ts --dry-run    # Preview changes
 *   npx ts-node scripts/auto-internal-links.ts              # Apply changes
 *   npx ts-node scripts/auto-internal-links.ts --limit 100  # Process 100 articles
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

interface Article {
  id: string;
  native_lang: string;
  target_lang: string;
  slug: string;
  title: string;
  content_html: string;
}

interface LinkTarget {
  slug: string;
  title: string;
  keywords: string[];
}

// Extract linkable keywords from title
function extractKeywords(title: string, targetLang: string): string[] {
  const keywords: string[] = [];
  const lowerTitle = title.toLowerCase();

  // Common patterns to extract
  const patterns = [
    /pet names/i,
    /terms of endearment/i,
    /i love you/i,
    /romantic phrases/i,
    /romantic poems/i,
    /grammar basics/i,
    /essential phrases/i,
    /how to flirt/i,
    /how to apologize/i,
    /compliments/i,
    /pronunciation/i,
    /good morning/i,
    /goodnight/i,
    /wedding phrases/i,
    /date night/i,
    /long.distance/i,
    /video calls/i,
    /false friends/i,
    /common words/i,
    /vocabulary/i,
    /greetings/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(lowerTitle)) {
      const match = lowerTitle.match(pattern);
      if (match) {
        keywords.push(match[0].toLowerCase());
      }
    }
  }

  return keywords;
}

// Add link to content (first occurrence only)
function addLink(html: string, phrase: string, url: string, articleSlug: string): { html: string; added: boolean } {
  // Don't link if URL already exists in content
  if (html.includes(url) || html.includes(`href="${url}`)) {
    return { html, added: false };
  }

  // Don't link to same article
  if (url.includes(articleSlug)) {
    return { html, added: false };
  }

  // Create regex that matches the phrase but NOT inside:
  // - existing <a> tags
  // - <h1>-<h6> tags
  // - already has a link around it
  const escapedPhrase = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Simple approach: find first occurrence in plain text sections
  // Split by tags, process text nodes only
  let found = false;
  let result = html;

  // Use a simple state machine approach
  const parts = html.split(/(<[^>]+>)/);
  let inLink = false;
  let inHeading = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Track if we're inside tags we shouldn't modify
    if (part.startsWith('<a ') || part.startsWith('<a>')) inLink = true;
    if (part === '</a>') inLink = false;
    if (/^<h[1-6]/i.test(part)) inHeading = true;
    if (/^<\/h[1-6]>/i.test(part)) inHeading = false;

    // Only process text nodes outside links and headings
    if (!part.startsWith('<') && !inLink && !inHeading && !found) {
      const regex = new RegExp(`\\b(${escapedPhrase})\\b`, 'i');
      if (regex.test(part)) {
        parts[i] = part.replace(regex, `<a href="${url}" class="internal-link">$1</a>`);
        found = true;
      }
    }
  }

  if (found) {
    result = parts.join('');
  }

  return { html: result, added: found };
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg !== -1 ? parseInt(process.argv[limitArg + 1]) : undefined;

  console.log(`🔗 Auto Internal Linking Script v2`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  if (limit) console.log(`Limit: ${limit} articles`);
  console.log('');

  // Step 1: Build keyword map from all articles
  console.log('📚 Building keyword map from article titles...');

  const { data: allArticles, error: fetchError } = await supabase
    .from('blog_articles')
    .select('native_lang, target_lang, slug, title');

  if (fetchError || !allArticles) {
    console.error('Error fetching articles:', fetchError);
    process.exit(1);
  }

  // Build map: for each language pair, map keywords to articles
  // Structure: { "en/pl": { "pet names": { slug, title }, ... } }
  const keywordMap: Record<string, Record<string, { slug: string; title: string }>> = {};

  for (const article of allArticles) {
    const pairKey = `${article.native_lang}/${article.target_lang}`;
    if (!keywordMap[pairKey]) {
      keywordMap[pairKey] = {};
    }

    const keywords = extractKeywords(article.title, article.target_lang);
    for (const kw of keywords) {
      // Only keep first article for each keyword (could improve to keep best)
      if (!keywordMap[pairKey][kw]) {
        keywordMap[pairKey][kw] = { slug: article.slug, title: article.title };
      }
    }
  }

  // Count keywords
  let totalKeywords = 0;
  for (const pair of Object.keys(keywordMap)) {
    totalKeywords += Object.keys(keywordMap[pair]).length;
  }
  console.log(`Built keyword map: ${Object.keys(keywordMap).length} language pairs, ${totalKeywords} total keywords`);

  // Show sample
  const samplePair = 'en/pl';
  if (keywordMap[samplePair]) {
    console.log(`\nSample keywords for ${samplePair}:`);
    Object.entries(keywordMap[samplePair]).slice(0, 5).forEach(([kw, art]) => {
      console.log(`  "${kw}" → ${art.slug.slice(0, 50)}...`);
    });
  }

  // Step 2: Process articles and add links
  console.log('\n📝 Processing articles...');

  const BATCH_SIZE = 100;
  let offset = 0;
  let totalProcessed = 0;
  let totalLinksAdded = 0;
  let articlesModified = 0;

  while (true) {
    if (limit && totalProcessed >= limit) break;

    const batchLimit = limit ? Math.min(BATCH_SIZE, limit - totalProcessed) : BATCH_SIZE;

    const { data: articles, error } = await supabase
      .from('blog_articles')
      .select('id, native_lang, target_lang, slug, title, content_html')
      .range(offset, offset + batchLimit - 1)
      .order('id');

    if (error) {
      console.error('Error fetching batch:', error);
      break;
    }

    if (!articles || articles.length === 0) break;

    for (const article of articles) {
      if (!article.content_html) continue;

      const pairKey = `${article.native_lang}/${article.target_lang}`;
      const pairKeywords = keywordMap[pairKey] || {};

      let content = article.content_html;
      let linksAdded = 0;
      const addedLinks: string[] = [];
      const MAX_LINKS = 5;

      // Try to add links for each keyword
      for (const [keyword, target] of Object.entries(pairKeywords)) {
        if (linksAdded >= MAX_LINKS) break;
        if (target.slug === article.slug) continue; // Don't self-link

        const url = `/learn/${article.native_lang}/${article.target_lang}/${target.slug}/`;
        const result = addLink(content, keyword, url, article.slug);

        if (result.added) {
          content = result.html;
          linksAdded++;
          addedLinks.push(`"${keyword}" → .../${target.slug.slice(0, 30)}...`);
        }
      }

      if (linksAdded > 0) {
        articlesModified++;
        totalLinksAdded += linksAdded;

        if (isDryRun) {
          console.log(`\n📄 ${article.native_lang}/${article.target_lang}/${article.slug.slice(0, 40)}...`);
          addedLinks.forEach(l => console.log(`   + ${l}`));
        } else {
          const { error: updateError } = await supabase
            .from('blog_articles')
            .update({ content_html: content })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Error updating ${article.slug}:`, updateError);
          } else {
            console.log(`✅ ${article.slug.slice(0, 50)} (+${linksAdded} links)`);
          }
        }
      }

      totalProcessed++;
    }

    offset += batchLimit;

    if (totalProcessed % 500 === 0) {
      console.log(`... processed ${totalProcessed} articles`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total articles processed: ${totalProcessed}`);
  console.log(`Articles modified: ${articlesModified}`);
  console.log(`Internal links added: ${totalLinksAdded}`);

  if (isDryRun) {
    console.log('\n⚠️  DRY RUN - Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Changes applied to database.');
  }
}

main().catch(console.error);
