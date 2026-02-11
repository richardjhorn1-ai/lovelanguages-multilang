#!/usr/bin/env node
/**
 * Regenerate content_html for all articles (or filtered subset).
 * Re-renders MDX → HTML using the current component-converters and updates Supabase.
 * Use --only-stale to only process articles where HTML would actually change.
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

// Collect all articles (skip target_lang='all')
const affected = data.articles.filter(a => a.target_lang !== 'all');
console.log(`Found ${affected.length} articles to process`);
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
    if (fixed % 200 === 0) console.log(`  Progress: ${fixed} regenerated (${i + 1}/${toProcess.length} checked)...`);
  }
}

console.log(`\nDone. Regenerated: ${fixed}, Failed: ${failed}, Unchanged: ${unchanged}`);
