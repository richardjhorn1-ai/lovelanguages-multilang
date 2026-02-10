#!/usr/bin/env node
/**
 * Phase 1f: Final comprehensive fix for all remaining REAL issues.
 *
 * Handles ALL issue types in one pass:
 * - english_example: AI-translate English VocabCard examples to native language
 * - pronunciation_equals_word (>3 chars): AI-generate real pronunciation
 * - empty_component_props: AI-fill empty word/translation
 * - word_in_wrong_language: AI-correct word language
 * - translation_in_wrong_language: AI-correct translation language
 * - placeholder_pronunciation: AI-generate pronunciation
 * - placeholder_text (XXX): mechanical delete
 * - english_prose_markers: mechanical regex replace
 *
 * Usage:
 *   node blog/scripts/fix-final.mjs --dry-run
 *   node blog/scripts/fix-final.mjs --limit 5
 *   node blog/scripts/fix-final.mjs
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
let LIMIT = null, DRY_RUN = false, CONCURRENCY = 3, MODEL_NAME = 'gemini-3-flash-preview';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const regex = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`);
  const match = tag.match(regex);
  return match ? match[1] : null;
}

const ENGLISH_FUNCTION_WORDS = new Set([
  'the', 'is', 'are', 'and', 'or', 'but', 'this', 'that', 'with', 'from',
  'have', 'has', 'would', 'could', 'they', 'their', 'you', 'your', 'we',
  'a', 'an', 'in', 'on', 'to', 'for', 'of', 'it', 'was', 'were', 'be',
  'been', 'being', 'do', 'does', 'did', 'will', 'shall', 'can', 'may',
  'not', 'so', 'if', 'at', 'by', 'as', 'up', 'no', 'all', 'about',
  'my', 'me', 'i', 'he', 'she', 'his', 'her',
]);

function looksEnglish(text) {
  if (!text) return false;
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

const CYRILLIC_RE = /[\u0400-\u04FF]/g;
const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/g;
const LATIN_RE = /[a-zA-Z\u00C0-\u00FF\u0100-\u017E\u0141\u0142\u0143\u0144\u015A\u015B\u0179\u017A\u017B\u017C\u0106\u0107\u0118\u0119\u0104\u0105\u00D3\u00F3]/g;
const CYRILLIC_LANGS = new Set(['ru', 'uk']);
const GREEK_LANGS = new Set(['el']);

function isCyrillic(text) {
  if (!text || text.length < 2) return false;
  const cyrillic = (text.match(CYRILLIC_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  const total = cyrillic + latin;
  return total > 0 && cyrillic / total > 0.5;
}

function isGreek(text) {
  if (!text || text.length < 2) return false;
  const greek = (text.match(GREEK_RE) || []).length;
  const latin = (text.match(LATIN_RE) || []).length;
  const total = greek + latin;
  return total > 0 && greek / total > 0.5;
}

// ─── Issue Detection ─────────────────────────────────────────────────────────

function findAllIssues(article) {
  const content = article.content || '';
  const nl = article.native_lang;
  const tl = article.target_lang;
  const vocabIssues = [];  // Need AI
  const mechFixes = [];    // Mechanical

  // ── VocabCard Issues ──
  const vocabMatches = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  for (const tag of vocabMatches) {
    const word = extractProp(tag, 'word') || extractProp(tag, 'polish') || '';
    const translation = extractProp(tag, 'translation') || extractProp(tag, 'english') || '';
    const pronunciation = extractProp(tag, 'pronunciation') || '';
    const example = extractProp(tag, 'example') || '';

    // English example in non-English article
    if (nl !== 'en' && tl !== 'en' && example && looksEnglish(example)) {
      vocabIssues.push({ type: 'english_example', word, example, tag });
    }

    // Pronunciation equals word (only > 3 chars)
    if (pronunciation && word && word.length > 3) {
      const pronLower = pronunciation.trim().toLowerCase();
      const wordLower = word.trim().toLowerCase();
      const pronStripped = pronLower.replace(/^[\/\[\(]|[\/\]\)]$/g, '').trim();
      if (pronLower === wordLower || pronStripped === wordLower) {
        vocabIssues.push({ type: 'bad_pronunciation', word, currentPronunciation: pronunciation, tag });
      }
    }

    // Empty or whitespace-only pronunciation (placeholder)
    if (/pronunciation\s*=\s*["']\s*["']/.test(tag) && word) {
      vocabIssues.push({ type: 'empty_pronunciation', word, tag });
    }

    // Empty word
    if ((!word || word.trim() === '') && (translation && translation.trim().length > 0)) {
      vocabIssues.push({ type: 'empty_word', translation, tag });
    }

    // Empty translation
    if (word && word.trim().length > 0 && (!translation || translation.trim() === '')) {
      vocabIssues.push({ type: 'empty_translation', word, tag });
    }

    // Word in wrong language (Cyrillic/Greek word in wrong target, or Latin in Cyrillic/Greek target)
    if (word.length >= 2) {
      if (!CYRILLIC_LANGS.has(tl) && !GREEK_LANGS.has(tl) && isCyrillic(word)) {
        vocabIssues.push({ type: 'wrong_lang_word', word, translation, tag });
      }
      if (!GREEK_LANGS.has(tl) && !CYRILLIC_LANGS.has(tl) && isGreek(word)) {
        vocabIssues.push({ type: 'wrong_lang_word', word, translation, tag });
      }
    }

    // Translation in wrong language
    if (translation.length >= 2) {
      if (CYRILLIC_LANGS.has(nl) && !isCyrillic(translation) && translation.length > 3 && looksEnglish(translation)) {
        vocabIssues.push({ type: 'wrong_lang_translation', word, translation, tag });
      } else if (!CYRILLIC_LANGS.has(nl) && isCyrillic(translation)) {
        vocabIssues.push({ type: 'wrong_lang_translation', word, translation, tag });
      }
    }
  }

  // ── Mechanical: Placeholder XXX ──
  if (content.includes('XXX')) {
    mechFixes.push({ type: 'placeholder_xxx' });
  }

  // ── Mechanical: English prose markers in non-English articles ──
  if (nl !== 'en' && tl !== 'en') {
    // "in conclusion" translations
    if (/\bin conclusion\b/i.test(content)) {
      const conclusionMap = {
        it: 'in conclusione', fr: 'en conclusion', es: 'en conclusión',
        de: 'zusammenfassend', pt: 'em conclusão', pl: 'podsumowując',
        nl: 'tot slot', ro: 'în concluzie', sv: 'sammanfattningsvis',
        no: 'avslutningsvis', da: 'afslutningsvis', cs: 'závěrem',
        el: 'εν κατακλείδι', hu: 'összefoglalva', tr: 'sonuç olarak',
        ru: 'в заключение', uk: 'на завершення',
      };
      if (conclusionMap[nl]) {
        mechFixes.push({ type: 'english_prose', pattern: 'in conclusion', replacement: conclusionMap[nl] });
      }
    }
    // "note:" translations
    if (/\bnote:/i.test(content)) {
      const noteMap = {
        it: 'nota:', fr: 'remarque :', es: 'nota:', de: 'Hinweis:',
        pt: 'nota:', pl: 'uwaga:', nl: 'opmerking:', ro: 'notă:',
        sv: 'obs:', no: 'merk:', da: 'bemærk:', cs: 'poznámka:',
        el: 'σημείωση:', hu: 'megjegyzés:', tr: 'not:', ru: 'примечание:', uk: 'примітка:',
      };
      if (noteMap[nl]) {
        mechFixes.push({ type: 'english_prose', pattern: 'note:', replacement: noteMap[nl] });
      }
    }
  }

  return { vocabIssues, mechFixes };
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

  let prompt = `You are fixing vocabulary flashcards in a language-learning article for ${nativeName} speakers learning ${targetName}.

Fix each item below. Return ONLY a JSON array with one object per item, in the same order.

`;

  const items = [];
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    switch (issue.type) {
      case 'english_example':
        items.push(`${i + 1}. TRANSLATE EXAMPLE: word="${issue.word}" — the example "${issue.example}" is in English. Translate it to ${nativeName} (the reader's native language).`);
        break;
      case 'bad_pronunciation':
        items.push(`${i + 1}. FIX PRONUNCIATION: word="${issue.word}" — current pronunciation "${issue.currentPronunciation}" is just the word copied. Provide a phonetic pronunciation guide that a ${nativeName} speaker can read to approximate the ${targetName} pronunciation.`);
        break;
      case 'empty_pronunciation':
        items.push(`${i + 1}. ADD PRONUNCIATION: word="${issue.word}" in ${targetName} — provide a phonetic pronunciation guide for a ${nativeName} speaker.`);
        break;
      case 'empty_word':
        items.push(`${i + 1}. ADD WORD: translation="${issue.translation}" in ${nativeName} — provide the ${targetName} word.`);
        break;
      case 'empty_translation':
        items.push(`${i + 1}. ADD TRANSLATION: word="${issue.word}" in ${targetName} — provide the ${nativeName} translation.`);
        break;
      case 'wrong_lang_word':
        items.push(`${i + 1}. FIX WORD LANGUAGE: word="${issue.word}" translation="${issue.translation}" — the word should be in ${targetName} but appears to be in the wrong language/script. Provide the correct ${targetName} word.`);
        break;
      case 'wrong_lang_translation':
        items.push(`${i + 1}. FIX TRANSLATION LANGUAGE: word="${issue.word}" translation="${issue.translation}" — the translation should be in ${nativeName} but appears to be in the wrong language/script. Provide the correct ${nativeName} translation.`);
        break;
    }
  }

  prompt += items.join('\n');

  prompt += `

Respond with a JSON array. Each object must have:
- "index": the item number (1-based)
- "type": the issue type
- "fix": the corrected value

Example: [{"index": 1, "type": "english_example", "fix": "Je suis content avec toi"}]`;

  return prompt;
}

// ─── Stitching ───────────────────────────────────────────────────────────────

function applyVocabFixes(content, issues, fixes) {
  let result = content;
  let applied = 0;

  for (const fix of fixes) {
    const idx = fix.index - 1;
    if (idx < 0 || idx >= issues.length) continue;

    const issue = issues[idx];
    const fixValue = fix.fix;
    if (!fixValue || fixValue.trim() === '') continue;

    const oldTag = issue.tag;
    if (!result.includes(oldTag)) continue;

    let newTag = oldTag;

    switch (issue.type) {
      case 'english_example':
        newTag = oldTag.replace(/example\s*=\s*"[^"]*"/, `example="${fixValue}"`);
        break;
      case 'bad_pronunciation':
      case 'empty_pronunciation':
        if (/pronunciation\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/pronunciation\s*=\s*"[^"]*"/, `pronunciation="${fixValue}"`);
        } else {
          newTag = oldTag.replace(/\s*\/>/, ` pronunciation="${fixValue}" />`);
        }
        break;
      case 'empty_word':
        if (/word\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/word\s*=\s*"[^"]*"/, `word="${fixValue}"`);
        } else {
          newTag = oldTag.replace(/\s*\/>/, ` word="${fixValue}" />`);
        }
        break;
      case 'empty_translation':
        if (/translation\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/translation\s*=\s*"[^"]*"/, `translation="${fixValue}"`);
        } else if (/english\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/english\s*=\s*"[^"]*"/, `english="${fixValue}"`);
        } else {
          newTag = oldTag.replace(/\s*\/>/, ` translation="${fixValue}" />`);
        }
        break;
      case 'wrong_lang_word':
        newTag = oldTag.replace(/word\s*=\s*"[^"]*"/, `word="${fixValue}"`);
        break;
      case 'wrong_lang_translation':
        if (/translation\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/translation\s*=\s*"[^"]*"/, `translation="${fixValue}"`);
        } else if (/english\s*=/.test(oldTag)) {
          newTag = oldTag.replace(/english\s*=\s*"[^"]*"/, `english="${fixValue}"`);
        }
        break;
    }

    if (newTag !== oldTag) {
      result = result.replace(oldTag, newTag);
      applied++;
    }
  }

  return { content: result, applied };
}

function applyMechFixes(content, mechFixes) {
  let result = content;
  let applied = 0;

  for (const fix of mechFixes) {
    if (fix.type === 'placeholder_xxx') {
      const before = result;
      result = result.replace(/XXX/g, '');
      if (result !== before) applied++;
    } else if (fix.type === 'english_prose') {
      // Use \b at start; at end, only use \b if pattern ends with a word char
      const endsWithWord = /\w$/.test(fix.pattern);
      const re = new RegExp(`\\b${fix.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${endsWithWord ? '\\b' : ''}`, 'gi');
      const before = result;
      result = result.replace(re, fix.replacement);
      if (result !== before) applied++;
    }
  }

  return { content: result, applied };
}

// ─── Progress ────────────────────────────────────────────────────────────────

const PROGRESS_FILE = path.join(__dirname, 'data/ai-fix-progress-1h.json');

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
const alreadyDone = new Set(progress.applied);

// Find all articles with issues
const articlesWithIssues = [];
const typeCounts = {};

for (const a of articles) {
  if (alreadyDone.has(a.id)) continue;
  if (progress.failed[a.id]) continue;
  const { vocabIssues, mechFixes } = findAllIssues(a);
  if (vocabIssues.length > 0 || mechFixes.length > 0) {
    articlesWithIssues.push({ article: a, vocabIssues, mechFixes });
    for (const i of vocabIssues) typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
    for (const f of mechFixes) typeCounts[f.type] = (typeCounts[f.type] || 0) + 1;
  }
}

const totalIssues = articlesWithIssues.reduce((s, a) => s + a.vocabIssues.length + a.mechFixes.length, 0);
console.log(`Found ${articlesWithIssues.length} articles with ${totalIssues} issues`);
console.log(`  Already done: ${progress.applied.length}, Failed: ${Object.keys(progress.failed).length}`);
console.log('  By type:');
for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${type}: ${count}`);
}
if (DRY_RUN) console.log('(DRY RUN)');

const toProcess = LIMIT ? articlesWithIssues.slice(0, LIMIT) : articlesWithIssues;

let totalApplied = 0, totalFailed = 0, totalMech = 0;

async function processArticle({ article, vocabIssues, mechFixes }, idx) {
  const label = `[${idx + 1}/${toProcess.length}] ${article.id.slice(0, 8)} ${article.native_lang}\u2192${article.target_lang}`;
  const issueTypes = [...new Set([...vocabIssues.map(i => i.type), ...mechFixes.map(f => f.type)])].join('+');

  if (DRY_RUN) {
    console.log(`  ${label}: ${vocabIssues.length + mechFixes.length} issues (${issueTypes})`);
    return;
  }

  try {
    let content = article.content;
    let totalFixed = 0;

    // 1. Apply mechanical fixes first
    if (mechFixes.length > 0) {
      const { content: mechContent, applied: mechApplied } = applyMechFixes(content, mechFixes);
      content = mechContent;
      totalFixed += mechApplied;
      totalMech += mechApplied;
    }

    // 2. Apply AI fixes for VocabCard issues
    if (vocabIssues.length > 0) {
      const prompt = buildPrompt(article, vocabIssues);
      const response = await callGemini(prompt);
      const fixes = parseGeminiJson(response);
      const { content: fixedContent, applied } = applyVocabFixes(content, vocabIssues, fixes);
      content = fixedContent;
      totalFixed += applied;
    }

    if (totalFixed === 0 && content === article.content) {
      console.log(`  ${label}: 0 fixes applied`);
      progress.failed[article.id] = 'no fixes applied';
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
      console.log(`  ${label}: ${totalFixed} fixed (${issueTypes})`);
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

console.log(`\nDone. Applied: ${totalApplied}, Failed: ${totalFailed}, Mechanical: ${totalMech}`);
