#!/usr/bin/env node
/**
 * Find missing Batch 3B articles for a specific native language
 * Usage: node find-gaps-for-lang-3b.mjs sv
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
  console.error('Usage: node find-gaps-for-lang-3b.mjs <native>');
  process.exit(1);
}

const LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu'];
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', uk: 'Ukrainian',
  tr: 'Turkish', ro: 'Romanian', sv: 'Swedish', no: 'Norwegian', da: 'Danish',
  cs: 'Czech', el: 'Greek', hu: 'Hungarian'
};

// Batch 3B topics
const BATCH_3B = [
  { slug: 'argue', patterns: ['argu', 'fight', 'disagree'], name: 'Arguing & Disagreement Phrases' },
  { slug: 'makeup', patterns: ['makeup', 'make-up', 'reconcil'], name: 'Making Up & Reconciliation Phrases' },
  { slug: 'jealous', patterns: ['jealous'], name: 'Jealousy & Trust Phrases' },
  { slug: 'forgive', patterns: ['forgiv', 'forgive'], name: 'Forgiveness Phrases' },
  { slug: 'first-date', patterns: ['first-date', 'first date'], name: 'First Date Phrases' },
  { slug: '100-common', patterns: ['100-common', '100-words', 'common-words'], name: '100 Most Common Words' },
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
  for (const topic of BATCH_3B) {
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
