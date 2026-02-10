#!/usr/bin/env node
/**
 * fix-mechanical.mjs — Phase 1a: Deterministic fixes for blog articles.
 *
 * Reads articles-local.json, applies no-AI fixes:
 *   1. malformed_component: Rename VocabCard props (verb→word, meaning→translation, {lang}→word)
 *   2. html_entities_in_props: Decode &amp; &lt; etc. in component props
 *   3. empty_component_props: Remove VocabCards with empty word+translation
 *   4. repeated_content: Deduplicate identical paragraphs
 *   5. html_regen: Regenerate content_html for articles with raw MDX/markdown/stale HTML
 *
 * All content fixes also get HTML regenerated automatically.
 *
 * Usage:
 *   node blog/scripts/fix-mechanical.mjs --dry-run    # preview changes (default)
 *   node blog/scripts/fix-mechanical.mjs --apply       # apply to Supabase
 */

import { createClient } from '@supabase/supabase-js';
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

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── CLI Args ────────────────────────────────────────────────────────────────

const APPLY = process.argv.includes('--apply');
const BATCH_DELAY = 100; // ms between DB writes

// Language codes that might be used as VocabCard prop names instead of word=
const LANG_PROP_CODES = [
  'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'uk',
  'tr', 'sv', 'no', 'da', 'cs', 'el', 'hu', 'en',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);

  const match = tag.match(regex);
  return match ? match[1] : null;
}

// ─── Fix Functions ───────────────────────────────────────────────────────────

/**
 * Fix 1: Rename non-standard props in VocabCard AND PhraseOfDay.
 * verb→word, meaning→translation, {lang_code}→word
 */
function fixMalformedProps(content) {
  const fixes = [];

  function renameProps(match, tagName, attrs) {
    let newAttrs = attrs;
    let changed = false;

    const hasWord = /\bword\s*=/i.test(newAttrs);
    const hasPhrase = /\bphrase\s*=/i.test(newAttrs);
    const hasTranslation = /\btranslation\s*=/i.test(newAttrs);

    // verb= or term= → word=
    if (!hasWord && !hasPhrase) {
      for (const alt of ['verb', 'term', 'hungarian', 'turkish', 'greek', 'czech', 'swedish', 'norwegian', 'danish', 'romanian']) {
        const re = new RegExp(`\\b${alt}\\s*=`, 'i');
        if (re.test(newAttrs)) {
          newAttrs = newAttrs.replace(re, 'word=');
          if (!fixes.includes(`${alt}→word`)) fixes.push(`${alt}→word`);
          changed = true;
          break;
        }
      }
    }

    // meaning= or english= → translation=
    if (!hasTranslation) {
      for (const alt of ['meaning', 'english']) {
        const re = new RegExp(`\\b${alt}\\s*=`, 'i');
        if (re.test(newAttrs)) {
          newAttrs = newAttrs.replace(re, 'translation=');
          if (!fixes.includes(`${alt}→translation`)) fixes.push(`${alt}→translation`);
          changed = true;
          break;
        }
      }
    }

    // Language code props → word= (es=, fr=, de=, etc.)
    if (!/\bword\s*=/i.test(newAttrs) && !/\bphrase\s*=/i.test(newAttrs)) {
      for (const code of LANG_PROP_CODES) {
        const re = new RegExp(`\\b${code}\\s*=`, 'i');
        if (re.test(newAttrs)) {
          newAttrs = newAttrs.replace(re, 'word=');
          if (!fixes.includes(`${code}→word`)) fixes.push(`${code}→word`);
          changed = true;
          break;
        }
      }
    }

    return changed ? `<${tagName}${newAttrs}/>` : match;
  }

  // Fix VocabCard tags
  let fixed = content.replace(/<VocabCard([\s\S]*?)\/>/gi, (match, attrs) =>
    renameProps(match, 'VocabCard', attrs)
  );

  // Fix PhraseOfDay tags
  fixed = fixed.replace(/<PhraseOfDay([\s\S]*?)\/>/gi, (match, attrs) =>
    renameProps(match, 'PhraseOfDay', attrs)
  );

  return { content: fixed, changed: fixes.length > 0, fixes };
}

/**
 * Fix 2: Decode HTML entities in component props.
 * e.g., word="l&apos;amour" → word="l'amour"
 */
function fixHtmlEntities(content) {
  const ENTITY_MAP = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&apos;': "'",
  };
  let fixCount = 0;

  const fixed = content.replace(
    /<(?:VocabCard|PhraseOfDay|CultureTip|ConjugationTable)([\s\S]*?)(?:\/>|>)/gi,
    (match) => {
      if (/&(?:amp|lt|gt|quot|apos);/i.test(match)) {
        fixCount++;
        return match.replace(/&(amp|lt|gt|quot|apos);/gi, (full, entity) => {
          return ENTITY_MAP[`&${entity.toLowerCase()};`] || full;
        });
      }
      return match;
    }
  );

  return { content: fixed, changed: fixCount > 0, fixCount };
}

/**
 * Fix 3: Remove VocabCards with empty word prop.
 * A VocabCard with no word is broken — nothing to teach.
 */
function fixEmptyComponents(content) {
  let removedCount = 0;

  const fixed = content.replace(/<VocabCard([\s\S]*?)\/>/gi, (match, attrs) => {
    const tag = `<VocabCard${attrs}/>`;
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';

    if (!word.trim()) {
      removedCount++;
      return '';
    }
    return match;
  });

  return { content: fixed, changed: removedCount > 0, removedCount };
}

/**
 * Fix 4: Strip code fences wrapping entire content.
 * AI sometimes generates content inside ```html ... ```
 */
function fixCodeFences(content) {
  const trimmed = content.trim();
  // Matched pair: ```html\n ... \n```
  if (/^```\w*\n/.test(trimmed) && /\n```\s*$/.test(trimmed)) {
    const stripped = trimmed
      .replace(/^```\w*\n/, '')
      .replace(/\n```\s*$/, '')
      .trim();
    return { content: stripped, changed: true };
  }
  // Orphan opening fence only (no closing ```)
  if (/^```\w*\n/.test(trimmed) && !/\n```\s*$/.test(trimmed)) {
    const stripped = trimmed.replace(/^```\w*\n/, '').trim();
    return { content: stripped, changed: true };
  }
  return { content, changed: false };
}

/**
 * Fix 5: Deduplicate repeated paragraphs (>50 chars).
 */
function fixRepeatedContent(content) {
  const parts = content.split(/\n\s*\n/);
  const seen = new Set();
  const unique = [];
  let removedCount = 0;

  for (const p of parts) {
    const normalized = p.trim().toLowerCase();
    if (normalized.length >= 50 && seen.has(normalized)) {
      removedCount++;
      continue;
    }
    unique.push(p);
    if (normalized.length >= 50) seen.add(normalized);
  }

  return { content: unique.join('\n\n'), changed: removedCount > 0, removedCount };
}

/**
 * Check if article needs HTML regeneration (even without content changes).
 */
function detectHtmlIssue(article) {
  const content = article.content || '';
  const html = article.content_html || '';

  // Raw MDX component tags in HTML
  const COMPONENT_TAGS = ['VocabCard', 'PhraseOfDay', 'CultureTip', 'ConjugationTable', 'CTA'];
  for (const tag of COMPONENT_TAGS) {
    if (new RegExp(`<${tag}[\\s/>]`, 'i').test(html)) return 'raw_mdx_in_html';
  }

  // Non-standard <Phrase>/<Original>/<Translation> tags in HTML (now handled by converter)
  if (/<Phrase[\s>]/i.test(html) || /<Original>/i.test(html)) return 'non_standard_tags_in_html';

  // Raw markdown headings in HTML
  if (html.length > 100) {
    const mdHeadings = (html.match(/^##\s+\w/gm) || []).length;
    if (mdHeadings >= 2) return 'raw_markdown_in_html';
  }

  // Frontmatter leaked into HTML
  if (html.startsWith('<hr') && html.includes('title:')) return 'frontmatter_in_html';

  // HTML wrapped in <pre><code> (content was in code fences)
  if (html.startsWith('<pre><code>') && html.length > 500) return 'code_fence_in_html';

  // Non-standard tags in content that should now render (converter updated)
  if (/<Phrase[\s>]/i.test(content) && !(/speakable-vocab/.test(html) && !/<Phrase/i.test(html))) {
    return 'non_standard_tags_stale';
  }

  // Stale HTML: content has VocabCards but HTML lacks rendered versions
  const vocabCount = (content.match(/<VocabCard/gi) || []).length;
  if (vocabCount > 0 && html.trim().length > 200 && !/speakable-vocab/.test(html)) {
    return 'stale_html';
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  process.stderr.write(`fix-mechanical: Phase 1a\n`);
  process.stderr.write(`  Mode: ${APPLY ? 'APPLY TO SUPABASE' : 'DRY RUN (use --apply to write)'}\n\n`);

  // Load articles
  const localPath = path.join(__dirname, 'data', 'articles-local.json');
  if (!fs.existsSync(localPath)) {
    process.stderr.write(`  Error: ${localPath} not found. Run export-articles.mjs first.\n`);
    process.exit(1);
  }

  process.stderr.write(`  Loading articles...\n`);
  const data = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
  const articles = data.articles.filter(a => a.target_lang !== 'all');
  process.stderr.write(`  Loaded ${articles.length.toLocaleString()} articles\n\n`);

  // Process articles
  const updates = [];
  const stats = {
    malformed_props: 0,
    html_entities: 0,
    empty_components: 0,
    code_fences: 0,
    repeated_content: 0,
    html_regen_only: 0,
  };
  const propRenameCounts = {}; // track which renames are most common

  for (const article of articles) {
    const appliedFixes = [];
    let content = article.content || '';
    let contentChanged = false;

    // Fix 1: Malformed VocabCard props
    const propResult = fixMalformedProps(content);
    if (propResult.changed) {
      content = propResult.content;
      contentChanged = true;
      appliedFixes.push(`props: ${propResult.fixes.join(', ')}`);
      stats.malformed_props++;
      for (const f of propResult.fixes) {
        propRenameCounts[f] = (propRenameCounts[f] || 0) + 1;
      }
    }

    // Fix 2: HTML entities in component props
    const entityResult = fixHtmlEntities(content);
    if (entityResult.changed) {
      content = entityResult.content;
      contentChanged = true;
      appliedFixes.push(`html_entities: ${entityResult.fixCount}`);
      stats.html_entities++;
    }

    // Fix 3: Remove empty VocabCards
    const emptyResult = fixEmptyComponents(content);
    if (emptyResult.changed) {
      content = emptyResult.content;
      contentChanged = true;
      appliedFixes.push(`empty_removed: ${emptyResult.removedCount}`);
      stats.empty_components++;
    }

    // Fix 4: Strip code fences wrapping content
    const fenceResult = fixCodeFences(content);
    if (fenceResult.changed) {
      content = fenceResult.content;
      contentChanged = true;
      appliedFixes.push('code_fence_stripped');
      stats.code_fences++;
    }

    // Fix 5: Deduplicate repeated paragraphs
    const repeatResult = fixRepeatedContent(content);
    if (repeatResult.changed) {
      content = repeatResult.content;
      contentChanged = true;
      appliedFixes.push(`dedup: ${repeatResult.removedCount}`);
      stats.repeated_content++;
    }

    // Fix 6: Check if HTML needs regeneration (even without content changes)
    const htmlIssue = detectHtmlIssue(article);
    if (htmlIssue && !contentChanged) {
      appliedFixes.push(`html: ${htmlIssue}`);
      stats.html_regen_only++;
    }

    // Skip articles with no fixes needed
    if (!contentChanged && !htmlIssue) continue;

    // Regenerate HTML from (possibly fixed) content
    const { html } = convertMdxToHtml(content, article.native_lang || 'en', article.target_lang || null);

    const update = {
      id: article.id,
      slug: article.slug,
      native_lang: article.native_lang,
      target_lang: article.target_lang,
      fixes: appliedFixes,
    };

    if (contentChanged) {
      update.content = content;
    }
    update.content_html = html;

    updates.push(update);
  }

  // ─── Report ──────────────────────────────────────────────────────────────

  const totalFixed = updates.length;

  process.stderr.write(`  ═══════════════════════════════════════════════\n`);
  process.stderr.write(`  PHASE 1a FIX SUMMARY\n`);
  process.stderr.write(`  ═══════════════════════════════════════════════\n`);
  process.stderr.write(`  malformed_props:      ${stats.malformed_props}\n`);
  process.stderr.write(`  html_entities:        ${stats.html_entities}\n`);
  process.stderr.write(`  empty_components:     ${stats.empty_components}\n`);
  process.stderr.write(`  code_fences:          ${stats.code_fences}\n`);
  process.stderr.write(`  repeated_content:     ${stats.repeated_content}\n`);
  process.stderr.write(`  html_regen (only):    ${stats.html_regen_only}\n`);
  process.stderr.write(`  ───────────────────────────────────────────────\n`);
  process.stderr.write(`  Total articles:       ${totalFixed}\n\n`);

  if (Object.keys(propRenameCounts).length > 0) {
    process.stderr.write(`  --- Prop Renames ---\n`);
    const sorted = Object.entries(propRenameCounts).sort((a, b) => b[1] - a[1]);
    for (const [rename, count] of sorted) {
      process.stderr.write(`  ${rename.padEnd(24)} ${count}\n`);
    }
    process.stderr.write(`\n`);
  }

  // Show sample fixes
  process.stderr.write(`  --- Sample Fixes (first 15) ---\n`);
  for (const u of updates.slice(0, 15)) {
    process.stderr.write(`  ${u.slug.slice(0, 50).padEnd(50)} ${u.fixes.join(' | ')}\n`);
  }
  if (updates.length > 15) {
    process.stderr.write(`  ... and ${updates.length - 15} more\n`);
  }
  process.stderr.write(`\n`);

  if (totalFixed === 0) {
    process.stderr.write(`  No fixes needed!\n`);
    return;
  }

  if (!APPLY) {
    process.stderr.write(`  DRY RUN complete. Run with --apply to write to Supabase.\n\n`);
    return;
  }

  // ─── Apply to Supabase ──────────────────────────────────────────────────

  process.stderr.write(`  Applying ${totalFixed} fixes to Supabase...\n`);

  let applied = 0;
  let errors = 0;
  const failedSlugs = [];

  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    const fields = { content_html: u.content_html };
    if (u.content) fields.content = u.content;

    const { error } = await supabase
      .from('blog_articles')
      .update(fields)
      .eq('id', u.id);

    if (error) {
      process.stderr.write(`  ERROR [${u.slug}]: ${error.message}\n`);
      errors++;
      failedSlugs.push(u.slug);

      // Retry once on transient errors
      if (error.message.includes('fetch failed')) {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await supabase
          .from('blog_articles')
          .update(fields)
          .eq('id', u.id);
        if (!retry.error) {
          errors--;
          failedSlugs.pop();
          applied++;
          continue;
        }
      }
    } else {
      applied++;
    }

    if ((i + 1) % 50 === 0) {
      process.stderr.write(`  Progress: ${i + 1}/${updates.length} (${applied} ok, ${errors} err)\n`);
    }

    if (i < updates.length - 1) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  process.stderr.write(`\n  ═══════════════════════════════════════════════\n`);
  process.stderr.write(`  RESULTS\n`);
  process.stderr.write(`  ═══════════════════════════════════════════════\n`);
  process.stderr.write(`  Applied:  ${applied}\n`);
  process.stderr.write(`  Errors:   ${errors}\n`);
  process.stderr.write(`  Duration: ${duration}s\n`);

  if (failedSlugs.length > 0) {
    process.stderr.write(`\n  Failed:\n`);
    for (const s of failedSlugs) {
      process.stderr.write(`    ${s}\n`);
    }
  }

  process.stderr.write(`\n  Next: Re-run audit to verify fixes:\n`);
  process.stderr.write(`    node blog/scripts/audit-content.mjs --tier real\n\n`);
}

main().catch(err => {
  process.stderr.write(`Fatal: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
