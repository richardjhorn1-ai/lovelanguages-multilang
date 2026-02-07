#!/usr/bin/env node
/**
 * audit-deep.mjs — Comprehensive audit of blog_articles title/description quality.
 *
 * Checks:
 *   1. English titles remaining (per language)
 *   2. Null/empty descriptions
 *   3. Description length distribution (target: 140-170 chars)
 *   4. Title length distribution (target: 50-70 chars)
 *   5. Formulaic/template descriptions (EL especially)
 *   6. Generic descriptions (not topic-specific)
 *   7. PT failed push (null description or English title)
 *   8. Spot-check samples per language
 *
 * Usage:
 *   node audit-deep.mjs
 *   node audit-deep.mjs --native_lang el
 *   node audit-deep.mjs --spot-check 3
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from ../../.env.local
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
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
let filterLang = null;
let spotCheckCount = 3;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--native_lang') filterLang = args[++i];
  if (args[i] === '--spot-check') spotCheckCount = parseInt(args[++i], 10);
}

// English title detection
const ENGLISH_TITLE_WORDS = new Set([
  'the', 'and', 'for', 'your', 'how', 'to', 'with', 'most', 'common',
  'essential', 'learn', 'guide', 'tips', 'words', 'phrases', 'couples', 'every',
  'best', 'ways', 'say', 'that', 'will', 'make', 'you', 'their', 'complete',
  'romantic', 'together', 'vocabulary', 'language', 'expressions',
]);

function titleLooksEnglish(title, nativeLang) {
  if (!title || nativeLang === 'en') return false;
  const words = title.toLowerCase().split(/\s+/);
  let englishCount = 0;
  for (const w of words) {
    if (ENGLISH_TITLE_WORDS.has(w)) englishCount++;
  }
  return englishCount >= 3;
}

// Generic description detection
const GENERIC_PATTERNS = [
  /learn .+ with your partner/i,
  /discover .+ with your partner/i,
  /master .+ with your partner/i,
  /explore .+ with your partner/i,
  /practice .+ with your loved one/i,
  /improve your .+ skills as a couple/i,
];

function descriptionLooksGeneric(desc) {
  if (!desc) return false;
  return GENERIC_PATTERNS.some(p => p.test(desc));
}

// Formulaic description detection (all ~same length, same pattern)
function descriptionLooksFormulaic(desc) {
  if (!desc) return false;
  // Check if it's exactly 160 chars (EL pattern)
  if (desc.length === 160) return true;
  return false;
}

const PAGE_SIZE = 1000;
const ALL_LANGS = ['es', 'it', 'sv', 'hu', 'fr', 'de', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'no', 'da', 'cs', 'el'];

async function fetchAllArticles() {
  const allArticles = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`  Fetching ${offset}...\r`);

    let query = supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,title,description,category')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (filterLang) query = query.eq('native_lang', filterLang);
    // Exclude methodology articles
    query = query.neq('target_lang', 'all');

    const { data, error } = await query;
    if (error) {
      process.stderr.write(`\nError: ${error.message}\n`);
      break;
    }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  process.stderr.write(`\n  Total articles fetched: ${allArticles.length}\n\n`);
  return allArticles;
}

function analyzeLang(articles, lang) {
  const langArticles = articles.filter(a => a.native_lang === lang);
  if (langArticles.length === 0) return null;

  const stats = {
    lang,
    total: langArticles.length,
    englishTitles: 0,
    nullDescriptions: 0,
    emptyDescriptions: 0,
    genericDescriptions: 0,
    formulaicDescriptions: 0,
    titleLengths: [],
    descLengths: [],
    englishTitleSamples: [],
    nullDescSamples: [],
    genericDescSamples: [],
    formulaicDescSamples: [],
  };

  for (const a of langArticles) {
    // English titles
    if (titleLooksEnglish(a.title, a.native_lang)) {
      stats.englishTitles++;
      if (stats.englishTitleSamples.length < 3) {
        stats.englishTitleSamples.push({ id: a.id, title: a.title, slug: a.slug });
      }
    }

    // Null/empty descriptions
    if (a.description === null) {
      stats.nullDescriptions++;
      if (stats.nullDescSamples.length < 3) {
        stats.nullDescSamples.push({ id: a.id, title: a.title, slug: a.slug });
      }
    } else if (a.description.trim() === '') {
      stats.emptyDescriptions++;
      if (stats.nullDescSamples.length < 3) {
        stats.nullDescSamples.push({ id: a.id, title: a.title, slug: a.slug });
      }
    }

    // Title length
    if (a.title) stats.titleLengths.push(a.title.length);

    // Description length
    if (a.description) {
      stats.descLengths.push(a.description.length);

      // Generic descriptions
      if (descriptionLooksGeneric(a.description)) {
        stats.genericDescriptions++;
        if (stats.genericDescSamples.length < 3) {
          stats.genericDescSamples.push({ id: a.id, description: a.description, slug: a.slug });
        }
      }

      // Formulaic descriptions
      if (descriptionLooksFormulaic(a.description)) {
        stats.formulaicDescriptions++;
        if (stats.formulaicDescSamples.length < 3) {
          stats.formulaicDescSamples.push({ id: a.id, description: a.description, slug: a.slug });
        }
      }
    }
  }

  return stats;
}

function lengthDistribution(lengths, label, idealMin, idealMax) {
  if (lengths.length === 0) return { min: 0, max: 0, avg: 0, median: 0, inRange: 0, pctInRange: '0%' };

  lengths.sort((a, b) => a - b);
  const min = lengths[0];
  const max = lengths[lengths.length - 1];
  const avg = Math.round(lengths.reduce((s, l) => s + l, 0) / lengths.length);
  const median = lengths[Math.floor(lengths.length / 2)];
  const inRange = lengths.filter(l => l >= idealMin && l <= idealMax).length;
  const pctInRange = ((inRange / lengths.length) * 100).toFixed(1) + '%';

  // Buckets
  const buckets = {};
  const step = label === 'title' ? 10 : 20;
  for (const l of lengths) {
    const bucket = Math.floor(l / step) * step;
    const key = `${bucket}-${bucket + step - 1}`;
    buckets[key] = (buckets[key] || 0) + 1;
  }

  return { min, max, avg, median, inRange, total: lengths.length, pctInRange, buckets };
}

function printReport(allStats) {
  console.log('='.repeat(80));
  console.log('  BLOG ARTICLES TITLE/DESCRIPTION AUDIT');
  console.log('  ' + new Date().toISOString());
  console.log('='.repeat(80));

  // Grand totals
  let totalArticles = 0, totalEnglishTitles = 0, totalNullDesc = 0, totalEmptyDesc = 0;
  let totalGeneric = 0, totalFormulaic = 0;
  const allTitleLengths = [], allDescLengths = [];

  for (const s of allStats) {
    if (!s) continue;
    totalArticles += s.total;
    totalEnglishTitles += s.englishTitles;
    totalNullDesc += s.nullDescriptions;
    totalEmptyDesc += s.emptyDescriptions;
    totalGeneric += s.genericDescriptions;
    totalFormulaic += s.formulaicDescriptions;
    allTitleLengths.push(...s.titleLengths);
    allDescLengths.push(...s.descLengths);
  }

  console.log('\n--- SUMMARY ---');
  console.log(`  Total articles (non-en, non-methodology): ${totalArticles}`);
  console.log(`  English titles remaining:   ${totalEnglishTitles} (was 683)`);
  console.log(`  Null descriptions:          ${totalNullDesc}`);
  console.log(`  Empty descriptions:         ${totalEmptyDesc}`);
  console.log(`  Generic descriptions:       ${totalGeneric}`);
  console.log(`  Formulaic descriptions:     ${totalFormulaic} (160-char pattern)`);

  // Title length distribution
  const titleDist = lengthDistribution(allTitleLengths, 'title', 50, 70);
  console.log('\n--- TITLE LENGTH DISTRIBUTION (target: 50-70 chars) ---');
  console.log(`  Min: ${titleDist.min}  Max: ${titleDist.max}  Avg: ${titleDist.avg}  Median: ${titleDist.median}`);
  console.log(`  In range (50-70): ${titleDist.inRange}/${titleDist.total} (${titleDist.pctInRange})`);
  if (titleDist.buckets) {
    console.log('  Buckets:');
    for (const [range, count] of Object.entries(titleDist.buckets).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
      const bar = '#'.repeat(Math.ceil(count / 100));
      console.log(`    ${range.padEnd(8)} ${String(count).padStart(6)} ${bar}`);
    }
  }

  // Description length distribution
  const descDist = lengthDistribution(allDescLengths, 'desc', 140, 170);
  console.log('\n--- DESCRIPTION LENGTH DISTRIBUTION (target: 140-170 chars) ---');
  console.log(`  Min: ${descDist.min}  Max: ${descDist.max}  Avg: ${descDist.avg}  Median: ${descDist.median}`);
  console.log(`  In range (140-170): ${descDist.inRange}/${descDist.total} (${descDist.pctInRange})`);
  if (descDist.buckets) {
    console.log('  Buckets:');
    for (const [range, count] of Object.entries(descDist.buckets).sort((a, b) => parseInt(a[0]) - parseInt(b[0]))) {
      const bar = '#'.repeat(Math.ceil(count / 100));
      console.log(`    ${range.padEnd(10)} ${String(count).padStart(6)} ${bar}`);
    }
  }

  // Per-language breakdown
  console.log('\n--- PER-LANGUAGE BREAKDOWN ---');
  console.log('  ' + 'Lang'.padEnd(5) + 'Total'.padStart(7) + 'EngTitle'.padStart(10) + 'NullDesc'.padStart(10) + 'Generic'.padStart(9) + 'Formulaic'.padStart(11) + '  AvgTitle  AvgDesc');
  console.log('  ' + '-'.repeat(75));

  for (const s of allStats) {
    if (!s) continue;
    const avgTitle = s.titleLengths.length > 0 ? Math.round(s.titleLengths.reduce((a, b) => a + b, 0) / s.titleLengths.length) : 0;
    const avgDesc = s.descLengths.length > 0 ? Math.round(s.descLengths.reduce((a, b) => a + b, 0) / s.descLengths.length) : 0;
    console.log(
      '  ' +
      s.lang.padEnd(5) +
      String(s.total).padStart(7) +
      String(s.englishTitles).padStart(10) +
      String(s.nullDescriptions + s.emptyDescriptions).padStart(10) +
      String(s.genericDescriptions).padStart(9) +
      String(s.formulaicDescriptions).padStart(11) +
      String(avgTitle).padStart(10) +
      String(avgDesc).padStart(9)
    );
  }

  // Issues requiring attention
  console.log('\n--- ISSUES REQUIRING ATTENTION ---');

  // English titles samples
  const engSamples = allStats.flatMap(s => s ? s.englishTitleSamples.map(e => ({ ...e, lang: s.lang })) : []);
  if (engSamples.length > 0) {
    console.log(`\n  English Titles (showing up to 10 samples):`);
    for (const s of engSamples.slice(0, 10)) {
      console.log(`    [${s.lang}] ${s.title}`);
      console.log(`         id: ${s.id}`);
    }
  }

  // Null/empty descriptions
  const nullSamples = allStats.flatMap(s => s ? s.nullDescSamples.map(e => ({ ...e, lang: s.lang })) : []);
  if (nullSamples.length > 0) {
    console.log(`\n  Null/Empty Descriptions (showing up to 10 samples):`);
    for (const s of nullSamples.slice(0, 10)) {
      console.log(`    [${s.lang}] ${s.title}`);
      console.log(`         id: ${s.id}`);
    }
  }

  // Formulaic (EL) samples
  const formulaicSamples = allStats.flatMap(s => s ? s.formulaicDescSamples.map(e => ({ ...e, lang: s.lang })) : []);
  if (formulaicSamples.length > 0) {
    console.log(`\n  Formulaic Descriptions — exactly 160 chars (showing up to 10 samples):`);
    for (const s of formulaicSamples.slice(0, 10)) {
      console.log(`    [${s.lang}] "${s.description}"`);
      console.log(`         id: ${s.id}`);
    }
  }

  // Generic samples
  const genericSamples = allStats.flatMap(s => s ? s.genericDescSamples.map(e => ({ ...e, lang: s.lang })) : []);
  if (genericSamples.length > 0) {
    console.log(`\n  Generic Descriptions (showing up to 10 samples):`);
    for (const s of genericSamples.slice(0, 10)) {
      console.log(`    [${s.lang}] "${s.description}"`);
      console.log(`         id: ${s.id}`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

async function spotCheck(articles, count) {
  console.log('\n--- SPOT CHECK: Random Samples Per Language ---');

  const langs = filterLang ? [filterLang] : ALL_LANGS;

  for (const lang of langs) {
    const langArticles = articles.filter(a => a.native_lang === lang && a.title && a.description);
    if (langArticles.length === 0) continue;

    // Pick random samples
    const samples = [];
    const indices = new Set();
    while (samples.length < Math.min(count, langArticles.length)) {
      const idx = Math.floor(Math.random() * langArticles.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        samples.push(langArticles[idx]);
      }
    }

    console.log(`\n  [${lang.toUpperCase()}] (${langArticles.length} articles with title+desc)`);
    for (const s of samples) {
      console.log(`    Title (${s.title.length} chars): ${s.title}`);
      console.log(`    Desc  (${s.description.length} chars): ${s.description}`);
      console.log(`    Slug: ${s.slug}`);
      console.log();
    }
  }
}

async function main() {
  process.stderr.write(`audit-deep: Fetching articles...\n`);
  const articles = await fetchAllArticles();

  const langs = filterLang ? [filterLang] : ALL_LANGS;
  const allStats = langs.map(lang => analyzeLang(articles, lang));

  printReport(allStats);
  await spotCheck(articles, spotCheckCount);
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
