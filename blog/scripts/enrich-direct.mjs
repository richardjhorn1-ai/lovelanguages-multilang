#!/usr/bin/env node
/**
 * enrich-direct.mjs — Direct Gemini Content Enrichment (Section-Only Mode)
 *
 * Reads articles from ai-batches/tier2a-batch-*.json, detects empty sections,
 * calls Gemini for ONLY the missing section intros (not full articles),
 * stitches them back in, validates, and writes to Supabase.
 *
 * Usage:
 *   node blog/scripts/enrich-direct.mjs --limit 5 --dry-run     # Test 5, don't write
 *   node blog/scripts/enrich-direct.mjs --limit 20               # Process 20 articles
 *   node blog/scripts/enrich-direct.mjs                           # Process all remaining
 *   node blog/scripts/enrich-direct.mjs --concurrency 50          # Override concurrency
 *   node blog/scripts/enrich-direct.mjs --model gemini-2.0-flash  # Override model
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
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--model': MODEL_NAME = args[++i]; break;
  }
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

// ─── Directories & Progress ─────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const BATCH_DIR = path.join(DATA_DIR, 'ai-batches');
const APPLIED_DIR = path.join(DATA_DIR, 'ai-applied');
const PROGRESS_FILE = path.join(DATA_DIR, 'enrich-direct-progress.json');

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { applied: [], failed: {}, stats: { total_processed: 0, applied: 0, failed: 0, skipped: 0 } };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── Applied ID Set ──────────────────────────────────────────────────────────

function buildAppliedSet(progress) {
  const applied = new Set(progress.applied);

  for (const id of Object.keys(progress.failed)) {
    applied.add(id);
  }

  if (fs.existsSync(APPLIED_DIR)) {
    const files = fs.readdirSync(APPLIED_DIR)
      .filter(f => f.startsWith('tier2a-') && f.endsWith('.json'));

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(APPLIED_DIR, file), 'utf-8'));
        if (data.results && Array.isArray(data.results)) {
          for (const r of data.results) {
            applied.add(r.id);
          }
        }
      } catch (e) {
        // skip corrupt files
      }
    }
  }

  return applied;
}

// ─── Issue Detection ─────────────────────────────────────────────────────────

/**
 * Find empty ## sections in article content.
 * Returns array of { header, subsections } objects.
 */
function findEmptyH2Sections(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => !l.startsWith('import '));
  const results = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('## ') || line.startsWith('### ')) continue;

    let hasContent = false;
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next) continue;
      if (next.startsWith('#')) break;
      hasContent = true;
      break;
    }

    if (!hasContent) {
      const subsections = [];
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (next.startsWith('## ') && !next.startsWith('### ')) break;
        if (next.startsWith('### ')) subsections.push(next);
      }
      results.push({ header: line, subsections });
    }
  }
  return results;
}

/**
 * Count prose words (strip components + headings + imports).
 */
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

// ─── Content Sanitization ────────────────────────────────────────────────────

function sanitizeResultContent(content) {
  let cleaned = content;
  cleaned = cleaned.replace(/^import\s+.*\s+from\s+['"].*['"];?\s*\n?/gm, '');
  cleaned = cleaned.replace(/<CTA[\s\S]*?\/?>\s*\n?/gi, '');
  cleaned = cleaned.replace(/^\s+/, '');
  return cleaned;
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

function validateResult(original, result) {
  const errors = [];

  if (!result || typeof result !== 'string' || result.trim().length === 0) {
    errors.push('Result content is empty');
    return { valid: false, errors };
  }

  if (result.trimStart().startsWith('---')) {
    errors.push('Result contains frontmatter (starts with ---)');
  }

  if (/^import\s+.*\s+from\s+/m.test(result)) {
    errors.push('Result contains import statements');
  }

  if (/<CTA[\s\S]*?\/?>/i.test(result)) {
    errors.push('Result contains <CTA> tags');
  }

  const origCounts = countComponents(original);
  const resultCounts = countComponents(result);
  for (const [comp, origCount] of Object.entries(origCounts)) {
    if (resultCounts[comp] < origCount) {
      errors.push(`${comp} count decreased: ${origCount} → ${resultCounts[comp]}`);
    }
  }

  if (result.length < original.length * 0.80) {
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

// ─── Section-Only Gemini Prompt ──────────────────────────────────────────────

function buildSectionPrompt(article, emptySections) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  const sectionList = emptySections.map(s => {
    let entry = `"${s.header}"`;
    if (s.subsections.length > 0) {
      entry += ` (subsections: ${s.subsections.join(', ')})`;
    }
    return entry;
  }).join('\n  ');

  return `Write introductory prose for empty sections in a ${nativeName} language-learning blog article about ${targetName}.

Article: "${article.title}" (category: ${article.category})
Native language for prose: ${nativeName}
Target language for examples: ${targetName}

Empty sections needing intro prose:
  ${sectionList}

For EACH section, write 2-3 paragraphs of educational content in ${nativeName} that:
- Introduces what the section covers
- Is specific to the topic, not generic filler
- References the subsections if any

RULES:
- ALL prose in ${nativeName}
- Do NOT include the ## heading itself — just the prose that goes after it
- Do NOT add imports, frontmatter, <CTA> tags
- Do NOT use: "Don't be afraid", "Practice makes perfect", "Your partner will appreciate", "The most important thing is..."
- You MAY include 1 <VocabCard word="..." translation="..." pronunciation="..." example="..." /> per section (all 4 props required)

Respond in JSON format:
{
  "sections": {
    "## Header Text": "prose content here...",
    "## Another Header": "prose content here..."
  }
}`;
}

// ─── Stitching ───────────────────────────────────────────────────────────────

/**
 * Insert new content after a ## header line.
 * Processes from bottom up to avoid line-shift issues.
 */
function insertSectionContent(content, header, newContent) {
  const lines = content.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() !== header) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === '') j++;
    if (j < lines.length && lines[j].trim().startsWith('#')) {
      lines.splice(j, 0, '', newContent, '');
    }
    break;
  }
  return lines.join('\n');
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

// ─── Rate-Limited Gemini Call ────────────────────────────────────────────────

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
        const delay = Math.pow(2, attempt) * 1000;
        process.stderr.write(`  Gemini ${status} error, retrying in ${delay}ms...\n`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// ─── Parse JSON from Gemini Response ─────────────────────────────────────────

function parseGeminiJson(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(cleaned);
}

// ─── Process Single Article ──────────────────────────────────────────────────

async function processArticle(article, idx, total, progress) {
  const label = `[${idx + 1}/${total}] ${article.id.slice(0, 8)}`;

  const emptySections = findEmptyH2Sections(article.content);

  if (emptySections.length === 0) {
    progress.stats.skipped++;
    return 'skipped';
  }

  process.stderr.write(`  ${label}: ${emptySections.length} sections — enriching...\n`);

  const prompt = buildSectionPrompt(article, emptySections);
  let responseText;
  try {
    responseText = await callGemini(prompt);
  } catch (e) {
    process.stderr.write(`  ${label}: Gemini error — ${e.message}\n`);
    progress.failed[article.id] = `Gemini error: ${e.message}`;
    progress.stats.failed++;
    return 'failed';
  }

  let parsed;
  try {
    parsed = parseGeminiJson(responseText);
  } catch (e) {
    process.stderr.write(`  ${label}: JSON parse error — ${e.message}\n`);
    progress.failed[article.id] = `JSON parse error: ${e.message}`;
    progress.stats.failed++;
    return 'failed';
  }

  if (!parsed.sections || typeof parsed.sections !== 'object') {
    process.stderr.write(`  ${label}: no sections in response\n`);
    progress.failed[article.id] = 'No sections object in response';
    progress.stats.failed++;
    return 'failed';
  }

  let stitched = article.content;
  const sectionHeaders = Object.keys(parsed.sections);
  const lines = stitched.split('\n');
  const headerPositions = sectionHeaders.map(h => {
    const idx = lines.findIndex(l => l.trim() === h);
    return { header: h, pos: idx };
  }).filter(h => h.pos >= 0).sort((a, b) => b.pos - a.pos);

  let insertedCount = 0;
  for (const { header } of headerPositions) {
    let newContent = parsed.sections[header];
    if (!newContent || typeof newContent !== 'string' || newContent.trim().length === 0) continue;
    newContent = sanitizeResultContent(newContent);
    if (!newContent.trim()) continue;
    stitched = insertSectionContent(stitched, header, newContent);
    insertedCount++;
  }

  if (insertedCount === 0) {
    process.stderr.write(`  ${label}: no sections stitched\n`);
    progress.failed[article.id] = 'No sections could be stitched';
    progress.stats.failed++;
    return 'failed';
  }

  const sanitized = sanitizeResultContent(stitched);
  const origClean = sanitizeResultContent(article.content);

  const validation = validateResult(origClean, sanitized);
  if (!validation.valid) {
    process.stderr.write(`  ${label}: FAILED validation\n`);
    for (const err of validation.errors) {
      process.stderr.write(`    - ${err}\n`);
    }
    progress.failed[article.id] = validation.errors.join('; ');
    progress.stats.failed++;
    return 'failed';
  }

  const delta = sanitized.length - origClean.length;
  const wordDelta = countProseWords(sanitized) - countProseWords(origClean);

  if (DRY_RUN) {
    process.stderr.write(`  ${label}: OK +${delta} chars, +${wordDelta} words (${insertedCount} sections)\n`);
    progress.stats.applied++;
    return 'applied';
  }

  let html;
  try {
    const htmlResult = convertMdxToHtml(sanitized, article.native_lang, article.target_lang);
    html = htmlResult.html;
  } catch (e) {
    process.stderr.write(`  ${label}: HTML error — ${e.message}\n`);
    progress.failed[article.id] = `HTML error: ${e.message}`;
    progress.stats.failed++;
    return 'failed';
  }

  const { error } = await supabase
    .from('blog_articles')
    .update({ content: sanitized, content_html: html })
    .eq('id', article.id);

  if (error) {
    process.stderr.write(`  ${label}: DB error — ${error.message}\n`);
    progress.failed[article.id] = `DB error: ${error.message}`;
    progress.stats.failed++;
    return 'failed';
  }

  process.stderr.write(`  ${label}: applied +${delta} chars, +${wordDelta} words (${insertedCount} sections)\n`);
  progress.applied.push(article.id);
  progress.stats.applied++;
  return 'applied';
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write(`\n${'═'.repeat(60)}\n`);
  process.stderr.write(`  SECTION-ONLY ENRICHMENT${DRY_RUN ? ' — DRY RUN' : ''}\n`);
  process.stderr.write(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}\n`);
  process.stderr.write(`${'═'.repeat(60)}\n\n`);

  const progress = loadProgress();
  process.stderr.write(`Progress: ${progress.applied.length} applied, ${Object.keys(progress.failed).length} failed previously\n`);

  const skipSet = buildAppliedSet(progress);
  process.stderr.write(`Skip set: ${skipSet.size} IDs\n`);

  const batchFiles = fs.readdirSync(BATCH_DIR)
    .filter(f => f.startsWith('tier2a-batch-') && f.endsWith('.json'))
    .sort();

  process.stderr.write(`Scanning ${batchFiles.length} batch files...\n`);

  const allArticles = [];
  for (const file of batchFiles) {
    const data = JSON.parse(fs.readFileSync(path.join(BATCH_DIR, file), 'utf-8'));
    for (const article of data.articles) {
      if (!skipSet.has(article.id)) {
        allArticles.push(article);
      }
    }
  }

  process.stderr.write(`Found ${allArticles.length + skipSet.size} total, skipping ${skipSet.size}\n`);

  const toProcess = LIMIT ? allArticles.slice(0, LIMIT) : allArticles;
  process.stderr.write(`Processing ${toProcess.length} articles\n\n`);

  if (toProcess.length === 0) {
    process.stderr.write('Nothing to process.\n');
    return;
  }

  let processed = 0;
  const total = toProcess.length;

  await processPool(toProcess, CONCURRENCY, async (article, idx) => {
    const result = await processArticle(article, idx, total, progress);
    processed++;
    progress.stats.total_processed = processed;

    if (!DRY_RUN) {
      saveProgress(progress);
    }

    return result;
  });

  if (!DRY_RUN) {
    saveProgress(progress);
  }

  process.stderr.write(`\n${'═'.repeat(60)}\n`);
  process.stderr.write(`  RESULTS${DRY_RUN ? ' — DRY RUN' : ''}\n`);
  process.stderr.write(`${'═'.repeat(60)}\n`);
  process.stderr.write(`  Processed: ${processed}\n`);
  process.stderr.write(`  Applied:   ${progress.stats.applied}\n`);
  process.stderr.write(`  Failed:    ${progress.stats.failed}\n`);
  process.stderr.write(`  Skipped:   ${progress.stats.skipped}\n`);
  process.stderr.write(`${'═'.repeat(60)}\n\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
