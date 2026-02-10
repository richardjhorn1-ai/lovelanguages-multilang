#!/usr/bin/env node
/**
 * Phase 2, Steps 3/4/5/7: Expand thin/stub articles with AI-generated content.
 *
 * Four modes:
 *   --mode stubs         Step 3: wordCount<200 AND 0 components → full expansion
 *   --mode thin-empty    Step 4: wordCount 200-299 AND 0 components → lighter expansion
 *   --mode empty-sections Step 5: ## heading followed by ## or EOF → fill empty sections
 *   --mode seo-thin      Step 7: wordCount<300 in communication/situations → expand
 *
 * Usage:
 *   node blog/scripts/fix-expand.mjs --mode stubs --dry-run
 *   node blog/scripts/fix-expand.mjs --mode stubs --limit 5
 *   node blog/scripts/fix-expand.mjs --mode stubs
 *   node blog/scripts/fix-expand.mjs --mode thin-empty
 *   node blog/scripts/fix-expand.mjs --mode empty-sections
 *   node blog/scripts/fix-expand.mjs --mode seo-thin
 *   node blog/scripts/fix-expand.mjs --mode stubs --model gemini-2.0-flash
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
let MODE = null, LIMIT = null, DRY_RUN = false, CONCURRENCY = 3, MODEL_NAME = 'gemini-3-flash-preview';

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--mode': MODE = args[++i]; break;
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--model': MODEL_NAME = args[++i]; break;
  }
}

const VALID_MODES = ['stubs', 'thin-empty', 'empty-sections', 'seo-thin'];
if (!MODE || !VALID_MODES.includes(MODE)) {
  console.error(`Usage: fix-expand.mjs --mode <${VALID_MODES.join('|')}>`);
  process.exit(1);
}

const model = genAI.getGenerativeModel({ model: MODEL_NAME });

// ─── Progress Files ──────────────────────────────────────────────────────────

const PROGRESS_FILES = {
  'stubs': 'ai-fix-progress-2-stubs.json',
  'thin-empty': 'ai-fix-progress-2-thin.json',
  'empty-sections': 'ai-fix-progress-2-sections.json',
  'seo-thin': 'ai-fix-progress-2-seo.json',
};
const PROGRESS_FILE = path.join(__dirname, 'data', PROGRESS_FILES[MODE]);

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  return { applied: [], failed: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─── Language Names ──────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── Content Analysis (from enrich-direct.mjs) ──────────────────────────────

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

/**
 * Count components in content.
 */
function countComponents(content) {
  return {
    VocabCard: (content.match(/<VocabCard/gi) || []).length,
    PhraseOfDay: (content.match(/<PhraseOfDay/gi) || []).length,
    CultureTip: (content.match(/<CultureTip/gi) || []).length,
    ConjugationTable: (content.match(/<ConjugationTable/gi) || []).length,
  };
}

function totalComponents(content) {
  const counts = countComponents(content);
  return counts.VocabCard + counts.PhraseOfDay + counts.CultureTip + counts.ConjugationTable;
}

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

// ─── Content Sanitization ────────────────────────────────────────────────────

function sanitizeResultContent(content) {
  let cleaned = content;
  cleaned = cleaned.replace(/^import\s+.*\s+from\s+['"].*['"];?\s*\n?/gm, '');
  cleaned = cleaned.replace(/<CTA[\s\S]*?\/?>\s*\n?/gi, '');
  cleaned = cleaned.replace(/^\s+/, '');
  return cleaned;
}

// ─── Validation (from enrich-direct.mjs) ─────────────────────────────────────

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

// ─── Section Stitching (from enrich-direct.mjs) ─────────────────────────────

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

// ─── Article Selection ───────────────────────────────────────────────────────

function selectArticles(articles, mode) {
  const selected = [];

  for (const a of articles) {
    const content = a.content || '';
    const wordCount = countProseWords(content);
    const compCount = totalComponents(content);

    switch (mode) {
      case 'stubs':
        if (wordCount < 200 && compCount === 0) {
          selected.push({ article: a, wordCount, compCount, reason: 'stub' });
        }
        break;

      case 'thin-empty':
        if (wordCount >= 200 && wordCount < 300 && compCount === 0) {
          selected.push({ article: a, wordCount, compCount, reason: 'thin-empty' });
        }
        break;

      case 'empty-sections': {
        const emptySections = findEmptyH2Sections(content);
        if (emptySections.length > 0) {
          selected.push({ article: a, wordCount, compCount, emptySections, reason: 'empty-sections' });
        }
        break;
      }

      case 'seo-thin': {
        const cat = (a.category || '').toLowerCase();
        if (wordCount < 300 && (cat === 'communication' || cat === 'situations')) {
          selected.push({ article: a, wordCount, compCount, reason: 'seo-thin' });
        }
        break;
      }
    }
  }

  return selected;
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

// ─── Prompts ─────────────────────────────────────────────────────────────────

function buildStubPrompt(article) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  return `You are writing educational content for a ${nativeName} language-learning blog about ${targetName}.

Article title: "${article.title}"
Category: ${article.category}
Current content is a stub — too short and lacks interactive components.

Write 400-600 words of educational content in ${nativeName} teaching ${targetName}. Include:
- Preserve any existing headings from the original content
- 3-5 VocabCard components
- 1 PhraseOfDay component
- Engaging prose that teaches vocabulary and grammar in context

COMPONENT FORMAT (use EXACTLY this syntax):
<VocabCard word="[${targetName} word]" translation="[${nativeName} translation]" pronunciation="[phonetic guide]" example="[example sentence in ${nativeName}]" />
<PhraseOfDay word="[${targetName} phrase]" translation="[${nativeName} translation]" pronunciation="[phonetic guide]" context="[usage context in ${nativeName}]" />

RULES:
- ALL prose MUST be in ${nativeName}
- VocabCard word/pronunciation = ${targetName}, translation/example = ${nativeName}
- Do NOT include imports, frontmatter (---), or <CTA> tags
- Do NOT use: "Don't be afraid", "Practice makes perfect", "Your partner will appreciate", "The most important thing is..."
- Do NOT wrap output in code blocks

Return ONLY the content (markdown + components). No JSON wrapper.`;
}

function buildThinPrompt(article) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  return `You are expanding a thin language-learning article for ${nativeName} speakers learning ${targetName}.

Article title: "${article.title}"
Category: ${article.category}

Current content (preserve and expand — do NOT replace):
---
${article.content}
---

Add 200-300 words of educational content in ${nativeName} and 2-3 VocabCard components. Integrate them naturally with the existing content.

COMPONENT FORMAT (use EXACTLY this syntax):
<VocabCard word="[${targetName} word]" translation="[${nativeName} translation]" pronunciation="[phonetic guide]" example="[example sentence in ${nativeName}]" />

RULES:
- ALL prose MUST be in ${nativeName}
- VocabCard word/pronunciation = ${targetName}, translation/example = ${nativeName}
- PRESERVE all existing content — only ADD to it
- Do NOT include imports, frontmatter (---), or <CTA> tags
- Do NOT use: "Don't be afraid", "Practice makes perfect", "Your partner will appreciate"
- Do NOT wrap output in code blocks

Return the COMPLETE article content (existing + new). No JSON wrapper.`;
}

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

For EACH section, write 2-3 sentences of educational content in ${nativeName} that:
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

function buildSeoThinPrompt(article) {
  const nativeName = LANG_NAMES[article.native_lang] || article.native_lang;
  const targetName = LANG_NAMES[article.target_lang] || article.target_lang;

  return `You are expanding a thin communication/situations language-learning article for ${nativeName} speakers learning ${targetName}.

Article title: "${article.title}"
Category: ${article.category}

Current content (preserve and expand — do NOT replace):
---
${article.content}
---

Add 200-400 words of educational content in ${nativeName} and 2-3 VocabCard components. Focus on practical communication phrases and real-world usage scenarios.

COMPONENT FORMAT (use EXACTLY this syntax):
<VocabCard word="[${targetName} word/phrase]" translation="[${nativeName} translation]" pronunciation="[phonetic guide]" example="[example sentence in ${nativeName}]" />

RULES:
- ALL prose MUST be in ${nativeName}
- VocabCard word/pronunciation = ${targetName}, translation/example = ${nativeName}
- PRESERVE all existing content — only ADD to it
- Do NOT include imports, frontmatter (---), or <CTA> tags
- Do NOT use: "Don't be afraid", "Practice makes perfect", "Your partner will appreciate"
- Do NOT wrap output in code blocks

Return the COMPLETE article content (existing + new). No JSON wrapper.`;
}

// ─── Process Article ─────────────────────────────────────────────────────────

async function processArticle(item, idx, total, progress) {
  const { article, wordCount, compCount, emptySections, reason } = item;
  const label = `[${idx + 1}/${total}] ${article.id.slice(0, 8)} ${article.native_lang}→${article.target_lang}`;

  if (DRY_RUN) {
    console.log(`  ${label}: ${reason} (${wordCount}w, ${compCount}c${emptySections ? ', ' + emptySections.length + ' empty sections' : ''})`);
    return;
  }

  try {
    let resultContent;

    if (MODE === 'empty-sections') {
      // Section-fill mode: get JSON response, stitch into existing content
      const prompt = buildSectionPrompt(article, emptySections);
      const responseText = await callGemini(prompt);

      let parsed;
      try {
        parsed = parseGeminiJson(responseText);
      } catch (e) {
        console.log(`  ${label}: JSON parse error — ${e.message}`);
        progress.failed[article.id] = `JSON parse error: ${e.message}`;
        saveProgress(progress);
        return;
      }

      if (!parsed.sections || typeof parsed.sections !== 'object') {
        console.log(`  ${label}: no sections in response`);
        progress.failed[article.id] = 'No sections object in response';
        saveProgress(progress);
        return;
      }

      let stitched = article.content;
      const sectionHeaders = Object.keys(parsed.sections);
      const lines = stitched.split('\n');
      const headerPositions = sectionHeaders.map(h => {
        const lineIdx = lines.findIndex(l => l.trim() === h);
        return { header: h, pos: lineIdx };
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
        console.log(`  ${label}: no sections stitched`);
        progress.failed[article.id] = 'No sections could be stitched';
        saveProgress(progress);
        return;
      }

      resultContent = stitched;
    } else if (MODE === 'stubs') {
      // Stub mode: generate full new content
      const prompt = buildStubPrompt(article);
      const responseText = await callGemini(prompt);
      // For stubs, we replace the content entirely (it's a stub anyway)
      // But preserve any existing headings structure
      resultContent = sanitizeResultContent(responseText);
    } else if (MODE === 'thin-empty') {
      // Thin-empty mode: expand existing content
      const prompt = buildThinPrompt(article);
      const responseText = await callGemini(prompt);
      resultContent = sanitizeResultContent(responseText);
    } else if (MODE === 'seo-thin') {
      // SEO-thin mode: expand existing content
      const prompt = buildSeoThinPrompt(article);
      const responseText = await callGemini(prompt);
      resultContent = sanitizeResultContent(responseText);
    }

    // Validate
    const validation = validateResult(article.content, resultContent);
    if (!validation.valid) {
      // For stubs, relax the shrinkage check (new content may be structured differently)
      const realErrors = MODE === 'stubs'
        ? validation.errors.filter(e => !e.startsWith('Content shrunk'))
        : validation.errors;

      if (realErrors.length > 0) {
        console.log(`  ${label}: FAILED validation`);
        for (const err of realErrors) console.log(`    - ${err}`);
        progress.failed[article.id] = realErrors.join('; ');
        saveProgress(progress);
        return;
      }
    }

    const newWordCount = countProseWords(resultContent);
    const wordDelta = newWordCount - wordCount;

    // Generate HTML
    let html;
    try {
      const htmlResult = convertMdxToHtml(resultContent, article.native_lang, article.target_lang);
      html = htmlResult.html;
    } catch (e) {
      console.log(`  ${label}: HTML error — ${e.message}`);
      progress.failed[article.id] = `HTML error: ${e.message}`;
      saveProgress(progress);
      return;
    }

    // Update DB
    const { error } = await supabase
      .from('blog_articles')
      .update({ content: resultContent, content_html: html })
      .eq('id', article.id);

    if (error) {
      console.log(`  ${label}: DB error — ${error.message}`);
      progress.failed[article.id] = `DB error: ${error.message}`;
    } else {
      console.log(`  ${label}: +${wordDelta}w (${wordCount}→${newWordCount})`);
      progress.applied.push(article.id);
    }
    saveProgress(progress);
  } catch (e) {
    console.log(`  ${label}: ERROR — ${e.message}`);
    progress.failed[article.id] = e.message;
    saveProgress(progress);
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/articles-local.json'), 'utf-8'));
const articles = data.articles.filter(a => a.target_lang !== 'all');
const progress = loadProgress();
const alreadyDone = new Set([...progress.applied, ...Object.keys(progress.failed)]);

// Select articles based on mode
const allSelected = selectArticles(articles, MODE).filter(item => !alreadyDone.has(item.article.id));

console.log(`\n${'═'.repeat(60)}`);
console.log(`  FIX-EXPAND: ${MODE}${DRY_RUN ? ' — DRY RUN' : ''}`);
console.log(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Found: ${allSelected.length} articles`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);

const toProcess = LIMIT ? allSelected.slice(0, LIMIT) : allSelected;
console.log(`  Processing: ${toProcess.length}\n`);

if (toProcess.length === 0) {
  console.log('Nothing to process.');
  process.exit(0);
}

// Process with concurrency pool
let index = 0;
async function worker() {
  while (index < toProcess.length) {
    const i = index++;
    await processArticle(toProcess[i], i, toProcess.length, progress);
  }
}
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, toProcess.length) }, () => worker()));

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Applied: ${progress.applied.length}`);
console.log(`  Failed:  ${Object.keys(progress.failed).length}`);
console.log(`${'═'.repeat(60)}\n`);
