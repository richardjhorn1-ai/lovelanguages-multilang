#!/usr/bin/env node
/**
 * fix-regex-global.mjs — Phase A: Global deterministic fixes for ALL blog articles.
 *
 * Applies regex-only fixes that need zero AI judgment:
 *   1. Remove import statements
 *   2. Strip double-bracket pronunciations (leading [ and trailing ])
 *   3. Remove <CTA .../> components
 *   4. Replace IPA symbols with learner-friendly equivalents
 *   5. Convert legacy props (polish= → word=, english= → translation=)
 *   6. Fix double-hash headers (## ## → ##)
 *   7. Clear [...] placeholder pronunciations
 *
 * Regenerates content_html for every modified article.
 *
 * Usage:
 *   node blog/scripts/fix-regex-global.mjs --dry-run          # Preview (default)
 *   node blog/scripts/fix-regex-global.mjs --apply             # Apply to Supabase
 *   node blog/scripts/fix-regex-global.mjs --apply --pair es-en  # Single pair only
 *   node blog/scripts/fix-regex-global.mjs --apply --limit 100  # First N articles
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
let APPLY = false, PAIR_FILTER = null, LIMIT = null;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--apply': APPLY = true; break;
    case '--dry-run': APPLY = false; break;
    case '--pair': PAIR_FILTER = args[++i]; break;  // e.g., "es-en"
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
  }
}

// ─── IPA Mapping ─────────────────────────────────────────────────────────────

const IPA_MAP = {
  'ʃ': 'sh', 'ʒ': 'zh', 'θ': 'th', 'ð': 'dh', 'ŋ': 'ng',
  'ɲ': 'ny', 'ɛ': 'e', 'ɔ': 'o', 'ə': 'e', 'æ': 'a',
  'ɑ': 'a', 'ɪ': 'i', 'ʊ': 'u', 'ɐ': 'a', 'ɒ': 'o',
  'ʌ': 'a', 'ɜ': 'er', 'ɹ': 'r', 'ɾ': 'r', 'ɻ': 'r',
  'ʂ': 'sh', 'ʐ': 'zh', 'ɕ': 'sh', 'ʑ': 'zh', 'ɡ': 'g',
  'ɫ': 'l', 'ɬ': 'l', 'ɮ': 'l', 'ʔ': '', 'ç': 'h',
  'ʁ': 'r', 'ħ': 'h', 'ʕ': '', 'β': 'b', 'ɸ': 'f',
  'ɣ': 'g', 'χ': 'kh', 'ˈ': '', 'ˌ': '', 'ː': '',
};

const IPA_REGEX = new RegExp('[' + Object.keys(IPA_MAP).join('').replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ']', 'g');

function replaceIPA(text) {
  return text.replace(IPA_REGEX, ch => IPA_MAP[ch] || '');
}

// ─── Fix Functions ───────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Apply all deterministic fixes to article content.
 * Returns { content, fixes } where fixes is an array of fix type strings.
 */
function applyFixes(content) {
  const fixes = [];
  let fixed = content;

  // 1. Remove import statements
  const beforeImports = fixed;
  fixed = fixed.replace(/^import\s+.*from\s+['"]@?components\/.*['"];?\s*$/gm, '');
  fixed = fixed.replace(/^import\s+.*from\s+['"]\.\.?\/?components\/.*['"];?\s*$/gm, '');
  if (fixed !== beforeImports) fixes.push('imports');

  // 2. Strip double-bracket pronunciations — remove leading [ and trailing ]
  //    from pronunciation prop values in component tags
  const beforeBrackets = fixed;
  fixed = fixed.replace(
    /(<(?:VocabCard|PhraseOfDay|Phrase|PhraseCard|PhrasePair)\s[\s\S]*?)pronunciation\s*=\s*"(\[)([\s\S]*?)"([\s\S]*?\/>)/gi,
    (match, before, bracket, pron, after) => {
      // Strip leading [ and also trailing ] if present
      let cleanPron = pron;
      if (cleanPron.endsWith(']')) {
        cleanPron = cleanPron.slice(0, -1);
      }
      return `${before}pronunciation="${cleanPron.trim()}"${after}`;
    }
  );
  if (fixed !== beforeBrackets) fixes.push('doubleBrackets');

  // 3. Remove <CTA .../> components (self-closing and with children)
  const beforeCTA = fixed;
  fixed = fixed.replace(/<CTA[\s\S]*?\/>\s*/gi, '');
  fixed = fixed.replace(/<CTA[\s\S]*?>[\s\S]*?<\/CTA>\s*/gi, '');
  if (fixed !== beforeCTA) fixes.push('cta');

  // 4. Replace IPA symbols in pronunciation props
  const beforeIPA = fixed;
  fixed = fixed.replace(
    /(<(?:VocabCard|PhraseOfDay|Phrase|PhraseCard|PhrasePair|ConjugationTable)\s[\s\S]*?)pronunciation\s*=\s*"([^"]*)"([\s\S]*?\/>)/gi,
    (match, before, pron, after) => {
      if (IPA_REGEX.test(pron)) {
        const cleaned = replaceIPA(pron);
        return `${before}pronunciation="${cleaned}"${after}`;
      }
      return match;
    }
  );
  // Also check markdown table cells for IPA (pronunciation columns)
  // This is trickier — only replace IPA chars within known pronunciation patterns
  if (fixed !== beforeIPA) fixes.push('ipa');

  // 5. Convert legacy props: polish= → word=, english= → translation=
  const beforeLegacy = fixed;
  fixed = fixed.replace(/<(?:VocabCard|PhraseOfDay)[\s\S]*?\/>/gi, (tag) => {
    let newTag = tag;
    // polish= → word= (only if no existing word= prop)
    if (/polish\s*=\s*"/.test(newTag) && !/\bword\s*=\s*"/.test(newTag)) {
      newTag = newTag.replace(/polish\s*=\s*"/, 'word="');
    }
    // english= → translation= (only if no existing translation= prop)
    if (/english\s*=\s*"/.test(newTag) && !/\btranslation\s*=\s*"/.test(newTag)) {
      newTag = newTag.replace(/english\s*=\s*"/, 'translation="');
    }
    return newTag;
  });
  if (fixed !== beforeLegacy) fixes.push('legacyProps');

  // 6. Fix double-hash headers
  const beforeHash = fixed;
  fixed = fixed.replace(/^(#{2,6})\s+\1\s+/gm, '$1 ');
  if (fixed !== beforeHash) fixes.push('doubleHash');

  // 7. Clear [...] placeholder pronunciations
  const beforePlaceholder = fixed;
  fixed = fixed.replace(/pronunciation\s*=\s*"\[\.{3,}\]"/g, 'pronunciation=""');
  fixed = fixed.replace(/pronunciation\s*=\s*"\[…\]"/g, 'pronunciation=""');
  if (fixed !== beforePlaceholder) fixes.push('placeholder');

  // Clean up excessive blank lines from removals
  fixed = fixed.replace(/\n{4,}/g, '\n\n\n');
  fixed = fixed.trim();

  return { content: fixed, fixes };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();

console.log(`\n${'═'.repeat(70)}`);
console.log(`  GLOBAL REGEX FIX — Phase A${APPLY ? '' : ' (DRY RUN)'}`);
console.log(`${'═'.repeat(70)}`);

// 1. Fetch all articles from Supabase in pages
console.log('\n  Fetching articles from Supabase...');
let allArticles = [];
let from = 0;
const PAGE_SIZE = 1000;

while (true) {
  let query = supabase
    .from('blog_articles')
    .select('id, slug, native_lang, target_lang, content, content_html')
    .range(from, from + PAGE_SIZE - 1);

  if (PAIR_FILTER) {
    const [native, target] = PAIR_FILTER.split('-');
    query = query.eq('native_lang', native).eq('target_lang', target);
  }

  const { data: page, error } = await query;

  if (error) {
    console.error(`  ERROR fetching page at offset ${from}: ${error.message}`);
    break;
  }

  if (!page || page.length === 0) break;
  allArticles = allArticles.concat(page);
  console.log(`    Fetched ${allArticles.length} articles...`);
  if (page.length < PAGE_SIZE) break;
  from += PAGE_SIZE;
}

// Filter out 'all' target_lang articles (methodology pages)
allArticles = allArticles.filter(a => a.target_lang !== 'all');

if (LIMIT) {
  allArticles = allArticles.slice(0, LIMIT);
}

console.log(`  Total articles to scan: ${allArticles.length}`);

// 2. Apply fixes
const stats = {
  scanned: 0,
  changed: 0,
  unchanged: 0,
  htmlRegenOnly: 0,
  failed: 0,
  byFix: {},
  byPair: {},
};

const changedArticles = [];

for (const article of allArticles) {
  stats.scanned++;
  const pair = `${article.native_lang}-${article.target_lang}`;

  if (!article.content) {
    stats.unchanged++;
    continue;
  }

  const { content: fixedContent, fixes } = applyFixes(article.content);

  if (fixes.length === 0) {
    stats.unchanged++;
    continue;
  }

  // Track fix stats
  stats.changed++;
  for (const fix of fixes) {
    stats.byFix[fix] = (stats.byFix[fix] || 0) + 1;
  }
  stats.byPair[pair] = (stats.byPair[pair] || 0) + 1;

  // Regenerate HTML
  let html;
  try {
    const converted = convertMdxToHtml(fixedContent, article.native_lang, article.target_lang);
    html = converted.html;
  } catch (e) {
    console.log(`    WARN: HTML regen failed for ${article.slug}: ${e.message}`);
    stats.failed++;
    continue;
  }

  // Validate: check word count didn't drop dramatically
  const originalWords = article.content.split(/\s+/).filter(w => w.length > 0).length;
  const fixedWords = fixedContent.split(/\s+/).filter(w => w.length > 0).length;
  if (originalWords > 20 && fixedWords < originalWords * 0.5) {
    console.log(`    WARN: ${article.slug} content shrank too much: ${originalWords} → ${fixedWords} words`);
    stats.failed++;
    continue;
  }

  changedArticles.push({
    id: article.id,
    slug: article.slug,
    pair,
    fixes,
    content: fixedContent,
    html,
  });

  if (stats.scanned % 2000 === 0) {
    console.log(`  Progress: ${stats.scanned}/${allArticles.length} scanned, ${stats.changed} changed`);
  }
}

console.log(`\n  Scan complete: ${stats.scanned} scanned, ${stats.changed} need fixes`);

// 3. Apply to Supabase
if (APPLY && changedArticles.length > 0) {
  console.log(`\n  Applying ${changedArticles.length} fixes to Supabase...`);

  let applied = 0;
  let applyFailed = 0;
  const BATCH_SIZE = 50;

  for (let i = 0; i < changedArticles.length; i += BATCH_SIZE) {
    const batch = changedArticles.slice(i, i + BATCH_SIZE);

    // Supabase doesn't support bulk upsert on select columns easily,
    // so we do individual updates but with concurrency
    const results = await Promise.allSettled(
      batch.map(article =>
        supabase
          .from('blog_articles')
          .update({ content: article.content, content_html: article.html })
          .eq('id', article.id)
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && !result.value.error) {
        applied++;
      } else {
        applyFailed++;
        const err = result.status === 'rejected' ? result.reason : result.value.error?.message;
        if (applyFailed <= 5) console.log(`    DB ERROR: ${err}`);
      }
    }

    if ((i + BATCH_SIZE) % 500 === 0 || i + BATCH_SIZE >= changedArticles.length) {
      console.log(`    Applied ${applied}/${changedArticles.length}...`);
    }

    // Small delay between batches to be nice to the DB
    await new Promise(r => setTimeout(r, 50));
  }

  console.log(`  Applied: ${applied}, Failed: ${applyFailed}`);
}

// 4. Save progress report
const report = {
  timestamp: new Date().toISOString(),
  mode: APPLY ? 'apply' : 'dry-run',
  pairFilter: PAIR_FILTER || 'all',
  stats: {
    scanned: stats.scanned,
    changed: stats.changed,
    unchanged: stats.unchanged,
    failed: stats.failed,
  },
  fixBreakdown: stats.byFix,
  topPairs: Object.entries(stats.byPair)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([pair, count]) => ({ pair, count })),
};

const reportPath = path.join(__dirname, 'data', 'regex-global-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

// 5. Print summary
const duration = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${'═'.repeat(70)}`);
console.log(`  RESULTS${APPLY ? '' : ' (DRY RUN)'}`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Scanned:      ${stats.scanned}`);
console.log(`  Changed:      ${stats.changed} (${((stats.changed / stats.scanned) * 100).toFixed(1)}%)`);
console.log(`  Unchanged:    ${stats.unchanged}`);
console.log(`  Failed:       ${stats.failed}`);

console.log(`\n  --- Fix Breakdown ---`);
const fixOrder = ['imports', 'doubleBrackets', 'cta', 'ipa', 'legacyProps', 'doubleHash', 'placeholder'];
for (const fix of fixOrder) {
  if (stats.byFix[fix]) {
    console.log(`  ${fix.padEnd(20)} ${stats.byFix[fix]} articles`);
  }
}

console.log(`\n  --- Top 10 Pairs by Fixes ---`);
const topPairs = Object.entries(stats.byPair).sort((a, b) => b[1] - a[1]).slice(0, 10);
for (const [pair, count] of topPairs) {
  console.log(`  ${pair.padEnd(10)} ${count} articles`);
}

console.log(`\n  Duration: ${duration}s`);
console.log(`  Report saved to: ${reportPath}`);
console.log(`${'═'.repeat(70)}\n`);
