#!/usr/bin/env node
/**
 * Stage 2: Extract stratified samples for subagent semantic review.
 *
 * Strategy:
 *   - 1 sample file per native language (18 files)
 *   - Each file contains articles across ALL 17 target languages for that native
 *   - ~2 articles per language pair = ~34 articles per native language
 *   - Stratified by category and shortest articles (most likely low quality)
 *
 * Subagent waves process 6 target languages per wave (3 waves total).
 *
 * Output: blog/scripts/data/samples/sample-{lang}.json
 *
 * Usage:
 *   node blog/scripts/extract-samples.mjs
 *   node blog/scripts/extract-samples.mjs --per-pair 3    # 3 articles per pair
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let PER_PAIR = 2;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--per-pair') PER_PAIR = parseInt(args[++i], 10);
}

// ─── All Languages ──────────────────────────────────────────────────────────

const ALL_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'uk', 'tr', 'sv', 'no', 'da', 'cs', 'el', 'hu'];
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// Categories to stratify by
const CATEGORIES = ['vocabulary', 'communication', 'phrases', 'situations', 'grammar'];

// ─── Target Language Wave Assignment ────────────────────────────────────────

/**
 * Assign target languages to 3 waves of 6.
 * For a given native language, exclude itself from targets.
 */
function assignWaves(nativeLang) {
  const targets = ALL_LANGS.filter(l => l !== nativeLang);
  // Distribute into 3 waves: 6, 6, 5 (or 6, 6, 5)
  return [
    targets.slice(0, 6),
    targets.slice(6, 12),
    targets.slice(12),
  ];
}

// ─── Sampling ───────────────────────────────────────────────────────────────

function countProseWords(content) {
  if (!content) return 0;
  let prose = content;
  prose = prose.replace(/^import\s+.*$/gm, '');
  prose = prose.replace(/^---[\s\S]*?---/m, '');
  prose = prose.replace(/<CultureTip[^>]*>[\s\S]*?<\/CultureTip>/gi, '');
  prose = prose.replace(/<(?:VocabCard|PhraseOfDay|ConjugationTable|CultureTip|CTA)[\s\S]*?\/>/gi, '');
  prose = prose.replace(/^#{1,3}\s+.+$/gm, '');
  return prose.split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Seeded pseudo-random for reproducible sampling.
 */
function seededRandom(seed) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) & 0xffffffff;
    return (state >>> 0) / 0x100000000;
  };
}

function shuffleWithSeed(arr, seed) {
  const rng = seededRandom(seed);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select PER_PAIR articles for a given (native, target) pair.
 * Strategy: pick 1 from shortest, 1 from random category spread.
 */
function samplePair(articles, nativeLang, targetLang) {
  const pair = articles.filter(a => a.native_lang === nativeLang && a.target_lang === targetLang);
  if (pair.length === 0) return [];

  // Sort by word count ascending (shortest first)
  const withWordCount = pair.map(a => ({
    ...a,
    _wordCount: countProseWords(a.content),
  }));
  withWordCount.sort((a, b) => a._wordCount - b._wordCount);

  const selected = [];
  const selectedIds = new Set();
  const seed = (nativeLang + targetLang).split('').reduce((s, c) => s + c.charCodeAt(0), 0);

  // Pick 1 from shortest quartile (most likely low quality)
  const shortestQuartile = withWordCount.slice(0, Math.max(1, Math.ceil(withWordCount.length / 4)));
  const shuffledShort = shuffleWithSeed(shortestQuartile, seed);
  if (shuffledShort.length > 0) {
    selected.push(shuffledShort[0]);
    selectedIds.add(shuffledShort[0].id);
  }

  // Pick remaining from random category spread
  const remaining = withWordCount.filter(a => !selectedIds.has(a.id));
  const shuffledRemaining = shuffleWithSeed(remaining, seed + 1);

  // Try to get different categories
  const usedCategories = new Set();
  for (const a of shuffledRemaining) {
    if (selected.length >= PER_PAIR) break;
    const cat = (a.category || '').toLowerCase();
    if (!usedCategories.has(cat) || shuffledRemaining.length <= PER_PAIR) {
      selected.push(a);
      selectedIds.add(a.id);
      usedCategories.add(cat);
    }
  }

  // Fill if still under PER_PAIR
  for (const a of shuffledRemaining) {
    if (selected.length >= PER_PAIR) break;
    if (!selectedIds.has(a.id)) {
      selected.push(a);
      selectedIds.add(a.id);
    }
  }

  return selected;
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log(`Loading articles...`);
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));
const articles = data.articles.filter(a => a.target_lang !== 'all');
console.log(`  ${articles.length} articles loaded`);

const samplesDir = path.join(__dirname, 'data/samples');
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

let totalSampled = 0;
const summaryRows = [];

for (const nativeLang of ALL_LANGS) {
  const waves = assignWaves(nativeLang);
  const samplesByWave = [[], [], []];

  for (let w = 0; w < waves.length; w++) {
    for (const targetLang of waves[w]) {
      const sampled = samplePair(articles, nativeLang, targetLang);
      for (const a of sampled) {
        samplesByWave[w].push({
          id: a.id,
          slug: a.slug,
          native_lang: a.native_lang,
          target_lang: a.target_lang,
          category: a.category,
          title: a.title,
          content: a.content,
          content_html: a.content_html,
          _wordCount: a._wordCount,
        });
      }
    }
  }

  const totalForLang = samplesByWave.reduce((s, w) => s + w.length, 0);
  totalSampled += totalForLang;

  const output = {
    native_lang: nativeLang,
    native_lang_name: LANG_NAMES[nativeLang],
    waves: waves.map((targetLangs, i) => ({
      wave: i + 1,
      target_langs: targetLangs,
      articles: samplesByWave[i],
    })),
    total_articles: totalForLang,
    generated_at: new Date().toISOString(),
  };

  const outFile = path.join(samplesDir, `sample-${nativeLang}.json`);
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));

  const waveSizes = samplesByWave.map(w => w.length).join('/');
  console.log(`  ${nativeLang} (${LANG_NAMES[nativeLang]}): ${totalForLang} articles (waves: ${waveSizes})`);
  summaryRows.push({ lang: nativeLang, name: LANG_NAMES[nativeLang], total: totalForLang, waveSizes });
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  EXTRACTION COMPLETE`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Total articles sampled: ${totalSampled}`);
console.log(`  Articles per pair: ${PER_PAIR}`);
console.log(`  Language pairs: ${ALL_LANGS.length * (ALL_LANGS.length - 1)}`);
console.log(`  Output: ${samplesDir}/sample-{lang}.json`);
console.log(`${'═'.repeat(60)}\n`);
