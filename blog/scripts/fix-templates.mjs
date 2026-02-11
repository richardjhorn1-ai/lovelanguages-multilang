#!/usr/bin/env node
/**
 * Stage 1, Step 1.2: Fix unfilled template placeholders.
 *
 * Detects placeholder patterns in VocabCard/table content:
 *   - "Frase esempio N" / "Traduzione N" / "Situazione N" (Italian)
 *   - "[Disculpa N en X]" (Spanish bracket placeholders)
 *   - "Parola N" / "pro-NUN-cia" (generic pronunciation placeholders)
 *   - "Példa N" / "Fordítás N" (Hungarian)
 *   - "Voorbeeld N" / "Vertaling N" (Dutch)
 *   - "Příklad N" / "Překlad N" (Czech)
 *   - "Exemplo N" / "Tradução N" (Portuguese)
 *   - "Beispiel N" / "Übersetzung N" (German)
 *   - "Exemple N" / "Traduction N" (French)
 *   - Numbered rows with generic content in any language
 *
 * AI regeneration replaces placeholder VocabCards with real vocabulary.
 *
 * Usage:
 *   node blog/scripts/fix-templates.mjs --dry-run
 *   node blog/scripts/fix-templates.mjs --limit 5
 *   node blog/scripts/fix-templates.mjs
 *   node blog/scripts/fix-templates.mjs --concurrency 20 --model gemini-2.0-flash
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

// ─── Placeholder Detection ──────────────────────────────────────────────────

/**
 * Template placeholder patterns across languages.
 * These are unfilled template content that should be real vocabulary.
 */
const PLACEHOLDER_PATTERNS = [
  // Numbered examples/translations in multiple languages
  /Frase esempio \d/i,          // Italian
  /Traduzione \d/i,             // Italian
  /Situazione \d/i,             // Italian
  /Esempio \d/i,                // Italian/Portuguese
  /Parola \d/i,                 // Italian
  /Példa \d/i,                  // Hungarian
  /Fordítás \d/i,               // Hungarian
  /Voorbeeld \d/i,              // Dutch
  /Vertaling \d/i,              // Dutch
  /Příklad \d/i,                // Czech
  /Překlad \d/i,                // Czech
  /Exemplo \d/i,                // Portuguese
  /Tradução \d/i,               // Portuguese
  /Beispiel \d/i,               // German
  /Übersetzung \d/i,            // German
  /Exemple \d/i,                // French
  /Traduction \d/i,             // French
  /Ejemplo \d/i,                // Spanish
  /Traducción \d/i,             // Spanish
  /Eksempel \d/i,               // Norwegian/Danish
  /Översättning \d/i,           // Swedish
  /Tłumaczenie \d/i,            // Polish
  /Exemplu \d/i,                // Romanian
  /Traducere \d/i,              // Romanian
  /Örnek \d/i,                  // Turkish
  /Çeviri \d/i,                 // Turkish
  // Bracketed placeholders
  /\[Disculpa \d+ en \w+\]/i,   // Spanish
  /\[.+? \d+ in \w+\]/i,        // Generic bracket placeholders
  // Generic pronunciation placeholders
  /pro-NUN-cia/i,
  // Repeated "Word 1", "Phrase 1" etc.
  /\bWord \d\b/,
  /\bPhrase \d\b/,
  /\bSentence \d\b/,
];

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Check if a VocabCard tag has placeholder content.
 */
function isPlaceholderVocabCard(tag) {
  const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  const pronunciation = extractProp(tag, 'pronunciation') || '';
  const example = extractProp(tag, 'example') || '';

  const allProps = [word, translation, pronunciation, example].join(' ');
  return PLACEHOLDER_PATTERNS.some(re => re.test(allProps));
}

/**
 * Extract complete markdown tables that contain placeholder rows.
 * Returns array of { fullTable, headerRow, rowCount, tableType } objects.
 */
function extractPlaceholderTables(content) {
  const tables = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for table header rows (starts with |)
    if (!line.startsWith('|') || !line.includes('|')) continue;

    // Check if next line is a separator (|---|---|)
    if (i + 1 >= lines.length) continue;
    const sep = lines[i + 1].trim();
    if (!/^\|[\s-|]+\|$/.test(sep)) continue;

    // Collect all rows of this table
    const tableLines = [lines[i], lines[i + 1]];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      tableLines.push(lines[j]);
      j++;
    }

    // Check if any data rows are placeholders
    const dataRows = tableLines.slice(2);
    const isPlaceholder = dataRows.some(row =>
      /Frase esempio\s*\d|Traduzione\s*\d|Situazione\s*\d|Parola\s*\d|pro-NUN-cia|Esempio\s*\d|Tradução\s*\d|Übersetzung\s*\d|Beispiel\s*\d|Traduction\s*\d|Exemple\s*\d|Traducción\s*\d|Ejemplo\s*\d|Voorbeeld\s*\d|Vertaling\s*\d|Příklad\s*\d|Překlad\s*\d|Példa\s*\d|Fordítás\s*\d|Eksempel\s*\d|Översättning\s*\d|Tłumaczenie\s*\d|Exemplu\s*\d|Traducere\s*\d|Örnek\s*\d|Çeviri\s*\d/i.test(row)
    );

    if (isPlaceholder) {
      // Determine table type from header
      const header = line.toLowerCase();
      const tableType = header.includes('pronuncia') || header.includes('pronunc') ? 'vocabulary' : 'phrases';
      tables.push({
        fullTable: tableLines.join('\n'),
        headerRow: line,
        rowCount: dataRows.length,
        tableType,
        startLine: i,
        endLine: j - 1,
      });
      i = j - 1; // Skip past this table
    }
  }
  return tables;
}

/**
 * Check if article has placeholder content (in VocabCards, PhraseOfDay, or tables).
 */
function findPlaceholders(article) {
  const content = article.content || '';
  const issues = [];

  // Check VocabCards
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  const placeholderCards = [];
  for (const tag of vocabMatches) {
    if (isPlaceholderVocabCard(tag)) {
      placeholderCards.push(tag);
    }
  }
  if (placeholderCards.length > 0) {
    issues.push({ type: 'placeholder_vocabcards', cards: placeholderCards });
  }

  // Check PhraseOfDay
  const phraseMatches = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (const tag of phraseMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    const allProps = [word, translation].join(' ');
    if (PLACEHOLDER_PATTERNS.some(re => re.test(allProps))) {
      issues.push({ type: 'placeholder_phrase', tag });
    }
  }

  // Check markdown tables for placeholder rows
  const placeholderTables = extractPlaceholderTables(content);
  if (placeholderTables.length > 0) {
    issues.push({ type: 'placeholder_tables', tables: placeholderTables });
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

  const placeholderCards = issues.find(i => i.type === 'placeholder_vocabcards');
  const placeholderPhrase = issues.find(i => i.type === 'placeholder_phrase');
  const placeholderTables = issues.find(i => i.type === 'placeholder_tables');

  let prompt = `You are fixing a language-learning article for ${nativeName} speakers learning ${targetName}.
Title: "${article.title}"
Category: ${article.category}

The article has PLACEHOLDER content that was never filled in. Replace each placeholder with REAL vocabulary relevant to the article topic.

`;

  if (placeholderCards) {
    prompt += `PLACEHOLDER VOCABCARDS (replace each with real content):\n`;
    for (let i = 0; i < placeholderCards.cards.length; i++) {
      const tag = placeholderCards.cards[i];
      prompt += `${i + 1}. ${tag}\n`;
    }
    prompt += `\n`;
  }

  if (placeholderPhrase) {
    prompt += `PLACEHOLDER PHRASEOFDAY:\n${placeholderPhrase.tag}\n\n`;
  }

  if (placeholderTables) {
    prompt += `PLACEHOLDER TABLES to replace with real content:\n`;
    for (let i = 0; i < placeholderTables.tables.length; i++) {
      const t = placeholderTables.tables[i];
      prompt += `\nTable ${i + 1} (${t.tableType}, ${t.rowCount} rows):\n${t.fullTable}\n`;
    }
    prompt += `\n`;
  }

  // Build expected response format
  const responseFields = {};

  if (placeholderCards) {
    responseFields.vocabcards = `[{"index": 1, "word": "${targetName} word", "translation": "${nativeName} translation", "pronunciation": "phonetic guide", "example": "sentence in ${nativeName}"}]`;
  }
  if (placeholderPhrase) {
    responseFields.phrase = `{"word": "${targetName} phrase", "translation": "${nativeName} translation", "pronunciation": "phonetic guide", "context": "context in ${nativeName}"}`;
  }
  if (placeholderTables) {
    responseFields.tables = `[{"index": 1, "rows": [{"col1": "${targetName} word/phrase", "col2": "${nativeName} translation", "col3": "pronunciation OR situation"}]}]`;
  }

  prompt += `Return a JSON object with:\n${JSON.stringify(responseFields, null, 2)}

RULES:
- Column 1 (word/phrase): ${targetName}
- Column 2 (translation): ${nativeName}
- Column 3: pronunciation (phonetic, NOT IPA) OR situational context in ${nativeName}
- Pronunciations should be simple romanized phonetics (like "LAHSS-kah"), NOT IPA symbols
- Content must be relevant to the article topic: "${article.title}"
- Each table must have exactly the same number of rows as the original
- Omit keys not needed (no placeholder_vocabcards → no "vocabcards" key, etc.)`;

  return prompt;
}

// ─── Progress ────────────────────────────────────────────────────────────────

const PROGRESS_FILE = path.join(__dirname, 'data/ai-fix-progress-3-templates.json');

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

// Find articles with placeholder content
const articlesWithPlaceholders = [];
for (const a of articles) {
  if (alreadyDone.has(a.id)) continue;
  const issues = findPlaceholders(a);
  if (issues.length > 0) {
    articlesWithPlaceholders.push({ article: a, issues });
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  FIX-TEMPLATES${DRY_RUN ? ' — DRY RUN' : ''}`);
console.log(`  Model: ${MODEL_NAME} | Concurrency: ${CONCURRENCY}`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Found: ${articlesWithPlaceholders.length} articles with placeholders`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);

const toProcess = LIMIT ? articlesWithPlaceholders.slice(0, LIMIT) : articlesWithPlaceholders;
console.log(`  Processing: ${toProcess.length}\n`);

if (toProcess.length === 0) {
  console.log('Nothing to process.');
  process.exit(0);
}

let totalApplied = 0, totalFailed = 0;

async function processArticle({ article, issues }, idx) {
  const label = `[${idx + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;
  const issueTypes = issues.map(i => i.type).join('+');

  if (DRY_RUN) {
    const cardCount = issues.find(i => i.type === 'placeholder_vocabcards')?.cards.length || 0;
    const tableCount = issues.find(i => i.type === 'placeholder_tables')?.tables.length || 0;
    console.log(`  ${label}: ${issueTypes} (${cardCount} cards, ${tableCount} tables)`);
    return;
  }

  try {
    let content = article.content;
    let changed = false;

    // Get AI replacements
    const prompt = buildPrompt(article, issues);
    const response = await callGemini(prompt);
    const fixes = parseGeminiJson(response);

    // Replace placeholder VocabCards
    const placeholderCards = issues.find(i => i.type === 'placeholder_vocabcards');
    if (placeholderCards && fixes.vocabcards) {
      for (let i = 0; i < placeholderCards.cards.length && i < fixes.vocabcards.length; i++) {
        const oldTag = placeholderCards.cards[i];
        const fix = fixes.vocabcards[i];
        if (!fix || !fix.word) continue;

        const newTag = `<VocabCard word="${fix.word}" translation="${fix.translation || ''}" pronunciation="${fix.pronunciation || ''}" example="${fix.example || ''}" />`;
        if (content.includes(oldTag)) {
          content = content.replace(oldTag, newTag);
          changed = true;
        }
      }
    }

    // Replace placeholder PhraseOfDay
    const placeholderPhrase = issues.find(i => i.type === 'placeholder_phrase');
    if (placeholderPhrase && fixes.phrase) {
      const oldTag = placeholderPhrase.tag;
      const fix = fixes.phrase;
      const newTag = `<PhraseOfDay word="${fix.word || ''}" translation="${fix.translation || ''}" pronunciation="${fix.pronunciation || ''}" context="${fix.context || ''}" />`;
      if (content.includes(oldTag)) {
        content = content.replace(oldTag, newTag);
        changed = true;
      }
    }

    // Replace placeholder tables with real content
    const placeholderTables = issues.find(i => i.type === 'placeholder_tables');
    if (placeholderTables && fixes.tables) {
      for (let t = 0; t < placeholderTables.tables.length; t++) {
        const oldTable = placeholderTables.tables[t];
        const fixTable = fixes.tables[t];
        if (!fixTable || !fixTable.rows || fixTable.rows.length === 0) continue;

        // Build replacement table with same header + separator
        const headerLine = oldTable.fullTable.split('\n')[0];
        const sepLine = oldTable.fullTable.split('\n')[1];
        const newRows = fixTable.rows.map(r =>
          `| ${r.col1 || ''} | ${r.col2 || ''} | ${r.col3 || ''} |`
        );
        const newTable = [headerLine, sepLine, ...newRows].join('\n');

        if (content.includes(oldTable.fullTable)) {
          content = content.replace(oldTable.fullTable, newTable);
          changed = true;
        }
      }
    }

    if (!changed) {
      console.log(`  ${label}: NO CHANGE`);
      progress.failed[article.id] = 'no changes applied';
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
      console.log(`  ${label}: FIXED (${issueTypes})`);
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

console.log(`\n${'═'.repeat(60)}`);
console.log(`  RESULTS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Applied: ${totalApplied}`);
console.log(`  Failed:  ${totalFailed}`);
console.log(`${'═'.repeat(60)}\n`);
