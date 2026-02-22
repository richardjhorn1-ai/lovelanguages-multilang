#!/usr/bin/env node
/**
 * generate-faqs-gemini.mjs — Generate bespoke FAQ items for blog articles
 * using Gemini 3 Flash API with structured JSON output.
 *
 * Usage:
 *   node blog/scripts/generate-faqs-gemini.mjs --test              # 10 articles, print for inspection
 *   node blog/scripts/generate-faqs-gemini.mjs --lang en            # One language only
 *   node blog/scripts/generate-faqs-gemini.mjs                      # All remaining articles
 *   node blog/scripts/generate-faqs-gemini.mjs --batch-size 5       # Override batch size (default 10)
 *   node blog/scripts/generate-faqs-gemini.mjs --concurrency 3      # Parallel API calls (default 2)
 *
 * Reads article batch files from blog/scripts/faq-data/articles-{lang}-{batch}.json
 * Skips articles that already have FAQs (from Wave 1 faqs-*.json files)
 * Outputs to blog/scripts/faq-data/faqs-{lang}-gemini.json
 *
 * Lessons learned from Wave 1 (Claude subagents):
 *   - Use structured JSON schema (responseMimeType + responseSchema) for guaranteed valid JSON
 *   - Small batches (10 articles) prevent template drift and context overload
 *   - Concrete names (Maria, Tomáš) instead of [your name] placeholders
 *   - No emoji, no markdown, no HTML — plain text only
 *   - Anti-parroting: include article headings so AI knows what NOT to repeat
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const geminiKey = env.GEMINI_API_KEY;
if (!geminiKey) {
  process.stderr.write('Missing GEMINI_API_KEY in .env.local\n');
  process.exit(1);
}

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let testMode = false;
let langFilter = null;
let batchSize = 10;
let concurrency = 2;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--test': testMode = true; break;
    case '--lang': langFilter = args[++i]; break;
    case '--batch-size': batchSize = parseInt(args[++i], 10); break;
    case '--concurrency': concurrency = parseInt(args[++i], 10); break;
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FAQ_DIR = path.join(__dirname, 'faq-data');
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;

const LANGUAGE_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
  pt: 'Portuguese', pl: 'Polish', nl: 'Dutch', ro: 'Romanian', ru: 'Russian',
  tr: 'Turkish', uk: 'Ukrainian', sv: 'Swedish', no: 'Norwegian', da: 'Danish',
  cs: 'Czech', el: 'Greek', hu: 'Hungarian',
};

// ─── Load existing FAQ IDs (Wave 1) ──────────────────────────────────────────

function loadExistingFaqIds() {
  const ids = new Set();
  if (!fs.existsSync(FAQ_DIR)) return ids;

  const files = fs.readdirSync(FAQ_DIR)
    .filter(f => f.startsWith('faqs-') && f.endsWith('.json') && !f.includes('test'));

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(FAQ_DIR, file), 'utf-8'));
      if (Array.isArray(data)) {
        for (const record of data) {
          if (record.id) ids.add(record.id);
        }
      }
    } catch (e) {
      process.stderr.write(`  Warning: could not parse ${file}: ${e.message}\n`);
    }
  }

  return ids;
}

// ─── Load article batch files ────────────────────────────────────────────────

function loadArticles(existingIds) {
  const articleFiles = fs.readdirSync(FAQ_DIR)
    .filter(f => f.startsWith('articles-') && f.endsWith('.json') && !f.includes('test'))
    .sort();

  const articlesByLang = {};

  for (const file of articleFiles) {
    // Parse lang from filename: articles-{lang}-{batch}.json
    const match = file.match(/^articles-(\w+)-\d+\.json$/);
    if (!match) continue;
    const lang = match[1];

    if (langFilter && lang !== langFilter) continue;

    const data = JSON.parse(fs.readFileSync(path.join(FAQ_DIR, file), 'utf-8'));
    const newArticles = data.filter(a => !existingIds.has(a.id));

    if (!articlesByLang[lang]) articlesByLang[lang] = [];
    articlesByLang[lang].push(...newArticles);
  }

  return articlesByLang;
}

// ─── Gemini API Call ─────────────────────────────────────────────────────────

async function callGemini(prompt, retries = 3) {
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            id: { type: 'STRING', description: 'The article UUID' },
            faq_items: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  question: { type: 'STRING', description: 'A specific FAQ question ending with ?' },
                  answer: { type: 'STRING', description: 'A 2-3 sentence plain text answer (200-400 chars)' }
                },
                required: ['question', 'answer']
              }
            }
          },
          required: ['id', 'faq_items']
        }
      }
    }
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.status === 429 && attempt < retries) {
        const waitSec = attempt * 15;
        process.stderr.write(`    Rate limited, waiting ${waitSec}s (attempt ${attempt}/${retries})...\n`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      if (response.status >= 500 && attempt < retries) {
        const waitSec = 5;
        process.stderr.write(`    Server error ${response.status}, retrying in ${waitSec}s...\n`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText.slice(0, 200)}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('No response text from Gemini');

      // With responseMimeType: 'application/json', response should be clean JSON
      let jsonStr = text.trim();
      // Strip markdown code fences if present (shouldn't happen with structured output, but safety)
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonStr = jsonMatch[1].trim();

      return JSON.parse(jsonStr);
    } catch (err) {
      if (attempt === retries) throw err;
      process.stderr.write(`    Error: ${err.message}, retrying...\n`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// ─── Build Prompt ────────────────────────────────────────────────────────────

function buildPrompt(articles) {
  const articleList = articles.map((a, i) => {
    const headingsStr = a.headings && a.headings.length > 0
      ? `\n   Headings already in article: ${a.headings.join(' | ')}`
      : '';
    const targetLangDisplay = a.target_lang === 'all'
      ? 'General (applies to all languages)'
      : (LANGUAGE_NAMES[a.target_lang] || a.target_lang);
    return `${i + 1}. id: "${a.id}"
   Title: "${a.title}"
   Description: "${a.description}"
   Category: ${a.category} | Target language: ${targetLangDisplay} | Native language: ${LANGUAGE_NAMES[a.native_lang] || a.native_lang}${headingsStr}`;
  }).join('\n\n');

  return `You are writing FAQ content for a language-learning blog for couples. Generate exactly 5 unique FAQ items for each of the ${articles.length} blog articles below. These FAQs appear as visible accordions on article pages AND as Google FAQ structured data (JSON-LD), so quality matters enormously.

WHAT MAKES A GREAT FAQ:
- The question sounds like something a real person would type into Google about this specific topic
- The answer gives concrete, actionable advice — specific phrases, exact steps, real cultural tips
- The answer is 2-3 substantial sentences, between 200 and 400 characters long (this is critical — never below 200)
- At least one FAQ per article naturally mentions how couples can practice together
- The FAQ adds genuine NEW value that the article itself does not already cover

FORMATTING RULES:
- Write everything in English (this is for search engine structured data)
- Plain text only — no markdown, no HTML tags, no bold, no links, no bullet points
- No emoji characters anywhere
- When giving example phrases in a foreign language, include the English translation in parentheses
- You may occasionally mention example names like Maria, Tomáš, or Anna to make advice feel concrete, but only where it flows naturally — not in every single answer

CRITICAL CONSTRAINTS:
- Every question across all ${articles.length} articles must be completely UNIQUE — zero repeated or near-identical questions
- Your FAQs must NOT repeat or rephrase what is already covered in the article's headings listed below — generate follow-up questions that go BEYOND the article
- Copy each article's id value EXACTLY into your response — do not modify UUIDs

Return a JSON array with exactly ${articles.length} objects, one per article, each with exactly 5 faq_items.

ARTICLES:

${articleList}`;
}

// ─── Validate batch results ──────────────────────────────────────────────────

function validateBatch(results, expectedIds) {
  const issues = [];

  if (!Array.isArray(results)) {
    return { valid: false, issues: ['Result is not an array'] };
  }

  if (results.length !== expectedIds.length) {
    issues.push(`Expected ${expectedIds.length} records, got ${results.length}`);
  }

  for (const record of results) {
    if (!record.id || !expectedIds.includes(record.id)) {
      issues.push(`Unknown or missing id: ${record.id}`);
      continue;
    }

    if (!Array.isArray(record.faq_items)) {
      issues.push(`${record.id}: faq_items is not an array`);
      continue;
    }

    if (record.faq_items.length !== 5) {
      issues.push(`${record.id}: expected 5 FAQ items, got ${record.faq_items.length}`);
    }

    for (let i = 0; i < record.faq_items.length; i++) {
      const item = record.faq_items[i];
      if (!item.question || !item.answer) {
        issues.push(`${record.id} item ${i}: missing question or answer`);
        continue;
      }
      if (!item.question.endsWith('?')) {
        issues.push(`${record.id} item ${i}: question doesn't end with ?`);
      }
      if (item.answer.length < 150) {
        issues.push(`${record.id} item ${i}: answer too short (${item.answer.length} chars, min 150)`);
      }
      if (item.answer.length > 500) {
        issues.push(`${record.id} item ${i}: answer too long (${item.answer.length} chars, max 500)`);
      }
      // Check for placeholder brackets
      if (/\[your |your name\]|\[number\]|\[partner/i.test(item.answer)) {
        issues.push(`${record.id} item ${i}: placeholder bracket found in answer`);
      }
      // Check for emoji
      if (/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(item.answer)) {
        issues.push(`${record.id} item ${i}: emoji found in answer`);
      }
      // Check for markdown
      if (/\*\*|__|\[.*\]\(.*\)|^#{1,3}\s/m.test(item.answer)) {
        issues.push(`${record.id} item ${i}: markdown formatting found in answer`);
      }
    }
  }

  return { valid: issues.length === 0, issues };
}

// ─── Process a batch with concurrency control ────────────────────────────────

async function processBatch(articles, batchIndex, totalBatches, lang) {
  const prompt = buildPrompt(articles);
  const expectedIds = articles.map(a => a.id);

  try {
    const results = await callGemini(prompt);
    const validation = validateBatch(results, expectedIds);

    if (!validation.valid) {
      process.stderr.write(`    ⚠️  Batch ${batchIndex + 1} validation issues:\n`);
      for (const issue of validation.issues.slice(0, 5)) {
        process.stderr.write(`      - ${issue}\n`);
      }
      // If we got some valid records, keep them
      if (Array.isArray(results)) {
        const validRecords = results.filter(r =>
          r.id && expectedIds.includes(r.id) &&
          Array.isArray(r.faq_items) && r.faq_items.length > 0
        );
        if (validRecords.length > 0) {
          process.stderr.write(`    Keeping ${validRecords.length}/${articles.length} valid records\n`);
          return validRecords;
        }
      }
      return null;
    }

    return results;
  } catch (err) {
    process.stderr.write(`    ✗ Batch ${batchIndex + 1} failed: ${err.message}\n`);
    return null;
  }
}

// ─── Concurrency limiter ─────────────────────────────────────────────────────

async function withConcurrency(tasks, limit) {
  const results = [];
  const running = new Set();

  for (const task of tasks) {
    const promise = task().then(result => {
      running.delete(promise);
      return result;
    });
    running.add(promise);
    results.push(promise);

    if (running.size >= limit) {
      await Promise.race(running);
    }
  }

  return Promise.all(results);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  process.stderr.write('Loading existing FAQ IDs...\n');
  const existingIds = loadExistingFaqIds();
  process.stderr.write(`  Found ${existingIds.size} existing FAQ records (Wave 1)\n\n`);

  process.stderr.write('Loading article batch files...\n');
  const articlesByLang = loadArticles(existingIds);

  let totalRemaining = 0;
  for (const [lang, articles] of Object.entries(articlesByLang)) {
    process.stderr.write(`  ${lang} (${LANGUAGE_NAMES[lang]}): ${articles.length} articles remaining\n`);
    totalRemaining += articles.length;
  }
  process.stderr.write(`  Total remaining: ${totalRemaining}\n\n`);

  if (totalRemaining === 0) {
    process.stderr.write('No articles to process. All have FAQs already.\n');
    return;
  }

  // Test mode: just process 10 diverse articles and print results
  if (testMode) {
    process.stderr.write('TEST MODE: Processing 10 diverse articles\n\n');

    // Pick 10 articles from different languages
    const testArticles = [];
    const langs = Object.keys(articlesByLang);
    for (let i = 0; testArticles.length < 10 && i < 100; i++) {
      const lang = langs[i % langs.length];
      if (articlesByLang[lang] && articlesByLang[lang].length > 0) {
        // Pick from different positions to get variety
        const idx = Math.min(Math.floor(i / langs.length) * 3, articlesByLang[lang].length - 1);
        const article = articlesByLang[lang][idx];
        if (article && !testArticles.find(a => a.id === article.id)) {
          testArticles.push(article);
        }
      }
    }

    process.stderr.write(`  Selected ${testArticles.length} test articles from ${[...new Set(testArticles.map(a => a.native_lang))].join(', ')}\n\n`);

    const results = await callGemini(buildPrompt(testArticles));
    const validation = validateBatch(results, testArticles.map(a => a.id));

    if (!validation.valid) {
      process.stderr.write('⚠️  Validation issues:\n');
      for (const issue of validation.issues) {
        process.stderr.write(`  - ${issue}\n`);
      }
    } else {
      process.stderr.write('✓ All validations passed\n\n');
    }

    // Print all FAQs for inspection
    for (const record of results) {
      const article = testArticles.find(a => a.id === record.id);
      console.log(`\n${'═'.repeat(80)}`);
      console.log(`ARTICLE: ${article?.title || record.id}`);
      console.log(`  Lang: ${article?.native_lang} → ${article?.target_lang} | Category: ${article?.category}`);
      if (article?.headings?.length > 0) {
        console.log(`  Headings: ${article.headings.slice(0, 5).join(', ')}${article.headings.length > 5 ? '...' : ''}`);
      }
      console.log(`${'─'.repeat(80)}`);
      for (let i = 0; i < record.faq_items.length; i++) {
        const faq = record.faq_items[i];
        console.log(`  Q${i + 1}: ${faq.question}`);
        console.log(`  A${i + 1}: ${faq.answer}`);
        console.log(`  [${faq.answer.length} chars]`);
        console.log();
      }
    }

    // Save test output
    const testFile = path.join(FAQ_DIR, 'faqs-gemini-test.json');
    fs.writeFileSync(testFile, JSON.stringify(results, null, 2));
    process.stderr.write(`\nTest output saved to ${testFile}\n`);
    process.stderr.write(`Total: ${results.length} articles × 5 FAQs = ${results.length * 5} FAQ items\n`);
    return;
  }

  // Full run
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalFailed = 0;

  for (const [lang, articles] of Object.entries(articlesByLang).sort()) {
    if (articles.length === 0) continue;

    process.stderr.write(`\n${'═'.repeat(60)}\n`);
    process.stderr.write(`Processing ${lang} (${LANGUAGE_NAMES[lang]}): ${articles.length} articles\n`);
    process.stderr.write(`${'═'.repeat(60)}\n`);

    // Split into batches
    const batches = [];
    for (let i = 0; i < articles.length; i += batchSize) {
      batches.push(articles.slice(i, i + batchSize));
    }

    const allResults = [];
    let batchesDone = 0;

    // Process batches with concurrency
    const tasks = batches.map((batch, batchIdx) => () =>
      processBatch(batch, batchIdx, batches.length, lang).then(result => {
        batchesDone++;
        const processed = Math.min(batchesDone * batchSize, articles.length);
        const pct = ((processed / articles.length) * 100).toFixed(1);
        process.stderr.write(`  [${lang}] ${processed}/${articles.length} articles (${pct}%) — batch ${batchesDone}/${batches.length}\n`);
        return result;
      })
    );

    const batchResults = await withConcurrency(tasks, concurrency);

    for (const result of batchResults) {
      if (result) {
        allResults.push(...result);
      } else {
        totalFailed += batchSize;
      }
    }

    totalProcessed += allResults.length;

    // Save results for this language
    if (allResults.length > 0) {
      const outFile = path.join(FAQ_DIR, `faqs-${lang}-gemini.json`);
      fs.writeFileSync(outFile, JSON.stringify(allResults, null, 2));
      process.stderr.write(`  ✓ Saved ${allResults.length} records to faqs-${lang}-gemini.json\n`);
    }

    // Rate limit between languages
    await new Promise(r => setTimeout(r, 2000));
  }

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  process.stderr.write(`\n${'═'.repeat(60)}\n`);
  process.stderr.write(`COMPLETE\n`);
  process.stderr.write(`  Total processed: ${totalProcessed}\n`);
  process.stderr.write(`  Total failed: ${totalFailed}\n`);
  process.stderr.write(`  Time: ${elapsed} minutes\n`);
  process.stderr.write(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
