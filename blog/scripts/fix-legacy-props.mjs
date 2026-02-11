#!/usr/bin/env node
/**
 * Stage 1, Step 1.1: Fix legacy component props.
 *
 * Mechanical fix (no AI). Renames:
 *   polish="X"  → word="X"
 *   english="X" → translation="X"
 *
 * in VocabCard and PhraseOfDay components. Regenerates HTML after.
 *
 * Usage:
 *   node blog/scripts/fix-legacy-props.mjs --dry-run
 *   node blog/scripts/fix-legacy-props.mjs --limit 5
 *   node blog/scripts/fix-legacy-props.mjs
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

// ─── Main ────────────────────────────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));
const articles = data.articles.filter(a => a.target_lang !== 'all');

// Find articles with legacy props
const legacyArticles = [];
for (const a of articles) {
  const content = a.content || '';
  // Match polish= or english= inside VocabCard or PhraseOfDay tags
  const hasPolish = /<(?:VocabCard|PhraseOfDay)[\s\S]*?polish\s*=\s*"[^"]*"[\s\S]*?\/>/i.test(content);
  const hasEnglish = /<(?:VocabCard|PhraseOfDay)[\s\S]*?english\s*=\s*"[^"]*"[\s\S]*?\/>/i.test(content);
  if (hasPolish || hasEnglish) {
    legacyArticles.push({ article: a, hasPolish, hasEnglish });
  }
}

console.log(`Found ${legacyArticles.length} articles with legacy props`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? legacyArticles.slice(0, LIMIT) : legacyArticles;
let fixed = 0, failed = 0;

for (let i = 0; i < toProcess.length; i++) {
  const { article, hasPolish, hasEnglish } = toProcess[i];
  const label = `[${i + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;
  const props = [hasPolish && 'polish', hasEnglish && 'english'].filter(Boolean).join('+');

  let content = article.content;
  let changes = 0;

  // Rename polish= → word= inside VocabCard/PhraseOfDay tags
  // Only rename if the tag doesn't already have a word= prop
  content = content.replace(/<(?:VocabCard|PhraseOfDay)[\s\S]*?\/>/gi, (tag) => {
    let newTag = tag;

    // polish= → word= (only if no existing word= prop)
    if (/polish\s*=\s*"/.test(newTag) && !/\bword\s*=\s*"/.test(newTag)) {
      newTag = newTag.replace(/polish\s*=\s*"/, 'word="');
      changes++;
    }

    // english= → translation= (only if no existing translation= prop)
    if (/english\s*=\s*"/.test(newTag) && !/\btranslation\s*=\s*"/.test(newTag)) {
      newTag = newTag.replace(/english\s*=\s*"/, 'translation="');
      changes++;
    }

    return newTag;
  });

  if (changes === 0) {
    console.log(`  ${label}: NO CHANGE (already has word/translation)`);
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${label}: WOULD FIX ${changes} props (${props})`);
    fixed++;
    continue;
  }

  // Generate HTML
  let html;
  try {
    const htmlResult = convertMdxToHtml(content, article.native_lang, article.target_lang);
    html = htmlResult.html;
  } catch (e) {
    console.log(`  ${label}: HTML ERROR \u2014 ${e.message}`);
    failed++;
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content, content_html: html })
    .eq('id', article.id);

  if (error) {
    console.log(`  ${label}: DB ERROR \u2014 ${error.message}`);
    failed++;
  } else {
    console.log(`  ${label}: FIXED ${changes} props (${props})`);
    fixed++;
  }
}

console.log(`\nDone. Fixed: ${fixed}, Failed: ${failed}`);
