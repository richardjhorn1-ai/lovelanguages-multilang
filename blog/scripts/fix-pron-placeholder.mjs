#!/usr/bin/env node
/**
 * Phase 2, Step 2: Fix [pron] placeholders in VocabCards.
 *
 * Handles two patterns:
 * - VocabCard pronunciation="[pron]" → AI-generate real pronunciation
 * - Bare [pron] in prose text → mechanically strip
 *
 * Usage:
 *   node blog/scripts/fix-pron-placeholder.mjs --dry-run
 *   node blog/scripts/fix-pron-placeholder.mjs --limit 5
 *   node blog/scripts/fix-pron-placeholder.mjs
 *   node blog/scripts/fix-pron-placeholder.mjs --model gemini-2.0-flash
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
let LIMIT = null, DRY_RUN = false, CONCURRENCY = 3, MODEL_NAME = 'gemini-3-flash-preview';

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

// ─── Issue Detection ─────────────────────────────────────────────────────────

function findPronIssues(article) {
  const content = article.content || '';
  const vocabIssues = [];   // Need AI
  let hasProseIssue = false; // Mechanical

  // ── VocabCard [pron] placeholders ──
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';

    if (pronunciation === '[pron]' || pronunciation === '[pronunciation]') {
      vocabIssues.push({ word, tag });
    }
  }

  // ── PhraseOfDay [pron] placeholders ──
  const phraseMatches = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (const tag of phraseMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';

    if (pronunciation === '[pron]' || pronunciation === '[pronunciation]') {
      vocabIssues.push({ word, tag });
    }
  }

  // ── Bare [pron] in prose ──
  if (/\[pron\]/i.test(content)) {
    hasProseIssue = true;
  }

  return { vocabIssues, hasProseIssue };
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

  let prompt = `You are generating pronunciation guides for ${targetName} words, written for ${nativeName} speakers.

For each word below, provide a phonetic pronunciation guide that a ${nativeName} speaker can read to approximate the ${targetName} sound.

`;

  const items = issues.map((issue, i) =>
    `${i + 1}. word="${issue.word}"`
  );
  prompt += items.join('\n');

  prompt += `

Respond with a JSON array. Each object must have:
- "index": the item number (1-based)
- "pronunciation": the phonetic pronunciation guide

Example: [{"index": 1, "pronunciation": "psheh-PRAH-shahm"}]`;

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
    const pronunciation = fix.pronunciation;
    if (!pronunciation || pronunciation.trim() === '') continue;

    const oldTag = issue.tag;
    if (!result.includes(oldTag)) continue;

    const newTag = oldTag.replace(
      /pronunciation\s*=\s*"\[pron(?:unciation)?\]"/i,
      `pronunciation="${pronunciation}"`
    );

    if (newTag !== oldTag) {
      result = result.replace(oldTag, newTag);
      applied++;
    }
  }

  return { content: result, applied };
}

function stripProsePron(content) {
  const before = content;
  // Remove bare [pron] from prose (not inside component tags)
  const result = content.replace(/\s*\[pron\]\s*/gi, ' ');
  return { content: result, changed: result !== before };
}

// ─── Progress ────────────────────────────────────────────────────────────────

const PROGRESS_FILE = path.join(__dirname, 'data/ai-fix-progress-2-pron.json');

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

// Find all articles with [pron] issues
const articlesWithIssues = [];

for (const a of articles) {
  if (alreadyDone.has(a.id)) continue;
  if (progress.failed[a.id]) continue;
  const { vocabIssues, hasProseIssue } = findPronIssues(a);
  if (vocabIssues.length > 0 || hasProseIssue) {
    articlesWithIssues.push({ article: a, vocabIssues, hasProseIssue });
  }
}

console.log(`Found ${articlesWithIssues.length} articles with [pron] issues`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);
console.log(`  VocabCard issues: ${articlesWithIssues.reduce((s, a) => s + a.vocabIssues.length, 0)}`);
console.log(`  Prose issues: ${articlesWithIssues.filter(a => a.hasProseIssue).length}`);
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? articlesWithIssues.slice(0, LIMIT) : articlesWithIssues;

let totalApplied = 0, totalFailed = 0;

async function processArticle({ article, vocabIssues, hasProseIssue }, idx) {
  const label = `[${idx + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  if (DRY_RUN) {
    console.log(`  ${label}: ${vocabIssues.length} VocabCard + ${hasProseIssue ? '1 prose' : '0 prose'}`);
    return;
  }

  try {
    let content = article.content;
    let totalFixed = 0;

    // 1. Strip [pron] from prose (mechanical)
    if (hasProseIssue) {
      const { content: cleaned, changed } = stripProsePron(content);
      content = cleaned;
      if (changed) totalFixed++;
    }

    // 2. AI-generate real pronunciations for VocabCard [pron] props
    if (vocabIssues.length > 0) {
      const prompt = buildPrompt(article, vocabIssues);
      const response = await callGemini(prompt);
      const fixes = parseGeminiJson(response);
      const { content: fixedContent, applied } = applyFixes(content, vocabIssues, fixes);
      content = fixedContent;
      totalFixed += applied;
    }

    if (totalFixed === 0 && content === article.content) {
      console.log(`  ${label}: 0 fixes applied`);
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
      console.log(`  ${label}: DB ERROR — ${error.message}`);
      progress.failed[article.id] = error.message;
      totalFailed++;
    } else {
      console.log(`  ${label}: ${totalFixed} fixed`);
      progress.applied.push(article.id);
      totalApplied++;
    }
    saveProgress(progress);
  } catch (e) {
    console.log(`  ${label}: ERROR — ${e.message}`);
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
