#!/usr/bin/env node
/**
 * Phase 1e-3: Single-pass AI fix for all remaining VocabCard issues.
 *
 * Scans all articles for VocabCards with bad props (wrong pronunciation,
 * empty translation, English examples in non-English articles), groups
 * them by article, sends one Gemini prompt per article, and stitches
 * all fixes back in one go.
 *
 * Usage:
 *   node blog/scripts/fix-vocabcards.mjs --dry-run
 *   node blog/scripts/fix-vocabcards.mjs --limit 5
 *   node blog/scripts/fix-vocabcards.mjs --model gemini-2.0-flash
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
let LIMIT = null, DRY_RUN = false, CONCURRENCY = 5, MODEL_NAME = 'gemini-2.0-flash';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

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

// ─── Issue Detection ─────────────────────────────────────────────────────────

function findIssues(article) {
  const content = article.content || '';
  const issues = [];

  // Match all vocab-like tags
  const tagRe = /<(?:VocabCard|PhraseOfDay|PhrasePair|PhraseCard|VocabCell|KVocabCard)[\s\S]*?\/>/gi;
  const tags = content.match(tagRe) || [];

  for (const tag of tags) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'target') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || extractProp(tag, 'source') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || extractProp(tag, 'phonetic') || null;
    const example = extractProp(tag, 'example') || extractProp(tag, 'context') || '';

    // Pronunciation equals word (skip short words <= 3 chars)
    if (pronunciation && word && pronunciation.trim().toLowerCase() === word.trim().toLowerCase() && word.length > 3) {
      issues.push({ type: 'bad_pronunciation', word, currentPronunciation: pronunciation, tag });
    }

    // Empty translation (word exists but translation is empty)
    if (word && word.trim().length > 0 && (!translation || translation.trim() === '')) {
      issues.push({ type: 'empty_translation', word, tag });
    }

    // English example in non-English article
    if (example && article.native_lang !== 'en' && article.target_lang !== 'en' && looksEnglish(example)) {
      issues.push({ type: 'english_example', word, example, tag });
    }
  }

  return issues;
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

function buildPrompt(article, issues) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  let prompt = `You are fixing vocabulary flashcards in a language-learning article for ${nativeName} speakers learning ${targetName}.

Fix each item below. Return ONLY a JSON array with one object per item, in the same order.

`;

  const items = [];
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    if (issue.type === 'bad_pronunciation') {
      items.push(`${i + 1}. FIX PRONUNCIATION: word="${issue.word}" — current pronunciation "${issue.currentPronunciation}" is just the word copied. Provide a phonetic pronunciation guide that a ${nativeName} speaker can read.`);
    } else if (issue.type === 'empty_translation') {
      items.push(`${i + 1}. ADD TRANSLATION: word="${issue.word}" in ${targetName} — provide the ${nativeName} translation.`);
    } else if (issue.type === 'english_example') {
      items.push(`${i + 1}. TRANSLATE EXAMPLE: word="${issue.word}" — the example "${issue.example}" is in English. Translate it to ${nativeName}.`);
    }
  }

  prompt += items.join('\n');

  prompt += `

Respond with a JSON array. Each object must have:
- "index": the item number (1-based)
- "type": "${issues.map(i => i.type).join('" or "')}"
- "word": the word (unchanged)
- "fix": the corrected value (pronunciation, translation, or translated example)

Example response:
[
  {"index": 1, "type": "bad_pronunciation", "word": "Benimle", "fix": "be-NIM-leh"},
  {"index": 2, "type": "empty_translation", "word": "casa", "fix": "Haus"},
  {"index": 3, "type": "english_example", "word": "amor", "fix": "Je t'aime de tout mon coeur"}
]`;

  return prompt;
}

// ─── Stitching ───────────────────────────────────────────────────────────────

function applyFixes(content, issues, fixes) {
  let result = content;
  let applied = 0;

  for (const fix of fixes) {
    const idx = fix.index - 1;
    if (idx < 0 || idx >= issues.length) continue;

    const issue = issues[idx];
    const fixValue = fix.fix;
    if (!fixValue || fixValue.trim() === '') continue;

    const oldTag = issue.tag;
    if (!result.includes(oldTag)) continue;

    let newTag = oldTag;

    if (issue.type === 'bad_pronunciation') {
      // Replace pronunciation value
      newTag = oldTag.replace(/pronunciation\s*=\s*"[^"]*"/, `pronunciation="${fixValue}"`);
    } else if (issue.type === 'empty_translation') {
      // Add or replace translation
      if (/translation\s*=/.test(oldTag)) {
        newTag = oldTag.replace(/translation\s*=\s*"[^"]*"/, `translation="${fixValue}"`);
      } else if (/english\s*=/.test(oldTag)) {
        newTag = oldTag.replace(/english\s*=\s*"[^"]*"/, `english="${fixValue}"`);
      } else {
        // Add translation prop
        newTag = oldTag.replace(/\s*\/>/, ` translation="${fixValue}" />`);
      }
    } else if (issue.type === 'english_example') {
      // Replace example value
      if (/example\s*=/.test(oldTag)) {
        newTag = oldTag.replace(/example\s*=\s*"[^"]*"/, `example="${fixValue}"`);
      } else if (/context\s*=/.test(oldTag)) {
        newTag = oldTag.replace(/context\s*=\s*"[^"]*"/, `context="${fixValue}"`);
      }
    }

    if (newTag !== oldTag) {
      result = result.replace(oldTag, newTag);
      applied++;
    }
  }

  return { content: result, applied };
}

// ─── Progress ────────────────────────────────────────────────────────────────

const PROGRESS_FILE = path.join(__dirname, 'data/ai-fix-progress-1e.json');

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
const alreadyDone = new Set(progress.applied);

// Find all articles with issues
const articlesWithIssues = [];
for (const a of articles) {
  if (alreadyDone.has(a.id)) continue;
  if (progress.failed[a.id]) continue;
  const issues = findIssues(a);
  if (issues.length > 0) {
    articlesWithIssues.push({ article: a, issues });
  }
}

console.log(`Found ${articlesWithIssues.length} articles with ${articlesWithIssues.reduce((s, a) => s + a.issues.length, 0)} issues`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? articlesWithIssues.slice(0, LIMIT) : articlesWithIssues;

let totalApplied = 0, totalFailed = 0;

async function processArticle({ article, issues }, idx) {
  const label = `[${idx + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;
  const issueTypes = [...new Set(issues.map(i => i.type))].join('+');

  if (DRY_RUN) {
    console.log(`  ${label}: ${issues.length} issues (${issueTypes})`);
    return;
  }

  try {
    const prompt = buildPrompt(article, issues);
    const response = await callGemini(prompt);
    const fixes = parseGeminiJson(response);

    const { content: newContent, applied } = applyFixes(article.content, issues, fixes);

    if (applied === 0) {
      console.log(`  ${label}: 0/${issues.length} applied (no matches)`);
      progress.failed[article.id] = 'no fixes applied';
      saveProgress(progress);
      totalFailed++;
      return;
    }

    // Generate HTML
    const { html } = convertMdxToHtml(newContent, article.native_lang, article.target_lang);

    // Update DB
    const { error } = await supabase
      .from('blog_articles')
      .update({ content: newContent, content_html: html })
      .eq('id', article.id);

    if (error) {
      console.log(`  ${label}: DB ERROR \u2014 ${error.message}`);
      progress.failed[article.id] = error.message;
      totalFailed++;
    } else {
      console.log(`  ${label}: ${applied}/${issues.length} fixed (${issueTypes})`);
      progress.applied.push(article.id);
      totalApplied++;
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

console.log(`\nDone. Applied: ${totalApplied}, Failed: ${totalFailed}`);
