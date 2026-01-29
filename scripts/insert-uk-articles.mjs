#!/usr/bin/env node
/**
 * Inserts pre-generated Ukrainian articles into Supabase
 * Articles are provided as JSON via stdin
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Parse .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([A-Z_]+)=["']?(.+?)["']?$/);
  if (m) env[m[1]] = m[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function insertArticle(article) {
  const { error } = await supabase
    .from('blog_articles')
    .insert(article);

  if (error) {
    console.error(`Error inserting ${article.slug}:`, error.message);
    return false;
  }
  console.log(`✅ Inserted: ${article.slug}`);
  return true;
}

// Read articles from file argument
const articlesFile = process.argv[2];
if (!articlesFile) {
  console.error('Usage: node insert-uk-articles.mjs <articles.json>');
  process.exit(1);
}

const articles = JSON.parse(fs.readFileSync(articlesFile, 'utf8'));
let success = 0;
let failed = 0;

for (const article of articles) {
  const result = await insertArticle(article);
  if (result) success++;
  else failed++;
}

console.log(`\nDone: ${success} inserted, ${failed} failed`);
