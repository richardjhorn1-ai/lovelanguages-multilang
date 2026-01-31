#!/usr/bin/env node
/**
 * Find missing native→target pairs for Batch 1 topics
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '../../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) {
    env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const NATIVE_LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu'];
const TARGET_LANGS = ['en','es','fr','de','it','pt','nl','pl','ru','uk','tr','ro','sv','no','da','cs','el','hu'];

const BATCH1_TOPICS = [
  { name: 'how-to-say-i-love-you', patterns: ['i-love-you', 'how-to-say'] },
  { name: 'pet-names', patterns: ['pet-names', 'endearment', 'kosenamen', 'sobriquets'] },
  { name: 'greetings-farewells', patterns: ['greetings', 'farewell', 'salutations'] },
  { name: 'meeting-family', patterns: ['meeting', 'family', 'familie'] },
  { name: 'date-night', patterns: ['date-night', 'date night', 'rendez-vous'] },
];

async function main() {
  // Fetch all articles (paginated)
  const articles = [];
  let offset = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('native_lang, target_lang, slug')
      .range(offset, offset + pageSize - 1);

    if (error || !data || data.length === 0) break;
    articles.push(...data);
    offset += data.length;
    if (data.length < pageSize) break;
  }

  console.log(`Loaded ${articles.length} articles\n`);

  // Build a set of what exists
  const exists = new Set();
  for (const a of articles) {
    exists.add(`${a.native_lang}|${a.target_lang}|${a.slug}`);
  }

  // Check each topic
  for (const topic of BATCH1_TOPICS) {
    console.log(`\n📝 ${topic.name.toUpperCase()}`);
    console.log('='.repeat(50));

    let missing = [];
    let found = 0;

    for (const native of NATIVE_LANGS) {
      for (const target of TARGET_LANGS) {
        if (native === target) continue;

        // Check if any article matches the topic patterns
        const hasArticle = articles.some(a =>
          a.native_lang === native &&
          a.target_lang === target &&
          topic.patterns.some(p => a.slug.toLowerCase().includes(p))
        );

        if (hasArticle) {
          found++;
        } else {
          missing.push(`${native}->${target}`);
        }
      }
    }

    console.log(`Found: ${found} / 306 pairs`);
    console.log(`Missing: ${missing.length} pairs`);

    if (missing.length > 0 && missing.length <= 20) {
      console.log(`Missing pairs: ${missing.join(', ')}`);
    } else if (missing.length > 20) {
      console.log(`First 20 missing: ${missing.slice(0, 20).join(', ')}...`);
    }
  }
}

main().catch(console.error);
