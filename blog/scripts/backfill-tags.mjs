#!/usr/bin/env node
/**
 * backfill-tags.mjs — Generate tags for articles with null/empty tags.
 * Uses deterministic logic (no LLM) to derive tags from title, category, language, difficulty.
 *
 * Usage:
 *   node blog/scripts/backfill-tags.mjs --preview 10    # Show 10 sample tag sets
 *   node blog/scripts/backfill-tags.mjs --dry-run        # Stats only
 *   node blog/scripts/backfill-tags.mjs | node blog/scripts/update-batch.mjs --dry-run
 *   node blog/scripts/backfill-tags.mjs | node blog/scripts/update-batch.mjs
 *
 * Output: JSON array to stdout: [{id, tags}, ...]
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

const DRY_RUN = process.argv.includes('--dry-run');
const PREVIEW = parseInt(process.argv.find((_, i, a) => a[i - 1] === '--preview') || '0');

const LANGUAGE_INFO = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ru: 'Russian', uk: 'Ukrainian', sv: 'Swedish', no: 'Norwegian',
  da: 'Danish', cs: 'Czech', el: 'Greek', hu: 'Hungarian',
  tr: 'Turkish', ro: 'Romanian'
};

// Stop words to exclude from title keyword extraction
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'for', 'in', 'to', 'of', 'is', 'are',
  'how', 'your', 'with', 'my', 'learn', 'learning', 'guide', 'essential',
  'complete', 'ultimate', 'best', 'top', 'most', 'that', 'this', 'from',
  'will', 'can', 'what', 'when', 'where', 'why', 'which', 'their',
  'you', 'we', 'they', 'it', 'its', 'be', 'has', 'have', 'had',
  'do', 'does', 'did', 'not', 'but', 'if', 'on', 'at', 'by', 'as',
  'every', 'all', 'about', 'more', 'some', 'any', 'each', 'make',
  'like', 'just', 'over', 'also', 'into', 'than', 'way', 'our',
  // Language names (handled separately)
  ...Object.values(LANGUAGE_INFO).map(n => n.toLowerCase()),
]);

function generateTags(article) {
  const tags = new Set();

  // 1. Category tag
  if (article.category) {
    tags.add(article.category);
  }

  // 2. Target language name
  const langName = LANGUAGE_INFO[article.target_lang];
  if (langName) {
    tags.add(langName.toLowerCase());
  }

  // 3. Difficulty tag
  if (article.difficulty) {
    tags.add(article.difficulty);
  }

  // 4. Relationship context
  tags.add('couples language learning');

  // 5. Title keywords (extract 2-3 meaningful words)
  if (article.title) {
    const words = article.title
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/gi, ' ')  // Remove special chars (keep apostrophes/hyphens)
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS.has(w));

    // Take up to 3 keywords
    for (const word of words.slice(0, 3)) {
      tags.add(word);
    }
  }

  return [...tags].slice(0, 6);  // Max 6 tags
}

async function fetchArticlesWithNullTags() {
  const allData = [];
  const PAGE_SIZE = 1000;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, title, description, category, difficulty, target_lang, native_lang')
      .eq('published', true)
      .is('tags', null)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      process.stderr.write(`Error fetching articles: ${error.message}\n`);
      return allData;
    }

    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  // Also fetch articles with empty tags array
  offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, title, description, category, difficulty, target_lang, native_lang')
      .eq('published', true)
      .eq('tags', '{}')
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) break;
    if (!data || data.length === 0) break;

    // Avoid duplicates
    const existingIds = new Set(allData.map(a => a.id));
    for (const d of data) {
      if (!existingIds.has(d.id)) allData.push(d);
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allData;
}

async function main() {
  process.stderr.write('Fetching articles with null/empty tags...\n');
  const articles = await fetchArticlesWithNullTags();
  process.stderr.write(`  Found ${articles.length} articles needing tags\n\n`);

  if (articles.length === 0) {
    process.stderr.write('No articles need tag backfill. Done.\n');
    process.stdout.write('[]');
    return;
  }

  if (DRY_RUN) {
    // Show stats
    const byCat = {};
    const byLang = {};
    for (const a of articles) {
      byCat[a.category] = (byCat[a.category] || 0) + 1;
      byLang[a.target_lang] = (byLang[a.target_lang] || 0) + 1;
    }
    process.stderr.write('By category:\n');
    for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
      process.stderr.write(`  ${cat}: ${count}\n`);
    }
    process.stderr.write('\nBy target language:\n');
    for (const [lang, count] of Object.entries(byLang).sort((a, b) => b[1] - a[1])) {
      process.stderr.write(`  ${lang} (${LANGUAGE_INFO[lang] || lang}): ${count}\n`);
    }

    // Show 5 samples
    process.stderr.write('\nSample tags:\n');
    for (const a of articles.slice(0, 5)) {
      const tags = generateTags(a);
      process.stderr.write(`  "${a.title}" → [${tags.join(', ')}]\n`);
    }
    return;
  }

  if (PREVIEW > 0) {
    process.stderr.write(`Preview mode: showing ${PREVIEW} samples\n\n`);
    for (const a of articles.slice(0, PREVIEW)) {
      const tags = generateTags(a);
      process.stderr.write(`  Title: "${a.title}"\n`);
      process.stderr.write(`  Category: ${a.category} | Lang: ${a.target_lang} | Difficulty: ${a.difficulty}\n`);
      process.stderr.write(`  Tags: [${tags.join(', ')}]\n\n`);
    }
    return;
  }

  // Generate all tags and output
  const output = articles.map(a => ({
    id: a.id,
    tags: generateTags(a)
  }));

  process.stderr.write(`Generated tags for ${output.length} articles\n`);
  process.stdout.write(JSON.stringify(output));
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
