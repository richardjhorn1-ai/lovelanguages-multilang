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

// ─── Translation Maps ────────────────────────────────────────────────────────

/** Translated component labels per native language */
export const COMPONENT_LABELS = {
  en: { pronunciation: 'Pronunciation:', phraseToLearn: 'Phrase to Learn', culturalTip: 'Cultural Tip', definition: 'Definition' },
  es: { pronunciation: 'Pronunciación:', phraseToLearn: 'Frase para Aprender', culturalTip: 'Consejo Cultural', definition: 'Definición' },
  fr: { pronunciation: 'Prononciation :', phraseToLearn: 'Expression à Apprendre', culturalTip: 'Astuce Culturelle', definition: 'Définition' },
  de: { pronunciation: 'Aussprache:', phraseToLearn: 'Ausdruck zum Lernen', culturalTip: 'Kulturtipp', definition: 'Definition' },
  it: { pronunciation: 'Pronuncia:', phraseToLearn: 'Frase da Imparare', culturalTip: 'Curiosità Culturale', definition: 'Definizione' },
  pt: { pronunciation: 'Pronúncia:', phraseToLearn: 'Frase para Aprender', culturalTip: 'Dica Cultural', definition: 'Definição' },
  pl: { pronunciation: 'Wymowa:', phraseToLearn: 'Zwrot do Nauki', culturalTip: 'Ciekawostka Kulturowa', definition: 'Definicja' },
  nl: { pronunciation: 'Uitspraak:', phraseToLearn: 'Zin om te Leren', culturalTip: 'Cultuurtip', definition: 'Definitie' },
  ro: { pronunciation: 'Pronunție:', phraseToLearn: 'Expresie de Învățat', culturalTip: 'Sfat Cultural', definition: 'Definiție' },
  ru: { pronunciation: 'Произношение:', phraseToLearn: 'Фраза для Изучения', culturalTip: 'Культурный Совет', definition: 'Определение' },
  uk: { pronunciation: 'Вимова:', phraseToLearn: 'Фраза для Вивчення', culturalTip: 'Культурна Порада', definition: 'Визначення' },
  tr: { pronunciation: 'Telaffuz:', phraseToLearn: 'Öğrenilecek İfade', culturalTip: 'Kültürel İpucu', definition: 'Tanım' },
  sv: { pronunciation: 'Uttal:', phraseToLearn: 'Fras att Lära Sig', culturalTip: 'Kulturtips', definition: 'Definition' },
  no: { pronunciation: 'Uttale:', phraseToLearn: 'Uttrykk å Lære', culturalTip: 'Kulturtips', definition: 'Definisjon' },
  da: { pronunciation: 'Udtale:', phraseToLearn: 'Udtryk at Lære', culturalTip: 'Kulturtip', definition: 'Definition' },
  cs: { pronunciation: 'Výslovnost:', phraseToLearn: 'Fráze k Naučení', culturalTip: 'Kulturní Tip', definition: 'Definice' },
  el: { pronunciation: 'Προφορά:', phraseToLearn: 'Φράση για Εκμάθηση', culturalTip: 'Πολιτιστική Συμβουλή', definition: 'Ορισμός' },
  hu: { pronunciation: 'Kiejtés:', phraseToLearn: 'Megtanulandó Kifejezés', culturalTip: 'Kulturális Tipp', definition: 'Meghatározás' },
};

/** Flag emoji per target language */
export const LANG_FLAGS = {
  pl: '🇵🇱', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
  sv: '🇸🇪', no: '🇳🇴', da: '🇩🇰', nl: '🇳🇱', cs: '🇨🇿', hu: '🇭🇺',
  tr: '🇹🇷', ro: '🇷🇴', ru: '🇷🇺', uk: '🇺🇦', el: '🇬🇷', en: '🇬🇧',
};

/** Get labels for a native language, falling back to English */
function getLabels(nativeLang) {
  return COMPONENT_LABELS[nativeLang] || COMPONENT_LABELS.en;
}

/** Get flag for a target language, falling back to empty string */
function getFlag(targetLang) {
  return LANG_FLAGS[targetLang] || '';
}

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
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
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
function convertVocabCard(tag, nativeLang = 'en') {
  const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  const pronunciation = extractProp(tag, 'pronunciation');
  const example = extractProp(tag, 'example');
  const labels = getLabels(nativeLang);

  let html = `<div class="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
  <div class="flex items-center justify-between mb-2">
    <span class="text-2xl font-bold text-accent font-header">${escapeHtml(word)}</span>
    <span class="text-lg text-gray-900">${escapeHtml(translation)}</span>
  </div>`;

  if (pronunciation) {
    html += `
  <p class="text-sm text-gray-600 mb-2">
    ${escapeHtml(labels.pronunciation)} <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
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
function convertPhraseOfDay(tag, nativeLang = 'en') {
  const word = extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '';
  const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
  const pronunciation = extractProp(tag, 'pronunciation') || '';
  const context = extractProp(tag, 'context');
  const labels = getLabels(nativeLang);

  let html = `<div class="speakable-phrase my-8 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8">
  <div class="absolute top-4 right-4 text-6xl opacity-20">💕</div>
  <p class="text-sm uppercase tracking-wide text-accent font-bold mb-2">
    ${escapeHtml(labels.phraseToLearn)}
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
function convertCultureTip(tag, innerContent, nativeLang = 'en', targetLang = null) {
  const labels = getLabels(nativeLang);
  const title = extractProp(tag, 'title') || labels.culturalTip;
  const flag = extractProp(tag, 'flag') || (targetLang ? getFlag(targetLang) : '🇵🇱');

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
 * Extract text content of a child element from a parent block.
 * e.g. extractChild('<Phrase><Original>hello</Original></Phrase>', 'Original') => 'hello'
 */
function extractChild(block, tagName) {
  const re = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const m = block.match(re);
  return m ? m[1].trim() : null;
}

/**
 * Convert <Phrase>...</Phrase> with children (Original, Translation, Transliteration, Context, etc.)
 * OR <Phrase term="..." pronunciation="..."><Trans>...<Note>...</Phrase>
 * → styled HTML matching VocabCard appearance
 */
function convertPhrase(block, nativeLang = 'en') {
  const labels = getLabels(nativeLang);

  // Extract from attributes (pattern 2: <Phrase term="..." pronunciation="...">)
  const openTag = block.match(/<Phrase([^>]*)>/i);
  const attrs = openTag ? openTag[1] : '';
  const termAttr = extractProp(`<Phrase${attrs}>`, 'term');
  const pronAttr = extractProp(`<Phrase${attrs}>`, 'pronunciation');

  // Extract from children (pattern 1: <Original>...<Translation>...)
  const original = extractChild(block, 'Original') || termAttr || '';
  const translation = extractChild(block, 'Translation') || extractChild(block, 'Translated') || extractChild(block, 'Trans') || '';
  const pronunciation = extractChild(block, 'Transliteration') || extractChild(block, 'Pronunciation') || pronAttr || '';
  const context = extractChild(block, 'Context') || extractChild(block, 'Note') || '';
  const example = extractChild(block, 'Example') || '';

  let html = `<div class="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
  <div class="flex items-center justify-between mb-2">
    <span class="text-2xl font-bold text-accent font-header">${escapeHtml(original)}</span>
    <span class="text-lg text-gray-900">${escapeHtml(translation)}</span>
  </div>`;

  if (pronunciation) {
    html += `
  <p class="text-sm text-gray-600 mb-2">
    ${escapeHtml(labels.pronunciation)} <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
  </p>`;
  }

  if (context || example) {
    const note = context || example;
    html += `
  <p class="text-gray-600 italic border-t border-accent/20 pt-3 mt-3">
    ${escapeHtml(note)}
  </p>`;
  }

  html += `\n</div>`;
  return html;
}

/**
 * Convert self-closing <Phrase native="..." target="..." phonetic="..." />
 * (pattern 3: found inside <PhraseList> wrappers)
 * → styled HTML matching VocabCard appearance
 */
function convertPhraseSelfClosing(tag, nativeLang = 'en') {
  const labels = getLabels(nativeLang);
  const original = extractProp(tag, 'native') || extractProp(tag, 'term') || '';
  const translation = extractProp(tag, 'target') || extractProp(tag, 'translation') || '';
  const pronunciation = extractProp(tag, 'phonetic') || extractProp(tag, 'pronunciation') || '';
  const context = extractProp(tag, 'context') || extractProp(tag, 'note') || '';

  let html = `<div class="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
  <div class="flex items-center justify-between mb-2">
    <span class="text-2xl font-bold text-accent font-header">${escapeHtml(original)}</span>
    <span class="text-lg text-gray-900">${escapeHtml(translation)}</span>
  </div>`;

  if (pronunciation) {
    html += `
  <p class="text-sm text-gray-600 mb-2">
    ${escapeHtml(labels.pronunciation)} <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
  </p>`;
  }

  if (context) {
    html += `
  <p class="text-gray-600 italic border-t border-accent/20 pt-3 mt-3">
    ${escapeHtml(context)}
  </p>`;
  }

  html += `\n</div>`;
  return html;
}

/**
 * Convert <VocabCard> with children (Word, Translation, Pronunciation, etc.)
 * → styled HTML matching self-closing VocabCard appearance
 */
function convertVocabCardWithChildren(block, nativeLang = 'en') {
  const labels = getLabels(nativeLang);
  const word = extractChild(block, 'Word') || '';
  const translation = extractChild(block, 'Translation') || '';
  const pronunciation = extractChild(block, 'Pronunciation') || '';
  const example = extractChild(block, 'Example') || extractChild(block, 'Sentence') || '';
  const gender = extractChild(block, 'Gender') || '';

  let html = `<div class="speakable-vocab bg-gradient-to-br from-accent/5 to-accent/10 rounded-2xl p-6 my-6 border border-accent/20">
  <div class="flex items-center justify-between mb-2">
    <span class="text-2xl font-bold text-accent font-header">${escapeHtml(word)}${gender ? ` <span class="text-sm text-gray-500">(${escapeHtml(gender)})</span>` : ''}</span>
    <span class="text-lg text-gray-900">${escapeHtml(translation)}</span>
  </div>`;

  if (pronunciation) {
    html += `
  <p class="text-sm text-gray-600 mb-2">
    ${escapeHtml(labels.pronunciation)} <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
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
 * Convert <ConjugationTable>...</ConjugationTable> with children (Meaning, Present, Past, Future, etc.)
 * → styled HTML matching ConjugationTable appearance
 */
function convertConjugationTableWithChildren(block) {
  const openTag = block.match(/<ConjugationTable([^>]*)>/i);
  const attrs = openTag ? openTag[1] : '';
  const verb = extractProp(`<ConjugationTable${attrs}>`, 'term') || extractProp(`<ConjugationTable${attrs}>`, 'verb') || '';
  const meaning = extractChild(block, 'Meaning') || extractProp(`<ConjugationTable${attrs}>`, 'meaning') || '';

  // Extract tense children
  const tenses = ['Present', 'Past', 'Future', 'Imperative', 'Conditional'];
  const rows = [];
  for (const tense of tenses) {
    const value = extractChild(block, tense);
    if (value) {
      const bgClass = rows.length % 2 === 0 ? ' class="bg-gray-50"' : '';
      rows.push(`      <tr${bgClass}>
        <td class="px-4 py-3 font-medium text-gray-600 w-1/4">${escapeHtml(tense)}</td>
        <td class="px-4 py-3 font-bold text-accent" colspan="2">${escapeHtml(value)}</td>
      </tr>`);
    }
  }

  return `<div class="my-8 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
  <div class="bg-accent text-white px-6 py-4">
    <h4 class="text-xl font-bold font-header">${escapeHtml(verb)}</h4>
    <p class="text-white/80">${escapeHtml(meaning)}</p>
  </div>
  <table class="w-full">
    <tbody>
${rows.join('\n')}
    </tbody>
  </table>
</div>`;
}

/**
 * Convert <DefinitionBlock term="X" definition="Y" ... /> to styled HTML
 * Uses semantic <dl>/<dt>/<dd> with schema.org/DefinedTerm microdata
 */
function convertDefinitionBlock(tag, nativeLang = 'en') {
  const term = extractProp(tag, 'term') || '';
  const definition = extractProp(tag, 'definition') || '';
  const pronunciation = extractProp(tag, 'pronunciation');
  const partOfSpeech = extractProp(tag, 'partOfSpeech');
  const language = extractProp(tag, 'language');

  let html = `<div class="speakable-vocab my-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200" itemscope itemtype="https://schema.org/DefinedTerm">
  <dl>
    <dt class="flex items-center gap-3 mb-2">
      <span class="text-2xl font-bold text-purple-800 font-header" itemprop="name">${escapeHtml(term)}</span>`;

  if (partOfSpeech) {
    html += `
      <span class="text-xs font-medium text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">${escapeHtml(partOfSpeech)}</span>`;
  }

  html += `
    </dt>`;

  if (pronunciation) {
    html += `
    <p class="text-sm text-purple-600 mb-2">
      <code class="bg-white/50 px-2 py-0.5 rounded">${escapeHtml(pronunciation)}</code>
    </p>`;
  }

  html += `
    <dd class="text-gray-700 leading-relaxed" itemprop="description">
      ${escapeHtml(definition)}
    </dd>
  </dl>`;

  if (language) {
    html += `
  <meta itemprop="inDefinedTermSet" content="${escapeHtml(language)}" />`;
  }

  html += `\n</div>`;
  return html;
}

/**
 * Main conversion function: raw MDX content → clean HTML with rendered components
 *
 * @param {string} rawContent - Raw MDX content (may include frontmatter, imports, components)
 * @param {string} nativeLang - Native language code for translated labels (default: 'en')
 * @param {string|null} targetLang - Target language code for flags (default: null)
 * @returns {{ html: string, stats: object }} - Converted HTML and conversion stats
 */
export function convertMdxToHtml(rawContent, nativeLang = 'en', targetLang = null) {
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
      return convertCultureTip(`<CultureTip${attrs}>`, inner, nativeLang, targetLang);
    }
  );

  // 3b. Convert self-closing CultureTip with content/tip prop: <CultureTip content='...' /> or <CultureTip tip='...' />
  content = content.replace(
    /<CultureTip([\s\S]*?)\/>/gi,
    (match, attrs) => {
      const tag = `<CultureTip${attrs}/>`;
      const contentProp = extractProp(tag, 'content') || extractProp(tag, 'tip') || extractProp(tag, 'description') || extractProp(tag, 'text');
      if (contentProp) {
        stats.cultureTips++;
        return convertCultureTip(`<CultureTip${attrs}>`, contentProp, nativeLang, targetLang);
      }
      // Self-closing with no content/tip prop — skip
      return match;
    }
  );

  // 4a-0a. Convert <PhrasePair source="..." target="..." /> → VocabCard HTML
  // MUST come before <Phrase> conversion since <PhrasePair> starts with "Phrase"
  content = content.replace(
    /<PhrasePair([\s\S]*?)\/>/gi,
    (match, attrs) => {
      const tag = `<PhrasePair${attrs}/>`;
      const word = extractProp(tag, 'target') || '';
      const translation = extractProp(tag, 'source') || '';
      stats.phrasePairs = (stats.phrasePairs || 0) + 1;
      return convertVocabCard(`<VocabCard word="${word}" translation="${translation}" />`, nativeLang);
    }
  );

  // 4a-0b. Convert <PhraseCard phrase="..." translation="..." context="..." /> → VocabCard HTML
  // MUST come before <Phrase> conversion since <PhraseCard> starts with "Phrase"
  content = content.replace(
    /<PhraseCard([\s\S]*?)\/>/gi,
    (match, attrs) => {
      const tag = `<PhraseCard${attrs}/>`;
      const word = extractProp(tag, 'phrase') || '';
      const translation = extractProp(tag, 'translation') || '';
      const pronunciation = extractProp(tag, 'pronunciation') || '';
      const example = extractProp(tag, 'context') || extractProp(tag, 'example') || '';
      stats.phraseCards = (stats.phraseCards || 0) + 1;
      const parts = [`word="${word}"`, `translation="${translation}"`];
      if (pronunciation) parts.push(`pronunciation="${pronunciation}"`);
      if (example) parts.push(`example="${example}"`);
      return convertVocabCard(`<VocabCard ${parts.join(' ')} />`, nativeLang);
    }
  );

  // 4a-i. Strip <PhraseList> wrapper tags (keep contents)
  content = content.replace(/<\/?PhraseList>/gi, '');

  // 4a-ii. Convert <Phrase>...</Phrase> with children (non-standard AI-generated tags)
  // Negative lookahead prevents matching <PhraseOfDay>, <PhraseCard>, <PhrasePair>
  content = content.replace(
    /<Phrase(?!OfDay|Card|Pair)([\s\S]*?)>([\s\S]*?)<\/Phrase>/gi,
    (match) => {
      stats.phrases = (stats.phrases || 0) + 1;
      return convertPhrase(match, nativeLang);
    }
  );

  // 4a-iii. Convert self-closing <Phrase native="..." target="..." phonetic="..." />
  // Negative lookahead prevents matching <PhraseOfDay>, <PhraseCard>, <PhrasePair>
  content = content.replace(
    /<Phrase(?!OfDay|Card|Pair)([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.phrases = (stats.phrases || 0) + 1;
      return convertPhraseSelfClosing(`<Phrase${attrs}/>`, nativeLang);
    }
  );

  // 4b. Convert <VocabCard>...</VocabCard> with children (non-standard: <Word>, <Translation>, etc.)
  content = content.replace(
    /<VocabCard>([\s\S]*?)<\/VocabCard>/gi,
    (match) => {
      stats.vocabCards++;
      return convertVocabCardWithChildren(match, nativeLang);
    }
  );

  // 4c. Convert VocabCard (self-closing)
  // Handles both single-line and multi-line: <VocabCard ... /> with attributes possibly on multiple lines
  content = content.replace(
    /<VocabCard([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.vocabCards++;
      return convertVocabCard(`<VocabCard${attrs}/>`, nativeLang);
    }
  );

  // 5. Convert PhraseOfDay (self-closing)
  content = content.replace(
    /<PhraseOfDay([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.phraseOfDay++;
      return convertPhraseOfDay(`<PhraseOfDay${attrs}/>`, nativeLang);
    }
  );

  // 6a. Convert ConjugationTable with children (non-standard: <Meaning>, <Present>, etc.)
  content = content.replace(
    /<ConjugationTable([^>]*)>([\s\S]*?)<\/ConjugationTable>/gi,
    (match) => {
      stats.conjugationTables++;
      return convertConjugationTableWithChildren(match);
    }
  );

  // 6b. Convert ConjugationTable (self-closing)
  content = content.replace(
    /<ConjugationTable([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.conjugationTables++;
      return convertConjugationTable(`<ConjugationTable${attrs}/>`);
    }
  );

  // 7. Convert <VocabCell ... /> and <KVocabCard ... /> → VocabCard HTML (identical props)
  content = content.replace(
    /<(?:VocabCell|KVocabCard)([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.vocabCards++;
      return convertVocabCard(`<VocabCard${attrs}/>`, nativeLang);
    }
  );

  // 7b. Convert DefinitionBlock (self-closing)
  content = content.replace(
    /<DefinitionBlock([\s\S]*?)\/>/gi,
    (match, attrs) => {
      stats.definitionBlocks = (stats.definitionBlocks || 0) + 1;
      return convertDefinitionBlock(`<DefinitionBlock${attrs}/>`, nativeLang);
    }
  );

  // 8. Strip CTA (ArticleLayout renders its own CTA)
  content = content.replace(/<CTA[\s\S]*?\/>/gi, () => {
    stats.ctaRemoved++;
    return '';
  });

  // 9. Run marked() on remaining markdown
  // HTML blocks (our converted components) pass through untouched
  let html;
  try {
    html = marked.parse(content);
  } catch (e) {
    // Fallback: return content as-is if marked fails
    html = content;
  }

  // 10. Clean up extra whitespace
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
