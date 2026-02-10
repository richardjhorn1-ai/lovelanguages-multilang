#!/usr/bin/env node
/**
 * Phase 1e-1: Fix double-hash headers.
 * Replaces `## ## Something` → `## Something` in content and regenerates HTML.
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

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));

const DOUBLE_HASH_RE = /^## ## /gm;

let fixed = 0, failed = 0;

for (const a of data.articles) {
  if (a.target_lang === 'all') continue;
  const content = a.content || '';
  if (!DOUBLE_HASH_RE.test(content)) continue;
  DOUBLE_HASH_RE.lastIndex = 0;

  const newContent = content.replace(DOUBLE_HASH_RE, '## ');

  let html;
  try {
    const result = convertMdxToHtml(newContent, a.native_lang, a.target_lang);
    html = result.html;
  } catch (e) {
    console.log(`${a.id.slice(0,8)}: HTML ERROR — ${e.message}`);
    failed++;
    continue;
  }

  if (DRY_RUN) {
    console.log(`${a.id.slice(0,8)} ${a.native_lang}\u2192${a.target_lang}: WOULD FIX`);
    fixed++;
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: newContent, content_html: html })
    .eq('id', a.id);

  if (error) {
    console.log(`${a.id.slice(0,8)}: DB ERROR — ${error.message}`);
    failed++;
  } else {
    fixed++;
    if (fixed % 100 === 0) console.log(`  Progress: ${fixed} fixed...`);
  }
}

console.log(`\nDone. Fixed: ${fixed}, Failed: ${failed}`);
