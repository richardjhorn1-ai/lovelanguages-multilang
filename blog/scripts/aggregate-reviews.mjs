#!/usr/bin/env node
/**
 * Stage 3, Step 3.1: Aggregate subagent review reports.
 *
 * Reads 18 review-{lang}.json files from data/reviews/,
 * groups issues by type, counts affected articles,
 * identifies systemic patterns, and produces combined report.
 *
 * Usage:
 *   node blog/scripts/aggregate-reviews.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ALL_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'uk', 'tr', 'sv', 'no', 'da', 'cs', 'el', 'hu'];
const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

const reviewsDir = path.join(__dirname, 'data/reviews');

// ─── Load Reviews ───────────────────────────────────────────────────────────

const allReviews = [];
const missingLangs = [];

for (const lang of ALL_LANGS) {
  const reviewFile = path.join(reviewsDir, `review-${lang}.json`);
  if (fs.existsSync(reviewFile)) {
    try {
      const review = JSON.parse(fs.readFileSync(reviewFile, 'utf-8'));
      allReviews.push(review);
    } catch (e) {
      console.log(`  WARNING: Could not parse review-${lang}.json: ${e.message}`);
      missingLangs.push(lang);
    }
  } else {
    missingLangs.push(lang);
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  AGGREGATE REVIEWS`);
console.log(`${'═'.repeat(60)}`);
console.log(`  Loaded: ${allReviews.length}/18 review files`);
if (missingLangs.length > 0) {
  console.log(`  Missing: ${missingLangs.join(', ')}`);
}

// ─── Aggregate Issues ───────────────────────────────────────────────────────

const issuesByType = {};
const issuesBySeverity = { high: [], medium: [], low: [] };
const issuesByLangPair = {};
const allIssues = [];
const allSystemicPatterns = [];

let totalReviewed = 0;
let totalClean = 0;

for (const review of allReviews) {
  totalReviewed += review.articles_reviewed || 0;
  totalClean += review.clean_articles || 0;

  // Collect systemic patterns
  if (review.systemic_patterns) {
    for (const pattern of review.systemic_patterns) {
      allSystemicPatterns.push({
        native_lang: review.native_lang,
        pattern,
      });
    }
  }

  // Collect issues
  if (!review.issues) continue;
  for (const issue of review.issues) {
    allIssues.push({ ...issue, native_lang: review.native_lang });

    // Group by type
    if (!issuesByType[issue.issue_type]) {
      issuesByType[issue.issue_type] = [];
    }
    issuesByType[issue.issue_type].push(issue);

    // Group by severity
    const sev = issue.severity || 'medium';
    if (issuesBySeverity[sev]) {
      issuesBySeverity[sev].push(issue);
    }

    // Group by language pair
    const pair = `${review.native_lang}\u2192${issue.target_lang}`;
    if (!issuesByLangPair[pair]) {
      issuesByLangPair[pair] = [];
    }
    issuesByLangPair[pair].push(issue);
  }
}

// ─── Report ─────────────────────────────────────────────────────────────────

console.log(`\n  SUMMARY:`);
console.log(`    Articles reviewed: ${totalReviewed}`);
console.log(`    Clean articles: ${totalClean} (${totalReviewed > 0 ? Math.round(totalClean / totalReviewed * 100) : 0}%)`);
console.log(`    Total issues found: ${allIssues.length}`);

console.log(`\n  BY SEVERITY:`);
for (const [sev, issues] of Object.entries(issuesBySeverity)) {
  if (issues.length > 0) {
    console.log(`    ${sev}: ${issues.length}`);
  }
}

console.log(`\n  BY TYPE:`);
const sortedTypes = Object.entries(issuesByType).sort((a, b) => b[1].length - a[1].length);
for (const [type, issues] of sortedTypes) {
  console.log(`    ${type}: ${issues.length}`);
}

console.log(`\n  TOP AFFECTED LANGUAGE PAIRS:`);
const sortedPairs = Object.entries(issuesByLangPair).sort((a, b) => b[1].length - a[1].length);
for (const [pair, issues] of sortedPairs.slice(0, 20)) {
  console.log(`    ${pair}: ${issues.length} issues`);
}

if (allSystemicPatterns.length > 0) {
  console.log(`\n  SYSTEMIC PATTERNS:`);
  for (const { native_lang, pattern } of allSystemicPatterns) {
    console.log(`    [${native_lang}] ${pattern}`);
  }
}

// ─── Write Full Report ──────────────────────────────────────────────────────

const report = {
  generated_at: new Date().toISOString(),
  summary: {
    reviews_loaded: allReviews.length,
    missing_langs: missingLangs,
    articles_reviewed: totalReviewed,
    clean_articles: totalClean,
    clean_rate: totalReviewed > 0 ? Math.round(totalClean / totalReviewed * 100) : 0,
    total_issues: allIssues.length,
  },
  by_severity: Object.fromEntries(
    Object.entries(issuesBySeverity).map(([sev, issues]) => [sev, issues.length])
  ),
  by_type: Object.fromEntries(sortedTypes.map(([type, issues]) => [type, {
    count: issues.length,
    article_ids: [...new Set(issues.map(i => i.article_id))],
  }])),
  by_lang_pair: Object.fromEntries(
    sortedPairs.map(([pair, issues]) => [pair, {
      count: issues.length,
      types: Object.fromEntries(
        Object.entries(
          issues.reduce((acc, i) => { acc[i.issue_type] = (acc[i.issue_type] || 0) + 1; return acc; }, {})
        ).sort((a, b) => b[1] - a[1])
      ),
    }])
  ),
  systemic_patterns: allSystemicPatterns,
  all_issues: allIssues,
  fix_recommendations: generateRecommendations(sortedTypes, allSystemicPatterns),
};

const reportFile = path.join(__dirname, 'data/review-aggregate.json');
fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
console.log(`\n  Full report: ${reportFile}`);

// ─── Fix Recommendations ────────────────────────────────────────────────────

function generateRecommendations(sortedTypes, patterns) {
  const recs = [];

  for (const [type, issues] of sortedTypes) {
    const uniqueArticles = new Set(issues.map(i => i.article_id)).size;
    let fix = 'manual review';
    let script = 'TBD';

    switch (type) {
      case 'generic_filler':
        fix = 'AI rewrite affected sections';
        script = 'Extend fix-expand.mjs';
        break;
      case 'wrong_language':
        fix = 'AI rewrite in correct language';
        script = 'Extend fix-final.mjs';
        break;
      case 'template_artifacts':
        fix = 'AI regeneration with real content';
        script = 'fix-templates.mjs';
        break;
      case 'bad_pronunciation':
        fix = 'AI convert to readable phonetics';
        script = 'fix-ipa.mjs';
        break;
      case 'empty_props':
        fix = 'AI fill missing props';
        script = 'fix-final.mjs';
        break;
      default:
        fix = 'Investigate and build targeted fix';
        script = 'New script needed';
    }

    recs.push({
      issue_type: type,
      count: issues.length,
      unique_articles: uniqueArticles,
      recommended_fix: fix,
      script,
    });
  }

  return recs;
}

console.log(`\n  FIX RECOMMENDATIONS:`);
for (const rec of report.fix_recommendations) {
  console.log(`    ${rec.issue_type} (${rec.count} issues, ${rec.unique_articles} articles)`);
  console.log(`      Fix: ${rec.recommended_fix}`);
  console.log(`      Script: ${rec.script}`);
}

console.log(`\n${'═'.repeat(60)}\n`);
