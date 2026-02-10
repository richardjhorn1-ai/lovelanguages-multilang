#!/usr/bin/env node
/**
 * audit-content.mjs — Comprehensive content quality audit for blog articles.
 *
 * Detects: hardcoded English labels, wrong-language content, thin content,
 * empty sections, rendering corruption, placeholder pronunciations, script
 * mismatches, broken HTML, pronunciation=word copies, English examples in
 * non-English articles, wrong-language VocabCard content, malformed components,
 * empty CultureTips, stale HTML, same-language pairs, and metadata issues.
 *
 * Three-tier issue classification:
 *   REAL PROBLEM  — broken, unreadable, or factually wrong (must fix)
 *   QUALITY GAP   — thin, poorly structured, or missing content (should fix)
 *   COSMETIC      — polish and consistency (nice to have)
 *
 * Usage:
 *   node audit-content.mjs                            # all articles (from local JSON)
 *   node audit-content.mjs --db                       # force fetch from Supabase
 *   node audit-content.mjs --native_lang es           # filter by native
 *   node audit-content.mjs --target_lang de           # filter by target
 *   node audit-content.mjs --category grammar         # filter by category
 *   node audit-content.mjs --limit 500                # test on subset
 *   node audit-content.mjs --tier real                 # only REAL PROBLEMS
 *   node audit-content.mjs --tier quality              # only QUALITY GAPS
 *   node audit-content.mjs --tier cosmetic             # only COSMETIC
 *
 * Progress to stderr, JSON report to stdout + blog/scripts/data/content-audit.json.
 */

import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_KEY;

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let nativeLang = null, targetLang = null, category = null, limit = null;
let useDb = false;
let tierFilter = null; // 'real', 'quality', 'cosmetic'

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--native_lang': nativeLang = args[++i]; break;
    case '--target_lang': targetLang = args[++i]; break;
    case '--category': category = args[++i]; break;
    case '--limit': limit = parseInt(args[++i], 10); break;
    case '--db': useDb = true; break;
    case '--tier': tierFilter = args[++i]; break;
  }
}

// ─── Issue Tier Classification ───────────────────────────────────────────────

const ISSUE_TIERS = {
  // REAL PROBLEMS — broken, unreadable, or factually wrong
  truncated_content: 'real',
  placeholder_pronunciation: 'real',
  placeholder_text: 'real',
  empty_component_props: 'real',
  raw_mdx_in_html: 'real',
  raw_markdown_in_html: 'real',
  missing_content_html: 'real',
  frontmatter_in_html: 'real',
  frontmatter_in_content: 'real',
  html_equals_content: 'real',
  html_too_short: 'real',
  encoding_corruption: 'real',
  english_headers: 'real',
  english_prose_markers: 'real',
  english_in_html: 'real',
  english_density: 'real',
  script_mismatch: 'real',
  language_fingerprint_mismatch: 'real',
  repeated_content: 'real',
  pronunciation_equals_word: 'real',
  english_example: 'real',
  word_in_wrong_language: 'real',
  translation_in_wrong_language: 'real',
  malformed_component: 'real',
  same_language_pair: 'real',
  non_standard_tags: 'cosmetic',
  undefined_literal: 'real',

  // QUALITY GAPS — thin, poorly structured, or missing content
  thin_content: 'quality',
  component_missing: 'quality',
  component_low: 'quality',
  few_headings: 'quality',
  component_dump: 'quality',
  no_intro: 'quality',
  empty_sections: 'quality',
  culturetip_empty: 'quality',
  stale_html: 'quality',
  metadata_missing: 'quality',
  broken_internal_links: 'quality',
  duplicate_vocabcards: 'quality',

  // COSMETIC — polish and consistency
  stale_artifacts: 'cosmetic',
  legacy_props: 'cosmetic',
  wrong_flag: 'cosmetic',
};

// ─── Constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 1000;

// Category-aware component expectations
// Key: category, Value: { required: [...], optional: [...] }
const CATEGORY_COMPONENTS = {
  grammar: {
    expected: ['ConjugationTable'],
    optional: ['VocabCard', 'CultureTip', 'PhraseOfDay'],
    vocabMin: 0, // grammar articles don't need VocabCards
  },
  vocabulary: {
    expected: ['VocabCard'],
    optional: ['CultureTip', 'PhraseOfDay'],
    vocabMin: 3,
  },
  phrases: {
    expected: ['PhraseOfDay'],
    optional: ['VocabCard', 'CultureTip'],
    vocabMin: 0,
  },
  culture: {
    expected: ['CultureTip'],
    optional: ['VocabCard', 'PhraseOfDay'],
    vocabMin: 0,
  },
  pronunciation: {
    expected: ['VocabCard'],
    optional: ['CultureTip', 'PhraseOfDay'],
    vocabMin: 2,
  },
  communication: {
    expected: [],
    optional: ['VocabCard', 'CultureTip', 'PhraseOfDay'],
    vocabMin: 0,
  },
  situations: {
    expected: [],
    optional: ['VocabCard', 'CultureTip', 'PhraseOfDay'],
    vocabMin: 0,
  },
  // Default fallback for unknown categories
  _default: {
    expected: ['VocabCard'],
    optional: ['CultureTip', 'PhraseOfDay'],
    vocabMin: 3,
  },
};

// English section headers to detect (case-insensitive)
const ENGLISH_HEADERS = [
  'key vocabulary', 'pronunciation guide', 'cultural tips', 'practice together',
  'grammar notes', 'common phrases', 'essential phrases', 'introduction',
  'conclusion', 'verb conjugation', 'quick reference', 'how to say',
  'how to use', 'how to pronounce', 'vocabulary list', 'practice exercises',
  'common mistakes', 'useful expressions', 'dialogue practice', 'review',
];

const ENGLISH_HEADER_REGEXES = ENGLISH_HEADERS.map(eh => ({
  pattern: new RegExp(`(?:^|\\W)${eh.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\W|$)`, 'i'),
  text: eh,
}));

const NATIVE_HEADER_EXCLUSIONS = {
  fr: new Set(['conclusion', 'la conclusion', 'introduction', 'la introduction',
    'formules de conclusion', 'en conclusion']),
  it: new Set(['conclusione', 'la conclusione', 'introduzione']),
  es: new Set(['introducción', 'conclusión']),
  pt: new Set(['introdução', 'conclusão']),
  ro: new Set(['concluzie', 'introducere']),
};

// English prose markers (lowercase)
const ENGLISH_PROSE_MARKERS = [
  'pronunciation:', 'for example', "let's learn", 'note:', 'remember:',
  'try saying', 'here are some', 'in conclusion', 'to summarize',
  'vocabulary list', 'practice together', 'keep learning', 'want to learn more',
  'start now', 'let us explore', "let's explore", "let's practice",
  'in this article', 'in this lesson',
];

// English function words for density check
const ENGLISH_FUNCTION_WORDS = new Set([
  'the', 'is', 'are', 'and', 'or', 'but', 'this', 'that', 'with', 'from',
  'have', 'has', 'would', 'could', 'they', 'their', 'you', 'your', 'we',
  'a', 'an', 'in', 'on', 'to', 'for', 'of', 'it', 'was', 'were', 'be',
  'been', 'being', 'do', 'does', 'did', 'will', 'shall', 'can', 'may',
  'not', 'so', 'if', 'at', 'by', 'as', 'up', 'no', 'all', 'about',
]);

// Language stop-word fingerprints
const LANG_FINGERPRINTS = {
  es: ['el', 'la', 'los', 'las', 'de', 'en', 'con', 'por', 'para', 'que'],
  fr: ['le', 'la', 'les', 'de', 'des', 'du', 'en', 'un', 'est', 'que', 'dans'],
  de: ['der', 'die', 'das', 'den', 'ein', 'und', 'ist', 'mit', 'auf', 'für'],
  it: ['il', 'la', 'le', 'di', 'del', 'della', 'che', 'con', 'per'],
  pt: ['o', 'os', 'um', 'de', 'do', 'da', 'em', 'no', 'com', 'para'],
  pl: ['się', 'nie', 'jest', 'na', 'do', 'że', 'jak', 'ale', 'czy'],
  ro: ['și', 'în', 'la', 'cu', 'pe', 'este', 'pentru', 'din', 'care'],
  sv: ['och', 'att', 'det', 'för', 'med', 'som', 'den', 'har', 'kan'],
  no: ['og', 'det', 'som', 'for', 'med', 'har', 'den', 'til', 'kan'],
  da: ['og', 'det', 'som', 'for', 'med', 'har', 'den', 'til', 'kan'],
  cs: ['je', 'se', 'na', 'že', 'to', 'pro', 'ale', 'jako', 'jsou'],
  hu: ['az', 'és', 'hogy', 'nem', 'egy', 'van', 'meg', 'ezt', 'mint'],
  tr: ['bir', 've', 'bu', 'için', 'ile', 'olan', 'gibi', 'daha'],
  nl: ['de', 'het', 'een', 'van', 'en', 'in', 'dat', 'met', 'voor'],
};

// Cyrillic/Greek script ranges
const CYRILLIC_RE = /[\u0400-\u04FF]/g;
const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/g;
const LATIN_RE = /[a-zA-ZÀ-ÿĀ-žŁłŃńŚśŹźŻżĆćĘęĄąÓó]/g;

// Languages that use Cyrillic script
const CYRILLIC_LANGS = new Set(['ru', 'uk']);
// Languages that use Greek script
const GREEK_LANGS = new Set(['el']);

// Placeholder pronunciation patterns
const PLACEHOLDER_PRONUN_PATTERNS = [
  /pronunciation=["']\s*["']/,
  /pronunciation=["']\.\.\.["']/,
  /pronunciation=["']\?\?\?["']/,
  /pronunciation=["']TBD["']/i,
  /pronunciation=["']\/…\/["']/,
  /pronunciation=["']\/\.\.\.\/["']/,
  /pronunciation=["']\s*\/\s*\/\s*["']/,
];

// Flag emoji per target language
const LANG_FLAGS = {
  pl: '🇵🇱', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
  sv: '🇸🇪', no: '🇳🇴', da: '🇩🇰', nl: '🇳🇱', cs: '🇨🇿', hu: '🇭🇺',
  tr: '🇹🇷', ro: '🇷🇴', ru: '🇷🇺', uk: '🇺🇦', el: '🇬🇷', en: '🇬🇧',
};

// ─── Helper Functions ────────────────────────────────────────────────────────

function stripContent(content) {
  if (!content) return '';
  return content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^import\s+.*$/gm, '')
    .trim();
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function stripComponentTags(content) {
  if (!content) return '';
  let result = content;
  result = result.replace(/<CultureTip[^>]*>[\s\S]*?<\/CultureTip>/gi, '');
  result = result.replace(/<(?:VocabCard|PhraseOfDay|ConjugationTable|CultureTip|CTA)[\s\S]*?\/>/gi, '');
  return result;
}

function findEmptySections(content) {
  if (!content) return [];
  const lines = content.split('\n').filter(l => !l.startsWith('import '));
  const emptySections = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('## ') || line.startsWith('### ')) {
      let hasContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        const next = lines[j].trim();
        if (!next) continue;
        if (next.startsWith('## ') || next.startsWith('### ') || next.startsWith('# ')) break;
        hasContent = true;
        break;
      }
      if (!hasContent) emptySections.push(line);
    }
  }
  return emptySections;
}

function findPlaceholders(content) {
  if (!content) return [];
  const patterns = [
    /\[TODO\]/gi, /\[insert\s+\w+\]/gi, /\[placeholder\]/gi, /\[fill\s+in\]/gi,
    /Lorem ipsum/gi, /\bFIXME\b/g, /\bXXX\b/g, /\bTBD\b/g,
    /coming soon/gi, /content goes here/gi, /\[\.\.\.\]/g,
  ];
  const found = [];
  for (const p of patterns) {
    const matches = content.match(p);
    if (matches) found.push(...matches);
  }
  return found;
}

/**
 * Extract prop value from a component tag string.
 */
function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Check if text contains primarily Cyrillic characters.
 * Returns true if > 50% of alpha chars are Cyrillic.
 */
function isCyrillic(text) {
  if (!text || text.length < 2) return false;
  const cyrillic = (text.match(CYRILLIC_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  const total = cyrillic + latin;
  return total > 0 && cyrillic / total > 0.5;
}

/**
 * Check if text contains primarily Greek characters.
 */
function isGreek(text) {
  if (!text || text.length < 2) return false;
  const greek = (text.match(GREEK_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  const total = greek + latin;
  return total > 0 && greek / total > 0.5;
}

/**
 * Check if text looks like an English phrase (3+ common English words).
 * Skips text with diacritics/non-ASCII letters — words like "to", "no" in
 * Polish/Portuguese trigger false positives but those texts have diacritics.
 */
function looksEnglish(text) {
  if (!text) return false;
  // If text contains diacritics or non-ASCII letters, it's likely not English
  if (/[À-ÿĀ-žŁłŃńŚśŹźŻżĆćĘęĄąÓóŠšŘřŮůŽžŤťĎďŇňĚěŠČŘŽÝÁÍÉÚÖÜÄÖẞÐÞÆØÅÑ]/.test(text)) return false;
  const words = text.toLowerCase().split(/\s+/);
  if (words.length < 3) return false;
  let engCount = 0;
  for (const w of words) {
    const clean = w.replace(/[^a-z]/g, '');
    if (ENGLISH_FUNCTION_WORDS.has(clean)) engCount++;
  }
  return engCount / words.length > 0.4;
}

// ─── Detection Checks ───────────────────────────────────────────────────────

function checkArticle(article) {
  const issues = [];
  const content = article.content || '';
  const contentHtml = article.content_html || '';
  const nl = article.native_lang;
  const tl = article.target_lang;
  const cat = article.category || '_default';
  const stripped = stripContent(content);
  const prose = stripComponentTags(stripped);
  const wordCount = countWords(prose);

  // ── NEW: Same language pair ──
  if (nl && tl && nl === tl) {
    issues.push({
      type: 'same_language_pair',
      severity: 'critical',
      tier: 'real',
      details: { native_lang: nl, target_lang: tl },
    });
  }

  // ── NEW: Metadata validation ──
  if (!article.title || article.title.trim().length === 0) {
    issues.push({
      type: 'metadata_missing',
      severity: 'high',
      tier: 'quality',
      details: { field: 'title' },
    });
  }
  if (!article.description || article.description.trim().length === 0) {
    issues.push({
      type: 'metadata_missing',
      severity: 'medium',
      tier: 'quality',
      details: { field: 'description' },
    });
  }
  if (!article.category || article.category.trim().length === 0) {
    issues.push({
      type: 'metadata_missing',
      severity: 'medium',
      tier: 'quality',
      details: { field: 'category' },
    });
  }

  // ── A: Hardcoded English in content_html ──
  if (nl !== 'en') {
    if (/Pronunciation:\s*<code/i.test(contentHtml)) {
      issues.push({
        type: 'english_in_html',
        severity: 'high',
        tier: 'real',
        subtype: 'pronunciation_label',
        details: { label: 'Pronunciation:', source: 'VocabCard converter' },
      });
    }
    if (/Phrase to Learn/i.test(contentHtml)) {
      issues.push({
        type: 'english_in_html',
        severity: 'high',
        tier: 'real',
        subtype: 'phrase_to_learn_label',
        details: { label: 'Phrase to Learn', source: 'PhraseOfDay converter' },
      });
    }
    if (/>Cultural Tip</.test(contentHtml)) {
      issues.push({
        type: 'english_in_html',
        severity: 'high',
        tier: 'real',
        subtype: 'cultural_tip_default',
        details: { label: 'Cultural Tip', source: 'CultureTip converter default' },
      });
    }
  }

  // ── B: English Section Headers in content ──
  if (nl !== 'en') {
    const headingLines = stripped.match(/^#{2,3}\s+.+$/gm) || [];
    const englishHeaders = [];
    const exclusions = NATIVE_HEADER_EXCLUSIONS[nl];
    for (const line of headingLines) {
      const headerText = line.replace(/^#{2,3}\s+/, '').trim();
      const headerLower = headerText.toLowerCase();
      const withoutNumber = headerLower.replace(/^\d+\.\s*/, '');

      if (exclusions) {
        let isExcluded = false;
        for (const excl of exclusions) {
          if (withoutNumber === excl || withoutNumber.startsWith(excl + ':') || withoutNumber.startsWith(excl + ' ')) {
            isExcluded = true;
            break;
          }
          if (withoutNumber.includes(`(${excl})`) || withoutNumber.includes(` ${excl} `)) {
            isExcluded = true;
            break;
          }
        }
        if (isExcluded) continue;
      }

      for (const { pattern } of ENGLISH_HEADER_REGEXES) {
        if (pattern.test(withoutNumber)) {
          englishHeaders.push(line.trim());
          break;
        }
      }
    }
    if (englishHeaders.length > 0) {
      issues.push({
        type: 'english_headers',
        severity: 'high',
        tier: 'real',
        details: { headers_found: englishHeaders },
      });
    }
  }

  // ── C: English Prose Markers in content ──
  if (nl !== 'en' && tl !== 'en') {
    const proseLower = prose.toLowerCase();
    const markersFound = [];
    for (const marker of ENGLISH_PROSE_MARKERS) {
      // Use word-boundary regex to avoid false positives (e.g. "in conclusione" matching "in conclusion")
      const escaped = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const endsWithWord = /\w$/.test(marker);
      const re = new RegExp(`\\b${escaped}${endsWithWord ? '\\b' : ''}`, 'i');
      if (re.test(proseLower)) {
        markersFound.push(marker);
      }
    }
    if (markersFound.length > 0) {
      issues.push({
        type: 'english_prose_markers',
        severity: 'high',
        tier: 'real',
        details: { markers_found: markersFound },
      });
    }
  }

  // ── D: High English Density Paragraphs ──
  if (nl !== 'en' && tl !== 'en') {
    const paragraphs = prose.split(/\n\s*\n/);
    const highDensityParas = [];
    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(w => w.length > 0);
      if (words.length < 30) continue;
      let engCount = 0;
      for (const w of words) {
        if (ENGLISH_FUNCTION_WORDS.has(w.toLowerCase().replace(/[^a-z]/g, ''))) {
          engCount++;
        }
      }
      const ratio = engCount / words.length;
      if (ratio > 0.40) {
        highDensityParas.push({
          preview: para.slice(0, 100).replace(/\n/g, ' '),
          wordCount: words.length,
          englishRatio: Math.round(ratio * 100),
        });
      }
    }
    if (highDensityParas.length > 0) {
      issues.push({
        type: 'english_density',
        severity: 'critical',
        tier: 'real',
        details: { paragraphs: highDensityParas },
      });
    }
  }

  // ── E: Script Mismatch ──
  if (CYRILLIC_LANGS.has(nl)) {
    const cyrillicCount = (prose.match(CYRILLIC_RE) || []).length;
    const latinCount = (prose.match(LATIN_RE) || []).length;
    const totalScript = cyrillicCount + latinCount;
    if (totalScript > 50 && cyrillicCount / totalScript < 0.20) {
      issues.push({
        type: 'script_mismatch',
        severity: 'critical',
        tier: 'real',
        details: {
          expected: 'cyrillic',
          cyrillicRatio: Math.round((cyrillicCount / totalScript) * 100),
          cyrillicCount,
          latinCount,
        },
      });
    }
  }
  if (GREEK_LANGS.has(nl)) {
    const greekCount = (prose.match(GREEK_RE) || []).length;
    const latinCount = (prose.match(LATIN_RE) || []).length;
    const totalScript = greekCount + latinCount;
    if (totalScript > 50 && greekCount / totalScript < 0.20) {
      issues.push({
        type: 'script_mismatch',
        severity: 'critical',
        tier: 'real',
        details: {
          expected: 'greek',
          greekRatio: Math.round((greekCount / totalScript) * 100),
          greekCount,
          latinCount,
        },
      });
    }
  }

  // ── F: Latin Language Fingerprinting ──
  if (nl !== 'en' && tl !== 'en' && LANG_FINGERPRINTS[nl]) {
    if (!CYRILLIC_LANGS.has(nl) && !GREEK_LANGS.has(nl)) {
      const words = prose.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      if (words.length > 50) {
        const fingerprint = LANG_FINGERPRINTS[nl];
        let nativeHits = 0;
        let englishHits = 0;
        for (const w of words) {
          const clean = w.replace(/[^a-zà-žłńśźżćęąóšřůžťďňěščřžýáíéúůüöäößðþæøåñ]/g, '');
          if (fingerprint.includes(clean)) nativeHits++;
          if (ENGLISH_FUNCTION_WORDS.has(clean)) englishHits++;
        }
        const nativeRatio = nativeHits / words.length;
        const englishRatio = englishHits / words.length;
        const LOW_STOPWORD_LANGS = new Set(['hu', 'fi', 'tr']);
        const engThreshold = LOW_STOPWORD_LANGS.has(nl) ? 0.15 : 0.10;
        if (englishRatio > nativeRatio && englishRatio > engThreshold) {
          issues.push({
            type: 'language_fingerprint_mismatch',
            severity: 'high',
            tier: 'real',
            details: {
              nativeLang: nl,
              nativeStopWordRatio: Math.round(nativeRatio * 100),
              englishStopWordRatio: Math.round(englishRatio * 100),
            },
          });
        }
      }
    }
  }

  // ── G: Empty/Placeholder Sections ──
  const emptySections = findEmptySections(content);
  if (emptySections.length > 0) {
    issues.push({
      type: 'empty_sections',
      severity: 'high',
      tier: 'quality',
      details: { sections: emptySections },
    });
  }

  const placeholders = findPlaceholders(stripped);
  if (placeholders.length > 0) {
    issues.push({
      type: 'placeholder_text',
      severity: 'high',
      tier: 'real',
      details: { found: [...new Set(placeholders)] },
    });
  }

  // ── H: Component Counts (needed by thin content + section I) ──
  const vocabCount = (content.match(/<VocabCard/gi) || []).length;
  const phraseCount = (content.match(/<PhraseOfDay/gi) || []).length;
  const cultureCount = (content.match(/<CultureTip/gi) || []).length;
  const conjCount = (content.match(/<ConjugationTable/gi) || []).length;

  // ── H2: Thin Content ──
  // <300 words is only quality when article also has <2 components
  // (articles with components ARE the content)
  const totalComps = vocabCount + phraseCount + cultureCount + conjCount;
  if (wordCount < 300 && totalComps < 2) {
    issues.push({
      type: 'thin_content',
      severity: 'critical',
      tier: 'quality',
      details: { wordCount, band: '<300', components: totalComps },
    });
  } else if (wordCount < 300) {
    issues.push({
      type: 'thin_content',
      severity: 'low',
      tier: 'cosmetic',
      details: { wordCount, band: '<300', components: totalComps, note: 'has components' },
    });
  } else if (wordCount < 500) {
    issues.push({
      type: 'thin_content',
      severity: 'high',
      tier: 'quality',
      details: { wordCount, band: '300-499' },
    });
  } else if (wordCount < 800) {
    issues.push({
      type: 'thin_content',
      severity: 'medium',
      tier: 'cosmetic',
      details: { wordCount, band: '500-799' },
    });
  }

  // ── I: Component Issues (category-aware) ──
  const catConfig = CATEGORY_COMPONENTS[cat] || CATEGORY_COMPONENTS._default;

  // Check expected components for this category
  for (const expected of catConfig.expected) {
    let count = 0;
    if (expected === 'VocabCard') count = vocabCount;
    else if (expected === 'PhraseOfDay') count = phraseCount;
    else if (expected === 'CultureTip') count = cultureCount;
    else if (expected === 'ConjugationTable') count = conjCount;

    if (count === 0) {
      issues.push({
        type: 'component_missing',
        severity: 'high',
        tier: 'quality',
        details: { component: expected, count: 0, category: cat },
      });
    }
  }

  // Check VocabCard minimum for categories that need them
  if (catConfig.vocabMin > 0 && vocabCount > 0 && vocabCount < catConfig.vocabMin) {
    issues.push({
      type: 'component_low',
      severity: 'medium',
      tier: 'quality',
      details: { component: 'VocabCard', count: vocabCount, minimum: catConfig.vocabMin, category: cat },
    });
  }

  // Check optional components that are universally useful (PhraseOfDay, CultureTip)
  // Only flag if missing AND not in the expected list
  if (phraseCount === 0 && !catConfig.expected.includes('PhraseOfDay')) {
    issues.push({
      type: 'component_missing',
      severity: 'low',
      tier: 'quality',
      details: { component: 'PhraseOfDay', count: 0, category: cat, optional: true },
    });
  }
  if (cultureCount === 0 && !catConfig.expected.includes('CultureTip')) {
    issues.push({
      type: 'component_missing',
      severity: 'low',
      tier: 'quality',
      details: { component: 'CultureTip', count: 0, category: cat, optional: true },
    });
  }

  // Placeholder pronunciations
  for (const pat of PLACEHOLDER_PRONUN_PATTERNS) {
    if (pat.test(content)) {
      issues.push({
        type: 'placeholder_pronunciation',
        severity: 'high',
        tier: 'real',
        details: { pattern: pat.source },
      });
      break;
    }
  }

  // Empty component props — use backreference to ensure matching quotes (prevents "' false positives)
  if (/\bword=(["'])\s*\1/i.test(content) || /(?<![a-zA-Z])translation=(["'])\s*\1/i.test(content)) {
    issues.push({
      type: 'empty_component_props',
      severity: 'high',
      tier: 'real',
      details: { found: 'word or translation prop is empty' },
    });
  }

  // Legacy props
  if (/\bpolish=["']/i.test(content) || /\benglish=["']/i.test(content)) {
    issues.push({
      type: 'legacy_props',
      severity: 'low',
      tier: 'cosmetic',
      details: { found: 'polish= or english= instead of word=/translation=' },
    });
  }

  // ── NEW: Pronunciation equals word ──
  // Detect VocabCards where pronunciation is just the word copied
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  let pronEqWordCount = 0;
  let englishExampleCount = 0;
  let wrongLangWordCount = 0;
  let wrongLangTranslationCount = 0;
  const malformedComponents = [];

  for (const tag of vocabMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    const example = extractProp(tag, 'example') || '';

    // Pronunciation equals word (case-insensitive, trimmed)
    // Also catches near-misses: /word/, [word], (word)
    // Skip short words (≤3 chars) — in phonetic languages (TR, ES, RO, PL) pron=word is correct
    if (pronunciation && word && word.trim().length > 3) {
      const pronLower = pronunciation.trim().toLowerCase();
      const wordLower = word.trim().toLowerCase();
      const pronStripped = pronLower.replace(/^[\/\[\(]|[\/\]\)]$/g, '').trim();
      if (pronLower === wordLower || pronStripped === wordLower) {
        pronEqWordCount++;
      }
    }

    // English example in non-English native article
    // Skip when target_lang=en — English examples are expected there
    if (nl !== 'en' && tl !== 'en' && example && looksEnglish(example)) {
      englishExampleCount++;
    }

    // Word in wrong language: Cyrillic word in Latin-script language or vice versa
    if (word.length >= 2) {
      if (CYRILLIC_LANGS.has(tl) && !isCyrillic(word) && !/^[a-zA-Z\s'-]+$/.test(word)) {
        // Target should be Cyrillic but word isn't — might be Latin
        // Skip if word is pure ASCII (could be a loanword)
      } else if (!CYRILLIC_LANGS.has(tl) && !GREEK_LANGS.has(tl) && isCyrillic(word)) {
        wrongLangWordCount++;
      } else if (!GREEK_LANGS.has(tl) && !CYRILLIC_LANGS.has(tl) && isGreek(word)) {
        wrongLangWordCount++;
      }
    }

    // Translation in wrong language: should be in native language
    if (translation.length >= 2) {
      if (CYRILLIC_LANGS.has(nl) && !isCyrillic(translation) && translation.length > 3) {
        // Native is Cyrillic but translation is Latin — might be wrong
        // Only flag if it looks like English
        if (looksEnglish(translation)) {
          wrongLangTranslationCount++;
        }
      } else if (!CYRILLIC_LANGS.has(nl) && !GREEK_LANGS.has(nl) && isCyrillic(translation)) {
        wrongLangTranslationCount++;
      }
    }

    // Malformed component: missing required word prop
    if (!word && !extractProp(tag, 'polish')) {
      malformedComponents.push({ component: 'VocabCard', issue: 'missing word prop' });
    }
  }

  if (pronEqWordCount > 0) {
    issues.push({
      type: 'pronunciation_equals_word',
      severity: 'high',
      tier: 'real',
      details: { count: pronEqWordCount, totalVocabCards: vocabMatches.length },
    });
  }

  if (englishExampleCount > 0) {
    issues.push({
      type: 'english_example',
      severity: 'medium',
      tier: 'real',
      details: { count: englishExampleCount },
    });
  }

  if (wrongLangWordCount > 0) {
    issues.push({
      type: 'word_in_wrong_language',
      severity: 'high',
      tier: 'real',
      details: { count: wrongLangWordCount, targetLang: tl },
    });
  }

  if (wrongLangTranslationCount > 0) {
    issues.push({
      type: 'translation_in_wrong_language',
      severity: 'high',
      tier: 'real',
      details: { count: wrongLangTranslationCount, nativeLang: nl },
    });
  }

  // Check PhraseOfDay components too
  const phraseMatches = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  for (const tag of phraseMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
    if (!word) {
      malformedComponents.push({ component: 'PhraseOfDay', issue: 'missing word/phrase prop' });
    }
  }

  if (malformedComponents.length > 0) {
    issues.push({
      type: 'malformed_component',
      severity: 'high',
      tier: 'real',
      details: { components: malformedComponents },
    });
  }

  // ── NEW: CultureTip empty (whitespace-only children) ──
  const cultureTipWithChildren = content.match(/<CultureTip[^>]*>([\s\S]*?)<\/CultureTip>/gi) || [];
  let emptyCultureTips = 0;
  for (const match of cultureTipWithChildren) {
    const innerMatch = match.match(/<CultureTip[^>]*>([\s\S]*?)<\/CultureTip>/i);
    if (innerMatch && innerMatch[1].trim().length === 0) {
      emptyCultureTips++;
    }
  }
  if (emptyCultureTips > 0) {
    issues.push({
      type: 'culturetip_empty',
      severity: 'medium',
      tier: 'quality',
      details: { count: emptyCultureTips },
    });
  }

  // ── NEW: HTML entities in component props (malformed) ──
  if (/(?:word|translation|pronunciation|example)=["'][^"']*&(?:amp|lt|gt|quot|apos);[^"']*["']/i.test(content)) {
    issues.push({
      type: 'malformed_component',
      severity: 'medium',
      tier: 'real',
      details: { issue: 'HTML entities in component props' },
    });
  }

  // ── J: Structural Issues ──
  const headingCount = (stripped.match(/^##\s+/gm) || []).length;
  if (headingCount < 3 && wordCount < 400) {
    issues.push({
      type: 'few_headings',
      severity: 'medium',
      tier: 'quality',
      details: { headingCount, wordCount },
    });
  }

  const firstHeadingIdx = stripped.search(/^##\s+/m);
  if (firstHeadingIdx >= 0) {
    const beforeHeading = stripped.slice(0, firstHeadingIdx).trim();
    const introText = stripComponentTags(beforeHeading).trim();
    if (introText.length < 30) {
      issues.push({
        type: 'no_intro',
        severity: 'medium',
        tier: 'quality',
        details: { introLength: introText.length },
      });
    }
  }

  // Component dump
  if (wordCount < 200 && (vocabCount + phraseCount + cultureCount) > 3) {
    issues.push({
      type: 'component_dump',
      severity: 'medium',
      tier: 'quality',
      details: { proseWords: wordCount, componentCount: vocabCount + phraseCount + cultureCount },
    });
  }

  // ── K: Repeated Content ──
  const paragraphs = prose.split(/\n\s*\n/).filter(p => p.trim().length > 50);
  const seen = new Map();
  const repeated = [];
  for (const p of paragraphs) {
    const normalized = p.trim().toLowerCase();
    if (seen.has(normalized)) {
      repeated.push(p.trim().slice(0, 80));
    } else {
      seen.set(normalized, true);
    }
  }
  if (repeated.length > 0) {
    issues.push({
      type: 'repeated_content',
      severity: 'high',
      tier: 'real',
      details: { count: repeated.length, previews: repeated.slice(0, 3) },
    });
  }

  // ── L: Missing/Empty content_html ──
  if ((!contentHtml || contentHtml.trim().length === 0) && content.trim().length > 0) {
    issues.push({
      type: 'missing_content_html',
      severity: 'critical',
      tier: 'real',
      details: { contentLength: content.length },
    });
  }

  // ── M: Rendering Corruption ──
  if (/^---\s*\n/m.test(contentHtml)) {
    issues.push({
      type: 'frontmatter_in_html',
      severity: 'critical',
      tier: 'real',
      details: { field: 'content_html' },
    });
  }

  const rawContentStart = (content || '').trim().slice(0, 200);
  if (/^---\s*\ntitle:/m.test(rawContentStart)) {
    issues.push({
      type: 'frontmatter_in_content',
      severity: 'high',
      tier: 'real',
      details: { field: 'content' },
    });
  }

  const COMPONENT_TAGS = ['VocabCard', 'PhraseOfDay', 'CultureTip', 'ConjugationTable', 'CTA'];
  for (const tag of COMPONENT_TAGS) {
    const regex = new RegExp(`<${tag}[\\s/>]`, 'i');
    if (regex.test(contentHtml)) {
      issues.push({
        type: 'raw_mdx_in_html',
        severity: 'critical',
        tier: 'real',
        details: { tag },
      });
      break;
    }
  }

  if (contentHtml.length > 100) {
    const mdHeadings = (contentHtml.match(/^##\s+\w/gm) || []).length;
    if (mdHeadings >= 2) {
      issues.push({
        type: 'raw_markdown_in_html',
        severity: 'critical',
        tier: 'real',
        details: { markdownHeadings: mdHeadings },
      });
    }
  }

  if (contentHtml && content && contentHtml.trim() === content.trim() && content.trim().length > 100) {
    issues.push({
      type: 'html_equals_content',
      severity: 'critical',
      tier: 'real',
      details: { contentLength: content.length },
    });
  }

  // ── NEW: Stale HTML — content updated but HTML not regenerated ──
  // Detect when content has components but HTML doesn't have rendered equivalents
  if (contentHtml && content && vocabCount > 0) {
    // If content has VocabCards but HTML doesn't have the rendered div class
    const hasRenderedVocab = /speakable-vocab/.test(contentHtml);
    if (!hasRenderedVocab && contentHtml.trim().length > 200) {
      issues.push({
        type: 'stale_html',
        severity: 'high',
        tier: 'quality',
        details: { reason: 'content has VocabCards but HTML lacks rendered equivalents' },
      });
    }
  }

  // ── N: Truncated/Corrupted Content ──
  if (stripped.length > 100) {
    const strippedEnd = stripped.slice(-80).trim();
    const endsWithComponent = /\/>$/.test(strippedEnd) || /<\/\w+>$/.test(strippedEnd);
    // Also exclude articles ending with bold/italic text (complete articles)
    const endsWithFormatting = /\*{1,2}$/.test(strippedEnd);
    if (!endsWithComponent && !endsWithFormatting) {
      const lastChars = prose.slice(-50).trim();
      if (lastChars.length > 10 && !/[.!?:)\]"'»。！？\*]$/.test(lastChars)) {
        // Only flag comma/semicolon endings (likely truly truncated)
        // and word endings that aren't part of a list or bold text
        if (/[,;]$/.test(lastChars)) {
          issues.push({
            type: 'truncated_content',
            severity: 'high',
            tier: 'real',
            details: { endingChars: lastChars.slice(-30) },
          });
        } else if (/\w$/.test(lastChars)) {
          // Word ending — only flag if not ending with a markdown link or formatted text
          const last100 = prose.slice(-100).trim();
          const endsWithLink = /\]\([^)]*\)$/.test(last100) || /\]\([^)]*$/.test(last100);
          const endsWithBold = /\*\*[^*]+$/.test(last100);
          if (!endsWithLink && !endsWithBold) {
            issues.push({
              type: 'truncated_content',
              severity: 'medium',
              tier: 'real',
              details: { endingChars: lastChars.slice(-30) },
            });
          }
        }
      }
    }
  }

  if (/\ufffd{2,}/.test(content) || /\?{5,}/.test(content)) {
    issues.push({
      type: 'encoding_corruption',
      severity: 'high',
      tier: 'real',
      details: { found: 'replacement characters or long ? sequences' },
    });
  }

  if (contentHtml && content) {
    if (contentHtml.trim().length < 200 && content.trim().length > 500) {
      issues.push({
        type: 'html_too_short',
        severity: 'high',
        tier: 'real',
        details: {
          htmlLength: contentHtml.trim().length,
          contentLength: content.trim().length,
        },
      });
    }
  }

  // ── O: Wrong Flag Emoji ──
  if (tl !== 'pl' && contentHtml.includes('🇵🇱')) {
    issues.push({
      type: 'wrong_flag',
      severity: 'low',
      tier: 'cosmetic',
      details: {
        found: '🇵🇱',
        expected: LANG_FLAGS[tl] || 'unknown',
        targetLang: tl,
      },
    });
  }

  // ── P: Broken Internal Links ──
  const linkMatches = content.match(/\[([^\]]*)\]\(\/learn\/[^)]*\)/g) || [];
  const brokenLinks = [];
  for (const link of linkMatches) {
    if (/\(\/learn\/\)/.test(link) || /\(\/learn\/[^/]*\)/.test(link)) {
      brokenLinks.push(link);
    }
  }
  const htmlLinks = contentHtml.match(/href="\/learn\/[^"]*"/g) || [];
  const malformedHtmlLinks = htmlLinks.filter(l =>
    /href="\/learn\/"/.test(l) || /href="\/learn\/[^/"]*"/.test(l)
  );

  if (brokenLinks.length > 0 || malformedHtmlLinks.length > 0) {
    issues.push({
      type: 'broken_internal_links',
      severity: 'medium',
      tier: 'quality',
      details: {
        inContent: brokenLinks.length,
        inHtml: malformedHtmlLinks.length,
        samples: [...brokenLinks, ...malformedHtmlLinks].slice(0, 3),
      },
    });
  }

  // ── Q: Stale Artifacts ──
  const staleArtifacts = [];
  if (/^import\s+\w/m.test(content)) {
    staleArtifacts.push('import statements');
  }
  if (/<CTA\s/i.test(stripped)) {
    staleArtifacts.push('raw <CTA /> tags');
  }
  if (staleArtifacts.length > 0) {
    issues.push({
      type: 'stale_artifacts',
      severity: 'low',
      tier: 'cosmetic',
      details: { found: staleArtifacts },
    });
  }

  // ── R: Non-standard component tags ──
  // AI-generated articles sometimes use XML-like tags that aren't valid Astro/MDX
  const NON_STD_TAG_RE = /<(Phrase|Original|Transliteration|Translation|Note|Example|Tip)>/gi;
  const nonStdMatches = content.match(NON_STD_TAG_RE) || [];
  if (nonStdMatches.length > 0) {
    const tagSet = [...new Set(nonStdMatches.map(m => m.replace(/<|>/g, '')))];
    issues.push({
      type: 'non_standard_tags',
      severity: 'low',
      tier: 'cosmetic',
      details: { tags: tagSet, count: nonStdMatches.length },
    });
  }

  // ── S: Literal "undefined" in content or HTML ──
  // AI generation sometimes outputs JS undefined instead of a word
  const undefinedInContent = /(?:^|["'=\s])undefined(?:["'\s,.]|$)/m.test(content);
  const undefinedInHtml = /\bundefined\b/.test(contentHtml);
  if (undefinedInContent || undefinedInHtml) {
    issues.push({
      type: 'undefined_literal',
      severity: 'high',
      tier: 'real',
      details: {
        inContent: undefinedInContent,
        inHtml: undefinedInHtml,
      },
    });
  }

  // ── T: Duplicate VocabCards within same article ──
  if (vocabMatches.length >= 3) {
    const vocabSigs = [];
    for (const tag of vocabMatches) {
      const w = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
      const t = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
      if (w) vocabSigs.push((w + '|' + t).toLowerCase());
    }
    const uniqueSigs = new Set(vocabSigs);
    const dupCount = vocabSigs.length - uniqueSigs.size;
    if (dupCount >= 2) {
      issues.push({
        type: 'duplicate_vocabcards',
        severity: 'medium',
        tier: 'quality',
        details: { totalVocabCards: vocabSigs.length, uniqueVocabCards: uniqueSigs.size, duplicates: dupCount },
      });
    }
  }

  // Apply tier to any issues missing it
  for (const issue of issues) {
    if (!issue.tier) {
      issue.tier = ISSUE_TIERS[issue.type] || 'quality';
    }
  }

  return issues;
}

// ─── Data Loading ────────────────────────────────────────────────────────────

async function loadFromLocal() {
  const localPath = path.join(__dirname, 'data', 'articles-local.json');
  if (!fs.existsSync(localPath)) {
    return null;
  }

  process.stderr.write(`  Loading from local: ${localPath}\n`);
  const raw = fs.readFileSync(localPath, 'utf-8');
  const data = JSON.parse(raw);

  process.stderr.write(`  Loaded ${data.articles.length.toLocaleString()} articles (exported: ${data.meta.exportedAt})\n`);
  return data.articles;
}

async function loadFromDb() {
  if (!supabaseUrl || !supabaseKey) {
    process.stderr.write('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const allArticles = [];
  let offset = 0;
  const maxArticles = limit || Infinity;

  while (allArticles.length < maxArticles) {
    const remaining = maxArticles - allArticles.length;
    const pageSize = Math.min(PAGE_SIZE, remaining);
    const from = offset;
    const to = from + pageSize - 1;

    process.stderr.write(`  Fetching ${from}-${to}...\r`);

    let query = supabase
      .from('blog_articles')
      .select('id,slug,native_lang,target_lang,category,title,description,content,content_html')
      .neq('target_lang', 'all')
      .range(from, to)
      .order('id');

    if (nativeLang) query = query.eq('native_lang', nativeLang);
    if (targetLang) query = query.eq('target_lang', targetLang);
    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) {
      process.stderr.write(`\nError: ${error.message}\n`);
      break;
    }
    if (!data || data.length === 0) break;

    allArticles.push(...data);
    offset += data.length;
    if (data.length < pageSize) break;
  }

  return allArticles;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  process.stderr.write(`audit-content: native=${nativeLang || 'all'}, target=${targetLang || 'all'}, category=${category || 'all'}, limit=${limit || 'all'}, tier=${tierFilter || 'all'}\n`);

  // Load articles
  let articles;
  if (useDb) {
    process.stderr.write('  Source: Supabase (--db flag)\n');
    articles = await loadFromDb();
  } else {
    articles = await loadFromLocal();
    if (!articles) {
      process.stderr.write('  No local export found, falling back to Supabase...\n');
      process.stderr.write('  Tip: Run `node blog/scripts/export-articles.mjs` first for instant audits.\n\n');
      articles = await loadFromDb();
    }
  }

  if (!articles || articles.length === 0) {
    process.stderr.write('No articles found.\n');
    process.exit(1);
  }

  // Apply filters for local data (DB filters are applied in query)
  if (!useDb) {
    if (nativeLang) articles = articles.filter(a => a.native_lang === nativeLang);
    if (targetLang) articles = articles.filter(a => a.target_lang === targetLang);
    if (category) articles = articles.filter(a => a.category === category);
    // Exclude target_lang === 'all' to match DB query behavior
    articles = articles.filter(a => a.target_lang !== 'all');
    if (limit) articles = articles.slice(0, limit);
  }

  process.stderr.write(`  Articles to scan: ${articles.length.toLocaleString()}\n\n`);

  // Accumulate results
  const allIssues = {};
  const tierCounts = { real: 0, quality: 0, cosmetic: 0 };
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  const issueTypeCounts = {};
  const byNativeLang = {};
  const systemicCounts = {
    pronunciation_label: 0,
    phrase_to_learn_label: 0,
    cultural_tip_default: 0,
  };
  const fixGroups = {
    component_label_fix: { description: 'Fix English labels in components + regen HTML', ids: [] },
    translate_headers: { description: 'Translate English section headers to native_lang', ids: [] },
    strip_frontmatter: { description: 'Remove frontmatter leaked into content/HTML', ids: [] },
    regenerate_content_html: { description: 'Re-run MDX->HTML conversion (broken/missing)', ids: [] },
    regenerate_content_ai: { description: 'Full AI regen (wrong language, thin, corrupted)', ids: [] },
    fix_pronunciations: { description: 'Replace placeholder pronunciations', ids: [] },
    fix_flags: { description: 'Replace default Polish flag with correct flag', ids: [] },
    fix_truncated: { description: 'Complete or regenerate truncated articles', ids: [] },
    fix_vocab_content: { description: 'Fix wrong-language or copied pronunciations in VocabCards', ids: [] },
    fix_malformed: { description: 'Fix malformed components (missing props, HTML entities)', ids: [] },
    fix_non_standard_tags: { description: 'Convert <Phrase>/<Original>/<Translation> XML tags to proper markdown/components', ids: [] },
    fix_undefined: { description: 'Fix literal "undefined" in content or HTML (mostly Russian-native)', ids: [] },
  };

  let totalScanned = 0;
  let totalWithIssues = 0;

  for (const article of articles) {
    totalScanned++;

    if (totalScanned % 2000 === 0) {
      process.stderr.write(`  Scanned: ${totalScanned.toLocaleString()}...\r`);
    }

    const issues = checkArticle(article);

    // Apply tier filter
    const filteredIssues = tierFilter
      ? issues.filter(i => i.tier === tierFilter)
      : issues;

    if (filteredIssues.length === 0) continue;
    totalWithIssues++;

    const nlang = article.native_lang;
    if (!byNativeLang[nlang]) byNativeLang[nlang] = { total: 0, critical: 0, high: 0, medium: 0, low: 0, real: 0, quality: 0, cosmetic: 0 };
    byNativeLang[nlang].total++;

    for (const issue of filteredIssues) {
      // Severity & tier counts
      severityCounts[issue.severity]++;
      tierCounts[issue.tier]++;
      byNativeLang[nlang][issue.severity]++;
      byNativeLang[nlang][issue.tier]++;

      // Issue type counts
      issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1;

      // Systemic counts
      if (issue.subtype === 'pronunciation_label') systemicCounts.pronunciation_label++;
      if (issue.subtype === 'phrase_to_learn_label') systemicCounts.phrase_to_learn_label++;
      if (issue.subtype === 'cultural_tip_default') systemicCounts.cultural_tip_default++;

      // Accumulate into issue type arrays
      if (!allIssues[issue.type]) allIssues[issue.type] = [];
      allIssues[issue.type].push({
        id: article.id,
        slug: article.slug,
        native_lang: nlang,
        target_lang: article.target_lang,
        category: article.category,
        severity: issue.severity,
        tier: issue.tier,
        details: issue.details,
      });

      // Assign to fix groups
      const aid = article.id;
      if (issue.subtype === 'pronunciation_label' || issue.subtype === 'phrase_to_learn_label' || issue.subtype === 'cultural_tip_default') {
        if (!fixGroups.component_label_fix.ids.includes(aid)) fixGroups.component_label_fix.ids.push(aid);
      }
      if (issue.type === 'english_headers') {
        if (!fixGroups.translate_headers.ids.includes(aid)) fixGroups.translate_headers.ids.push(aid);
      }
      if (issue.type === 'frontmatter_in_html' || issue.type === 'frontmatter_in_content') {
        if (!fixGroups.strip_frontmatter.ids.includes(aid)) fixGroups.strip_frontmatter.ids.push(aid);
      }
      if (issue.type === 'missing_content_html' || issue.type === 'raw_mdx_in_html' || issue.type === 'raw_markdown_in_html' || issue.type === 'html_equals_content' || issue.type === 'html_too_short' || issue.type === 'stale_html') {
        if (!fixGroups.regenerate_content_html.ids.includes(aid)) fixGroups.regenerate_content_html.ids.push(aid);
      }
      if (issue.type === 'script_mismatch' || issue.type === 'english_density' || issue.type === 'language_fingerprint_mismatch') {
        if (!fixGroups.regenerate_content_ai.ids.includes(aid)) fixGroups.regenerate_content_ai.ids.push(aid);
      }
      if (issue.type === 'thin_content' && issue.severity === 'critical') {
        if (!fixGroups.regenerate_content_ai.ids.includes(aid)) fixGroups.regenerate_content_ai.ids.push(aid);
      }
      if (issue.type === 'placeholder_pronunciation') {
        if (!fixGroups.fix_pronunciations.ids.includes(aid)) fixGroups.fix_pronunciations.ids.push(aid);
      }
      if (issue.type === 'wrong_flag') {
        if (!fixGroups.fix_flags.ids.includes(aid)) fixGroups.fix_flags.ids.push(aid);
      }
      if (issue.type === 'truncated_content') {
        if (!fixGroups.fix_truncated.ids.includes(aid)) fixGroups.fix_truncated.ids.push(aid);
      }
      if (issue.type === 'pronunciation_equals_word' || issue.type === 'word_in_wrong_language' || issue.type === 'translation_in_wrong_language' || issue.type === 'english_example') {
        if (!fixGroups.fix_vocab_content.ids.includes(aid)) fixGroups.fix_vocab_content.ids.push(aid);
      }
      if (issue.type === 'malformed_component') {
        if (!fixGroups.fix_malformed.ids.includes(aid)) fixGroups.fix_malformed.ids.push(aid);
      }
      if (issue.type === 'non_standard_tags') {
        if (!fixGroups.fix_non_standard_tags.ids.includes(aid)) fixGroups.fix_non_standard_tags.ids.push(aid);
      }
      if (issue.type === 'undefined_literal') {
        if (!fixGroups.fix_undefined.ids.includes(aid)) fixGroups.fix_undefined.ids.push(aid);
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Build output
  const report = {
    meta: {
      timestamp: new Date().toISOString(),
      totalScanned,
      totalWithIssues,
      scanDurationMs: durationMs,
      filters: {
        native_lang: nativeLang || 'all',
        target_lang: targetLang || 'all',
        category: category || 'all',
        limit: limit || 'all',
        tier: tierFilter || 'all',
      },
      source: useDb ? 'supabase' : 'local',
    },
    summary: {
      byTier: tierCounts,
      bySeverity: severityCounts,
      byIssueType: issueTypeCounts,
      byNativeLang,
    },
    systemic: {
      pronunciation_label: {
        description: "VocabCard renders 'Pronunciation:' in English for all languages",
        affected_count: systemicCounts.pronunciation_label,
        fix_location: 'VocabCard.astro + component-converters.mjs',
        fix_type: 'component_update + regenerate content_html',
      },
      phrase_to_learn_label: {
        description: "PhraseOfDay renders 'Phrase to Learn' in English for all languages",
        affected_count: systemicCounts.phrase_to_learn_label,
        fix_location: 'PhraseOfDay.astro + component-converters.mjs',
        fix_type: 'component_update + regenerate content_html',
      },
      cultural_tip_default: {
        description: "CultureTip defaults title to 'Cultural Tip' in English",
        affected_count: systemicCounts.cultural_tip_default,
        fix_location: 'CultureTip.astro + component-converters.mjs',
        fix_type: 'component_update + regenerate content_html',
      },
    },
    issues: allIssues,
    fixGroups: Object.fromEntries(
      Object.entries(fixGroups).map(([key, val]) => [
        key,
        { description: val.description, count: val.ids.length },
      ])
    ),
  };

  // Summary to stderr
  process.stderr.write(`\n\n${'='.repeat(70)}\n`);
  process.stderr.write(`  CONTENT AUDIT RESULTS\n`);
  process.stderr.write(`${'='.repeat(70)}\n`);
  process.stderr.write(`  Scanned:       ${totalScanned.toLocaleString()}\n`);
  process.stderr.write(`  With Issues:   ${totalWithIssues.toLocaleString()} (${totalScanned > 0 ? Math.round(totalWithIssues / totalScanned * 100) : 0}%)\n`);
  process.stderr.write(`  Duration:      ${(durationMs / 1000).toFixed(1)}s\n`);
  process.stderr.write(`  Source:        ${useDb ? 'Supabase' : 'Local JSON'}\n`);

  process.stderr.write(`\n  --- By Tier ---\n`);
  process.stderr.write(`  REAL PROBLEMS  ${tierCounts.real.toLocaleString()}\n`);
  process.stderr.write(`  QUALITY GAPS   ${tierCounts.quality.toLocaleString()}\n`);
  process.stderr.write(`  COSMETIC       ${tierCounts.cosmetic.toLocaleString()}\n`);

  process.stderr.write(`\n  --- By Severity ---\n`);
  for (const [sev, count] of Object.entries(severityCounts)) {
    process.stderr.write(`  ${sev.toUpperCase().padEnd(10)} ${count.toLocaleString()}\n`);
  }

  process.stderr.write(`\n  --- By Issue Type ---\n`);
  const sortedTypes = Object.entries(issueTypeCounts).sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes) {
    const tier = ISSUE_TIERS[type] || '?';
    const tierLabel = tier === 'real' ? 'REAL' : tier === 'quality' ? 'QUAL' : 'COSM';
    process.stderr.write(`  ${type.padEnd(32)} ${String(count).padStart(6)}  [${tierLabel}]\n`);
  }

  if (systemicCounts.pronunciation_label > 0 || systemicCounts.phrase_to_learn_label > 0 || systemicCounts.cultural_tip_default > 0) {
    process.stderr.write(`\n  --- Systemic Issues ---\n`);
    process.stderr.write(`  Pronunciation label:  ${systemicCounts.pronunciation_label.toLocaleString()}\n`);
    process.stderr.write(`  Phrase to Learn:      ${systemicCounts.phrase_to_learn_label.toLocaleString()}\n`);
    process.stderr.write(`  Cultural Tip default: ${systemicCounts.cultural_tip_default.toLocaleString()}\n`);
  }

  process.stderr.write(`\n  --- Fix Groups ---\n`);
  for (const [key, val] of Object.entries(fixGroups)) {
    if (val.ids.length > 0) {
      process.stderr.write(`  ${key.padEnd(28)} ${val.ids.length.toLocaleString()}\n`);
    }
  }
  process.stderr.write(`\n`);

  // Write to file
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const outPath = path.join(dataDir, 'content-audit.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  process.stderr.write(`  Report saved to: ${outPath}\n\n`);

  // Also write to stdout
  process.stdout.write(JSON.stringify(report, null, 2));
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
