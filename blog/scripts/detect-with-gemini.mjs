#!/usr/bin/env node
/**
 * detect-with-gemini.mjs — Gemini Flash semantic audit for all blog articles.
 *
 * Phase B replacement: Uses Gemini Flash to detect semantic issues that
 * mechanical detectors cannot catch — wrong-language words, fake
 * pronunciations, content-topic mismatches, copied phonetics, etc.
 *
 * Sends compact article data (props only, not full content) to Gemini
 * in batches of 15-20. Outputs a complete issues manifest.
 *
 * Usage:
 *   node blog/scripts/detect-with-gemini.mjs                    # Full run
 *   node blog/scripts/detect-with-gemini.mjs --pair it-tr       # Single pair
 *   node blog/scripts/detect-with-gemini.mjs --limit 100        # First N articles
 *   node blog/scripts/detect-with-gemini.mjs --concurrency 10   # Worker count
 *   node blog/scripts/detect-with-gemini.mjs --batch-size 15    # Articles per Gemini call
 *   node blog/scripts/detect-with-gemini.mjs --dry-run          # Extract only, no Gemini
 *   node blog/scripts/detect-with-gemini.mjs --resume           # Skip already-scanned articles
 */
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

// ─── Environment ─────────────────────────────────────────────────────────────

const envContent = fs.readFileSync(path.join(projectRoot, '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...vals] = line.split('=');
  if (key && vals.length) env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let PAIR_FILTER = null, LIMIT = null, CONCURRENCY = 10, BATCH_SIZE = 15;
let DRY_RUN = false, RESUME = false, MODEL_NAME = 'gemini-2.0-flash';

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--pair': PAIR_FILTER = args[++i]; break;
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--batch-size': BATCH_SIZE = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--resume': RESUME = true; break;
    case '--model': MODEL_NAME = args[++i]; break;
  }
}

// Model is passed per-call with the new SDK

// ─── Language Names ──────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── Prop Extraction ─────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const dq = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`, 's');
  const dm = tag.match(dq);
  if (dm) return dm[1];
  const sq = new RegExp(`${propName}\\s*=\\s*'([^']*)'`, 's');
  const sm = tag.match(sq);
  return sm ? sm[1] : null;
}

function extractAllVocabCards(content) {
  if (!content) return [];
  const tags = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  return tags.map(tag => ({
    word: extractProp(tag, 'word') || extractProp(tag, 'polish') || '',
    translation: extractProp(tag, 'translation') || extractProp(tag, 'english') || '',
    pronunciation: extractProp(tag, 'pronunciation') || '',
    example: extractProp(tag, 'example') || '',
  })).filter(v => v.word || v.translation);
}

function extractPhraseOfDay(content) {
  if (!content) return [];
  const tags = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  return tags.map(tag => ({
    word: extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '',
    translation: extractProp(tag, 'translation') || extractProp(tag, 'english') || '',
    pronunciation: extractProp(tag, 'pronunciation') || '',
  })).filter(v => v.word || v.translation);
}

function extractConjugationTables(content) {
  if (!content) return [];
  const tags = content.match(/<ConjugationTable[\s\S]*?\/>/gi) || [];
  return tags.map(tag => ({
    verb: extractProp(tag, 'verb') || '',
    meaning: extractProp(tag, 'meaning') || '',
  })).filter(v => v.verb);
}

/**
 * Build a compact representation of an article's learnable content.
 */
function extractArticleProps(article) {
  const vocabCards = extractAllVocabCards(article.content);
  const phrases = extractPhraseOfDay(article.content);
  const conjugations = extractConjugationTables(article.content);

  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    category: article.category,
    native_lang: article.native_lang,
    target_lang: article.target_lang,
    vocabCards,
    phrases,
    conjugations,
    hasContent: vocabCards.length > 0 || phrases.length > 0 || conjugations.length > 0,
  };
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await genAI.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
      });
      return result.text;
    } catch (e) {
      lastError = e;
      const status = e.status || e.statusCode || (e.message && e.message.includes('429') ? 429 : 0);
      if (status === 429 || status >= 500) {
        const delay = Math.pow(2, attempt) * 2000 + Math.random() * 1000;
        console.log(`  Gemini ${status}, retry ${attempt + 1}/3 in ${Math.round(delay / 1000)}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

function parseGeminiJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

/**
 * Build audit prompt for a batch of articles (all same native→target pair).
 */
function buildAuditPrompt(batch, nativeLang, targetLang) {
  const nativeName = LANG_NAMES[nativeLang] || nativeLang;
  const targetName = LANG_NAMES[targetLang] || targetLang;

  let prompt = `You are auditing blog articles for a language-learning website. Each article teaches ${targetName} to speakers of ${nativeName}.

For each article below, check ALL component props for these issues:

1. WRONG_LANG_WORD: The \`word\` value is NOT in ${targetName}. It's in ${nativeName} or another language.
2. WRONG_LANG_TRANSLATION: The \`translation\` is NOT in ${nativeName}. It's in ${targetName} or another language.
3. IDENTICAL_PROPS: \`word\` and \`translation\` are the same string (or nearly identical).
4. FAKE_PRONUNCIATION: \`pronunciation\` is a description/sentence rather than phonetics. Or it's just the word itself copied.
5. COPIED_PRONUNCIATION: The exact same pronunciation string reused for 3+ different words in the same article.
6. WRONG_LANG_EXAMPLE: \`example\` sentence is NOT in ${targetName}.
7. TITLE_MISMATCH: The vocabulary doesn't match the article's title/topic at all (e.g., title says "birthday" but words are about apologies).
8. EMPTY_PROPS: Missing or empty word/translation where there should be one.
9. PRONUNCIATION_MISMATCH: Pronunciation clearly belongs to a different word than the one it's assigned to.

IMPORTANT rules:
- For short words (1-3 chars), word=pronunciation is OK (e.g., "ja"/"ya" is fine).
- For phonetic languages, word≈pronunciation is OK when they sound the same.
- Only flag WRONG_LANG if you're confident the word is in the wrong language.
- For TITLE_MISMATCH, only flag if the vocabulary is clearly about a DIFFERENT topic, not just loosely related.

`;

  for (let i = 0; i < batch.length; i++) {
    const a = batch[i];
    prompt += `--- ARTICLE ${i + 1} ---
id: "${a.id}"
title: "${a.title}"
category: "${a.category || ''}"
`;

    if (a.vocabCards.length > 0) {
      prompt += `VocabCards:\n`;
      for (const vc of a.vocabCards) {
        prompt += `  - word="${vc.word}" translation="${vc.translation}" pronunciation="${vc.pronunciation}"`;
        if (vc.example) prompt += ` example="${vc.example}"`;
        prompt += `\n`;
      }
    }

    if (a.phrases.length > 0) {
      prompt += `PhraseOfDay:\n`;
      for (const ph of a.phrases) {
        prompt += `  - word="${ph.word}" translation="${ph.translation}" pronunciation="${ph.pronunciation}"\n`;
      }
    }

    if (a.conjugations.length > 0) {
      prompt += `ConjugationTables:\n`;
      for (const ct of a.conjugations) {
        prompt += `  - verb="${ct.verb}" meaning="${ct.meaning}"\n`;
      }
    }

    prompt += `\n`;
  }

  prompt += `Return a JSON array. For each article WITH issues, include an object:
[
  {
    "id": "article-id",
    "issues": [
      { "type": "WRONG_LANG_WORD", "severity": "high", "description": "brief description", "evidence": "the specific word or prop" }
    ]
  }
]

For clean articles with NO issues, do NOT include them in the array.
If ALL articles are clean, return an empty array: []

ONLY return the JSON array, no other text.`;

  return prompt;
}

// ─── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchAllArticles() {
  const PAGE_SIZE = 1000;
  let allArticles = [];
  let from = 0;

  while (true) {
    let query = supabase
      .from('blog_articles')
      .select('id, slug, native_lang, target_lang, title, category, content')
      .eq('published', true)
      .range(from, from + PAGE_SIZE - 1);

    if (PAIR_FILTER) {
      const [native, target] = PAIR_FILTER.split('-');
      if (native) query = query.eq('native_lang', native);
      if (target) query = query.eq('target_lang', target);
    }

    const { data: page, error } = await query;

    if (error) {
      console.error(`  ERROR fetching page at offset ${from}: ${error.message}`);
      break;
    }

    if (!page || page.length === 0) break;
    allArticles = allArticles.concat(page);
    console.log(`  Fetched ${allArticles.length} articles...`);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allArticles.filter(a => a.target_lang !== 'all');
}

// ─── Progress Tracking ───────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'gemini-audit-manifest.json');
const PROGRESS_PATH = path.join(DATA_DIR, 'gemini-audit-progress.json');

function loadProgress() {
  if (RESUME && fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return { scannedIds: [], results: {} };
}

function saveProgress(progress) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();

console.log(`\n${'═'.repeat(70)}`);
console.log(`  GEMINI SEMANTIC AUDIT${DRY_RUN ? ' — DRY RUN' : ''}`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY} | Batch size: ${BATCH_SIZE}`);
console.log(`  Pair filter: ${PAIR_FILTER || 'all'} | Limit: ${LIMIT || 'all'} | Resume: ${RESUME}`);
console.log(`${'═'.repeat(70)}\n`);

// Step 1: Fetch articles
console.log('Step 1: Fetching articles from Supabase...');
const rawArticles = await fetchAllArticles();
console.log(`  Total articles: ${rawArticles.length}\n`);

// Step 2: Extract props
console.log('Step 2: Extracting component props...');
let articlesWithProps = rawArticles.map(extractArticleProps).filter(a => a.hasContent);

if (LIMIT) articlesWithProps = articlesWithProps.slice(0, LIMIT);

let totalVocabCards = 0, totalPhrases = 0, totalConjugations = 0;
for (const a of articlesWithProps) {
  totalVocabCards += a.vocabCards.length;
  totalPhrases += a.phrases.length;
  totalConjugations += a.conjugations.length;
}

console.log(`  Articles with props: ${articlesWithProps.length}`);
console.log(`  VocabCards: ${totalVocabCards.toLocaleString()} | Phrases: ${totalPhrases.toLocaleString()} | Conjugations: ${totalConjugations.toLocaleString()}`);

// Load progress and filter already-scanned
const progress = loadProgress();
const scannedSet = new Set(progress.scannedIds);
const toScan = articlesWithProps.filter(a => !scannedSet.has(a.id));

console.log(`  Already scanned: ${scannedSet.size} | Remaining: ${toScan.length}\n`);

if (DRY_RUN) {
  console.log('DRY RUN — skipping Gemini calls. Showing extraction stats only.\n');

  // Show per-pair breakdown
  const pairCounts = {};
  for (const a of articlesWithProps) {
    const pair = `${a.native_lang}-${a.target_lang}`;
    pairCounts[pair] = (pairCounts[pair] || 0) + 1;
  }
  const sortedPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
  console.log(`  Language pairs: ${sortedPairs.length}`);
  for (const [pair, count] of sortedPairs.slice(0, 20)) {
    console.log(`    ${pair}: ${count} articles`);
  }
  if (sortedPairs.length > 20) console.log(`    ... and ${sortedPairs.length - 20} more`);

  const estBatches = Math.ceil(articlesWithProps.length / BATCH_SIZE);
  console.log(`\n  Estimated Gemini calls: ~${estBatches}`);
  console.log(`  Estimated cost: ~$${(estBatches * 0.003).toFixed(2)}-$${(estBatches * 0.005).toFixed(2)}`);
  process.exit(0);
}

if (toScan.length === 0) {
  console.log('All articles already scanned. Use without --resume to re-scan.\n');
  process.exit(0);
}

// Step 3: Group by pair, then batch
console.log('Step 3: Sending batches to Gemini Flash...\n');

const byPair = {};
for (const a of toScan) {
  const pair = `${a.native_lang}-${a.target_lang}`;
  if (!byPair[pair]) byPair[pair] = [];
  byPair[pair].push(a);
}

// Build all batches with pair context
const allBatches = [];
for (const [pair, articles] of Object.entries(byPair)) {
  const [native, target] = pair.split('-');
  for (let i = 0; i < articles.length; i += BATCH_SIZE) {
    allBatches.push({
      pair,
      nativeLang: native,
      targetLang: target,
      articles: articles.slice(i, i + BATCH_SIZE),
    });
  }
}

console.log(`  Total batches: ${allBatches.length} across ${Object.keys(byPair).length} language pairs\n`);

// Counters
let batchesCompleted = 0;
let batchesFailed = 0;
let articlesScanned = 0;
let articlesWithIssues = 0;
let totalIssues = 0;

const SEVERITY_MAP = {
  WRONG_LANG_WORD: 'high',
  WRONG_LANG_TRANSLATION: 'high',
  IDENTICAL_PROPS: 'medium',
  FAKE_PRONUNCIATION: 'medium',
  COPIED_PRONUNCIATION: 'high',
  WRONG_LANG_EXAMPLE: 'high',
  TITLE_MISMATCH: 'critical',
  EMPTY_PROPS: 'high',
  PRONUNCIATION_MISMATCH: 'high',
};

async function processBatch(batch, batchIdx) {
  const label = `[${batchIdx + 1}/${allBatches.length}] ${batch.pair} (${batch.articles.length} articles)`;

  try {
    const prompt = buildAuditPrompt(batch.articles, batch.nativeLang, batch.targetLang);
    const response = await callGemini(prompt);
    let results;

    try {
      results = parseGeminiJson(response);
    } catch (parseErr) {
      console.log(`  ${label}: JSON PARSE ERROR — ${parseErr.message}`);
      console.log(`    Response preview: ${response.slice(0, 200)}...`);
      batchesFailed++;
      return;
    }

    if (!Array.isArray(results)) {
      console.log(`  ${label}: Expected array, got ${typeof results}`);
      batchesFailed++;
      return;
    }

    // Process results
    const issueArticleIds = new Set();
    for (const result of results) {
      if (!result.id || !result.issues || !Array.isArray(result.issues)) continue;
      if (result.issues.length === 0) continue;

      issueArticleIds.add(result.id);

      // Find matching article for metadata
      const article = batch.articles.find(a => a.id === result.id);
      if (!article) continue;

      // Normalize severity using our map (Gemini may return different values)
      const normalizedIssues = result.issues.map(issue => ({
        type: issue.type || 'UNKNOWN',
        severity: SEVERITY_MAP[issue.type] || issue.severity || 'medium',
        description: issue.description || '',
        evidence: issue.evidence || '',
      }));

      progress.results[result.id] = {
        slug: article.slug,
        pair: batch.pair,
        title: article.title,
        category: article.category,
        issues: normalizedIssues,
      };

      articlesWithIssues++;
      totalIssues += normalizedIssues.length;
    }

    // Mark all articles in batch as scanned
    for (const a of batch.articles) {
      progress.scannedIds.push(a.id);
      articlesScanned++;
    }

    batchesCompleted++;

    const issueCount = issueArticleIds.size;
    if (issueCount > 0) {
      console.log(`  ${label}: ${issueCount} articles with issues`);
    } else {
      console.log(`  ${label}: all clean`);
    }

    // Save progress every 5 batches
    if (batchesCompleted % 5 === 0) {
      saveProgress(progress);
    }
  } catch (e) {
    console.log(`  ${label}: ERROR — ${e.message}`);
    batchesFailed++;
  }
}

// Concurrency pool
let batchIndex = 0;
async function worker() {
  while (batchIndex < allBatches.length) {
    const i = batchIndex++;
    await processBatch(allBatches[i], i);
  }
}

await Promise.all(Array.from({ length: Math.min(CONCURRENCY, allBatches.length) }, () => worker()));

// Save final progress
saveProgress(progress);

// Step 4: Build manifest
console.log('\nStep 4: Building manifest...');

const issueSummary = {
  byIssueType: {},
  bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
  byPair: {},
};

for (const [id, data] of Object.entries(progress.results)) {
  for (const issue of data.issues) {
    // By issue type
    issueSummary.byIssueType[issue.type] = (issueSummary.byIssueType[issue.type] || 0) + 1;

    // By severity
    issueSummary.bySeverity[issue.severity] = (issueSummary.bySeverity[issue.severity] || 0) + 1;

    // By pair
    if (!issueSummary.byPair[data.pair]) issueSummary.byPair[data.pair] = { total: 0, articles: new Set() };
    issueSummary.byPair[data.pair].total++;
    issueSummary.byPair[data.pair].articles.add(id);
  }
}

// Convert Sets to counts for JSON serialization
for (const pair of Object.keys(issueSummary.byPair)) {
  issueSummary.byPair[pair] = {
    total: issueSummary.byPair[pair].total,
    articles: issueSummary.byPair[pair].articles.size,
  };
}

const durationMs = Date.now() - startTime;

const manifest = {
  meta: {
    timestamp: new Date().toISOString(),
    model: MODEL_NAME,
    batchSize: BATCH_SIZE,
    totalScanned: progress.scannedIds.length,
    totalWithIssues: Object.keys(progress.results).length,
    totalIssueCount: Object.values(progress.results).reduce((sum, r) => sum + r.issues.length, 0),
    totalClean: progress.scannedIds.length - Object.keys(progress.results).length,
    scanDurationMs: durationMs,
    pairFilter: PAIR_FILTER || 'all',
  },
  summary: issueSummary,
  articles: progress.results,
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

// Print summary
const totalScanned = progress.scannedIds.length;
const totalWithIssuesFinal = Object.keys(progress.results).length;
const totalIssuesFinal = Object.values(progress.results).reduce((sum, r) => sum + r.issues.length, 0);

console.log(`\n${'═'.repeat(70)}`);
console.log(`  RESULTS`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Scanned:        ${totalScanned.toLocaleString()}`);
console.log(`  With Issues:    ${totalWithIssuesFinal.toLocaleString()} (${totalScanned > 0 ? ((totalWithIssuesFinal / totalScanned) * 100).toFixed(1) : 0}%)`);
console.log(`  Clean:          ${(totalScanned - totalWithIssuesFinal).toLocaleString()} (${totalScanned > 0 ? (((totalScanned - totalWithIssuesFinal) / totalScanned) * 100).toFixed(1) : 0}%)`);
console.log(`  Total Issues:   ${totalIssuesFinal.toLocaleString()}`);
console.log(`  Batches:        ${batchesCompleted} completed, ${batchesFailed} failed`);
console.log(`  Duration:       ${(durationMs / 1000).toFixed(1)}s`);

console.log(`\n  --- By Severity ---`);
for (const [sev, count] of Object.entries(issueSummary.bySeverity)) {
  if (count > 0) console.log(`  ${sev.toUpperCase().padEnd(10)} ${String(count).padStart(6)}`);
}

console.log(`\n  --- By Issue Type ---`);
const sortedTypes = Object.entries(issueSummary.byIssueType).sort((a, b) => b[1] - a[1]);
for (const [type, count] of sortedTypes) {
  const sev = SEVERITY_MAP[type] || 'medium';
  console.log(`  ${type.padEnd(28)} ${String(count).padStart(6)}  [${sev.toUpperCase().slice(0, 4)}]`);
}

console.log(`\n  --- By Pair (top 20) ---`);
const sortedPairs = Object.entries(issueSummary.byPair).sort((a, b) => b[1].total - a[1].total);
for (const [pair, data] of sortedPairs.slice(0, 20)) {
  console.log(`  ${pair.padEnd(8)} ${String(data.total).padStart(5)} issues in ${String(data.articles).padStart(4)} articles`);
}
if (sortedPairs.length > 20) console.log(`  ... and ${sortedPairs.length - 20} more pairs`);

console.log(`\n  Manifest saved: ${MANIFEST_PATH}`);
console.log(`  Progress saved: ${PROGRESS_PATH}`);
console.log(`${'═'.repeat(70)}\n`);
