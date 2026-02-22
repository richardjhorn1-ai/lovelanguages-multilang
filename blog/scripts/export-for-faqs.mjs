#!/usr/bin/env node
/**
 * export-for-faqs.mjs — Export article metadata from Supabase to local JSON files
 * for subagent FAQ generation.
 *
 * Usage:
 *   node blog/scripts/export-for-faqs.mjs                    # Export all articles, split into batches of 150
 *   node blog/scripts/export-for-faqs.mjs --batch-size 100   # Custom batch size
 *   node blog/scripts/export-for-faqs.mjs --test              # Export 15 test articles (5 en, 5 pl, 5 es)
 *
 * Output: blog/scripts/faq-data/articles-{lang}-{batch}.json
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

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BATCH_SIZE = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--batch-size') || '150');
const TEST_MODE = process.argv.includes('--test');
const OUTPUT_DIR = path.join(__dirname, 'faq-data');

const LANGUAGE_INFO = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ru: 'Russian', uk: 'Ukrainian', sv: 'Swedish', no: 'Norwegian',
  da: 'Danish', cs: 'Czech', el: 'Greek', hu: 'Hungarian',
  tr: 'Turkish', ro: 'Romanian'
};

/**
 * Extract markdown headings from article content.
 * Returns a compact summary of what the article already covers.
 */
function extractHeadings(content) {
  if (!content || typeof content !== 'string') return [];
  const headings = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (match) {
      headings.push(match[2].trim());
    }
  }
  return headings;
}

async function fetchAllArticles(nativeLang) {
  const allData = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    let query = supabase
      .from('blog_articles')
      .select('id, title, description, category, difficulty, target_lang, native_lang, content')
      .eq('native_lang', nativeLang)
      .eq('published', true)
      .is('faq_items', null)
      .order('target_lang', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    const { data, error } = await query;

    if (error) {
      process.stderr.write(`Error fetching articles for ${nativeLang}: ${error.message}\n`);
      return allData;
    }

    if (!data || data.length === 0) break;

    // Extract headings from content, then drop content to keep export files small
    for (const article of data) {
      article.headings = extractHeadings(article.content);
      delete article.content;
    }

    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  if (TEST_MODE) {
    process.stderr.write('TEST MODE: Exporting 5 articles each for en, pl, es\n\n');

    const testLangs = ['en', 'pl', 'es'];
    const testArticles = [];

    for (const lang of testLangs) {
      const articles = await fetchAllArticles(lang);
      // Pick 5 diverse articles (different categories if possible)
      const categories = [...new Set(articles.map(a => a.category))];
      const picked = [];
      for (const cat of categories) {
        if (picked.length >= 5) break;
        const fromCat = articles.find(a => a.category === cat && !picked.includes(a));
        if (fromCat) picked.push(fromCat);
      }
      // Fill remaining slots
      for (const a of articles) {
        if (picked.length >= 5) break;
        if (!picked.includes(a)) picked.push(a);
      }
      testArticles.push(...picked);
      process.stderr.write(`  ${lang}: picked ${picked.length} articles (categories: ${[...new Set(picked.map(a => a.category))].join(', ')})\n`);
    }

    const outFile = path.join(OUTPUT_DIR, 'articles-test.json');
    fs.writeFileSync(outFile, JSON.stringify(testArticles, null, 2));
    process.stderr.write(`\nWrote ${testArticles.length} test articles to ${outFile}\n`);
    return;
  }

  // Full export
  const allLangs = Object.keys(LANGUAGE_INFO);
  let totalArticles = 0;
  let totalFiles = 0;

  for (const lang of allLangs) {
    const articles = await fetchAllArticles(lang);

    if (articles.length === 0) {
      process.stderr.write(`  ${lang} (${LANGUAGE_INFO[lang]}): 0 articles — skipping\n`);
      continue;
    }

    // Split into batches
    const batchCount = Math.ceil(articles.length / BATCH_SIZE);
    for (let i = 0; i < batchCount; i++) {
      const batch = articles.slice(i * BATCH_SIZE, (i + 1) * BATCH_SIZE);
      const batchNum = i + 1;
      const outFile = path.join(OUTPUT_DIR, `articles-${lang}-${batchNum}.json`);
      fs.writeFileSync(outFile, JSON.stringify(batch, null, 2));
      totalFiles++;
    }

    process.stderr.write(`  ${lang} (${LANGUAGE_INFO[lang]}): ${articles.length} articles → ${batchCount} batch files\n`);
    totalArticles += articles.length;
  }

  process.stderr.write(`\n--- Export complete ---\n`);
  process.stderr.write(`  Total articles: ${totalArticles}\n`);
  process.stderr.write(`  Total batch files: ${totalFiles}\n`);
  process.stderr.write(`  Batch size: ${BATCH_SIZE}\n`);
  process.stderr.write(`  Output directory: ${OUTPUT_DIR}\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
