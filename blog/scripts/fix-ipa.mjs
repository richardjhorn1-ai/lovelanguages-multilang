#!/usr/bin/env node
/**
 * Stage 1, Step 1.3: Convert IPA pronunciations to learner-friendly phonetics.
 *
 * Detects VocabCard/PhraseOfDay pronunciations containing IPA symbols
 * (ʒ, ə, ɔ, ɹ, ʁ, etc.) and converts them to the romanized+stress style
 * used by the majority of articles (e.g., "LAHSS-kah" not "ˈlaːska").
 *
 * Native-language-aware:
 *   - Cyrillic output for ru/uk native speakers
 *   - Greek output for el native speakers
 *   - Latin-based phonetics for all others
 *
 * Usage:
 *   node blog/scripts/fix-ipa.mjs --dry-run
 *   node blog/scripts/fix-ipa.mjs --limit 5
 *   node blog/scripts/fix-ipa.mjs
 *   node blog/scripts/fix-ipa.mjs --concurrency 20 --model gemini-2.0-flash
 */
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertMdxToHtml } from './component-converters.mjs';

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
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let LIMIT = null, DRY_RUN = false, CONCURRENCY = 20, MODEL_NAME = 'gemini-2.0-flash';

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--model': MODEL_NAME = args[++i]; break;
  }
}

const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// ─── Language Names ──────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── IPA Detection ──────────────────────────────────────────────────────────

// IPA symbols that casual learners can't read
const IPA_CHARS = /[ʒʃθðŋɲɛɔəæɑɪʊɐɒʌɜɹɾɻʂʐɕʑɡɫɬɮʔçʁħʕβɸɣχˈˌː]/;

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

function hasIPA(pronunciation) {
  return IPA_CHARS.test(pronunciation);
}

/**
 * Find all VocabCard/PhraseOfDay tags with IPA pronunciations in an article.
 */
function findIPATags(article) {
  const content = article.content || '';
  const results = [];

  // Check VocabCards
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    if (pronunciation && hasIPA(pronunciation)) {
      const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
      results.push({ tag, word, pronunciation, component: 'VocabCard' });
    }
  }

  // Check PhraseOfDay
  const phraseMatches = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (const tag of phraseMatches) {
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    if (pronunciation && hasIPA(pronunciation)) {
      const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
      results.push({ tag, word, pronunciation, component: 'PhraseOfDay' });
    }
  }

  return results;
}

// ─── Gemini ──────────────────────────────────────────────────────────────────

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
        console.log(`  Gemini ${status}, retry in ${Math.round(delay)}ms...`);
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

function buildPrompt(article, ipaTags) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const isRuUk = article.native_lang === 'ru' || article.native_lang === 'uk';
  const isGreek = article.native_lang === 'el';

  let scriptNote = '';
  if (isRuUk) {
    scriptNote = `Output pronunciations in Cyrillic script (the reader is a ${nativeName} speaker).`;
  } else if (isGreek) {
    scriptNote = `Output pronunciations in Greek script (the reader is a Greek speaker).`;
  } else {
    scriptNote = `Output pronunciations in Latin script with stress markers using CAPS (e.g., "LAHSS-kah", "SEH-nee", "bohn-ZHOOR").`;
  }

  let prompt = `Convert these IPA pronunciations to simple, readable phonetic guides for a ${nativeName} speaker learning ${targetName}.

${scriptNote}

Style guide:
- Break into syllables with hyphens
- Mark stressed syllable with CAPS (for Latin) or bold conventions
- Make it intuitive for how a ${nativeName} speaker would sound it out
- Do NOT use IPA symbols (ʒ, ə, ɔ, ɹ, ʁ, etc.) — use simple letters
- Match the style: "LAHSS-kah", "bohn-ZHOOR", "GRAH-tsee-eh", not "ˈlaːska"

Words to convert:
`;

  for (let i = 0; i < ipaTags.length; i++) {
    const { word, pronunciation } = ipaTags[i];
    prompt += `${i + 1}. word="${word}" — IPA: "${pronunciation}"\n`;
  }

  prompt += `
Return a JSON array with one object per word:
[{"index": 1, "pronunciation": "new readable pronunciation"}]`;

  return prompt;
}

// ─── Progress ────────────────────────────────────────────────────────────────

const PROGRESS_FILE = path.join(__dirname, 'data/ai-fix-progress-3-ipa.json');

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  return { applied: [], failed: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── Main ────────────────────────────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));
const articles = data.articles.filter(a => a.target_lang !== 'all');
const progress = loadProgress();
const alreadyDone = new Set([...progress.applied, ...Object.keys(progress.failed)]);

// Find articles with IPA pronunciations
const articlesWithIPA = [];
let totalIPATags = 0;

for (const a of articles) {
  if (alreadyDone.has(a.id)) continue;
  const ipaTags = findIPATags(a);
  if (ipaTags.length > 0) {
    articlesWithIPA.push({ article: a, ipaTags });
    totalIPATags += ipaTags.length;
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  FIX-IPA${DRY_RUN ? ' — DRY RUN' : ''}`);
console.log(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Found: ${articlesWithIPA.length} articles with ${totalIPATags} IPA pronunciations`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);

const toProcess = LIMIT ? articlesWithIPA.slice(0, LIMIT) : articlesWithIPA;
console.log(`  Processing: ${toProcess.length}\n`);

if (toProcess.length === 0) {
  console.log('Nothing to process.');
  process.exit(0);
}

let totalApplied = 0, totalFailed = 0, totalFixed = 0;

async function processArticle({ article, ipaTags }, idx) {
  const label = `[${idx + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;

  if (DRY_RUN) {
    console.log(`  ${label}: ${ipaTags.length} IPA pronunciations`);
    return;
  }

  try {
    const prompt = buildPrompt(article, ipaTags);
    const response = await callGemini(prompt);
    const fixes = parseGeminiJson(response);

    let content = article.content;
    let applied = 0;

    for (const fix of fixes) {
      const idx = fix.index - 1;
      if (idx < 0 || idx >= ipaTags.length) continue;

      const { tag, pronunciation: oldPron } = ipaTags[idx];
      const newPron = fix.pronunciation;
      if (!newPron || newPron.trim() === '' || hasIPA(newPron)) continue; // Skip if still IPA

      const oldTag = tag;
      const newTag = oldTag.replace(
        /pronunciation\s*=\s*"[^"]*"/,
        `pronunciation="${newPron}"`
      );

      if (newTag !== oldTag && content.includes(oldTag)) {
        content = content.replace(oldTag, newTag);
        applied++;
      }
    }

    if (applied === 0) {
      console.log(`  ${label}: 0 fixed`);
      progress.failed[article.id] = 'no fixes applied';
      saveProgress(progress);
      totalFailed++;
      return;
    }

    // Generate HTML
    const { html } = convertMdxToHtml(content, article.native_lang, article.target_lang);

    // Update DB
    const { error } = await supabase
      .from('blog_articles')
      .update({ content, content_html: html })
      .eq('id', article.id);

    if (error) {
      console.log(`  ${label}: DB ERROR \u2014 ${error.message}`);
      progress.failed[article.id] = error.message;
      totalFailed++;
    } else {
      console.log(`  ${label}: ${applied}/${ipaTags.length} IPA→phonetic`);
      progress.applied.push(article.id);
      totalApplied++;
      totalFixed += applied;
    }
    saveProgress(progress);
  } catch (e) {
    console.log(`  ${label}: ERROR \u2014 ${e.message}`);
    progress.failed[article.id] = e.message;
    saveProgress(progress);
    totalFailed++;
  }
}

// Process with concurrency pool
let index = 0;
async function worker() {
  while (index < toProcess.length) {
    const i = index++;
    await processArticle(toProcess[i], i);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toProcess.length) }, () => worker()));

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Articles fixed: ${totalApplied}`);
console.log(`  Pronunciations converted: ${totalFixed}`);
console.log(`  Failed: ${totalFailed}`);
console.log(`${'═'.repeat(60)}\n`);
