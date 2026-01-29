import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Parse .env.local manually
const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1]] = match[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function analyze() {
  // Get Norwegian articles about Czech
  const { data } = await supabase
    .from('blog_articles')
    .select('slug, title, meta_description, native_lang, target_lang')
    .eq('native_lang', 'no')
    .eq('target_lang', 'cs')
    .limit(10);

  console.log('=== Norwegian (no) articles about Czech (cs) ===\n');
  for (const a of data || []) {
    // Check if title looks English (common English words)
    const isEnglish = /\b(the|your|with|for|to|and|Learn|Master|Essential|Guide|How|What|Why|Best|Top)\b/i.test(a.title);
    console.log(`${isEnglish ? '❌ ENGLISH' : '✅ NATIVE'}: ${a.title}`);
    console.log(`   slug: ${a.slug}`);
    console.log('');
  }

  // Count total English titles per native language
  console.log('\n=== English title count by native language ===\n');

  const allLangs = ['es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'tr', 'uk', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

  for (const lang of allLangs) {
    const { data: articles } = await supabase
      .from('blog_articles')
      .select('title')
      .eq('native_lang', lang);

    if (!articles) continue;

    const englishCount = articles.filter(a =>
      /\b(the|your|with|for|and|Learn|Master|Essential|Guide|How|What|Why|Best|Top|to)\b/i.test(a.title)
    ).length;

    console.log(`${lang}: ${englishCount}/${articles.length} English titles (${Math.round(englishCount/articles.length*100)}%)`);
  }
}

analyze();
