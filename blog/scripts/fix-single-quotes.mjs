#!/usr/bin/env node
/**
 * Normalize single-quoted component props to double quotes.
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const { convertMdxToHtml } = await import(path.join(__dirname, 'component-converters.mjs'));

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

const data = JSON.parse(fs.readFileSync(path.join(projectRoot, 'blog/scripts/data/articles-local.json'), 'utf-8'));

const DRY_RUN = process.argv.includes('--dry-run');

// Find articles with single-quoted props in components
const COMPONENT_RE = /<(?:VocabCard|PhraseOfDay|CultureTip|ConjugationTable)[\s\S]*?\/>/gi;

let fixed = 0;
for (const article of data.articles) {
  const content = article.content || '';
  const tags = content.match(COMPONENT_RE) || [];

  let hasChange = false;
  let newContent = content;

  for (const tag of tags) {
    // Replace single-quoted prop values with double-quoted
    // Match: propName='value' → propName="value"
    const fixedTag = tag.replace(/(\b\w+)\s*=\s*'([^']*)'/g, '$1="$2"');
    if (fixedTag !== tag) {
      newContent = newContent.replace(tag, fixedTag);
      hasChange = true;
    }
  }

  if (!hasChange) continue;

  console.log(`${article.id.slice(0,8)} ${article.native_lang}→${article.target_lang}: normalizing quotes`);

  if (DRY_RUN) {
    fixed++;
    continue;
  }

  let html;
  try {
    const result = convertMdxToHtml(newContent, article.native_lang, article.target_lang);
    html = result.html;
  } catch (e) {
    console.log(`  HTML ERROR: ${e.message}`);
    continue;
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: newContent, content_html: html })
    .eq('id', article.id);

  if (error) {
    console.log(`  DB ERROR: ${error.message}`);
  } else {
    console.log(`  FIXED`);
    fixed++;
  }
}

console.log(`\nDone. Fixed: ${fixed}`);
