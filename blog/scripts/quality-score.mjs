#!/usr/bin/env node
/**
 * quality-score.mjs — Score articles on a 7-point mechanical rubric.
 *
 * Usage:
 *   node quality-score.mjs --native_lang es --target_lang de
 *   node quality-score.mjs --native_lang fr
 *   node quality-score.mjs                    # all articles (slow)
 *
 * Quality Rubric (0-7):
 *   1. Has ≥3 <VocabCard
 *   2. Has ≥1 <PhraseOfDay
 *   3. Has ≥1 <CultureTip
 *   4. Content >800 words (after stripping imports/frontmatter)
 *   5. Has couples-oriented keywords
 *   6. No placeholder pronunciations
 *   7. Has ≥4 ## headings
 *
 * Outputs: [{"id":"uuid","score":4,"missing":["vocabcards","pronunciation"]}]
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

const supabase = createClient(
  env.SUPABASE_URL || env.VITE_SUPABASE_URL,
  env.SUPABASE_SERVICE_KEY
);

// Parse CLI args
const args = process.argv.slice(2);
let nativeLang = null, targetLang = null, threshold = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--native_lang') nativeLang = args[++i];
  if (args[i] === '--target_lang') targetLang = args[++i];
  if (args[i] === '--threshold') threshold = parseInt(args[++i], 10);
}

const COUPLES_KEYWORDS = [
  'love', 'partner', 'couple', 'together', 'romantic', 'heart',
  'amor', 'pareja', 'juntos', 'romántic', // es
  'amour', 'partenaire', 'ensemble', 'romantique', // fr
  'liebe', 'zusammen', 'romantisch', 'paar', // de
  'amore', 'coppia', 'insieme', 'romantic', // it
  'kärlek', 'par', 'tillsammans', // sv
  'kjærlighet', 'sammen', // no
  'kærlighed', 'sammen', // da
  'liefde', 'samen', 'koppel', // nl
  'miłość', 'razem', 'para', // pl
  'láska', 'spolu', 'pár', // cs
  'любов', 'разом', 'пара', // uk
  'любовь', 'вместе', 'пара', // ru
  'αγάπη', 'μαζί', 'ζευγάρι', // el
  'szerelem', 'együtt', // hu
  'aşk', 'birlikte', 'çift', // tr
  'iubire', 'împreună', 'cuplu', // ro
  'amor', 'casal', 'juntos', // pt
];

function stripContent(content) {
  if (!content) return '';
  return content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^import\s+.*$/gm, '')
    .trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function scoreArticle(article) {
  const content = article.content || '';
  const stripped = stripContent(content);
  const missing = [];
  let score = 0;

  // 1. Has ≥3 VocabCards
  const vocabCount = (content.match(/<VocabCard/gi) || []).length;
  if (vocabCount >= 3) {
    score++;
  } else {
    missing.push('vocabcards');
  }

  // 2. Has ≥1 PhraseOfDay
  const phraseCount = (content.match(/<PhraseOfDay/gi) || []).length;
  if (phraseCount >= 1) {
    score++;
  } else {
    missing.push('phraseofday');
  }

  // 3. Has ≥1 CultureTip
  const cultureCount = (content.match(/<CultureTip/gi) || []).length;
  if (cultureCount >= 1) {
    score++;
  } else {
    missing.push('culturetip');
  }

  // 4. Content >800 words
  const wordCount = countWords(stripped);
  if (wordCount > 800) {
    score++;
  } else {
    missing.push('wordcount');
  }

  // 5. Has couples-oriented keywords
  const lower = stripped.toLowerCase();
  const hasCouplesKeyword = COUPLES_KEYWORDS.some(kw => lower.includes(kw));
  if (hasCouplesKeyword) {
    score++;
  } else {
    missing.push('couples-focus');
  }

  // 6. No placeholder pronunciations
  const hasPlaceholder = /pronunciation=["'][/].*?[/]["']/.test(content) ||
    /pronunciation=["']\s*["']/.test(content) ||
    /pronunciation=["']\.\.\.["']/.test(content);
  if (!hasPlaceholder) {
    score++;
  } else {
    missing.push('pronunciation');
  }

  // 7. Has ≥4 ## headings
  const headingCount = (stripped.match(/^##\s+/gm) || []).length;
  if (headingCount >= 4) {
    score++;
  } else {
    missing.push('headings');
  }

  return {
    id: article.id,
    slug: article.slug,
    native_lang: article.native_lang,
    target_lang: article.target_lang,
    score,
    missing,
    details: { vocabCount, phraseCount, cultureCount, wordCount, headingCount },
  };
}

const PAGE_SIZE = 1000;

async function main() {
  process.stderr.write(`quality-score: native=${nativeLang || 'all'}, target=${targetLang || 'all'}\n`);

  const allScores = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`  Fetching ${offset}...\r`);

    let query = supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,content')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (nativeLang) query = query.eq('native_lang', nativeLang);
    if (targetLang) query = query.eq('target_lang', targetLang);

    const { data, error } = await query;
    if (error) { process.stderr.write(`\nError: ${error.message}\n`); break; }
    if (!data || data.length === 0) break;

    for (const article of data) {
      if (article.target_lang === 'all') continue; // skip methodology
      const scored = scoreArticle(article);
      if (threshold === null || scored.score < threshold) {
        allScores.push(scored);
      }
    }

    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  // Summary stats to stderr
  const distribution = [0, 0, 0, 0, 0, 0, 0, 0]; // 0-7
  for (const s of allScores) {
    distribution[s.score]++;
  }

  process.stderr.write(`\n\n--- Quality Score Distribution ---\n`);
  for (let i = 0; i <= 7; i++) {
    const bar = '█'.repeat(Math.ceil(distribution[i] / 50));
    process.stderr.write(`  Score ${i}: ${distribution[i].toString().padStart(5)} ${bar}\n`);
  }
  process.stderr.write(`  Total scored: ${allScores.length}\n`);
  process.stderr.write(`  Average: ${(allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length).toFixed(1)}\n`);

  if (threshold !== null) {
    process.stderr.write(`  Below threshold (${threshold}): ${allScores.length}\n`);
  }

  // Output to stdout
  process.stdout.write(JSON.stringify(allScores, null, 2));
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
