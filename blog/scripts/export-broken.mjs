#!/usr/bin/env node
/**
 * export-broken.mjs — Export all articles needing fixes to JSON.
 *
 * Detects:
 *   1. English titles on non-English pages
 *   2. English descriptions on non-English pages
 *   3. RO/PL titles missing target language name
 *   4. Emoji in titles
 *   5. Duplicate articles (identical content, same title)
 *
 * Usage:
 *   node export-broken.mjs
 *   node export-broken.mjs --issue emoji
 *   node export-broken.mjs --issue english-title
 *
 * Output: JSON to stdout grouped by fix type.
 * Also writes blog/scripts/data/broken-articles.json
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env from ../../.env.local
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

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse CLI args
const args = process.argv.slice(2);
let filterIssue = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--issue') filterIssue = args[++i];
}

// ─── Detection helpers ───

// English title detection (same as audit-deep.mjs)
const ENGLISH_TITLE_WORDS = new Set([
  'the', 'and', 'for', 'your', 'how', 'to', 'with', 'most', 'common',
  'essential', 'learn', 'guide', 'tips', 'words', 'phrases', 'couples', 'every',
  'best', 'ways', 'say', 'that', 'will', 'make', 'you', 'their', 'complete',
  'romantic', 'together', 'vocabulary', 'language', 'expressions',
]);

function titleLooksEnglish(title, nativeLang) {
  if (!title || nativeLang === 'en') return false;
  const words = title.toLowerCase().split(/\s+/);
  let englishCount = 0;
  for (const w of words) {
    if (ENGLISH_TITLE_WORDS.has(w)) englishCount++;
  }
  return englishCount >= 3;
}

// English description detection
const ENGLISH_DESC_WORDS = new Set([
  'the', 'and', 'for', 'your', 'how', 'to', 'with', 'learn', 'discover',
  'explore', 'practice', 'improve', 'master', 'couple', 'partner', 'together',
  'language', 'vocabulary', 'phrases', 'words', 'tips', 'guide', 'essential',
  'romantic', 'expressions', 'this', 'that', 'will', 'can', 'from',
]);

function descriptionLooksEnglish(desc, nativeLang) {
  if (!desc || nativeLang === 'en') return false;
  const words = desc.toLowerCase().split(/\s+/);
  let englishCount = 0;
  for (const w of words) {
    if (ENGLISH_DESC_WORDS.has(w)) englishCount++;
  }
  // Higher threshold for descriptions (they're longer)
  return englishCount >= 5;
}

// Emoji detection — match emoji characters in title
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{FE0F}\u{200D}\u{1F1E0}-\u{1F1FF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}-\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}-\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}]/gu;

function hasEmoji(title) {
  if (!title) return false;
  return EMOJI_REGEX.test(title);
}

function stripEmoji(title) {
  if (!title) return title;
  // Reset regex lastIndex
  EMOJI_REGEX.lastIndex = 0;
  return title.replace(EMOJI_REGEX, '').replace(/\s{2,}/g, ' ').trim();
}

// ─── RO/PL target language name detection ───

// Target language names in Romanian
const RO_LANG_NAMES = {
  en: 'engleză', es: 'spaniolă', fr: 'franceză', de: 'germană',
  it: 'italiană', pt: 'portugheză', nl: 'olandeză', sv: 'suedeză',
  no: 'norvegiană', da: 'daneză', pl: 'poloneză', cs: 'cehă',
  hu: 'maghiară', el: 'greacă', tr: 'turcă', uk: 'ucraineană',
  ru: 'rusă', ro: 'română',
};

// Alternate forms that also count as "has target lang"
// Includes all Romanian adjective declensions (masc/fem/plural)
const RO_LANG_ALTS = {
  en: ['englez', 'english', 'engleze', 'englezi'],
  es: ['spaniol', 'español', 'spaniole', 'spanioli'],
  fr: ['francez', 'français', 'franceze', 'francezi'],
  de: ['german', 'deutsch', 'germane', 'germani'],
  it: ['italian', 'italiano', 'italiene', 'italieni'],
  pt: ['portughez', 'português', 'portugheze', 'portughezi'],
  nl: ['olandez', 'dutch', 'nederlands', 'olandeze', 'olandezi'],
  sv: ['suedez', 'swedish', 'svenska', 'suedeze', 'suedezi'],
  no: ['norvegian', 'norsk', 'norvegiene', 'norvegieni'],
  da: ['danez', 'dansk', 'daneze', 'danezi'],
  pl: ['polonez', 'polski', 'poloneze', 'polonezi', 'polon'],
  cs: ['ceh', 'český', 'czech', 'cehe', 'cehi', 'cehă'],
  hu: ['maghiar', 'magyar', 'maghiare', 'maghiari'],
  el: ['greac', 'greek', 'ελληνικ', 'grec', 'grecești', 'greceasc', 'greci'],
  tr: ['turc', 'türk', 'turce', 'turci', 'turceasc'],
  uk: ['ucrainean', 'українськ', 'ucraine', 'ucraineni', 'ucraineană'],
  ru: ['rus', 'русск', 'ruse', 'rusi', 'rusesc'],
};

// Target language names in Polish
const PL_LANG_NAMES = {
  en: 'angielski', es: 'hiszpański', fr: 'francuski', de: 'niemiecki',
  it: 'włoski', pt: 'portugalski', nl: 'holenderski', sv: 'szwedzki',
  no: 'norweski', da: 'duński', cs: 'czeski', hu: 'węgierski',
  el: 'grecki', tr: 'turecki', uk: 'ukraiński', ru: 'rosyjski',
  ro: 'rumuński', pl: 'polski',
};

// Includes Polish case forms (nom, gen, loc, acc, instrumental, adj forms)
const PL_LANG_ALTS = {
  en: ['angiels', 'english', 'po angiels'],
  es: ['hiszpańs', 'español', 'po hiszpańs', 'hiszpans'],
  fr: ['francus', 'français', 'po francus'],
  de: ['niemiec', 'deutsch', 'po niemiec'],
  it: ['włos', 'italiano', 'po włos', 'wlos'],
  pt: ['portugals', 'português', 'po portugals'],
  nl: ['holenders', 'dutch', 'nederlands', 'niderlandz', 'po niderlandz', 'po holenders'],
  sv: ['szwedz', 'swedish', 'svenska', 'po szwedz'],
  no: ['norwes', 'norsk', 'po norwes'],
  da: ['duńs', 'dansk', 'po duńs', 'duns', 'dunsk'],
  cs: ['czes', 'český', 'czech', 'po czes'],
  hu: ['węgiers', 'magyar', 'po węgiers', 'wegier'],
  el: ['grec', 'greek', 'ελληνικ', 'po grec'],
  tr: ['turec', 'türk', 'po turec'],
  uk: ['ukraińs', 'українськ', 'po ukraińs', 'ukrains'],
  ro: ['rumuńs', 'română', 'po rumuńs', 'rumuns'],
  ru: ['rosyjs', 'русск', 'po rosyjs'],
};

function titleMissingTargetLang(title, nativeLang, targetLang) {
  if (!title || !targetLang || targetLang === 'all') return false;
  if (nativeLang !== 'ro' && nativeLang !== 'pl') return false;

  const titleLower = title.toLowerCase();
  const langNames = nativeLang === 'ro' ? RO_LANG_NAMES : PL_LANG_NAMES;
  const langAlts = nativeLang === 'ro' ? RO_LANG_ALTS : PL_LANG_ALTS;

  // Check primary name
  const primaryName = langNames[targetLang];
  if (primaryName && titleLower.includes(primaryName.toLowerCase())) return false;

  // Check alternate forms
  const alts = langAlts[targetLang] || [];
  for (const alt of alts) {
    if (titleLower.includes(alt.toLowerCase())) return false;
  }

  // Also check English name and target language code as fallback
  const englishNames = {
    en: 'english', es: 'spanish', fr: 'french', de: 'german',
    it: 'italian', pt: 'portuguese', nl: 'dutch', sv: 'swedish',
    no: 'norwegian', da: 'danish', pl: 'polish', cs: 'czech',
    hu: 'hungarian', el: 'greek', tr: 'turkish', uk: 'ukrainian',
    ru: 'russian', ro: 'romanian',
  };
  if (englishNames[targetLang] && titleLower.includes(englishNames[targetLang])) return false;

  return true;
}

// ─── Fetch all articles ───

const PAGE_SIZE = 1000;

async function fetchAllArticles() {
  const allArticles = [];
  let offset = 0;

  while (true) {
    process.stderr.write(`  Fetching ${offset}...\r`);

    const { data, error } = await supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,title,description,category,content')
      .neq('target_lang', 'all')
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (error) {
      process.stderr.write(`\nError: ${error.message}\n`);
      break;
    }
    if (!data || data.length === 0) break;
    allArticles.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }

  process.stderr.write(`\n  Total articles fetched: ${allArticles.length}\n\n`);
  return allArticles;
}

// ─── Main ───

async function main() {
  process.stderr.write('export-broken: Fetching all articles...\n');
  const articles = await fetchAllArticles();

  const issues = {
    english_titles: [],
    english_descriptions: [],
    missing_target_lang: [],
    emoji_titles: [],
    duplicates_identical: [],
    duplicates_same_title: [],
  };

  // ─── Scan each article for issues ───
  for (const a of articles) {
    if (a.native_lang === 'en') continue; // EN native is correct baseline

    const articleIssues = [];

    // 1. English title
    if (titleLooksEnglish(a.title, a.native_lang)) {
      articleIssues.push('english_title');
      issues.english_titles.push({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        category: a.category,
        title: a.title,
        description: a.description,
        fix_action: 'translate_title',
      });
    }

    // 2. English description
    if (descriptionLooksEnglish(a.description, a.native_lang)) {
      articleIssues.push('english_description');
      issues.english_descriptions.push({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        category: a.category,
        title: a.title,
        description: a.description,
        fix_action: 'translate_description',
      });
    }

    // 3. Missing target language name (RO/PL only)
    if (titleMissingTargetLang(a.title, a.native_lang, a.target_lang)) {
      articleIssues.push('missing_target_lang');
      issues.missing_target_lang.push({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        category: a.category,
        title: a.title,
        fix_action: 'add_target_lang',
      });
    }

    // 4. Emoji in title
    if (hasEmoji(a.title)) {
      const stripped = stripEmoji(a.title);
      articleIssues.push('emoji_title');
      issues.emoji_titles.push({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        category: a.category,
        title: a.title,
        title_stripped: stripped,
        title_stripped_length: stripped.length,
        needs_ai: stripped.length < 30,
        fix_action: 'strip_emoji',
      });
    }
  }

  // ─── Duplicate detection ───
  // Category 1: Identical content (first 500 chars)
  const contentMap = new Map();
  for (const a of articles) {
    const contentKey = (a.content || '').trim().slice(0, 500);
    if (contentKey.length < 100) continue;

    const key = `${a.native_lang}:${a.target_lang}:${contentKey}`;
    if (contentMap.has(key)) {
      contentMap.get(key).push(a);
    } else {
      contentMap.set(key, [a]);
    }
  }

  for (const [, group] of contentMap) {
    if (group.length < 2) continue;
    issues.duplicates_identical.push({
      articles: group.map(a => ({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        title: a.title,
        category: a.category,
        content_length: (a.content || '').length,
      })),
      fix_action: 'delete_one',
    });
  }

  // Category 2: Same title, different content (within same native_lang + target_lang)
  const titleMap = new Map();
  for (const a of articles) {
    if (!a.title) continue;
    const key = `${a.native_lang}:${a.target_lang}:${a.title.toLowerCase().trim()}`;
    if (titleMap.has(key)) {
      titleMap.get(key).push(a);
    } else {
      titleMap.set(key, [a]);
    }
  }

  for (const [, group] of titleMap) {
    if (group.length < 2) continue;
    // Skip if already caught as identical content
    const contentKey = (group[0].content || '').trim().slice(0, 500);
    const fullKey = `${group[0].native_lang}:${group[0].target_lang}:${contentKey}`;
    if (contentMap.has(fullKey) && contentMap.get(fullKey).length >= 2) continue;

    issues.duplicates_same_title.push({
      articles: group.map(a => ({
        id: a.id,
        slug: a.slug,
        native_lang: a.native_lang,
        target_lang: a.target_lang,
        title: a.title,
        category: a.category,
        content_length: (a.content || '').length,
        content_preview: (a.content || '').slice(0, 200),
      })),
      fix_action: 'keep_better_delete_other',
    });
  }

  // ─── Summary ───
  const summary = {
    english_titles: issues.english_titles.length,
    english_descriptions: issues.english_descriptions.length,
    missing_target_lang: issues.missing_target_lang.length,
    emoji_titles: issues.emoji_titles.length,
    duplicates_identical: issues.duplicates_identical.length,
    duplicates_same_title: issues.duplicates_same_title.length,
    total_articles_to_fix:
      issues.english_titles.length +
      issues.english_descriptions.length +
      issues.missing_target_lang.length +
      issues.emoji_titles.length,
    total_duplicate_pairs:
      issues.duplicates_identical.length +
      issues.duplicates_same_title.length,
  };

  process.stderr.write('--- Export Summary ---\n');
  process.stderr.write(`  English titles:        ${summary.english_titles}\n`);
  process.stderr.write(`  English descriptions:  ${summary.english_descriptions}\n`);
  process.stderr.write(`  Missing target lang:   ${summary.missing_target_lang}\n`);
  process.stderr.write(`  Emoji titles:          ${summary.emoji_titles}\n`);
  process.stderr.write(`  Duplicate pairs (identical): ${summary.duplicates_identical}\n`);
  process.stderr.write(`  Duplicate pairs (same title): ${summary.duplicates_same_title}\n`);
  process.stderr.write(`  Total articles to fix: ${summary.total_articles_to_fix}\n`);

  // Filter if requested
  let output = { summary, issues };
  if (filterIssue) {
    const key = filterIssue.replace(/-/g, '_');
    if (issues[key]) {
      output = { summary, issues: { [key]: issues[key] } };
    } else {
      process.stderr.write(`\n  Unknown issue type: ${filterIssue}\n`);
      process.stderr.write(`  Available: english-titles, english-descriptions, missing-target-lang, emoji-titles, duplicates-identical, duplicates-same-title\n`);
    }
  }

  // Write to file
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const outPath = path.join(dataDir, 'broken-articles.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  process.stderr.write(`\n  Written to: ${outPath}\n`);

  // Also output to stdout
  process.stdout.write(JSON.stringify(output, null, 2));
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
