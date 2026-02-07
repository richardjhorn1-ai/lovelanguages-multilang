#!/usr/bin/env node
/**
 * build-duplicate-review.mjs — Build a review file for duplicate articles.
 *
 * Reads broken-articles.json and generates duplicate-review.json with
 * recommendations for which article to keep in each pair.
 *
 * Usage:
 *   node build-duplicate-review.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

const dataPath = path.join(__dirname, 'data/broken-articles.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

function countWords(content) {
  if (!content) return 0;
  return content.replace(/^---[\s\S]*?---/m, '').replace(/^import\s+.*$/gm, '').trim().split(/\s+/).filter(w => w.length > 0).length;
}

function scoreArticle(content) {
  if (!content) return 0;
  let score = 0;
  const vocabCount = (content.match(/<VocabCard/gi) || []).length;
  if (vocabCount >= 3) score++;
  if ((content.match(/<PhraseOfDay/gi) || []).length >= 1) score++;
  if ((content.match(/<CultureTip/gi) || []).length >= 1) score++;
  const stripped = content.replace(/^---[\s\S]*?---/m, '').replace(/^import\s+.*$/gm, '').trim();
  if (countWords(content) > 800) score++;
  const headingCount = (stripped.match(/^##\s+/gm) || []).length;
  if (headingCount >= 4) score++;
  return score;
}

async function fetchFullArticles(ids) {
  const articles = [];
  // Fetch in batches of 50
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,title,description,category,content,created_at')
      .in('id', batch);

    if (error) {
      process.stderr.write(`Error fetching articles: ${error.message}\n`);
      continue;
    }
    articles.push(...data);
  }
  return articles;
}

async function main() {
  // Collect all article IDs from both duplicate types
  const allIds = new Set();

  for (const pair of data.issues.duplicates_identical) {
    for (const a of pair.articles) allIds.add(a.id);
  }
  for (const pair of data.issues.duplicates_same_title) {
    for (const a of pair.articles) allIds.add(a.id);
  }

  process.stderr.write(`Fetching ${allIds.size} articles for review...\n`);
  const fullArticles = await fetchFullArticles([...allIds]);
  const articleMap = new Map(fullArticles.map(a => [a.id, a]));

  const review = {
    generated: new Date().toISOString(),
    summary: {
      identical_content_pairs: data.issues.duplicates_identical.length,
      same_title_pairs: data.issues.duplicates_same_title.length,
      total_pairs: data.issues.duplicates_identical.length + data.issues.duplicates_same_title.length,
    },
    pairs: [],
  };

  // Process identical content pairs
  for (const pair of data.issues.duplicates_identical) {
    const articles = pair.articles.map(a => {
      const full = articleMap.get(a.id);
      if (!full) return null;
      return {
        id: a.id,
        slug: full.slug,
        native_lang: full.native_lang,
        target_lang: full.target_lang,
        title: full.title,
        description: full.description,
        category: full.category,
        word_count: countWords(full.content),
        quality_score: scoreArticle(full.content),
        content_length: (full.content || '').length,
        content_preview: (full.content || '').slice(0, 200),
        created_at: full.created_at,
        has_english_slug: /^[a-z0-9-]+$/.test(full.slug) && /^[a-z]/.test(full.slug),
      };
    }).filter(Boolean);

    if (articles.length < 2) continue;

    // Recommendation: keep native-language slug, delete English-style slug
    const nativeSlug = articles.find(a => !a.has_english_slug);
    const englishSlug = articles.find(a => a.has_english_slug);

    let recommendation;
    if (nativeSlug && englishSlug) {
      recommendation = {
        action: 'delete',
        delete_id: englishSlug.id,
        delete_slug: englishSlug.slug,
        keep_id: nativeSlug.id,
        keep_slug: nativeSlug.slug,
        reason: 'Identical content. Keep native-language slug, delete English-style slug.',
      };
    } else {
      // Both have same slug style — keep older one
      const sorted = articles.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      recommendation = {
        action: 'delete',
        delete_id: sorted[1].id,
        delete_slug: sorted[1].slug,
        keep_id: sorted[0].id,
        keep_slug: sorted[0].slug,
        reason: 'Identical content, same slug style. Keep older article.',
      };
    }

    review.pairs.push({
      type: 'identical_content',
      articles,
      recommendation,
    });
  }

  // Process same title pairs
  for (const pair of data.issues.duplicates_same_title) {
    const articles = pair.articles.map(a => {
      const full = articleMap.get(a.id);
      if (!full) return null;
      return {
        id: a.id,
        slug: full.slug,
        native_lang: full.native_lang,
        target_lang: full.target_lang,
        title: full.title,
        description: full.description,
        category: full.category,
        word_count: countWords(full.content),
        quality_score: scoreArticle(full.content),
        content_length: (full.content || '').length,
        content_preview: (full.content || '').slice(0, 200),
        created_at: full.created_at,
        has_english_slug: /^[a-z0-9-]+$/.test(full.slug) && /^[a-z]/.test(full.slug),
      };
    }).filter(Boolean);

    if (articles.length < 2) continue;

    // Recommendation: keep the longer/better-quality article
    const sorted = articles.sort((a, b) => {
      // Primary: quality score
      if (b.quality_score !== a.quality_score) return b.quality_score - a.quality_score;
      // Secondary: content length
      return b.content_length - a.content_length;
    });

    const keep = sorted[0];
    const del = sorted[1];

    review.pairs.push({
      type: 'same_title_different_content',
      articles,
      recommendation: {
        action: 'delete',
        delete_id: del.id,
        delete_slug: del.slug,
        keep_id: keep.id,
        keep_slug: keep.slug,
        reason: `Keep longer/better article (score:${keep.quality_score} len:${keep.content_length}) vs (score:${del.quality_score} len:${del.content_length}).`,
      },
    });
  }

  // Write review file
  const outPath = path.join(__dirname, 'data/duplicate-review.json');
  fs.writeFileSync(outPath, JSON.stringify(review, null, 2));
  process.stderr.write(`Written ${review.pairs.length} pairs to ${outPath}\n`);

  // Summary
  process.stderr.write('\n--- Duplicate Review Summary ---\n');
  process.stderr.write(`  Identical content pairs: ${review.pairs.filter(p => p.type === 'identical_content').length}\n`);
  process.stderr.write(`  Same title pairs: ${review.pairs.filter(p => p.type === 'same_title_different_content').length}\n`);
  process.stderr.write(`  Total articles recommended for deletion: ${review.pairs.length}\n`);
  process.stderr.write('\n  Recommended deletions:\n');
  for (const p of review.pairs) {
    const r = p.recommendation;
    process.stderr.write(`    DELETE: ${r.delete_slug} (${r.delete_id.slice(0, 8)})\n`);
    process.stderr.write(`    KEEP:   ${r.keep_slug} (${r.keep_id.slice(0, 8)})\n`);
    process.stderr.write(`    Reason: ${r.reason}\n\n`);
  }
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
