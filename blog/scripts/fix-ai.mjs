#!/usr/bin/env node
/**
 * fix-ai.mjs — AI-powered content quality fixes for blog articles.
 *
 * Detects and fixes content-quality issues that require AI (Gemini):
 *   - pronunciations: bad/missing/placeholder pronunciation in VocabCards/PhraseOfDay
 *   - english_example: English examples in non-English articles
 *   - undefined_literal: JavaScript "undefined" leaked into content
 *   - truncated: articles ending mid-sentence
 *   - wrong_language: words/translations in wrong language, English headers
 *
 * Usage:
 *   node blog/scripts/fix-ai.mjs --fix-type pronunciations --limit 5 --dry-run
 *   node blog/scripts/fix-ai.mjs --fix-type english_example --limit 20
 *   node blog/scripts/fix-ai.mjs --fix-type undefined_literal
 *   node blog/scripts/fix-ai.mjs --fix-type truncated --limit 10
 *   node blog/scripts/fix-ai.mjs --fix-type wrong_language --limit 10
 *   node blog/scripts/fix-ai.mjs --fix-type all --dry-run
 *   node blog/scripts/fix-ai.mjs --concurrency 30 --model gemini-2.0-flash
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Environment ─────────────────────────────────────────────────────────────

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
  process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n');
  process.exit(1);
}

const geminiApiKey = env.GEMINI_API_KEY;
if (!geminiApiKey) {
  process.stderr.write('Missing GEMINI_API_KEY in .env.local\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let LIMIT = null, DRY_RUN = false, CONCURRENCY = 25, MODEL_NAME = 'gemini-3-flash-preview';
let FIX_TYPE = null;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--model': MODEL_NAME = args[++i]; break;
    case '--fix-type': FIX_TYPE = args[++i]; break;
  }
}

const VALID_FIX_TYPES = ['pronunciations', 'english_example', 'undefined_literal', 'truncated', 'wrong_language', 'all'];

if (!FIX_TYPE || !VALID_FIX_TYPES.includes(FIX_TYPE)) {
  process.stderr.write(`Usage: node fix-ai.mjs --fix-type <${VALID_FIX_TYPES.join('|')}> [--limit N] [--dry-run]\n`);
  process.exit(1);
}

// ─── Gemini Client ───────────────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// ─── Language Names ──────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── Progress Tracking ───────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'ai-fix-progress-1c.json');

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return {};
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function getFixProgress(progress, fixType) {
  if (!progress[fixType]) {
    progress[fixType] = { applied: [], failed: {}, stats: { total: 0, applied: 0, failed: 0, skipped: 0 } };
  }
  return progress[fixType];
}

// ─── Data Loading ────────────────────────────────────────────────────────────

function loadArticles() {
  const localPath = path.join(DATA_DIR, 'articles-local.json');
  if (!fs.existsSync(localPath)) {
    process.stderr.write('No articles-local.json found. Run: node blog/scripts/export-articles.mjs\n');
    process.exit(1);
  }
  const raw = fs.readFileSync(localPath, 'utf-8');
  const data = JSON.parse(raw);
  process.stderr.write(`  Loaded ${data.articles.length.toLocaleString()} articles from local JSON\n`);
  return data.articles.filter(a => a.target_lang !== 'all');
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/** English function words for looksEnglish check */
const ENGLISH_FUNCTION_WORDS = new Set([
  'the', 'is', 'are', 'and', 'or', 'but', 'this', 'that', 'with', 'from',
  'have', 'has', 'would', 'could', 'they', 'their', 'you', 'your', 'we',
  'a', 'an', 'in', 'on', 'to', 'for', 'of', 'it', 'was', 'were', 'be',
]);

function looksEnglish(text) {
  if (!text) return false;
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 3) return false;
  let engCount = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '');
    if (ENGLISH_FUNCTION_WORDS.has(clean)) engCount++;
  }
  return engCount / words.length > 0.4;
}

const CYRILLIC_RE = /[\u0400-\u04FF]/g;
const LATIN_RE = /[a-zA-ZÀ-ÿĀ-žŁłŃńŚśŹźŻżĆćĘęĄąÓó]/g;
const CYRILLIC_LANGS = new Set(['ru', 'uk']);
const GREEK_LANGS = new Set(['el']);

function isCyrillic(text) {
  if (!text || text.length < 2) return false;
  const cyrillic = (text.match(CYRILLIC_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  const total = cyrillic + latin;
  return total > 0 && cyrillic / total > 0.5;
}

// Placeholder pronunciation patterns (same as audit)
const PLACEHOLDER_PRONUN_PATTERNS = [
  /^$/,
  /^\s*$/,
  /^\.\.\.$/,
  /^\?\?\?$/,
  /^TBD$/i,
  /^\/…\/$/,
  /^\/\.\.\.\/$/,
  /^\s*\/\s*\/\s*$/,
  /^\[\.{2,}\]$/,           // [...] or [....] — actual placeholders
  /^\[pronunciation\]$/i,   // [pronunciation]
  /^\[TBD\]$/i,             // [TBD]
  /^\[\s*\]$/,              // [ ] or []
];

function isBadPronunciation(word, pronunciation) {
  if (!pronunciation || pronunciation.trim() === '') return true;
  const pronTrimmed = pronunciation.trim();
  const wordTrimmed = word.trim();
  // Check placeholder patterns
  for (const pat of PLACEHOLDER_PRONUN_PATTERNS) {
    if (pat.test(pronTrimmed)) return true;
  }
  // Pronunciation equals word (case-insensitive)
  const pronLower = pronTrimmed.toLowerCase();
  const wordLower = wordTrimmed.toLowerCase();
  const pronStripped = pronLower.replace(/^[\/\[\(]|[\/\]\)]$/g, '').trim();
  if (pronLower === wordLower || pronStripped === wordLower) return true;
  return false;
}

// ─── Gemini Helpers ──────────────────────────────────────────────────────────

async function callGemini(prompt) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      lastError = e;
      const status = e.status || e.statusCode || (e.message && e.message.includes('429') ? 429 : 0);
      if (status === 429 || status >= 500) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        process.stderr.write(`  Gemini ${status}, retry in ${Math.round(delay)}ms...\n`);
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

// ─── Concurrency Pool ────────────────────────────────────────────────────────

async function processPool(items, concurrency, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

// ─── Validation ──────────────────────────────────────────────────────────────

function countComponents(content) {
  return {
    VocabCard: (content.match(/<VocabCard/gi) || []).length,
    PhraseOfDay: (content.match(/<PhraseOfDay/gi) || []).length,
    CultureTip: (content.match(/<CultureTip/gi) || []).length,
    ConjugationTable: (content.match(/<ConjugationTable/gi) || []).length,
  };
}

function validateResult(original, result, allowGrowth = false) {
  const errors = [];
  if (!result || typeof result !== 'string' || result.trim().length === 0) {
    errors.push('Result content is empty');
    return { valid: false, errors };
  }
  const origCounts = countComponents(original);
  const resultCounts = countComponents(result);
  for (const [comp, origCount] of Object.entries(origCounts)) {
    if (resultCounts[comp] < origCount) {
      errors.push(`${comp} count decreased: ${origCount} → ${resultCounts[comp]}`);
    }
  }
  const minRatio = allowGrowth ? 0.95 : 0.80;
  if (result.length < original.length * minRatio) {
    errors.push(`Content shrunk by ${Math.round((1 - result.length / original.length) * 100)}%`);
  }
  try {
    const { html } = convertMdxToHtml(result, 'en');
    if (!html || html.trim().length === 0) {
      errors.push('convertMdxToHtml produced empty output');
    }
  } catch (e) {
    errors.push(`convertMdxToHtml failed: ${e.message}`);
  }
  return { valid: errors.length === 0, errors };
}

// ─── Issue Detection (mirrors audit-content.mjs logic) ──────────────────────

function findPronunciationIssues(article) {
  const content = article.content || '';
  const items = [];

  // VocabCards
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    if (word && isBadPronunciation(word, pronunciation)) {
      items.push({ component: 'VocabCard', word, currentPronunciation: pronunciation, tag });
    }
  }

  // PhraseOfDay
  const phraseMatches = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (const tag of phraseMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    if (word && isBadPronunciation(word, pronunciation)) {
      items.push({ component: 'PhraseOfDay', word, currentPronunciation: pronunciation, tag });
    }
  }

  return items;
}

function findEnglishExamples(article) {
  const content = article.content || '';
  const nl = article.native_lang;
  const tl = article.target_lang;
  if (nl === 'en' || tl === 'en') return [];

  const items = [];
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const example = extractProp(tag, 'example') || '';
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    if (example && looksEnglish(example)) {
      items.push({ word, example, tag });
    }
  }
  return items;
}

function findUndefinedLiterals(article) {
  const content = article.content || '';
  const matches = [];
  // Find lines with "undefined" in them
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (/\bundefined\b/.test(lines[i])) {
      matches.push({ lineIndex: i, line: lines[i], context: lines.slice(Math.max(0, i - 1), i + 2).join('\n') });
    }
  }
  return matches;
}

function findTruncatedContent(article) {
  const content = article.content || '';
  const stripped = content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^import\s+.*$/gm, '')
    .trim();

  // Strip components for prose check
  let prose = stripped;
  prose = prose.replace(/<CultureTip[^>]*>[\s\S]*?<\/CultureTip>/gi, '');
  prose = prose.replace(/<(?:VocabCard|PhraseOfDay|ConjugationTable|CultureTip|CTA)[\s\S]*?\/>/gi, '');

  if (stripped.length < 100) return null;

  const strippedEnd = stripped.slice(-80).trim();
  const endsWithComponent = /\/>$/.test(strippedEnd) || /<\/\w+>$/.test(strippedEnd);
  const endsWithFormatting = /\*{1,2}$/.test(strippedEnd);
  if (endsWithComponent || endsWithFormatting) return null;

  const lastChars = prose.slice(-50).trim();
  if (lastChars.length <= 10) return null;
  if (/[.!?:)\]"'»。！？\*]$/.test(lastChars)) return null;

  if (/[,;]$/.test(lastChars)) {
    return { endingChars: lastChars.slice(-30), severity: 'high' };
  }
  if (/\w$/.test(lastChars)) {
    const last100 = prose.slice(-100).trim();
    const endsWithLink = /\]\([^)]*\)$/.test(last100) || /\]\([^)]*$/.test(last100);
    const endsWithBold = /\*\*[^*]+$/.test(last100);
    if (!endsWithLink && !endsWithBold) {
      return { endingChars: lastChars.slice(-30), severity: 'medium' };
    }
  }
  return null;
}

function findWrongLanguageIssues(article) {
  const content = article.content || '';
  const nl = article.native_lang;
  const tl = article.target_lang;
  const issues = [];

  // Wrong language words in VocabCards
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';

    // Word in wrong language (Cyrillic in Latin-target or vice versa)
    if (word.length >= 2) {
      if (!CYRILLIC_LANGS.has(tl) && !GREEK_LANGS.has(tl) && isCyrillic(word)) {
        issues.push({ type: 'word_wrong_lang', word, translation, tag, reason: 'Cyrillic word in Latin-script target' });
      }
    }

    // Translation in wrong language
    if (translation.length >= 2) {
      if (CYRILLIC_LANGS.has(nl) && !isCyrillic(translation) && translation.length > 3 && looksEnglish(translation)) {
        issues.push({ type: 'translation_wrong_lang', word, translation, tag, reason: 'English translation for Cyrillic-native' });
      }
      if (!CYRILLIC_LANGS.has(nl) && !GREEK_LANGS.has(nl) && isCyrillic(translation)) {
        issues.push({ type: 'translation_wrong_lang', word, translation, tag, reason: 'Cyrillic translation for Latin-native' });
      }
    }
  }

  // English headers
  if (nl !== 'en') {
    const ENGLISH_HEADERS = [
      'key vocabulary', 'pronunciation guide', 'cultural tips', 'practice together',
      'grammar notes', 'common phrases', 'essential phrases', 'introduction',
      'conclusion', 'verb conjugation', 'quick reference', 'how to say',
      'how to use', 'how to pronounce', 'vocabulary list', 'practice exercises',
      'common mistakes', 'useful expressions', 'dialogue practice', 'review',
    ];
    const stripped = content.replace(/^---[\s\S]*?---/m, '').replace(/^import\s+.*$/gm, '').trim();
    const headingLines = stripped.match(/^#{2,3}\s+.+$/gm) || [];
    for (const line of headingLines) {
      const headerText = line.replace(/^#{2,3}\s+/, '').trim().toLowerCase().replace(/^\d+\.\s*/, '');
      for (const eh of ENGLISH_HEADERS) {
        if (headerText.includes(eh)) {
          issues.push({ type: 'english_header', header: line.trim(), expected_lang: nl });
          break;
        }
      }
    }
  }

  return issues;
}

// ─── Fix Type: Pronunciations (Group A) ──────────────────────────────────────

function buildPronunciationPrompt(article, items) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const itemList = items.map((item, i) => {
    const reason = item.currentPronunciation
      ? (item.currentPronunciation === item.word ? 'copied from word' : `placeholder: "${item.currentPronunciation}"`)
      : 'empty';
    return `${i + 1}. word="${item.word}" — ${reason}`;
  }).join('\n');

  return `Generate phonetic pronunciation guides for these ${targetName} words/phrases.
The article is written for ${nativeName} speakers learning ${targetName}.

For EACH item, provide a pronunciation guide that a ${nativeName} speaker can read aloud to approximate the correct ${targetName} sound. Use the phonetic conventions natural to ${nativeName} readers.

Rules:
- Write pronunciations using letters/sounds familiar to ${nativeName} speakers
- Be accurate to actual ${targetName} pronunciation
- Keep guides concise but clear
- For multi-word phrases, include the full pronunciation

Items needing pronunciation:
${itemList}

Respond ONLY with valid JSON (no markdown, no explanation):
{ "fixes": [ { "word": "exact word from above", "pronunciation": "the phonetic guide" } ] }`;
}

async function fixPronunciations(article, label) {
  const items = findPronunciationIssues(article);
  if (items.length === 0) return { status: 'skipped', reason: 'no issues' };

  process.stderr.write(`  ${label}: ${items.length} bad pronunciations\n`);

  const prompt = buildPronunciationPrompt(article, items);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    return { status: 'failed', error: `Gemini error: ${e.message}` };
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    return { status: 'failed', error: `JSON parse error: ${e.message}` };
  }

  if (!parsed.fixes || !Array.isArray(parsed.fixes)) {
    return { status: 'failed', error: 'No fixes array in response' };
  }

  // Build lookup: word → pronunciation (exact + normalized keys)
  const fixMap = new Map();
  const fixList = [];
  for (const fix of parsed.fixes) {
    if (fix.word && fix.pronunciation) {
      const w = fix.word.trim();
      const p = fix.pronunciation.trim();
      fixMap.set(w, p);
      fixList.push({ word: w, pronunciation: p });
    }
  }

  // Fuzzy lookup: try exact, then case-insensitive, then normalized (strip punctuation/quotes)
  function findPronunciation(word) {
    const w = word.trim();
    if (fixMap.has(w)) return fixMap.get(w);
    // Case-insensitive
    for (const [k, v] of fixMap) {
      if (k.toLowerCase() === w.toLowerCase()) return v;
    }
    // Normalized: strip leading/trailing punctuation and quotes
    const norm = s => s.replace(/^[\s"'.,;:!?¿¡]+|[\s"'.,;:!?¿¡]+$/g, '').toLowerCase();
    const wNorm = norm(w);
    for (const [k, v] of fixMap) {
      if (norm(k) === wNorm) return v;
    }
    // Positional fallback: if only 1 item and 1 fix, match them
    if (items.length === 1 && fixList.length === 1) return fixList[0].pronunciation;
    return null;
  }

  let content = article.content;
  let fixCount = 0;

  for (const item of items) {
    const newPron = findPronunciation(item.word);
    if (!newPron) continue;

    // Replace pronunciation in the original tag
    const oldTag = item.tag;
    let newTag;

    if (!extractProp(oldTag, 'pronunciation') && !/pronunciation\s*=/.test(oldTag)) {
      // No pronunciation prop at all — add one before closing />
      newTag = oldTag.replace(/\s*\/>/, ` pronunciation="${newPron}" />`);
    } else {
      // Replace existing pronunciation value (even if empty)
      newTag = oldTag.replace(
        /pronunciation\s*=\s*"[^"]*"/,
        `pronunciation="${newPron}"`
      );
    }

    if (newTag !== oldTag) {
      content = content.replace(oldTag, newTag);
      fixCount++;
    }
  }

  if (fixCount === 0) {
    return { status: 'failed', error: 'No pronunciations could be stitched' };
  }

  const validation = validateResult(article.content, content);
  if (!validation.valid) {
    return { status: 'failed', error: `Validation: ${validation.errors.join('; ')}` };
  }

  return { status: 'applied', content, fixCount, detail: `${fixCount}/${items.length} pronunciations fixed` };
}

// ─── Fix Type: English Examples (Group B) ────────────────────────────────────

function buildEnglishExamplePrompt(article, items) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const itemList = items.map((item, i) =>
    `${i + 1}. word="${item.word}" example="${item.example}"`
  ).join('\n');

  return `Translate these English example sentences to ${nativeName}.
This is a ${nativeName} language-learning blog about ${targetName}, so all example sentences should be in ${nativeName} (the reader's native language) to help them understand the ${targetName} vocabulary.

Items:
${itemList}

Rules:
- Translate the example naturally to ${nativeName}, keeping the same meaning
- The example should demonstrate usage of the word in context
- Keep translations concise (1-2 sentences max)

Respond ONLY with valid JSON (no markdown):
{ "fixes": [ { "word": "exact word from above", "example": "translated example in ${nativeName}" } ] }`;
}

async function fixEnglishExamples(article, label) {
  const items = findEnglishExamples(article);
  if (items.length === 0) return { status: 'skipped', reason: 'no issues' };

  process.stderr.write(`  ${label}: ${items.length} English examples\n`);

  const prompt = buildEnglishExamplePrompt(article, items);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    return { status: 'failed', error: `Gemini error: ${e.message}` };
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    return { status: 'failed', error: `JSON parse error: ${e.message}` };
  }

  if (!parsed.fixes || !Array.isArray(parsed.fixes)) {
    return { status: 'failed', error: 'No fixes array in response' };
  }

  const fixMap = new Map();
  for (const fix of parsed.fixes) {
    if (fix.word && fix.example) fixMap.set(fix.word.trim(), fix.example.trim());
  }

  let content = article.content;
  let fixCount = 0;

  for (const item of items) {
    const newExample = fixMap.get(item.word.trim());
    if (!newExample) continue;

    const oldTag = item.tag;
    const newTag = oldTag.replace(
      new RegExp(`(example\\s*=\\s*")${escapeRegex(item.example)}(")`),
      `$1${newExample}$2`
    );

    if (newTag !== oldTag) {
      content = content.replace(oldTag, newTag);
      fixCount++;
    }
  }

  if (fixCount === 0) {
    return { status: 'failed', error: 'No examples could be stitched' };
  }

  const validation = validateResult(article.content, content);
  if (!validation.valid) {
    return { status: 'failed', error: `Validation: ${validation.errors.join('; ')}` };
  }

  return { status: 'applied', content, fixCount, detail: `${fixCount}/${items.length} examples translated` };
}

// ─── Fix Type: Undefined Literal (Group C) ───────────────────────────────────

function buildUndefinedPrompt(article, matches) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const contextList = matches.map((m, i) =>
    `${i + 1}. Line: "${m.line.trim()}"\n   Context: "${m.context.trim()}"`
  ).join('\n\n');

  return `Fix literal "undefined" in this ${nativeName} language-learning article about ${targetName}.
The word "undefined" is a JavaScript error that leaked into the content. For each occurrence, determine what word/phrase should be there based on surrounding context.

Occurrences:
${contextList}

Rules:
- The replacement should be in ${nativeName} (the article's prose language)
- Base your guess on surrounding words and sentence structure
- If the surrounding text is in ${targetName}, use ${targetName} for the replacement
- If truly ambiguous, use a reasonable placeholder word that fits grammatically

Respond ONLY with valid JSON:
{ "fixes": [ { "line_number": 1, "original_fragment": "text with undefined", "replacement_fragment": "text with correct word" } ] }`;
}

async function fixUndefinedLiterals(article, label) {
  const matches = findUndefinedLiterals(article);
  if (matches.length === 0) return { status: 'skipped', reason: 'no issues' };

  process.stderr.write(`  ${label}: ${matches.length} undefined literals\n`);

  const prompt = buildUndefinedPrompt(article, matches);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    return { status: 'failed', error: `Gemini error: ${e.message}` };
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    return { status: 'failed', error: `JSON parse error: ${e.message}` };
  }

  if (!parsed.fixes || !Array.isArray(parsed.fixes)) {
    return { status: 'failed', error: 'No fixes array in response' };
  }

  let content = article.content;
  let fixCount = 0;

  for (const fix of parsed.fixes) {
    if (!fix.original_fragment || !fix.replacement_fragment) continue;
    if (fix.replacement_fragment.includes('undefined')) continue; // AI didn't actually fix it

    const before = content;
    content = content.replace(fix.original_fragment, fix.replacement_fragment);
    if (content !== before) fixCount++;
  }

  if (fixCount === 0) {
    return { status: 'failed', error: 'No undefined literals could be fixed' };
  }

  // Verify undefined is actually gone
  if (/\bundefined\b/.test(content)) {
    process.stderr.write(`  ${label}: WARNING — some "undefined" still remain after fixes\n`);
  }

  const validation = validateResult(article.content, content);
  if (!validation.valid) {
    return { status: 'failed', error: `Validation: ${validation.errors.join('; ')}` };
  }

  return { status: 'applied', content, fixCount, detail: `${fixCount}/${matches.length} undefined fixed` };
}

// ─── Fix Type: Truncated Content (Group D) ───────────────────────────────────

function buildTruncatedPrompt(article) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  // Get the last ~500 chars for context
  const content = article.content || '';
  const lastSection = content.slice(-500);

  return `This ${nativeName} language-learning article about ${targetName} ends abruptly mid-sentence or without a proper conclusion.

Article title: "${article.title}"
Category: ${article.category}

Here is how the article currently ends:
---
${lastSection}
---

Write a natural conclusion for this article (2-3 short paragraphs) in ${nativeName}.

Rules:
- Write ONLY in ${nativeName}
- Continue naturally from where the text breaks off
- If it ends mid-sentence, complete that sentence first, then add a conclusion
- Include a brief summary or encouragement to practice
- Do NOT add import statements, frontmatter, or <CTA> tags
- Do NOT add new VocabCards or components
- Keep it concise (100-200 words)

Respond ONLY with valid JSON:
{ "continuation": "the continuation text here..." }`;
}

async function fixTruncated(article, label) {
  const issue = findTruncatedContent(article);
  if (!issue) return { status: 'skipped', reason: 'no truncation detected' };

  process.stderr.write(`  ${label}: truncated (ends: "${issue.endingChars}")\n`);

  const prompt = buildTruncatedPrompt(article);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    return { status: 'failed', error: `Gemini error: ${e.message}` };
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    return { status: 'failed', error: `JSON parse error: ${e.message}` };
  }

  if (!parsed.continuation || typeof parsed.continuation !== 'string') {
    return { status: 'failed', error: 'No continuation in response' };
  }

  let continuation = parsed.continuation.trim();
  // Sanitize
  continuation = continuation.replace(/^import\s+.*$/gm, '');
  continuation = continuation.replace(/<CTA[\s\S]*?\/?>/gi, '');

  if (continuation.length < 20) {
    return { status: 'failed', error: 'Continuation too short' };
  }

  const content = article.content + '\n\n' + continuation;

  const validation = validateResult(article.content, content, true);
  if (!validation.valid) {
    return { status: 'failed', error: `Validation: ${validation.errors.join('; ')}` };
  }

  return { status: 'applied', content, fixCount: 1, detail: `+${continuation.length} chars appended` };
}

// ─── Fix Type: Wrong Language (Group E) ──────────────────────────────────────

function buildWrongLanguagePrompt(article, issues) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const issueList = issues.map((issue, i) => {
    if (issue.type === 'word_wrong_lang') {
      return `${i + 1}. [WORD] word="${issue.word}" translation="${issue.translation}" — Reason: ${issue.reason}. The word should be in ${targetName}. Provide the correct ${targetName} word, or if this is intentional (e.g. language comparison article), respond with "KEEP".`;
    }
    if (issue.type === 'translation_wrong_lang') {
      return `${i + 1}. [TRANSLATION] word="${issue.word}" translation="${issue.translation}" — Reason: ${issue.reason}. The translation should be in ${nativeName}. Provide the correct ${nativeName} translation.`;
    }
    if (issue.type === 'english_header') {
      return `${i + 1}. [HEADER] "${issue.header}" — Translate this section header to ${nativeName}.`;
    }
    return `${i + 1}. Unknown issue type`;
  }).join('\n\n');

  return `Fix language issues in this ${nativeName} language-learning article about ${targetName}.
Article: "${article.title}"

Issues:
${issueList}

Rules:
- For WORD issues: provide the correct ${targetName} word. If the current word IS intentionally in ${nativeName} (e.g. for comparison), respond "KEEP"
- For TRANSLATION issues: provide the correct ${nativeName} translation
- For HEADER issues: translate to ${nativeName}
- Be accurate with translations

Respond ONLY with valid JSON:
{ "fixes": [ { "issue_number": 1, "action": "fix", "original": "original text", "replacement": "fixed text" } ] }

Use action "keep" if the current text is intentional and should not be changed.`;
}

async function fixWrongLanguage(article, label) {
  const issues = findWrongLanguageIssues(article);
  if (issues.length === 0) return { status: 'skipped', reason: 'no issues' };

  process.stderr.write(`  ${label}: ${issues.length} wrong-language issues\n`);

  const prompt = buildWrongLanguagePrompt(article, issues);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    return { status: 'failed', error: `Gemini error: ${e.message}` };
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    return { status: 'failed', error: `JSON parse error: ${e.message}` };
  }

  if (!parsed.fixes || !Array.isArray(parsed.fixes)) {
    return { status: 'failed', error: 'No fixes array in response' };
  }

  let content = article.content;
  let fixCount = 0;
  let keepCount = 0;

  for (const fix of parsed.fixes) {
    if (!fix.issue_number || fix.action === 'keep') {
      keepCount++;
      continue;
    }

    const issueIdx = fix.issue_number - 1;
    if (issueIdx < 0 || issueIdx >= issues.length) continue;

    const issue = issues[issueIdx];

    if (issue.type === 'english_header' && fix.replacement) {
      // Replace the header text
      const before = content;
      content = content.replace(issue.header, issue.header.replace(
        issue.header.replace(/^#{2,3}\s+/, ''),
        fix.replacement
      ));
      if (content !== before) fixCount++;
    } else if (issue.type === 'word_wrong_lang' && fix.replacement) {
      // Replace word in VocabCard
      const oldTag = issue.tag;
      const newTag = oldTag.replace(
        new RegExp(`(\\bword\\s*=\\s*")${escapeRegex(issue.word)}(")`),
        `$1${fix.replacement}$2`
      );
      if (newTag !== oldTag) {
        content = content.replace(oldTag, newTag);
        fixCount++;
      }
    } else if (issue.type === 'translation_wrong_lang' && fix.replacement) {
      // Replace translation in VocabCard
      const oldTag = issue.tag;
      const newTag = oldTag.replace(
        new RegExp(`(\\btranslation\\s*=\\s*")${escapeRegex(issue.translation)}(")`),
        `$1${fix.replacement}$2`
      );
      if (newTag !== oldTag) {
        content = content.replace(oldTag, newTag);
        fixCount++;
      }
    }
  }

  if (fixCount === 0 && keepCount === 0) {
    return { status: 'failed', error: 'No fixes could be applied' };
  }

  if (fixCount === 0) {
    return { status: 'skipped', reason: `All ${keepCount} issues flagged as intentional` };
  }

  const validation = validateResult(article.content, content);
  if (!validation.valid) {
    return { status: 'failed', error: `Validation: ${validation.errors.join('; ')}` };
  }

  return { status: 'applied', content, fixCount, detail: `${fixCount} fixed, ${keepCount} kept intentionally` };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Process Single Article ──────────────────────────────────────────────────

async function processArticle(article, idx, total, fixType) {
  const label = `[${idx + 1}/${total}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  let result;
  switch (fixType) {
    case 'pronunciations':
      result = await fixPronunciations(article, label);
      break;
    case 'english_example':
      result = await fixEnglishExamples(article, label);
      break;
    case 'undefined_literal':
      result = await fixUndefinedLiterals(article, label);
      break;
    case 'truncated':
      result = await fixTruncated(article, label);
      break;
    case 'wrong_language':
      result = await fixWrongLanguage(article, label);
      break;
    default:
      return { status: 'skipped', reason: 'unknown fix type' };
  }

  if (result.status === 'skipped') return result;

  if (result.status === 'failed') {
    process.stderr.write(`  ${label}: FAILED — ${result.error}\n`);
    return result;
  }

  // Apply to database
  if (DRY_RUN) {
    process.stderr.write(`  ${label}: OK (dry-run) — ${result.detail}\n`);
    return result;
  }

  // Generate HTML
  let html;
  try {
    const htmlResult = convertMdxToHtml(result.content, article.native_lang, article.target_lang);
    html = htmlResult.html;
  } catch (e) {
    process.stderr.write(`  ${label}: HTML error — ${e.message}\n`);
    return { status: 'failed', error: `HTML error: ${e.message}` };
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: result.content, content_html: html })
    .eq('id', article.id);

  if (error) {
    process.stderr.write(`  ${label}: DB error — ${error.message}\n`);
    return { status: 'failed', error: `DB error: ${error.message}` };
  }

  process.stderr.write(`  ${label}: APPLIED — ${result.detail}\n`);
  return result;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  process.stderr.write(`\n${'═'.repeat(60)}\n`);
  process.stderr.write(`  AI CONTENT FIXES — ${FIX_TYPE.toUpperCase()}${DRY_RUN ? ' (DRY RUN)' : ''}\n`);
  process.stderr.write(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}\n`);
  process.stderr.write(`${'═'.repeat(60)}\n\n`);

  const articles = loadArticles();
  const progress = loadProgress();

  // Determine which fix types to run
  const fixTypes = FIX_TYPE === 'all'
    ? ['pronunciations', 'english_example', 'undefined_literal', 'truncated', 'wrong_language']
    : [FIX_TYPE];

  for (const fixType of fixTypes) {
    process.stderr.write(`\n── Fix Type: ${fixType} ──\n`);

    const fixProgress = getFixProgress(progress, fixType);
    const appliedSet = new Set([...fixProgress.applied, ...Object.keys(fixProgress.failed)]);

    // Filter articles that need this fix type and haven't been processed
    let candidates;
    switch (fixType) {
      case 'pronunciations':
        candidates = articles.filter(a => !appliedSet.has(a.id) && findPronunciationIssues(a).length > 0);
        break;
      case 'english_example':
        candidates = articles.filter(a => !appliedSet.has(a.id) && findEnglishExamples(a).length > 0);
        break;
      case 'undefined_literal':
        candidates = articles.filter(a => !appliedSet.has(a.id) && findUndefinedLiterals(a).length > 0);
        break;
      case 'truncated':
        candidates = articles.filter(a => !appliedSet.has(a.id) && findTruncatedContent(a) !== null);
        break;
      case 'wrong_language':
        candidates = articles.filter(a => !appliedSet.has(a.id) && findWrongLanguageIssues(a).length > 0);
        break;
      default:
        candidates = [];
    }

    process.stderr.write(`  Found ${candidates.length} articles needing fixes (${appliedSet.size} already processed)\n`);

    const toProcess = LIMIT ? candidates.slice(0, LIMIT) : candidates;
    process.stderr.write(`  Processing ${toProcess.length} articles\n\n`);

    if (toProcess.length === 0) continue;

    let applied = 0, failed = 0, skipped = 0;

    await processPool(toProcess, CONCURRENCY, async (article, idx) => {
      const result = await processArticle(article, idx, toProcess.length, fixType);

      if (result.status === 'applied') {
        applied++;
        fixProgress.applied.push(article.id);
      } else if (result.status === 'failed') {
        failed++;
        fixProgress.failed[article.id] = result.error;
      } else {
        skipped++;
      }

      fixProgress.stats.total = applied + failed + skipped;
      fixProgress.stats.applied = (fixProgress.stats.applied || 0) + (result.status === 'applied' ? 1 : 0);
      fixProgress.stats.failed = (fixProgress.stats.failed || 0) + (result.status === 'failed' ? 1 : 0);
      fixProgress.stats.skipped = (fixProgress.stats.skipped || 0) + (result.status === 'skipped' ? 1 : 0);

      if (!DRY_RUN) saveProgress(progress);
      return result;
    });

    process.stderr.write(`\n  Results for ${fixType}:\n`);
    process.stderr.write(`    Applied: ${applied}\n`);
    process.stderr.write(`    Failed:  ${failed}\n`);
    process.stderr.write(`    Skipped: ${skipped}\n`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  process.stderr.write(`\n${'═'.repeat(60)}\n`);
  process.stderr.write(`  DONE in ${duration}s${DRY_RUN ? ' (DRY RUN — no changes written)' : ''}\n`);
  process.stderr.write(`${'═'.repeat(60)}\n\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
