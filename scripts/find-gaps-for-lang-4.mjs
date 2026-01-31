#!/usr/bin/env node
/**
 * Find missing Batch 4 articles for a specific native language
 * Usage: node find-gaps-for-lang-4.mjs sv
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

const NATIVE = process.argv[2];

if (!NATIVE) {
  console.error('Usage: node find-gaps-for-lang-4.mjs <native>');
  process.exit(1);
}

const LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu'];
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', uk: 'Ukrainian',
  tr: 'Turkish', ro: 'Romanian', sv: 'Swedish', no: 'Norwegian', da: 'Danish',
  cs: 'Czech', el: 'Greek', hu: 'Hungarian'
};

// Batch 4 topics
const BATCH_4 = [
  { slug: 'flirt', patterns: ['flirt'], name: 'Flirting Phrases' },
  { slug: 'miss-you', patterns: ['miss-you', 'miss you', 'missing'], name: 'I Miss You Phrases' },
  { slug: 'love-letter', patterns: ['love-letter', 'love letter'], name: 'Love Letter Writing' },
  { slug: 'in-laws', patterns: ['in-laws', 'in laws', 'inlaws', 'parents'], name: 'Meeting the In-Laws Phrases' },
  { slug: 'support', patterns: ['support', 'comfort', 'encourage'], name: 'Emotional Support & Comfort Phrases' },
];

async function main() {
  // Fetch existing articles for this native language
  const articles = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('blog_articles')
      .select('target_lang, slug')
      .eq('native_lang', NATIVE)
      .range(offset, offset + 999);
    if (!data?.length) break;
    articles.push(...data);
    offset += data.length;
  }

  // Find missing
  const missing = [];
  for (const topic of BATCH_4) {
    for (const target of LANGS) {
      if (NATIVE === target) continue;
      const exists = articles.some(a =>
        a.target_lang === target &&
        topic.patterns.some(p => a.slug.toLowerCase().includes(p))
      );
      if (!exists) {
        missing.push({
          native: NATIVE,
          nativeName: LANG_NAMES[NATIVE],
          target,
          targetName: LANG_NAMES[target],
          topicSlug: topic.slug,
          topicName: topic.name,
        });
      }
    }
  }

  // Output as JSON
  console.log(JSON.stringify(missing, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
