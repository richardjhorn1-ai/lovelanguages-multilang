import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// Pick diverse pairs to spot-check
const PAIRS = [
  ['de', 'it'], ['es', 'pl'], ['uk', 'hu'], ['fr', 'nl'],
  ['tr', 'cs'], ['en', 'de'], ['pt', 'ru'], ['da', 'el'],
];

console.log(`\n${'═'.repeat(70)}`);
console.log('  GEMINI QUALITY SPOT-CHECK — Post-Fix Verification');
console.log(`${'═'.repeat(70)}\n`);

let passed = 0, failed = 0;

for (const [native, target] of PAIRS) {
  // Grab one random article from this pair
  const { data: articles } = await supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, title, content')
    .eq('native_lang', native)
    .eq('target_lang', target)
    .eq('published', true)
    .limit(3);

  if (!articles || articles.length === 0) continue;

  // Pick the one with the most VocabCards
  const article = articles.sort((a, b) =>
    (b.content?.match(/<VocabCard/gi)?.length || 0) - (a.content?.match(/<VocabCard/gi)?.length || 0)
  )[0];

  const cards = (article.content?.match(/<VocabCard[\s\S]*?\/>/gi) || []).map(tag => {
    const word = (tag.match(/word\s*=\s*"([^"]*)"/)||[])[1] || '';
    const trans = (tag.match(/translation\s*=\s*"([^"]*)"/)||[])[1] || '';
    const pron = (tag.match(/pronunciation\s*=\s*"([^"]*)"/)||[])[1] || '';
    const ex = (tag.match(/example\s*=\s*"([^"]*)"/)||[])[1] || '';
    return { word, trans, pron, ex };
  });

  if (cards.length === 0) continue;

  const nativeName = LANG_NAMES[native];
  const targetName = LANG_NAMES[target];

  let prompt = `You are a strict quality checker for a language-learning blog. This article teaches ${targetName} to ${nativeName} speakers.

Title: "${article.title}"

VocabCards:
`;
  for (let i = 0; i < cards.length; i++) {
    const c = cards[i];
    prompt += `  [${i}] word="${c.word}" translation="${c.trans}" pronunciation="${c.pron}"`;
    if (c.ex) prompt += ` example="${c.ex}"`;
    prompt += `\n`;
  }

  prompt += `
Check EVERY VocabCard for:
1. Is \`word\` in ${targetName}? (not ${nativeName} or another language)
2. Is \`translation\` in ${nativeName}? (not ${targetName} or another language)
3. Does \`example\` use the word in a natural ${targetName} sentence?
4. Does the vocabulary match the article title/topic?
5. Is \`pronunciation\` a reasonable phonetic guide? (not IPA, not just the word copied)

Give a verdict: PASS or FAIL. If FAIL, list the specific card numbers and issues. Be concise — 3 sentences max.`;

  try {
    const result = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const verdict = result.text.trim();
    const isPassing = verdict.toUpperCase().startsWith('PASS');

    console.log(`${native}→${target} | ${article.slug}`);
    console.log(`  Title: ${article.title}`);
    console.log(`  Cards: ${cards.length} | Sample: word="${cards[0].word}" trans="${cards[0].trans}"`);
    console.log(`  Verdict: ${verdict}`);
    console.log();

    if (isPassing) passed++;
    else failed++;
  } catch (e) {
    console.log(`${native}→${target}: ERROR — ${e.message}\n`);
  }
}

console.log(`${'═'.repeat(70)}`);
console.log(`  PASSED: ${passed}/${passed + failed} | FAILED: ${failed}/${passed + failed}`);
console.log(`${'═'.repeat(70)}\n`);
