import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1]] = match[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

// Better English detection - look for distinctly English patterns
function looksEnglish(title) {
  // Common English phrases that wouldn't appear in other languages
  const englishPatterns = [
    /\bthe\b/i,           // "the" doesn't exist in most languages
    /\byour partner/i,    // "your partner" is English
    /\bto melt/i,         // "to melt" pattern
    /\bHow to\b/i,        // "How to" is English
    /\bLearn \w+ with/i,  // "Learn X with"
    /\bMaster \w+/i,      // "Master something"
    /\bEssential \w+ for/i, // "Essential X for"
    /\bGuide to\b/i,      // "Guide to"
    /\band\b.*\bwith\b/i, // "and...with" combo
    /\bEvery \w+ to\b/i,  // "Every X to"
    /\bYour \w+'s\b/i,    // "Your X's" possessive
    /\bWays to\b/i,       // "Ways to"
    /\bTerms of\b/i,      // "Terms of"
    /\b\w+ Names and\b/i, // "X Names and"
    /\bMake Your\b/i,     // "Make Your"
    /'\s*s\s+Heart/i,     // "'s Heart"
    /\bSay I Love\b/i,    // "Say I Love"
  ];

  return englishPatterns.some(p => p.test(title));
}

async function analyze() {
  console.log('=== NORWEGIAN (no) - Examples ===\n');

  const { data: noArticles } = await supabase
    .from('blog_articles')
    .select('slug, title')
    .eq('native_lang', 'no')
    .limit(30);

  let englishCount = 0;
  let norwegianCount = 0;

  for (const a of noArticles || []) {
    const isEnglish = looksEnglish(a.title);
    if (isEnglish) {
      englishCount++;
      if (englishCount <= 10) console.log(`❌ EN: ${a.title}`);
    } else {
      norwegianCount++;
      if (norwegianCount <= 5) console.log(`✅ NO: ${a.title}`);
    }
  }

  // Count for all languages
  console.log('\n\n=== ENGLISH TITLES BY LANGUAGE (refined detection) ===\n');

  const langs = ['es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'tr', 'uk', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

  let grandTotal = 0;
  for (const lang of langs) {
    const { data } = await supabase
      .from('blog_articles')
      .select('title, slug')
      .eq('native_lang', lang);

    const english = (data || []).filter(a => looksEnglish(a.title));

    if (english.length > 0) {
      console.log(`${lang}: ${english.length}/${data.length} (${Math.round(english.length/data.length*100)}%)`);
      grandTotal += english.length;
    }
  }

  console.log(`\n📊 TOTAL: ${grandTotal} articles with English titles`);
}

analyze();
