#!/usr/bin/env node
/**
 * Simple article inserter - takes JSON from stdin and inserts to Supabase
 * Usage: echo '{"native_lang":"sv","target_lang":"en",...}' | node insert-article.mjs
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function main() {
  // Read JSON from stdin
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const article = JSON.parse(input);

  // Validate required fields
  const required = ['native_lang', 'target_lang', 'slug', 'title', 'description', 'content'];
  for (const field of required) {
    if (!article[field]) {
      console.error(`Missing required field: ${field}`);
      process.exit(1);
    }
  }

  // Insert
  const { data, error } = await supabase.from('blog_articles').insert({
    native_lang: article.native_lang,
    target_lang: article.target_lang,
    slug: article.slug,
    title: article.title,
    description: article.description,
    content: article.content,
    category: article.category || 'phrases',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).select();

  if (error) {
    console.error('Insert error:', error.message);
    process.exit(1);
  }

  console.log('✅ Inserted:', article.slug);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
