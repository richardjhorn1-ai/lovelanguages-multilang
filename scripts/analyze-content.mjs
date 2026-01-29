import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1]] = match[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

function looksEnglish(text) {
  if (!text) return false;
  const englishPatterns = [
    /\bthe\b/i, /\byour partner/i, /\bto melt/i, /\bHow to\b/i,
    /\bLearn \w+ with/i, /\bMaster \w+/i, /\bEssential \w+ for/i,
    /\bGuide to\b/i, /\bEvery \w+ to\b/i, /\bYour \w+'s\b/i,
    /\bWays to\b/i, /\bTerms of\b/i, /\bMake Your\b/i,
    /'\s*s\s+Heart/i, /\bSay I Love\b/i, /\bwith your\b/i,
    /\bfor couples\b/i, /\bto impress\b/i, /\bto charm\b/i,
  ];
  return englishPatterns.some(p => p.test(text));
}

async function analyze() {
  console.log('=== FULL CONTENT ANALYSIS ===\n');

  // Get sample articles for each non-English language
  const langs = ['no', 'sv', 'da', 'cs', 'el', 'hu', 'fr', 'es', 'de'];

  for (const lang of langs) {
    const { data } = await supabase
      .from('blog_articles')
      .select('title, meta_description, native_lang, target_lang')
      .eq('native_lang', lang)
      .limit(5);

    console.log(`\n=== ${lang.toUpperCase()} - Sample articles ===`);
    for (const a of data || []) {
      const titleEn = looksEnglish(a.title);
      const descEn = looksEnglish(a.meta_description);

      console.log(`\nTarget: ${a.target_lang}`);
      console.log(`Title ${titleEn ? '❌EN' : '✅OK'}: ${a.title}`);
      console.log(`Desc  ${descEn ? '❌EN' : '✅OK'}: ${a.meta_description?.substring(0, 80)}...`);
    }
  }

  // Summary counts
  console.log('\n\n=== SUMMARY BY LANGUAGE ===\n');
  console.log('Lang | Total | Eng Titles | Eng Descs');
  console.log('-----|-------|------------|----------');

  const allLangs = ['es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'tr', 'uk', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

  let totalEngTitles = 0;
  let totalEngDescs = 0;

  for (const lang of allLangs) {
    const { data } = await supabase
      .from('blog_articles')
      .select('title, meta_description')
      .eq('native_lang', lang);

    const engTitles = (data || []).filter(a => looksEnglish(a.title)).length;
    const engDescs = (data || []).filter(a => looksEnglish(a.meta_description)).length;

    totalEngTitles += engTitles;
    totalEngDescs += engDescs;

    console.log(`${lang}   | ${String(data?.length || 0).padStart(5)} | ${String(engTitles).padStart(10)} | ${String(engDescs).padStart(9)}`);
  }

  console.log('-----|-------|------------|----------');
  console.log(`TOTAL|       | ${String(totalEngTitles).padStart(10)} | ${String(totalEngDescs).padStart(9)}`);
}

analyze();
