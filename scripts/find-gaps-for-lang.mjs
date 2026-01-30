#!/usr/bin/env node
/**
 * Find missing articles for a specific native language
 * Usage: node find-gaps-for-lang.mjs sv 3a
 *        node find-gaps-for-lang.mjs en 3c
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
const BATCH = process.argv[3];

if (!NATIVE || !BATCH) {
  console.error('Usage: node find-gaps-for-lang.mjs <native> <batch>');
  console.error('  e.g.: node find-gaps-for-lang.mjs sv 3a');
  process.exit(1);
}

const LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu'];
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', uk: 'Ukrainian',
  tr: 'Turkish', ro: 'Romanian', sv: 'Swedish', no: 'Norwegian', da: 'Danish',
  cs: 'Czech', el: 'Greek', hu: 'Hungarian'
};

const BATCH_3A = [
  { slug: 'wedding', name: 'Wedding Phrases' },
  { slug: 'anniversary', name: 'Anniversary Phrases' },
  { slug: 'proposal', name: 'Proposal & Engagement Phrases' },
  { slug: 'birthday', name: 'Birthday Wishes' },
  { slug: 'moving', name: 'Moving In Together Phrases' },
  { slug: 'baby', name: 'Baby & Pregnancy Phrases' },
  { slug: 'travel', name: 'Travel Phrases for Couples' },
];

const BATCH_3C = [
  { slug: 'compliment', name: 'Compliments' },
  { slug: 'texting', name: 'Texting & Chat Phrases' },
  { slug: 'apolog', name: 'Apology Phrases' },
];

const TOPICS = BATCH === '3a' ? BATCH_3A : BATCH_3C;

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
  for (const topic of TOPICS) {
    for (const target of LANGS) {
      if (NATIVE === target) continue;
      const exists = articles.some(a =>
        a.target_lang === target && a.slug.includes(topic.slug)
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
