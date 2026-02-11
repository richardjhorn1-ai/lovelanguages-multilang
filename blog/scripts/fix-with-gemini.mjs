#!/usr/bin/env node
/**
 * fix-with-gemini.mjs — Fix detected semantic issues using Gemini Flash.
 *
 * Reads the audit manifest (gemini-audit-manifest.json), fetches article content
 * from Supabase, sends broken VocabCard/PhraseOfDay props to Gemini for correction,
 * stitches fixes into content, regenerates HTML, and updates Supabase.
 *
 * Usage:
 *   node blog/scripts/fix-with-gemini.mjs                                  # Full run
 *   node blog/scripts/fix-with-gemini.mjs --pair de-it                     # Single pair
 *   node blog/scripts/fix-with-gemini.mjs --issue-type WRONG_LANG_EXAMPLE  # Single type
 *   node blog/scripts/fix-with-gemini.mjs --severity critical              # Critical only
 *   node blog/scripts/fix-with-gemini.mjs --limit 50 --dry-run             # Test run
 *   node blog/scripts/fix-with-gemini.mjs --concurrency 50 --resume        # Fast, resumable
 */
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
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
const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let PAIR_FILTER = null, ISSUE_TYPE_FILTER = null, SEVERITY_FILTER = null;
let LIMIT = null, CONCURRENCY = 20, BATCH_SIZE_NORMAL = 5, BATCH_SIZE_TITLE = 3;
let DRY_RUN = false, RESUME = false, MODEL_NAME = 'gemini-2.5-flash';

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--pair': PAIR_FILTER = args[++i]; break;
    case '--issue-type': ISSUE_TYPE_FILTER = args[++i]; break;
    case '--severity': SEVERITY_FILTER = args[++i]; break;
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--concurrency': CONCURRENCY = parseInt(args[++i], 10); break;
    case '--batch-size': BATCH_SIZE_NORMAL = parseInt(args[++i], 10); break;
    case '--dry-run': DRY_RUN = true; break;
    case '--resume': RESUME = true; break;
    case '--model': MODEL_NAME = args[++i]; break;
  }
}

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

/**
 * Extract all component tags (VocabCard, PhraseOfDay) in document order.
 * Returns array with tag text, position, componentType, and extracted props.
 */
function extractOrderedTags(content) {
  if (!content) return [];
  const tags = [];
  const regex = /<(VocabCard|PhraseOfDay)[\s\S]*?\/>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    tags.push({
      componentType: match[1],
      fullTag: match[0],
      position: match.index,
      word: extractProp(match[0], 'word') || extractProp(match[0], 'polish') || '',
      translation: extractProp(match[0], 'translation') || extractProp(match[0], 'english') || '',
      pronunciation: extractProp(match[0], 'pronunciation') || '',
      example: extractProp(match[0], 'example') || '',
    });
  }
  return tags;
}

/**
 * Match manifest issues to card indices using evidence strings.
 */
function matchIssuesToCards(issues, cards) {
  return issues.map(issue => {
    const evidence = String(issue.evidence || '');
    // Extract value from evidence format like word="value" or example=""
    const quotedMatch = evidence.match(/(?:word|translation|example|pronunciation)\s*=\s*"([^"]*)"/);
    const searchValue = quotedMatch ? quotedMatch[1] : evidence.trim();

    if (!searchValue) return { ...issue, cardIndex: -1 };

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.word === searchValue || card.translation === searchValue ||
          card.pronunciation === searchValue ||
          (card.example && card.example === searchValue) ||
          (card.word && searchValue.includes(card.word) && card.word.length > 2) ||
          (card.example && card.example.includes(searchValue) && searchValue.length > 5)) {
        return { ...issue, cardIndex: i };
      }
    }

    return { ...issue, cardIndex: -1 };
  });
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

// ─── Prompt Builders ─────────────────────────────────────────────────────────

function getPronunciationNote(nativeLang) {
  if (nativeLang === 'ru' || nativeLang === 'uk') {
    return `Output pronunciation in Cyrillic (reader is ${LANG_NAMES[nativeLang]}).`;
  }
  if (nativeLang === 'el') {
    return `Output pronunciation in Greek script (reader is Greek).`;
  }
  return `Output pronunciation in Latin with syllable-STRESS (e.g., "bohn-ZHOOR", "GRAH-tsee-eh").`;
}

function buildNormalFixPrompt(batch, nativeLang, targetLang) {
  const nativeName = LANG_NAMES[nativeLang] || nativeLang;
  const targetName = LANG_NAMES[targetLang] || targetLang;
  const pronNote = getPronunciationNote(nativeLang);

  let prompt = `You are fixing blog articles that teach ${targetName} to ${nativeName} speakers.
Fix ONLY the broken props listed below. Return corrected values.

Rules:
- \`word\` must be in ${targetName}
- \`translation\` must be in ${nativeName}
- \`example\` must be a natural sentence in ${targetName} using the word
- \`pronunciation\`: ${pronNote} No IPA symbols.
- Keep corrections natural and contextually appropriate for the article topic.

`;

  for (const item of batch) {
    prompt += `--- ARTICLE ---\nid: "${item.id}"\ntitle: "${item.title}"\n`;
    prompt += `Components:\n`;
    for (let i = 0; i < item.cards.length; i++) {
      const c = item.cards[i];
      prompt += `  [${i}] ${c.componentType}: word="${c.word}" translation="${c.translation}" pronunciation="${c.pronunciation}"`;
      if (c.example) prompt += ` example="${c.example}"`;
      prompt += `\n`;
    }
    prompt += `Issues:\n`;
    for (const issue of item.matchedIssues) {
      const cardRef = issue.cardIndex >= 0 ? `[${issue.cardIndex}] ` : '';
      prompt += `  - ${cardRef}${issue.type}: ${issue.description}\n`;
    }
    prompt += `\n`;
  }

  prompt += `Return a JSON array. For each article, include an object with fixes:
[{"id":"article-uuid","fixes":[{"index":0,"word":"corrected value","pronunciation":"corrected"}]}]

Each fix object must have "index" (component index from above) plus ONLY the props that need changing.
If a prop is fine, omit it from the fix. ONLY return the JSON array, no other text.`;

  return prompt;
}

function buildTitleMismatchPrompt(batch, nativeLang, targetLang) {
  const nativeName = LANG_NAMES[nativeLang] || nativeLang;
  const targetName = LANG_NAMES[targetLang] || targetLang;
  const pronNote = getPronunciationNote(nativeLang);

  let prompt = `You are fixing blog articles where the vocabulary doesn't match the article's topic.
Replace ALL vocabulary to match the title. Generate new, relevant words for the topic.

Rules:
- \`word\` must be in ${targetName}
- \`translation\` must be in ${nativeName}
- \`example\` must be a natural sentence in ${targetName} using the word
- \`pronunciation\`: ${pronNote} No IPA symbols.
- Each word should be relevant to the article's title/topic.
- Keep the same number of components — replace content, not structure.

`;

  for (const item of batch) {
    prompt += `--- ARTICLE ---\nid: "${item.id}"\ntitle: "${item.title}"\n`;
    prompt += `Current components (ALL need topic-appropriate replacements):\n`;
    for (let i = 0; i < item.cards.length; i++) {
      const c = item.cards[i];
      prompt += `  [${i}] ${c.componentType}: word="${c.word}" translation="${c.translation}" pronunciation="${c.pronunciation}"`;
      if (c.example) prompt += ` example="${c.example}"`;
      prompt += `\n`;
    }
    prompt += `\n`;
  }

  prompt += `Return a JSON array. For each article, include ALL components with new values:
[{"id":"article-uuid","fixes":[{"index":0,"word":"new word","translation":"new translation","pronunciation":"new pronunciation","example":"new example sentence"}]}]

Every fix MUST include word, translation, pronunciation, and example (for VocabCards).
ONLY return the JSON array, no other text.`;

  return prompt;
}

// ─── Fix Stitching ───────────────────────────────────────────────────────────

function replaceOrAddProp(tag, prop, newValue) {
  // Escape double quotes in value to avoid breaking the tag
  const safeValue = newValue.replace(/"/g, "'");
  const propRegex = new RegExp(`${prop}\\s*=\\s*"[^"]*"`);
  if (propRegex.test(tag)) {
    return tag.replace(propRegex, `${prop}="${safeValue}"`);
  }
  // Add prop before closing />
  return tag.replace(/\s*\/>/, ` ${prop}="${safeValue}" />`);
}

/**
 * Apply Gemini fixes to article content by replacing props in component tags.
 * Uses position-based replacement (reverse order) for accuracy.
 */
function applyFixesToContent(content, orderedTags, fixes) {
  const fixMap = new Map();
  for (const fix of fixes) {
    if (fix.index !== undefined && fix.index >= 0 && fix.index < orderedTags.length) {
      fixMap.set(fix.index, fix);
    }
  }

  if (fixMap.size === 0) return { content, propsFixed: 0 };

  let result = content;
  let propsFixed = 0;

  // Process in reverse order to preserve string positions
  for (let i = orderedTags.length - 1; i >= 0; i--) {
    const fix = fixMap.get(i);
    if (!fix) continue;

    const tag = orderedTags[i];
    let newTag = tag.fullTag;
    let tagChanged = false;

    for (const prop of ['word', 'translation', 'pronunciation', 'example']) {
      if (fix[prop] !== undefined && fix[prop] !== null && fix[prop].trim().length > 0) {
        const updatedTag = replaceOrAddProp(newTag, prop, fix[prop]);
        if (updatedTag !== newTag) {
          newTag = updatedTag;
          tagChanged = true;
          propsFixed++;
        }
      }
    }

    if (tagChanged) {
      result = result.substring(0, tag.position) + newTag +
               result.substring(tag.position + tag.fullTag.length);
    }
  }

  return { content: result, propsFixed };
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validateFixedContent(original, fixed) {
  const errors = [];

  if (!fixed || fixed.trim().length === 0) {
    errors.push('Fixed content is empty');
    return errors;
  }

  // Word count check (>50% of original)
  const originalWords = original.split(/\s+/).filter(w => w.length > 0).length;
  const fixedWords = fixed.split(/\s+/).filter(w => w.length > 0).length;
  if (originalWords > 20 && fixedWords < originalWords * 0.5) {
    errors.push(`Content shrank: ${fixedWords} words vs original ${originalWords}`);
  }

  // Check VocabCard props
  const vocabTags = fixed.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (let i = 0; i < vocabTags.length; i++) {
    const tag = vocabTags[i];
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    if (word.trim().length < 2) errors.push(`VocabCard #${i}: empty/short word`);
    if (translation.trim().length < 2) errors.push(`VocabCard #${i}: empty/short translation`);
  }

  // Check for broken tags (unclosed quotes)
  const brokenTag = fixed.match(/<(?:VocabCard|PhraseOfDay)[^>]*[^/]>/);
  if (brokenTag) errors.push('Broken component tag detected');

  return errors;
}

// ─── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchArticlesByIds(ids) {
  const PAGE_SIZE = 200;
  const allArticles = [];

  for (let i = 0; i < ids.length; i += PAGE_SIZE) {
    const batch = ids.slice(i, i + PAGE_SIZE);
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, slug, native_lang, target_lang, title, content')
      .in('id', batch);

    if (error) {
      console.log(`  ERROR fetching batch at ${i}: ${error.message}`);
      continue;
    }
    if (data) allArticles.push(...data);

    if ((i + PAGE_SIZE) % 1000 === 0 || i + PAGE_SIZE >= ids.length) {
      console.log(`  Fetched ${allArticles.length}/${ids.length} articles...`);
    }
  }

  return allArticles;
}

// ─── Progress Tracking ───────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const MANIFEST_PATH = path.join(DATA_DIR, 'gemini-audit-manifest.json');
const PROGRESS_PATH = path.join(DATA_DIR, 'gemini-fix-progress.json');

function loadProgress() {
  if (RESUME && fs.existsSync(PROGRESS_PATH)) {
    return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return { applied: [], failed: {}, stats: { totalPropsFixed: 0, byIssueType: {} } };
}

function saveProgress(progress) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();

console.log(`\n${'═'.repeat(70)}`);
console.log(`  GEMINI FIX PIPELINE${DRY_RUN ? ' — DRY RUN' : ''}`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}`);
console.log(`  Pair: ${PAIR_FILTER || 'all'} | Issue type: ${ISSUE_TYPE_FILTER || 'all'} | Severity: ${SEVERITY_FILTER || 'all'}`);
console.log(`  Limit: ${LIMIT || 'all'} | Resume: ${RESUME}`);
console.log(`${'═'.repeat(70)}\n`);

// Step 1: Load manifest and filter
console.log('Step 1: Loading manifest and applying filters...');

if (!fs.existsSync(MANIFEST_PATH)) {
  console.error(`  ERROR: Manifest not found at ${MANIFEST_PATH}`);
  console.error('  Run detect-with-gemini.mjs first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
console.log(`  Manifest: ${manifest.meta.totalWithIssues} articles, ${manifest.meta.totalIssueCount} issues`);

// Filter articles by CLI flags
let articleEntries = Object.entries(manifest.articles);

if (PAIR_FILTER) {
  articleEntries = articleEntries.filter(([, data]) => data.pair === PAIR_FILTER);
  console.log(`  After pair filter (${PAIR_FILTER}): ${articleEntries.length} articles`);
}

if (SEVERITY_FILTER) {
  articleEntries = articleEntries.filter(([, data]) =>
    data.issues.some(i => i.severity === SEVERITY_FILTER)
  );
  console.log(`  After severity filter (${SEVERITY_FILTER}): ${articleEntries.length} articles`);
}

if (ISSUE_TYPE_FILTER) {
  // Keep articles that have the specified issue type, but only keep matching issues
  articleEntries = articleEntries
    .map(([id, data]) => [id, {
      ...data,
      issues: data.issues.filter(i => i.type === ISSUE_TYPE_FILTER),
    }])
    .filter(([, data]) => data.issues.length > 0);
  console.log(`  After issue-type filter (${ISSUE_TYPE_FILTER}): ${articleEntries.length} articles`);
}

// Load progress and filter already-done
const progress = loadProgress();
const alreadyDone = new Set([...progress.applied, ...Object.keys(progress.failed)]);
articleEntries = articleEntries.filter(([id]) => !alreadyDone.has(id));
console.log(`  Already done: ${alreadyDone.size} | Remaining: ${articleEntries.length}`);

if (LIMIT) {
  articleEntries = articleEntries.slice(0, LIMIT);
  console.log(`  After limit: ${articleEntries.length}`);
}

if (articleEntries.length === 0) {
  console.log('\n  Nothing to fix. Done.\n');
  process.exit(0);
}

// Step 2: Fetch article content from Supabase
console.log('\nStep 2: Fetching article content from Supabase...');
const articleIds = articleEntries.map(([id]) => id);
const fetchedArticles = await fetchArticlesByIds(articleIds);
const articleMap = new Map(fetchedArticles.map(a => [a.id, a]));
console.log(`  Fetched: ${fetchedArticles.length} articles with content`);

// Step 3: Prepare articles — extract tags, match issues
console.log('\nStep 3: Extracting components and matching issues...');

const normalArticles = []; // No TITLE_MISMATCH
const titleMismatchArticles = []; // Has TITLE_MISMATCH

for (const [id, manifestData] of articleEntries) {
  const article = articleMap.get(id);
  if (!article || !article.content) continue;

  const cards = extractOrderedTags(article.content);
  if (cards.length === 0) continue;

  const matchedIssues = matchIssuesToCards(manifestData.issues, cards);
  const hasTitleMismatch = manifestData.issues.some(i => i.type === 'TITLE_MISMATCH');

  const prepared = {
    id,
    slug: manifestData.slug,
    title: manifestData.title,
    pair: manifestData.pair,
    cards,
    matchedIssues,
    originalContent: article.content,
    nativeLang: article.native_lang,
    targetLang: article.target_lang,
  };

  if (hasTitleMismatch) {
    titleMismatchArticles.push(prepared);
  } else {
    normalArticles.push(prepared);
  }
}

console.log(`  Normal fix articles: ${normalArticles.length}`);
console.log(`  Title mismatch articles: ${titleMismatchArticles.length}`);

// Step 4: Build batches grouped by pair
console.log('\nStep 4: Building batches...');

function buildBatches(articles, batchSize) {
  const byPair = {};
  for (const a of articles) {
    if (!byPair[a.pair]) byPair[a.pair] = [];
    byPair[a.pair].push(a);
  }

  const batches = [];
  for (const [pair, pairArticles] of Object.entries(byPair)) {
    const [native, target] = pair.split('-');
    for (let i = 0; i < pairArticles.length; i += batchSize) {
      batches.push({
        pair,
        nativeLang: native,
        targetLang: target,
        articles: pairArticles.slice(i, i + batchSize),
        isTitleMismatch: batchSize === BATCH_SIZE_TITLE,
      });
    }
  }
  return batches;
}

const normalBatches = buildBatches(normalArticles, BATCH_SIZE_NORMAL);
const titleBatches = buildBatches(titleMismatchArticles, BATCH_SIZE_TITLE);
const allBatches = [...normalBatches, ...titleBatches];

console.log(`  Normal batches: ${normalBatches.length} (${BATCH_SIZE_NORMAL}/batch)`);
console.log(`  Title mismatch batches: ${titleBatches.length} (${BATCH_SIZE_TITLE}/batch)`);
console.log(`  Total batches: ${allBatches.length}\n`);

if (DRY_RUN) {
  console.log('DRY RUN — showing what would be processed:\n');

  const pairCounts = {};
  for (const a of [...normalArticles, ...titleMismatchArticles]) {
    pairCounts[a.pair] = (pairCounts[a.pair] || 0) + 1;
  }
  const sortedPairs = Object.entries(pairCounts).sort((a, b) => b[1] - a[1]);
  for (const [pair, count] of sortedPairs.slice(0, 20)) {
    console.log(`  ${pair}: ${count} articles`);
  }
  if (sortedPairs.length > 20) console.log(`  ... and ${sortedPairs.length - 20} more pairs`);

  const issueCounts = {};
  for (const [, data] of articleEntries) {
    for (const issue of data.issues) {
      issueCounts[issue.type] = (issueCounts[issue.type] || 0) + 1;
    }
  }
  console.log('\n  Issue breakdown:');
  for (const [type, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type.padEnd(28)} ${count}`);
  }

  const estCost = allBatches.length * 0.004;
  console.log(`\n  Estimated Gemini calls: ${allBatches.length}`);
  console.log(`  Estimated cost: ~$${estCost.toFixed(2)}-$${(estCost * 2).toFixed(2)}`);
  process.exit(0);
}

// Step 5: Process batches with concurrency
console.log('Step 5: Processing batches with Gemini...\n');

let batchesCompleted = 0;
let batchesFailed = 0;
let articlesFixed = 0;
let articlesFailed = 0;
let totalPropsFixed = 0;

async function processBatch(batch, batchIdx) {
  const label = `[${batchIdx + 1}/${allBatches.length}] ${batch.pair} (${batch.articles.length} articles${batch.isTitleMismatch ? ', TITLE_MISMATCH' : ''})`;

  try {
    // Build prompt
    const prompt = batch.isTitleMismatch
      ? buildTitleMismatchPrompt(batch.articles, batch.nativeLang, batch.targetLang)
      : buildNormalFixPrompt(batch.articles, batch.nativeLang, batch.targetLang);

    // Call Gemini
    const response = await callGemini(prompt);
    let results;

    try {
      results = parseGeminiJson(response);
    } catch (parseErr) {
      console.log(`  ${label}: JSON PARSE ERROR — ${parseErr.message}`);
      console.log(`    Response preview: ${response.slice(0, 200)}...`);
      batchesFailed++;
      for (const a of batch.articles) {
        progress.failed[a.id] = 'JSON parse error';
      }
      saveProgress(progress);
      return;
    }

    if (!Array.isArray(results)) {
      console.log(`  ${label}: Expected array, got ${typeof results}`);
      batchesFailed++;
      for (const a of batch.articles) {
        progress.failed[a.id] = 'Invalid response format';
      }
      saveProgress(progress);
      return;
    }

    // Build a map of results by id
    const resultMap = new Map();
    for (const r of results) {
      if (r.id && Array.isArray(r.fixes)) resultMap.set(r.id, r.fixes);
    }

    // Apply fixes per article
    for (const article of batch.articles) {
      const fixes = resultMap.get(article.id);

      if (!fixes || fixes.length === 0) {
        // Gemini returned no fixes for this article
        progress.applied.push(article.id);
        continue;
      }

      // Stitch fixes into content
      const { content: fixedContent, propsFixed } = applyFixesToContent(
        article.originalContent, article.cards, fixes
      );

      if (propsFixed === 0) {
        console.log(`    ${article.slug}: 0 props changed — skipping`);
        progress.failed[article.id] = 'No props changed after stitching';
        articlesFailed++;
        continue;
      }

      // Validate
      const validationErrors = validateFixedContent(article.originalContent, fixedContent);
      if (validationErrors.length > 0) {
        console.log(`    ${article.slug}: VALIDATION FAILED — ${validationErrors[0]}`);
        progress.failed[article.id] = validationErrors.join('; ');
        articlesFailed++;
        continue;
      }

      // Regenerate HTML
      let html;
      try {
        const converted = convertMdxToHtml(fixedContent, article.nativeLang, article.targetLang);
        html = converted.html;
      } catch (e) {
        console.log(`    ${article.slug}: HTML REGEN FAILED — ${e.message}`);
        progress.failed[article.id] = `HTML regen: ${e.message}`;
        articlesFailed++;
        continue;
      }

      // Update Supabase
      const { error } = await supabase
        .from('blog_articles')
        .update({ content: fixedContent, content_html: html })
        .eq('id', article.id);

      if (error) {
        console.log(`    ${article.slug}: DB ERROR — ${error.message}`);
        progress.failed[article.id] = error.message;
        articlesFailed++;
      } else {
        progress.applied.push(article.id);
        articlesFixed++;
        totalPropsFixed += propsFixed;

        // Track by issue type
        for (const issue of article.matchedIssues) {
          progress.stats.byIssueType[issue.type] = (progress.stats.byIssueType[issue.type] || 0) + 1;
        }
      }
    }

    batchesCompleted++;
    const fixedInBatch = batch.articles.filter(a => progress.applied.includes(a.id)).length;
    console.log(`  ${label}: ${fixedInBatch} fixed`);

    // Save progress periodically
    if (batchesCompleted % 5 === 0) {
      progress.stats.totalPropsFixed = totalPropsFixed;
      saveProgress(progress);
    }
  } catch (e) {
    console.log(`  ${label}: ERROR — ${e.message}`);
    batchesFailed++;
    for (const a of batch.articles) {
      if (!progress.applied.includes(a.id) && !progress.failed[a.id]) {
        progress.failed[a.id] = e.message;
      }
    }
    saveProgress(progress);
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

// Final save
progress.stats.totalPropsFixed = totalPropsFixed;
saveProgress(progress);

// ─── Summary ─────────────────────────────────────────────────────────────────

const durationMs = Date.now() - startTime;

console.log(`\n${'═'.repeat(70)}`);
console.log(`  RESULTS`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Articles fixed:    ${articlesFixed}`);
console.log(`  Props corrected:   ${totalPropsFixed}`);
console.log(`  Failed:            ${articlesFailed}`);
console.log(`  Batches:           ${batchesCompleted} completed, ${batchesFailed} failed`);
console.log(`  Duration:          ${(durationMs / 1000).toFixed(1)}s`);

if (Object.keys(progress.stats.byIssueType).length > 0) {
  console.log(`\n  --- Issues Fixed by Type ---`);
  const sorted = Object.entries(progress.stats.byIssueType).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    console.log(`  ${type.padEnd(28)} ${count}`);
  }
}

console.log(`\n  Total applied (all runs): ${progress.applied.length}`);
console.log(`  Total failed (all runs):  ${Object.keys(progress.failed).length}`);
console.log(`  Progress saved: ${PROGRESS_PATH}`);
console.log(`${'═'.repeat(70)}\n`);
