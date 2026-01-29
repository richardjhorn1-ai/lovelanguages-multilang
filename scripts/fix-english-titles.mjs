import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

const envContent = readFileSync('.env.local', 'utf8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=]+)=["']?(.+?)["']?$/);
  if (match) env[match[1]] = match[2];
}

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Language names for prompts
const LANG_NAMES = {
  no: 'Norwegian', sv: 'Swedish', da: 'Danish', cs: 'Czech', el: 'Greek',
  hu: 'Hungarian', fr: 'French', uk: 'Ukrainian', ro: 'Romanian', ru: 'Russian',
  es: 'Spanish', de: 'German', it: 'Italian', pt: 'Portuguese', pl: 'Polish',
  nl: 'Dutch', tr: 'Turkish'
};

function looksEnglish(title) {
  const englishPatterns = [
    /\bthe\b/i, /\byour partner/i, /\bto melt/i, /\bHow to\b/i,
    /\bLearn \w+ with/i, /\bMaster \w+/i, /\bEssential \w+ for/i,
    /\bGuide to\b/i, /\band\b.*\bwith\b/i, /\bEvery \w+ to\b/i,
    /\bYour \w+'s\b/i, /\bWays to\b/i, /\bTerms of\b/i,
    /\b\w+ Names and\b/i, /\bMake Your\b/i, /'\s*s\s+Heart/i, /\bSay I Love\b/i,
  ];
  return englishPatterns.some(p => p.test(title));
}

async function translateTitle(title, targetLang) {
  const langName = LANG_NAMES[targetLang] || targetLang;

  const result = await model.generateContent(`Translate this article title to ${langName}. Keep the same style - catchy, romantic, for couples learning languages together. Only output the translated title, nothing else.

Title: ${title}`);

  return result.response.text().trim();
}

async function fixTitles(dryRun = true) {
  console.log(dryRun ? '🔍 DRY RUN - No changes will be made\n' : '🔧 FIXING TITLES\n');

  const langs = Object.keys(LANG_NAMES);
  let totalFixed = 0;

  for (const lang of langs) {
    const { data } = await supabase
      .from('blog_articles')
      .select('id, title, slug')
      .eq('native_lang', lang);

    const englishTitles = (data || []).filter(a => looksEnglish(a.title));

    if (englishTitles.length === 0) continue;

    console.log(`\n=== ${LANG_NAMES[lang]} (${lang}): ${englishTitles.length} to fix ===\n`);

    for (const article of englishTitles) {
      try {
        const newTitle = await translateTitle(article.title, lang);

        console.log(`❌ ${article.title}`);
        console.log(`✅ ${newTitle}`);
        console.log(`   slug: ${article.slug}\n`);

        if (!dryRun) {
          await supabase
            .from('blog_articles')
            .update({ title: newTitle })
            .eq('id', article.id);
        }

        totalFixed++;

        // Rate limit
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`Error translating: ${article.title}`, err.message);
      }
    }
  }

  console.log(`\n📊 Total: ${totalFixed} titles ${dryRun ? 'would be' : ''} fixed`);
}

// Run with --fix flag to actually make changes
const dryRun = !process.argv.includes('--fix');
fixTitles(dryRun);
