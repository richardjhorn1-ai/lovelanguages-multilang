#!/usr/bin/env node
/**
 * Component Converters: MDX → HTML
 *
 * Converts raw MDX content (with Astro component tags) into pure HTML.
 * Output matches the exact HTML structure of the Astro components:
 *   - VocabCard.astro
 *   - PhraseOfDay.astro
 *   - CultureTip.astro
 *   - ConjugationTable.astro
 *
 * Used by phase3-fix-content-html.mjs to regenerate content_html for all articles.
 */

import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Escape HTML special characters in user content
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Extract a prop value from a component tag string.
 * Handles: prop="value" and prop='value'
 */
function extractProp(tag, propName) {
  // Match prop="value" or prop='value'
  const regex = new RegExp(`${propName}\\s*=\\s*["']([^"']*?)["']`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

/**
 * Parse conjugations array from JSX prop: conjugations={[{...}, {...}]}
 * Handles the JSON-like syntax used in MDX files.
 */
function parseConjugations(tag) {
  // Match conjugations={[...]}
  const match = tag.match(/conjugations\s*=\s*\{(\[[\s\S]*?\])\}/);
  if (!match) return [];

  try {
    // The content uses JS object syntax (unquoted keys), convert to valid JSON
    let jsonStr = match[1]
      // Quote unquoted keys: person: -> "person":
      .replace(/(\w+)\s*:/g, '"$1":')
      // Single quotes to double quotes for values
      .replace(/'/g, '"')
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(jsonStr);
  } catch (e) {
    return [];
  }
}

/**
 * Convert <VocabCard ... /> to styled HTML
 * Supports both new props (word/translation) and legacy (polish/english)
 */
function convertVocabCard(tag) {
  const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  const pronunciation = extractProp(tag, 'pronunciation');
  const example = extractProp(tag, 'example');

  let html = `<div class="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
  <div class="flex items-center justify-between mb-2">
    <span class="text-2xl font-bold text-accent font-header">${escapeHtml(word)}</span>
    <span class="text-lg text-gray-900">${escapeHtml(translation)}</span>
  </div>`;

  if (pronunciation) {
    html += `
  <p class="text-sm text-gray-600 mb-2">
    Pronunciation: <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
  </p>`;
  }

  if (example) {
    html += `
  <p class="text-gray-600 italic border-t border-accent/20 pt-3 mt-3">
    "${escapeHtml(example)}"
  </p>`;
  }

  html += `\n</div>`;
  return html;
}

/**
 * Convert <PhraseOfDay ... /> to styled HTML
 * Supports both new props (word/translation) and legacy (polish/english)
 */
function convertPhraseOfDay(tag) {
  const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  const pronunciation = extractProp(tag, 'pronunciation') || '';
  const context = extractProp(tag, 'context');

  let html = `<div class="speakable-phrase my-8 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8">
  <div class="absolute top-4 right-4 text-6xl opacity-20">💕</div>
  <p class="text-sm uppercase tracking-wide text-accent font-bold mb-2">
    Phrase to Learn
  </p>
  <p class="text-3xl font-bold text-gray-900 font-header mb-2">${escapeHtml(word)}</p>
  <p class="text-lg text-gray-600 mb-1">${escapeHtml(translation)}</p>
  <p class="text-sm text-accent">[ ${escapeHtml(pronunciation)} ]</p>`;

  if (context) {
    html += `
  <p class="mt-4 text-gray-600 italic border-t border-accent/20 pt-4">
    ${escapeHtml(context)}
  </p>`;
  }

  html += `\n</div>`;
  return html;
}

/**
 * Convert <CultureTip title="X" flag="Y">inner text</CultureTip> to styled HTML
 */
function convertCultureTip(tag, innerContent) {
  const title = extractProp(tag, 'title') || 'Cultural Tip';
  const flag = extractProp(tag, 'flag') || '🇵🇱';

  // Convert inner markdown to HTML
  const innerHtml = marked.parse(innerContent.trim());

  return `<div class="my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
  <div class="flex items-center gap-2 mb-3">
    <span class="text-2xl">${flag}</span>
    <h4 class="font-bold text-amber-800 font-header">${escapeHtml(title)}</h4>
  </div>
  <div class="text-amber-900">
    ${innerHtml}
  </div>
</div>`;
}

/**
 * Convert <ConjugationTable verb="X" meaning="Y" conjugations={[...]} /> to styled HTML
 */
function convertConjugationTable(tag) {
  const verb = extractProp(tag, 'verb') || '';
  const meaning = extractProp(tag, 'meaning') || '';
  const conjugations = parseConjugations(tag);

  let rows = '';
  conjugations.forEach((c, i) => {
    const word = c.word || c.polish || '';
    const translation = c.translation || c.english || '';
    const bgClass = i % 2 === 0 ? ' class="bg-gray-50"' : '';
    rows += `      <tr${bgClass}>
        <td class="px-4 py-3 font-medium text-gray-600 w-1/4">${escapeHtml(c.person || '')}</td>
        <td class="px-4 py-3 font-bold text-accent">${escapeHtml(word)}</td>
        <td class="px-4 py-3 text-gray-600">${escapeHtml(translation)}</td>
      </tr>\n`;
  });

  return `<div class="my-8 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
  <div class="bg-accent text-white px-6 py-4">
    <h4 class="text-xl font-bold font-header">${escapeHtml(verb)}</h4>
    <p class="text-white/80">${escapeHtml(meaning)}</p>
  </div>
  <table class="w-full">
    <tbody>
${rows}    </tbody>
  </table>
</div>`;
}

/**
 * Main conversion function: raw MDX content → clean HTML with rendered components
 *
 * @param {string} rawContent - Raw MDX content (may include frontmatter, imports, components)
 * @returns {{ html: string, stats: object }} - Converted HTML and conversion stats
 */
export function convertMdxToHtml(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return { html: '', stats: { empty: true } };
  }

  const stats = {
    hadFrontmatter: false,
    vocabCards: 0,
    phraseOfDay: 0,
    cultureTips: 0,
    conjugationTables: 0,
    ctaRemoved: 0,
    importsRemoved: 0,
  };

  let content = rawContent;

  // 1. Strip frontmatter (--- ... ---) using gray-matter
  try {
    const parsed = matter(content);
    if (parsed.data && Object.keys(parsed.data).length > 0) {
      content = parsed.content;
      stats.hadFrontmatter = true;
    }
  } catch (e) {
    // If gray-matter fails, try manual regex
    const fmMatch = content.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
    if (fmMatch) {
      content = content.slice(fmMatch[0].length);
      stats.hadFrontmatter = true;
    }
  }

  // 2. Remove import statements
  content = content.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, (match) => {
    stats.importsRemoved++;
    return '';
  });

  // 3a. Convert CultureTip with children: <CultureTip ...>inner</CultureTip>
  content = content.replace(
    /<CultureTip([^>]*?)>([\s\S]*?)<\/CultureTip>/gi,
    (match, attrs, inner) => {
      stats.cultureTips++;
      return convertCultureTip(`<CultureTip${attrs}>`, inner);
    }
  );

  // 3b. Convert self-closing CultureTip with content prop: <CultureTip content='...' />
  content = content.replace(
    /<CultureTip([\s\S]*?)\/>/gi,
    (match, attrs) => {
      const contentProp = extractProp(`<CultureTip${attrs}/>`, 'content');
      if (contentProp) {
        stats.cultureTips++;
        return convertCultureTip(`<CultureTip${attrs}>`, contentProp);
      }
      // Self-closing with no content prop — skip (shouldn't happen)
      return match;
    }
  );

  // 4. Convert VocabCard (self-closing)
  // Handles both single-line and multi-line: <VocabCard ... /> with attributes possibly on multiple lines
  content = content.replace(
    /<VocabCard([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.vocabCards++;
      return convertVocabCard(`<VocabCard${attrs}/>`);
    }
  );

  // 5. Convert PhraseOfDay (self-closing)
  content = content.replace(
    /<PhraseOfDay([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.phraseOfDay++;
      return convertPhraseOfDay(`<PhraseOfDay${attrs}/>`);
    }
  );

  // 6. Convert ConjugationTable (self-closing)
  content = content.replace(
    /<ConjugationTable([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.conjugationTables++;
      return convertConjugationTable(`<ConjugationTable${attrs}/>`);
    }
  );

  // 7. Strip CTA (ArticleLayout renders its own CTA)
  content = content.replace(/<CTA[\s\S]*?\/>/gi, () => {
    stats.ctaRemoved++;
    return '';
  });

  // 8. Run marked() on remaining markdown
  // HTML blocks (our converted components) pass through untouched
  let html;
  try {
    html = marked.parse(content);
  } catch (e) {
    // Fallback: return content as-is if marked fails
    html = content;
  }

  // 9. Clean up extra whitespace
  html = html
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(<p>\s*<\/p>\s*)+/gi, '')
    .trim();

  return { html, stats };
}

/**
 * Strip frontmatter from raw content field (for cleaning up Type A articles)
 */
export function stripFrontmatter(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') return rawContent;

  try {
    const parsed = matter(rawContent);
    if (parsed.data && Object.keys(parsed.data).length > 0) {
      return parsed.content.trim();
    }
  } catch (e) {
    // Manual fallback
    const fmMatch = rawContent.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
    if (fmMatch) {
      return rawContent.slice(fmMatch[0].length).trim();
    }
  }

  return rawContent;
}
