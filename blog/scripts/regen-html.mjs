#!/usr/bin/env node
/**
 * Regenerate content_html for articles with apostrophes in component props.
 * Fixes the apostrophe truncation bug caused by the old extractProp regex.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit');
  return idx >= 0 ? parseInt(process.argv[idx + 1], 10) : null;
})();

// Load articles
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));

// Find articles whose component props contain apostrophes
const affected = [];
const COMPONENT_RE = /<(?:VocabCard|PhraseOfDay|CultureTip|ConjugationTable)[\s\S]*?\/>/gi;

for (const a of data.articles) {
  if (a.target_lang === 'all') continue;
  const content = a.content || '';
  const tags = content.match(COMPONENT_RE) || [];
  for (const tag of tags) {
    // Check if any prop value contains an apostrophe
    // Match: propName="value with ' inside"
    if (/\w+\s*=\s*"[^"]*'[^"]*"/.test(tag)) {
      affected.push(a);
      break;
    }
  }
}

console.log(`Found ${affected.length} articles with apostrophes in component props`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? affected.slice(0, LIMIT) : affected;
let fixed = 0, failed = 0, unchanged = 0;

for (let i = 0; i < toProcess.length; i++) {
  const article = toProcess[i];
  const label = `[${i + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  let html;
  try {
    const result = convertMdxToHtml(article.content, article.native_lang, article.target_lang);
    html = result.html;
  } catch (e) {
    console.log(`  ${label}: HTML ERROR — ${e.message}`);
    failed++;
    continue;
  }

  // Check if HTML actually changed
  if (html === article.content_html) {
    unchanged++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`  ${label}: WOULD REGEN`);
    fixed++;
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content_html: html })
    .eq('id', article.id);

  if (error) {
    console.log(`  ${label}: DB ERROR — ${error.message}`);
    failed++;
  } else {
    fixed++;
    if (fixed % 50 === 0) console.log(`  Progress: ${fixed} regenerated...`);
  }
}

console.log(`\nDone. Regenerated: ${fixed}, Failed: ${failed}, Unchanged: ${unchanged}`);
