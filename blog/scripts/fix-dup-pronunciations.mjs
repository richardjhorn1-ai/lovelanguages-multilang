#!/usr/bin/env node
/**
 * Fix duplicate pronunciation props in VocabCards/PhraseOfDay.
 * Bug: fix-ai.mjs added a second pronunciation="" instead of replacing the empty one.
 * This script removes the empty duplicate, keeping the correct one.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '../..');

// Import convertMdxToHtml
const { convertMdxToHtml } = await import(path.join(projectRoot, 'blog/scripts/component-converters.mjs'));

// Load env
const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();

// Load articles
const data = JSON.parse(fs.readFileSync(path.join(projectRoot, 'blog/scripts/data/articles-local.json'), 'utf-8'));
const articles = data.articles;

// Find articles with duplicate pronunciation props
const dupArticles = [];
for (const a of articles) {
  const content = a.content || '';
  // Match VocabCard/PhraseOfDay tags that have pronunciation appearing twice
  if (/<(?:VocabCard|PhraseOfDay)[^>]*pronunciation[^>]*pronunciation[^>]*\/?>/i.test(content)) {
    dupArticles.push(a);
  }
}

console.log(`Found ${dupArticles.length} articles with duplicate pronunciation props`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? dupArticles.slice(0, LIMIT) : dupArticles;
let fixed = 0, failed = 0;

for (let i = 0; i < toProcess.length; i++) {
  const article = toProcess[i];
  const label = `[${i + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  let content = article.content;

  // Fix pattern: pronunciation="" ... pronunciation="actual value"
  // Strategy: For each component tag with duplicate pronunciation props,
  // remove the empty one and keep the non-empty one
  const tagRegex = /<(?:VocabCard|PhraseOfDay)[\s\S]*?\/>/gi;
  const newContent = content.replace(tagRegex, (tag) => {
    // Count pronunciation occurrences
    const pronMatches = [...tag.matchAll(/pronunciation\s*=\s*"([^"]*)"/gi)];
    if (pronMatches.length <= 1) return tag; // No duplicate

    // Find the non-empty pronunciation
    const nonEmpty = pronMatches.find(m => m[1].trim() !== '');
    if (!nonEmpty) return tag; // All empty, leave as-is

    // Remove all pronunciation props, then add back the non-empty one
    let cleaned = tag;
    // Remove all pronunciation="..." occurrences
    cleaned = cleaned.replace(/\s*pronunciation\s*=\s*"[^"]*"/gi, '');
    // Add back the good pronunciation before />
    cleaned = cleaned.replace(/\s*\/>/, ` pronunciation="${nonEmpty[1]}" />`);
    return cleaned;
  });

  if (newContent === content) {
    console.log(`  ${label}: NO CHANGE`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${label}: WOULD FIX`);
    fixed++;
    continue;
  }

  // Generate HTML
  let html;
  try {
    const htmlResult = convertMdxToHtml(newContent, article.native_lang, article.target_lang);
    html = htmlResult.html;
  } catch (e) {
    console.log(`  ${label}: HTML ERROR — ${e.message}`);
    failed++;
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: newContent, content_html: html })
    .eq('id', article.id);

  if (error) {
    console.log(`  ${label}: DB ERROR — ${error.message}`);
    failed++;
  } else {
    console.log(`  ${label}: FIXED`);
    fixed++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Failed: ${failed}`);
