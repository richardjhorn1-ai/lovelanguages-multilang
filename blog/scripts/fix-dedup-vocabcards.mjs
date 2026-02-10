#!/usr/bin/env node
/**
 * Phase 2, Step 6: Deduplicate VocabCards within articles.
 *
 * Mechanical fix (no AI). Finds VocabCards with the same word|translation
 * (case-insensitive), keeps the first occurrence, removes duplicates,
 * regenerates HTML.
 *
 * Usage:
 *   node blog/scripts/fix-dedup-vocabcards.mjs --dry-run
 *   node blog/scripts/fix-dedup-vocabcards.mjs --limit 5
 *   node blog/scripts/fix-dedup-vocabcards.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// ─── Environment ─────────────────────────────────────────────────────────────

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

function getVocabSignature(tag) {
  const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  return (word + '|' + translation).toLowerCase();
}

// ─── Main ────────────────────────────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));
const articles = data.articles.filter(a => a.target_lang !== 'all');

// Find articles with duplicate VocabCards
const dupArticles = [];
for (const a of articles) {
  const content = a.content || '';
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  if (vocabMatches.length < 2) continue;

  const sigs = [];
  const hasDups = [];
  for (const tag of vocabMatches) {
    const sig = getVocabSignature(tag);
    if (!sig || sig === '|') continue;
    if (sigs.includes(sig)) {
      hasDups.push(sig);
    }
    sigs.push(sig);
  }

  if (hasDups.length > 0) {
    dupArticles.push({ article: a, dupCount: hasDups.length });
  }
}

console.log(`Found ${dupArticles.length} articles with duplicate VocabCards`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? dupArticles.slice(0, LIMIT) : dupArticles;
let fixed = 0, failed = 0;

for (let i = 0; i < toProcess.length; i++) {
  const { article, dupCount } = toProcess[i];
  const label = `[${i + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  let content = article.content;
  const seen = new Set();
  let removed = 0;

  // Replace all VocabCard tags, keeping first occurrence of each signature
  const newContent = content.replace(/<VocabCard[\s\S]*?\/>/gi, (tag) => {
    const sig = getVocabSignature(tag);
    if (!sig || sig === '|') return tag; // Can't determine signature, keep

    if (seen.has(sig)) {
      removed++;
      return ''; // Remove duplicate
    }
    seen.add(sig);
    return tag;
  });

  // Clean up extra blank lines left by removed tags
  const cleaned = newContent.replace(/\n{3,}/g, '\n\n');

  if (cleaned === content || removed === 0) {
    console.log(`  ${label}: NO CHANGE`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${label}: WOULD REMOVE ${removed} duplicates`);
    fixed++;
    continue;
  }

  // Generate HTML
  let html;
  try {
    const htmlResult = convertMdxToHtml(cleaned, article.native_lang, article.target_lang);
    html = htmlResult.html;
  } catch (e) {
    console.log(`  ${label}: HTML ERROR — ${e.message}`);
    failed++;
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: cleaned, content_html: html })
    .eq('id', article.id);

  if (error) {
    console.log(`  ${label}: DB ERROR — ${error.message}`);
    failed++;
  } else {
    console.log(`  ${label}: REMOVED ${removed} duplicates`);
    fixed++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Failed: ${failed}`);
