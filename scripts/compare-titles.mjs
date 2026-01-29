import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1]] = match[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

async function compare() {
  // Get Norwegian articles - show correct and incorrect
  const { data: noArticles } = await supabase
    .from('blog_articles')
    .select('slug, title, native_lang')
    .eq('native_lang', 'no')
    .limit(20);

  console.log('=== NORWEGIAN (no) - Correct vs English ===\n');

  for (const a of noArticles || []) {
    const isEnglish = /\b(the|your|with|for|and|Learn|Master|Essential|Guide|How|What|Why|Best|Top|to)\b/i.test(a.title);
    if (isEnglish) {
      console.log(`❌ ${a.title}`);
    }
  }
  console.log('\n--- Correctly translated ---\n');
  for (const a of noArticles || []) {
    const isEnglish = /\b(the|your|with|for|and|Learn|Master|Essential|Guide|How|What|Why|Best|Top|to)\b/i.test(a.title);
    if (!isEnglish) {
      console.log(`✅ ${a.title}`);
    }
  }

  // Compare with Spanish which has 6% English
  console.log('\n\n=== SPANISH (es) - Mostly correct ===\n');
  const { data: esArticles } = await supabase
    .from('blog_articles')
    .select('slug, title')
    .eq('native_lang', 'es')
    .limit(10);

  for (const a of esArticles || []) {
    console.log(`✅ ${a.title}`);
  }

  // Get total counts
  console.log('\n\n=== TOTAL ARTICLES NEEDING TITLE FIXES ===\n');

  const langs = [
    { code: 'no', name: 'Norwegian' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'el', name: 'Greek' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'cs', name: 'Czech' },
    { code: 'fr', name: 'French' },
    { code: 'uk', name: 'Ukrainian' },
    { code: 'ro', name: 'Romanian' },
    { code: 'ru', name: 'Russian' },
  ];

  let total = 0;
  for (const lang of langs) {
    const { data } = await supabase
      .from('blog_articles')
      .select('title')
      .eq('native_lang', lang.code);

    const englishCount = (data || []).filter(a =>
      /\b(the|your|with|for|and|Learn|Master|Essential|Guide|How|What|Why|Best|Top|to)\b/i.test(a.title)
    ).length;

    if (englishCount > 10) {
      console.log(`${lang.name} (${lang.code}): ${englishCount} articles need translation`);
      total += englishCount;
    }
  }
  console.log(`\nTOTAL: ${total} articles need title translation`);
}

compare();
