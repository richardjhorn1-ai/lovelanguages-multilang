#!/usr/bin/env node
/**
 * deep-sweep-apply.mjs — Validate fixes from Opus agent review, push to Supabase,
 * regenerate content_html, and update progress tracker.
 *
 * Usage:
 *   node blog/scripts/deep-sweep-apply.mjs --native en --target es --dry-run
 *   node blog/scripts/deep-sweep-apply.mjs --native en --target es
 *   node blog/scripts/deep-sweep-apply.mjs --native en --target es --batch 001
 */
import { createClient } from '@supabase/supabase-js';
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

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let NATIVE = null, TARGET = null, DRY_RUN = false, BATCH_FILTER = null;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--native': NATIVE = args[++i]; break;
    case '--target': TARGET = args[++i]; break;
    case '--dry-run': DRY_RUN = true; break;
    case '--batch': BATCH_FILTER = args[++i]; break;
  }
}

if (!NATIVE || !TARGET) {
  console.error('Usage: node blog/scripts/deep-sweep-apply.mjs --native <code> --target <code> [--dry-run] [--batch 001]');
  process.exit(1);
}

// ─── Validation Helpers ──────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const dq = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`, 's');
  const dm = tag.match(dq);
  if (dm) return dm[1];
  const sq = new RegExp(`${propName}\\s*=\\s*'([^']*)'`, 's');
  const sm = tag.match(sq);
  return sm ? sm[1] : null;
}

/**
 * Validate that fixed content is reasonable:
 * - Not empty
 * - Not drastically shorter than original (>50% word count)
 * - VocabCards have word + translation props
 */
function validateFixedContent(original, fixed, articleId) {
  const errors = [];

  if (!fixed || fixed.trim().length === 0) {
    errors.push('Fixed content is empty');
    return errors;
  }

  // Word count check (>50% of original)
  const originalWords = original.split(/\s+/).filter(w => w.length > 0).length;
  const fixedWords = fixed.split(/\s+/).filter(w => w.length > 0).length;
  if (originalWords > 20 && fixedWords < originalWords * 0.5) {
    errors.push(`Fixed content too short: ${fixedWords} words vs original ${originalWords} (${((fixedWords / originalWords) * 100).toFixed(0)}%)`);
  }

  // Check VocabCard props
  const vocabTags = fixed.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (let i = 0; i < vocabTags.length; i++) {
    const tag = vocabTags[i];
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    if (!word || word.trim().length < 2) {
      errors.push(`VocabCard #${i + 1} has empty/short word prop`);
    }
    if (!translation || translation.trim().length < 2) {
      errors.push(`VocabCard #${i + 1} has empty/short translation prop`);
    }
  }

  // Check PhraseOfDay props
  const phraseTags = fixed.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (let i = 0; i < phraseTags.length; i++) {
    const tag = phraseTags[i];
    const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    if (!word || word.trim().length < 2) {
      errors.push(`PhraseOfDay #${i + 1} has empty/short word prop`);
    }
    if (!translation || translation.trim().length < 2) {
      errors.push(`PhraseOfDay #${i + 1} has empty/short translation prop`);
    }
  }

  return errors;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();
const pairDir = path.join(__dirname, 'data', 'deep-sweep', `${NATIVE}-${TARGET}`);

console.log(`\n${'═'.repeat(70)}`);
console.log(`  DEEP SWEEP APPLY: ${NATIVE}→${TARGET}${DRY_RUN ? ' (DRY RUN)' : ''}`);
console.log(`${'═'.repeat(70)}`);

// 1. Read manifest
const manifestPath = path.join(pairDir, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error(`  ERROR: No manifest found at ${manifestPath}`);
  console.error('  Run deep-sweep-prep.mjs first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
console.log(`  Pair: ${manifest.nativeName} → ${manifest.targetName}`);
console.log(`  Total articles: ${manifest.totalArticles}`);
console.log(`  Batches: ${manifest.batches.length}`);

// 2. Collect original content from batch files (for validation)
const originalContent = new Map();
for (const batch of manifest.batches) {
  const batchPath = path.join(pairDir, batch.file);
  if (!fs.existsSync(batchPath)) continue;
  const batchData = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  for (const article of batchData.articles) {
    originalContent.set(article.id, article.content);
  }
}

// 3. Read all fixes files
const fixesFiles = [];
for (const batch of manifest.batches) {
  const fixesId = batch.batchId.replace('batch-', 'fixes-');
  if (BATCH_FILTER && !batch.batchId.endsWith(BATCH_FILTER)) continue;

  const fixesPath = path.join(pairDir, `${fixesId}.json`);
  if (!fs.existsSync(fixesPath)) {
    console.log(`  WARNING: ${fixesId}.json not found — skipping`);
    continue;
  }

  try {
    const fixesData = JSON.parse(fs.readFileSync(fixesPath, 'utf-8'));
    fixesFiles.push({ batchId: batch.batchId, fixesId, data: fixesData });
  } catch (e) {
    console.log(`  ERROR: Failed to parse ${fixesId}.json — ${e.message}`);
  }
}

if (fixesFiles.length === 0) {
  console.log('\n  No fixes files found. Run the review agents first.');
  process.exit(0);
}

console.log(`  Found ${fixesFiles.length} fixes file(s)`);

// 4. Process each fixes file
let totalApplied = 0, totalSkipped = 0, totalClean = 0, totalNeedsHuman = 0, totalValidationFail = 0;
const issueSummary = {};
const failedArticles = {};

for (const { batchId, fixesId, data: fixes } of fixesFiles) {
  console.log(`\n  --- ${fixesId} ---`);

  if (!fixes.results || !Array.isArray(fixes.results)) {
    console.log(`    ERROR: Invalid fixes format — missing results array`);
    continue;
  }

  for (const result of fixes.results) {
    const label = `${result.slug || result.id?.slice(0, 8) || '?'}`;

    if (result.verdict === 'clean') {
      totalClean++;
      continue;
    }

    if (result.verdict === 'needs_human') {
      totalNeedsHuman++;
      console.log(`    ${label}: NEEDS HUMAN — ${result.notes || 'no notes'}`);
      if (result.issuesFound) {
        for (const issue of result.issuesFound) {
          issueSummary[issue.type] = (issueSummary[issue.type] || 0) + 1;
        }
      }
      continue;
    }

    if (result.verdict !== 'fixed') {
      console.log(`    ${label}: UNKNOWN VERDICT "${result.verdict}" — skipping`);
      totalSkipped++;
      continue;
    }

    // verdict === 'fixed'
    if (!result.fixedContent) {
      console.log(`    ${label}: SKIP — verdict=fixed but no fixedContent`);
      totalSkipped++;
      continue;
    }

    // Track issues
    if (result.issuesFound) {
      for (const issue of result.issuesFound) {
        issueSummary[issue.type] = (issueSummary[issue.type] || 0) + 1;
      }
    }

    // Validate
    const originalMdx = originalContent.get(result.id) || '';
    const validationErrors = validateFixedContent(originalMdx, result.fixedContent, result.id);

    if (validationErrors.length > 0) {
      console.log(`    ${label}: VALIDATION FAILED`);
      for (const err of validationErrors) {
        console.log(`      - ${err}`);
      }
      totalValidationFail++;
      failedArticles[result.id] = validationErrors;
      continue;
    }

    // Generate HTML
    let html;
    try {
      const converted = convertMdxToHtml(result.fixedContent, NATIVE, TARGET);
      html = converted.html;
    } catch (e) {
      console.log(`    ${label}: HTML REGEN FAILED — ${e.message}`);
      totalValidationFail++;
      failedArticles[result.id] = [`HTML generation failed: ${e.message}`];
      continue;
    }

    if (DRY_RUN) {
      const issueTypes = (result.issuesFound || []).map(i => i.type).join(', ');
      console.log(`    ${label}: WOULD APPLY (${issueTypes})`);
      totalApplied++;
      continue;
    }

    // Push to Supabase
    const { error } = await supabase
      .from('blog_articles')
      .update({ content: result.fixedContent, content_html: html })
      .eq('id', result.id);

    if (error) {
      console.log(`    ${label}: DB ERROR — ${error.message}`);
      totalValidationFail++;
      failedArticles[result.id] = [`DB error: ${error.message}`];
    } else {
      totalApplied++;
      if (totalApplied % 10 === 0) {
        console.log(`    Progress: ${totalApplied} applied...`);
      }
    }
  }
}

// 5. Update progress tracker
const progressPath = path.join(__dirname, 'data', 'deep-sweep', 'progress.json');
let progress = { lastUpdated: null, pairs: {}, globalStats: { totalPairs: 306, completed: 0, inProgress: 0, totalArticlesReviewed: 0, totalFixed: 0 } };
if (fs.existsSync(progressPath)) {
  try { progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8')); } catch {}
}

const pairKey = `${NATIVE}-${TARGET}`;
const pairProgress = progress.pairs[pairKey] || {
  status: 'prepared',
  totalArticles: manifest.totalArticles,
  totalBatches: manifest.batches.length,
  batchesReviewed: 0,
  batchesApplied: 0,
  reviewed: { clean: 0, fixed: 0, needsHuman: 0 },
  applied: { articles: 0, failed: {} },
  issueSummary: {},
};

pairProgress.batchesReviewed = fixesFiles.length;
pairProgress.reviewed = {
  clean: totalClean,
  fixed: totalApplied + totalValidationFail,
  needsHuman: totalNeedsHuman,
};
pairProgress.issueSummary = issueSummary;

if (!DRY_RUN) {
  pairProgress.status = 'applied';
  pairProgress.batchesApplied = fixesFiles.length;
  pairProgress.applied = {
    articles: totalApplied,
    failed: failedArticles,
  };

  // Update global stats
  let completed = 0, inProgress = 0, totalReviewed = 0, totalFixed = 0;
  for (const [key, pair] of Object.entries(progress.pairs)) {
    if (pair.status === 'applied') completed++;
    else if (pair.status !== 'not_started') inProgress++;
    totalReviewed += pair.totalArticles || 0;
    totalFixed += pair.applied?.articles || 0;
  }
  progress.globalStats = { totalPairs: 306, completed, inProgress, totalArticlesReviewed: totalReviewed, totalFixed };
} else {
  pairProgress.status = 'reviewed';
}

progress.lastUpdated = new Date().toISOString();
progress.pairs[pairKey] = pairProgress;
fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

// 6. Print summary
const duration = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${'═'.repeat(70)}`);
console.log(`  RESULTS${DRY_RUN ? ' (DRY RUN)' : ''}`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Clean (no changes):   ${totalClean}`);
console.log(`  Applied fixes:        ${totalApplied}`);
console.log(`  Needs human review:   ${totalNeedsHuman}`);
console.log(`  Validation failed:    ${totalValidationFail}`);
console.log(`  Skipped:              ${totalSkipped}`);

if (Object.keys(issueSummary).length > 0) {
  console.log(`\n  --- Issues Fixed ---`);
  const sorted = Object.entries(issueSummary).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sorted) {
    console.log(`  ${type.padEnd(30)} ${count}`);
  }
}

if (Object.keys(failedArticles).length > 0) {
  console.log(`\n  --- Failed Articles ---`);
  for (const [id, errors] of Object.entries(failedArticles)) {
    console.log(`  ${id.slice(0, 8)}: ${errors[0]}`);
  }
}

console.log(`\n  Duration: ${duration}s`);
console.log(`  Progress saved to: ${progressPath}`);
console.log(`${'═'.repeat(70)}\n`);
