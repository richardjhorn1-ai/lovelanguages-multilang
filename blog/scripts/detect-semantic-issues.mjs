#!/usr/bin/env node
/**
 * detect-semantic-issues.mjs — Comprehensive semantic issue detection for blog articles.
 *
 * Scans all 13,000+ articles mechanically (zero AI cost) to find:
 *   - Apology template recycling (wrong VocabCards for the topic)
 *   - Pronunciation mismatches and copies
 *   - Missing diacriticals, wrong-language examples
 *   - Thin content, boilerplate text, title-content mismatches
 *   - IPA remnants, truncated props, legacy issues
 *
 * Usage:
 *   node blog/scripts/detect-semantic-issues.mjs
 *   node blog/scripts/detect-semantic-issues.mjs --native_lang cs
 *   node blog/scripts/detect-semantic-issues.mjs --limit 100
 *   node blog/scripts/detect-semantic-issues.mjs --detectors pronunciationMismatch,missingDiacriticals
 *   node blog/scripts/detect-semantic-issues.mjs --verbose
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── CLI Args ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
let NATIVE_LANG = null, TARGET_LANG = null, CATEGORY = null, LIMIT = null;
let DETECTORS = null, VERBOSE = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--native_lang': NATIVE_LANG = args[++i]; break;
    case '--target_lang': TARGET_LANG = args[++i]; break;
    case '--category': CATEGORY = args[++i]; break;
    case '--limit': LIMIT = parseInt(args[++i], 10); break;
    case '--detectors': DETECTORS = new Set(args[++i].split(',')); break;
    case '--verbose': VERBOSE = true; break;
  }
}

// ─── Language Data ───────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── Apology Word Lists (all 18 languages) ──────────────────────────────────

const APOLOGY_WORDS = {
  en: ['sorry', 'apologize', 'apology', 'forgive', 'forgiveness', 'fault', 'blame', 'regret', 'excuse me', 'my bad', 'pardon'],
  es: ['perdón', 'perdóname', 'lo siento', 'culpa', 'disculpa', 'disculpame', 'perdonar', 'arrepiento', 'disculpe', 'lamento', 'excusa'],
  fr: ['pardon', 'désolé', 'désolée', 'excuse', 'excusez', 'excuses', 'faute', 'pardonne', 'pardonnez', 'regret', 'regrette'],
  de: ['entschuldigung', 'entschuldige', 'verzeih', 'verzeihung', 'verzeihe', 'schuld', 'es tut mir leid', 'tut mir leid', 'bedaure', 'entschuldigen'],
  it: ['scusa', 'scusami', 'perdonami', 'perdono', 'colpa', 'mi dispiace', 'dispiaciuto', 'perdonare', 'scusate'],
  pt: ['desculpa', 'desculpe', 'perdão', 'perdoa', 'culpa', 'sinto muito', 'lamento', 'perdoar', 'desculpar'],
  pl: ['przepraszam', 'przeproś', 'wybacz', 'wybaczenie', 'wina', 'przebacz', 'żałuję', 'przeprosiny', 'wybaczysz'],
  nl: ['sorry', 'excuus', 'excuses', 'vergeven', 'vergeef', 'schuld', 'spijt', 'pardon', 'verontschuldiging'],
  ro: ['scuze', 'iartă', 'iertare', 'vină', 'îmi pare rău', 'regret', 'scuzați', 'iertați', 'pardon'],
  ru: ['извини', 'извините', 'прости', 'простите', 'виноват', 'виновата', 'сожалею', 'прощение', 'извинение', 'прошу прощения'],
  uk: ['вибач', 'вибачте', 'пробач', 'пробачте', 'вина', 'шкодую', 'перепрошую', 'вибачення', 'прощення'],
  tr: ['özür', 'affet', 'kusura bakma', 'suç', 'pişman', 'bağışla', 'özür dilerim', 'pardon', 'affedersin'],
  sv: ['förlåt', 'ursäkta', 'förlåtelse', 'skuld', 'ångrar', 'ledsen', 'ber om ursäkt', 'förlåta'],
  no: ['unnskyld', 'tilgi', 'beklager', 'skyld', 'angrer', 'lei', 'tilgivelse', 'unnskyldning'],
  da: ['undskyld', 'tilgiv', 'beklager', 'skyld', 'fortryder', 'ked af det', 'tilgivelse', 'undskyldning'],
  cs: ['promiň', 'promiňte', 'omlouvám', 'odpusť', 'odpuštění', 'vina', 'lituji', 'omluva', 'pardon', 'promiňte'],
  el: ['συγγνώμη', 'συγχώρεσε', 'λυπάμαι', 'φταίω', 'σφάλμα', 'μετανιώνω', 'συγχώρεση', 'παρδόν'],
  hu: ['bocsánat', 'elnézést', 'megbocsát', 'hiba', 'sajnálom', 'megbocsátás', 'bűn', 'bocsáss meg'],
};

// Title keywords that indicate the article IS about apologies (don't flag these)
const APOLOGY_TITLE_KEYWORDS = [
  'apolog', 'sorry', 'forgiv', 'forgive', 'entschuldig', 'omlouv', 'promiň', 'przepras',
  'perdón', 'perdon', 'perdão', 'desculp', 'pardon', 'désolé', 'scusa', 'disculp',
  'извин', 'прост', 'özür', 'unnskyld', 'undskyld', 'förlåt', 'bocsánat',
  'elnézés', 'scuze', 'iart', 'vybač', 'vergev', 'συγγνώμη', 'λυπ',
  'saying sorry', 'make up', 'making up', 'reconcil', 'примир', 'versöhn',
  'excus', 'excuser', 's\'excus',
  // Forgiveness in various languages
  'vergeb', 'vergebung', 'vergev', 'vergeving',
  'megbocsát', 'bocsáss',
  'iert', 'iertare',
  'odpuštění', 'odpustit', 'odpouštění',
  'przebacz', 'przebaczenie',
  'perdona', 'perdonar',
  'tilgi', 'tilgivelse',
  'förlåtelse',
  'прощен', 'прощал',
  'συγχώρ',
  'affetme', 'bağışla',
  // Reconciliation in various languages
  'smíření', 'pojednání', 'pogodzenie', 'riconciliazione', 'reconciliação',
  'reconciliación', 'réconcili', 'verzoening', 'forsoning', 'kibékül',
  'uzlaşma', 'примирен',
  // "After a fight" or "making amends"
  'svarky', 'svarce', 'hádky', 'kłótni', 'fight', 'streit', 'dispute',
  'pelea', 'briga', 'litigio', 'kavga',
];

// ─── Function Word Sets (for language detection) ─────────────────────────────

const FUNCTION_WORDS = {
  en: new Set(['the', 'is', 'are', 'and', 'or', 'but', 'this', 'that', 'with', 'from', 'have', 'has', 'would', 'could', 'they', 'their', 'you', 'your', 'we', 'a', 'an', 'in', 'on', 'to', 'for', 'of', 'it', 'was', 'were', 'be', 'not', 'so', 'if', 'at', 'by', 'as', 'up', 'no', 'all', 'about', 'when', 'how', 'what', 'which', 'who', 'will', 'can', 'do', 'does', 'did', 'use', 'say']),
  es: new Set(['el', 'la', 'los', 'las', 'de', 'del', 'en', 'con', 'por', 'para', 'que', 'un', 'una', 'es', 'son', 'este', 'esta', 'como', 'más', 'pero', 'se', 'su', 'al', 'lo', 'ya', 'le', 'muy', 'tu', 'mi', 'nos']),
  fr: new Set(['le', 'la', 'les', 'de', 'des', 'du', 'en', 'un', 'une', 'est', 'que', 'dans', 'pour', 'avec', 'sur', 'qui', 'ce', 'cette', 'sont', 'pas', 'plus', 'se', 'ne', 'au', 'aux', 'vous', 'nous', 'je', 'il', 'elle', 'mon', 'ton', 'son', 'mes', 'tes', 'ses']),
  de: new Set(['der', 'die', 'das', 'den', 'dem', 'ein', 'eine', 'und', 'ist', 'mit', 'auf', 'für', 'von', 'nicht', 'sich', 'auch', 'noch', 'wie', 'aber', 'oder', 'wenn', 'sie', 'wir', 'ihr', 'ich', 'du', 'er', 'es', 'zu', 'des', 'im', 'am', 'an']),
  it: new Set(['il', 'la', 'le', 'lo', 'gli', 'di', 'del', 'della', 'dei', 'che', 'con', 'per', 'un', 'una', 'è', 'sono', 'come', 'più', 'ma', 'se', 'si', 'non', 'al', 'nel', 'dal', 'questo', 'questa', 'suo', 'sua']),
  pt: new Set(['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'com', 'para', 'por', 'que', 'se', 'mais', 'mas', 'como', 'ou', 'ao', 'seu', 'sua', 'este', 'esta', 'muito']),
  pl: new Set(['się', 'nie', 'jest', 'na', 'do', 'że', 'jak', 'ale', 'czy', 'to', 'co', 'tak', 'za', 'już', 'od', 'po', 'ich', 'tylko', 'gdy', 'też', 'może', 'przez', 'ten', 'ta', 'te', 'aby', 'lub']),
  nl: new Set(['de', 'het', 'een', 'van', 'en', 'in', 'dat', 'met', 'voor', 'op', 'is', 'zijn', 'niet', 'aan', 'er', 'ook', 'om', 'dan', 'maar', 'bij', 'nog', 'wat', 'dit', 'die', 'ze', 'je', 'we', 'hij']),
  ro: new Set(['și', 'în', 'la', 'cu', 'pe', 'este', 'pentru', 'din', 'care', 'un', 'o', 'mai', 'dar', 'sau', 'nu', 'ca', 'de', 'ce', 'sunt', 'acest', 'această', 'al', 'ei', 'lui', 'lor', 'foarte']),
  ru: new Set(['и', 'в', 'на', 'не', 'что', 'он', 'она', 'это', 'как', 'но', 'из', 'за', 'то', 'все', 'его', 'её', 'для', 'от', 'по', 'так', 'уже', 'или', 'мы', 'вы', 'они', 'вас', 'нас', 'мой', 'твой']),
  uk: new Set(['і', 'в', 'на', 'не', 'що', 'він', 'вона', 'це', 'як', 'але', 'із', 'за', 'то', 'все', 'його', 'її', 'для', 'від', 'по', 'так', 'вже', 'або', 'ми', 'ви', 'вони', 'мій', 'твій']),
  tr: new Set(['bir', 've', 'bu', 'için', 'ile', 'olan', 'gibi', 'daha', 'çok', 'var', 'de', 'da', 'ben', 'sen', 'biz', 'siz', 'ama', 'ya', 'hem', 'ne', 'her', 'kadar', 'ise']),
  sv: new Set(['och', 'att', 'det', 'för', 'med', 'som', 'den', 'har', 'kan', 'är', 'inte', 'ett', 'en', 'av', 'till', 'om', 'på', 'vi', 'du', 'jag', 'han', 'hon', 'var', 'men', 'från']),
  no: new Set(['og', 'det', 'som', 'for', 'med', 'har', 'den', 'til', 'kan', 'er', 'ikke', 'et', 'en', 'av', 'om', 'på', 'vi', 'du', 'jeg', 'han', 'hun', 'var', 'men', 'fra', 'vil']),
  da: new Set(['og', 'det', 'som', 'for', 'med', 'har', 'den', 'til', 'kan', 'er', 'ikke', 'et', 'en', 'af', 'om', 'på', 'vi', 'du', 'jeg', 'han', 'hun', 'var', 'men', 'fra', 'vil']),
  cs: new Set(['je', 'se', 'na', 'že', 'to', 'pro', 'ale', 'jako', 'jsou', 'si', 'být', 'není', 'tak', 'od', 'do', 'po', 've', 'za', 'co', 'jak', 'i', 'nebo', 'by', 'ten', 'ta', 'ty', 'jeho', 'její']),
  el: new Set(['και', 'το', 'τα', 'η', 'ο', 'οι', 'να', 'με', 'σε', 'για', 'από', 'είναι', 'αυτό', 'δεν', 'θα', 'ένα', 'μια', 'που', 'στο', 'στη', 'στα', 'του', 'της', 'μου', 'σου']),
  hu: new Set(['az', 'a', 'és', 'hogy', 'nem', 'egy', 'van', 'meg', 'ezt', 'mint', 'is', 'de', 'ez', 'már', 'csak', 'még', 'vagy', 'volt', 'fel', 'ki', 'el', 'be', 'ami', 'aki']),
};

// ─── Diacritical Character Sets ──────────────────────────────────────────────

const DIACRITICAL_CHARS = {
  fr: /[àâäéèêëïîôùûüÿçœæ]/i,
  pt: /[àáâãçéêíóôõúü]/i,
  es: /[áéíóúüñ¿¡]/i,
  cs: /[áčďéěíňóřšťúůýž]/i,
  pl: /[ąćęłńóśźż]/i,
  tr: /[çğışöü]/i,
  ro: /[ăâîșț]/i,
  hu: /[áéíóöőúüű]/i,
  de: /[äöüß]/i,
  sv: /[åäö]/i,
  no: /[åæø]/i,
  da: /[åæø]/i,
};

// Languages that require diacriticals in normal text
const DIACRITICAL_LANGUAGES = new Set(Object.keys(DIACRITICAL_CHARS));

// ─── IPA Detection ───────────────────────────────────────────────────────────

const IPA_CHARS = /[ʒʃθðŋɲɛɔəæɑɪʊɐɒʌɜɹɾɻʂʐɕʑɡɫɬɮʔçʁħʕβɸɣχˈˌː]/;

// ─── Prop Extraction ─────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  // Try double quotes first
  const dq = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`, 's');
  const dm = tag.match(dq);
  if (dm) return dm[1];
  // Try single quotes
  const sq = new RegExp(`${propName}\\s*=\\s*'([^']*)'`, 's');
  const sm = tag.match(sq);
  return sm ? sm[1] : null;
}

function extractAllVocabCards(content) {
  if (!content) return [];
  const tags = content.match(/<VocabCard[\s\S]*?\/>/gi) || [];
  return tags.map(tag => ({
    tag,
    word: extractProp(tag, 'word') || extractProp(tag, 'polish') || '',
    translation: extractProp(tag, 'translation') || extractProp(tag, 'english') || '',
    pronunciation: extractProp(tag, 'pronunciation') || '',
    example: extractProp(tag, 'example') || '',
  }));
}

function extractPhraseOfDay(content) {
  if (!content) return [];
  const tags = content.match(/<PhraseOfDay[\s\S]*?\/>/gi) || [];
  return tags.map(tag => ({
    tag,
    word: extractProp(tag, 'word') || extractProp(tag, 'phrase') || extractProp(tag, 'polish') || '',
    translation: extractProp(tag, 'translation') || extractProp(tag, 'english') || '',
    pronunciation: extractProp(tag, 'pronunciation') || '',
    context: extractProp(tag, 'context') || '',
  }));
}

function stripComponentsAndFrontmatter(content) {
  if (!content) return '';
  return content
    .replace(/^---[\s\S]*?---/m, '')
    .replace(/^import\s+.*$/gm, '')
    .replace(/<CultureTip[^>]*>[\s\S]*?<\/CultureTip>/gi, '')
    .replace(/<(?:VocabCard|PhraseOfDay|ConjugationTable|CultureTip|CTA)[\s\S]*?\/>/gi, '')
    .trim();
}

function countProseWords(content) {
  const prose = stripComponentsAndFrontmatter(content);
  return prose.split(/\s+/).filter(w => w.length > 0).length;
}

// ─── Score text against a language's function words ──────────────────────────

function scoreFunctionWords(text, langCode) {
  const words = FUNCTION_WORDS[langCode];
  if (!words) return 0;
  const tokens = text.toLowerCase().split(/[\s,.!?;:'"()\[\]{}]+/).filter(w => w.length > 0);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) {
    if (words.has(t)) hits++;
  }
  return hits / tokens.length;
}

// ─── Detectors ───────────────────────────────────────────────────────────────

/**
 * Detector 0: Apology Template Bug (CRITICAL)
 * Articles generated from apology template but about a different topic.
 */
function detectApologyTemplateBug(article, vocabCards, phrases) {
  const issues = [];
  const tl = article.target_lang;
  const title = (article.title || '').toLowerCase();

  // Check if title indicates this IS an apology article
  for (const kw of APOLOGY_TITLE_KEYWORDS) {
    if (title.includes(kw)) return issues; // It's supposed to be about apologies
  }

  // Get apology words for the target language
  const apologyWords = APOLOGY_WORDS[tl] || [];
  if (apologyWords.length === 0) return issues;

  // Count VocabCards containing apology words
  let apologyCardCount = 0;
  const apologyEvidence = [];

  for (const vc of vocabCards) {
    const wordLower = vc.word.toLowerCase();
    const transLower = vc.translation.toLowerCase();
    const exampleLower = vc.example.toLowerCase();
    let isApology = false;

    for (const aw of apologyWords) {
      if (wordLower.includes(aw) || transLower.includes(aw) || exampleLower.includes(aw)) {
        isApology = true;
        break;
      }
    }

    // Also check native language apology words
    const nlApology = APOLOGY_WORDS[article.native_lang] || [];
    if (!isApology) {
      for (const aw of nlApology) {
        if (transLower.includes(aw) || exampleLower.includes(aw)) {
          isApology = true;
          break;
        }
      }
    }

    if (isApology) {
      apologyCardCount++;
      apologyEvidence.push({ word: vc.word, translation: vc.translation });
    }
  }

  // Also check PhraseOfDay
  let phraseIsApology = false;
  for (const ph of phrases) {
    const wordLower = ph.word.toLowerCase();
    for (const aw of apologyWords) {
      if (wordLower.includes(aw)) { phraseIsApology = true; break; }
    }
    if (!phraseIsApology) {
      const nlApology = APOLOGY_WORDS[article.native_lang] || [];
      for (const aw of nlApology) {
        if (ph.translation.toLowerCase().includes(aw)) { phraseIsApology = true; break; }
      }
    }
  }

  // Check boilerplate patterns from the apology template
  const content = article.content || '';
  const hasBoilerplate =
    /essential for make\b/i.test(content) ||
    /essential for apologize/i.test(content) ||
    /is the most important phrase to know\.\s*Use it whenever/i.test(content);

  // For articles with many VocabCards, require a higher ratio to avoid FP
  // (politeness phrases like "pardon" can appear naturally)
  const apologyRatio = vocabCards.length > 0 ? apologyCardCount / vocabCards.length : 0;
  const isHighRatio = apologyRatio >= 0.4;
  const isHighCount = apologyCardCount >= 3;

  if (isHighCount && (isHighRatio || apologyCardCount >= 5)) {
    issues.push({
      detector: 'apologyTemplateBug',
      severity: 'critical',
      description: `${apologyCardCount} of ${vocabCards.length} VocabCards (${Math.round(apologyRatio * 100)}%) contain apology words but title is about "${article.title}"`,
      evidence: {
        apologyCardCount,
        totalCards: vocabCards.length,
        apologyRatio: apologyRatio.toFixed(2),
        phraseIsApology,
        hasBoilerplate,
        samples: apologyEvidence.slice(0, 5),
      },
    });
  } else if (apologyCardCount >= 2 && (phraseIsApology || hasBoilerplate)) {
    issues.push({
      detector: 'apologyTemplateBug',
      severity: 'critical',
      description: `${apologyCardCount} apology VocabCards + ${phraseIsApology ? 'apology PhraseOfDay' : 'boilerplate text'} in non-apology article`,
      evidence: {
        apologyCardCount,
        totalCards: vocabCards.length,
        phraseIsApology,
        hasBoilerplate,
        samples: apologyEvidence.slice(0, 5),
      },
    });
  } else if (hasBoilerplate) {
    issues.push({
      detector: 'apologyTemplateBug',
      severity: 'high',
      description: 'Contains apology template boilerplate text ("essential for make", etc.)',
      evidence: { hasBoilerplate: true, apologyCardCount },
    });
  }

  return issues;
}

/**
 * Detector 1: Pronunciation Mismatch (HIGH)
 * PhraseOfDay pronunciation belongs to a different word (apology-template symptom).
 */
function detectPronunciationMismatch(article, vocabCards, phrases) {
  const issues = [];

  for (const ph of phrases) {
    if (!ph.pronunciation || !ph.word) continue;
    const phPronLower = ph.pronunciation.toLowerCase().trim();
    if (phPronLower.length < 3) continue;

    for (const vc of vocabCards) {
      if (!vc.pronunciation) continue;
      const vcPronLower = vc.pronunciation.toLowerCase().trim();

      // If PhraseOfDay pronunciation matches a VocabCard's pronunciation
      // but the words are different → mismatch
      if (phPronLower === vcPronLower) {
        const phWordNorm = ph.word.toLowerCase().replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňý\u0400-\u04FF\u0370-\u03FF]/g, '');
        const vcWordNorm = vc.word.toLowerCase().replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňý\u0400-\u04FF\u0370-\u03FF]/g, '');

        if (phWordNorm !== vcWordNorm && phWordNorm.length > 2 && vcWordNorm.length > 2) {
          issues.push({
            detector: 'pronunciationMismatch',
            severity: 'high',
            description: `PhraseOfDay pronunciation '${ph.pronunciation}' matches VocabCard '${vc.word}' but PhraseOfDay word is '${ph.word}'`,
            evidence: {
              phraseWord: ph.word,
              phrasePron: ph.pronunciation,
              matchedVocabWord: vc.word,
            },
          });
          break; // One match is enough
        }
      }
    }
  }

  return issues;
}

/**
 * Detector 2: Copied Pronunciations (HIGH)
 * Same pronunciation string reused across 3+ different VocabCard words.
 */
function detectCopiedPronunciations(article, vocabCards) {
  const issues = [];
  const pronMap = new Map(); // pronunciation → [words]

  for (const vc of vocabCards) {
    if (!vc.pronunciation || vc.pronunciation.trim().length < 3) continue;
    const pron = vc.pronunciation.trim().toLowerCase();
    if (!pronMap.has(pron)) pronMap.set(pron, []);
    pronMap.get(pron).push(vc.word);
  }

  for (const [pron, words] of pronMap) {
    // Deduplicate words (same word with same pron is fine)
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    if (uniqueWords.length >= 3) {
      issues.push({
        detector: 'copiedPronunciations',
        severity: 'high',
        description: `Pronunciation '${pron}' reused for ${uniqueWords.length} different words`,
        evidence: { pronunciation: pron, words: uniqueWords },
      });
    }
  }

  return issues;
}

/**
 * Detector 3: Truncated Pronunciation (MEDIUM)
 * Pronunciation cut off mid-word.
 */
function detectTruncatedPronunciation(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];

  for (const comp of allComponents) {
    if (!comp.pronunciation || !comp.word) continue;
    const pron = comp.pronunciation.trim();
    const word = comp.word.trim();

    if (word.length < 10) continue; // Only check longer words

    // Pronunciation suspiciously short relative to word
    if (pron.length > 0 && pron.length < word.length * 0.3) {
      issues.push({
        detector: 'truncatedPronunciation',
        severity: 'medium',
        description: `Pronunciation '${pron}' seems truncated for word '${word}' (${pron.length} chars vs ${word.length} chars)`,
        evidence: { word, pronunciation: pron, ratio: (pron.length / word.length).toFixed(2) },
      });
    }

    // Pronunciation ends with single character after space (likely cut off)
    if (/\s\S$/.test(pron) && pron.length > 3) {
      const lastPart = pron.split(/\s/).pop();
      if (lastPart.length === 1) {
        issues.push({
          detector: 'truncatedPronunciation',
          severity: 'medium',
          description: `Pronunciation '${pron}' ends with single char '${lastPart}' — likely truncated`,
          evidence: { word, pronunciation: pron, lastPart },
        });
      }
    }
  }

  return issues;
}

/**
 * Detector 4: Fake Pronunciation (MEDIUM)
 * Pronunciation field contains native-language description instead of phonetics.
 */
function detectFakePronunciation(article, vocabCards, phrases) {
  const issues = [];
  const nl = article.native_lang;
  const allComponents = [...vocabCards, ...phrases];

  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    const pron = comp.pronunciation.trim();
    if (pron.length < 5) continue;

    // Real phonetics typically have hyphens and/or CAPS stress markers
    const hasHyphens = /-/.test(pron);
    const hasCaps = /[A-Z]{2,}/.test(pron);
    const hasPhoneticMarkers = hasHyphens || hasCaps;

    if (hasPhoneticMarkers) continue; // Looks like real phonetics

    // Score against native language function words
    const nativeScore = scoreFunctionWords(pron, nl);
    // Score against English function words (sometimes descriptions are in English)
    const enScore = scoreFunctionWords(pron, 'en');

    if (nativeScore > 0.3 || enScore > 0.3) {
      issues.push({
        detector: 'fakePronunciation',
        severity: 'medium',
        description: `Pronunciation '${pron}' looks like a ${nativeScore > enScore ? nl : 'en'} description, not phonetics`,
        evidence: {
          word: comp.word,
          pronunciation: pron,
          nativeScore: nativeScore.toFixed(2),
          enScore: enScore.toFixed(2),
        },
      });
    }
  }

  return issues;
}

/**
 * Detector 5: Missing Diacriticals (HIGH)
 * Words in accented languages written in plain ASCII.
 */
function detectMissingDiacriticals(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;

  // Check target language VocabCard words
  if (DIACRITICAL_LANGUAGES.has(tl) && vocabCards.length >= 3) {
    const charRegex = DIACRITICAL_CHARS[tl];
    let wordsWithDiacriticals = 0;
    let totalWords = 0;

    for (const vc of vocabCards) {
      if (vc.word.trim().length < 3) continue;
      totalWords++;
      if (charRegex.test(vc.word)) wordsWithDiacriticals++;
    }

    if (totalWords >= 3 && wordsWithDiacriticals / totalWords < 0.15) {
      issues.push({
        detector: 'missingDiacriticals',
        severity: 'high',
        description: `Only ${wordsWithDiacriticals}/${totalWords} VocabCard words have ${tl} diacriticals — likely plain ASCII`,
        evidence: {
          field: 'word',
          language: tl,
          withDiacriticals: wordsWithDiacriticals,
          totalChecked: totalWords,
          ratio: (wordsWithDiacriticals / totalWords).toFixed(2),
          sampleWords: vocabCards.slice(0, 4).map(v => v.word),
        },
      });
    }
  }

  // Check native language VocabCard translations
  if (DIACRITICAL_LANGUAGES.has(nl) && vocabCards.length >= 3) {
    const charRegex = DIACRITICAL_CHARS[nl];
    let transWithDiacriticals = 0;
    let totalTrans = 0;

    for (const vc of vocabCards) {
      if (vc.translation.trim().length < 3) continue;
      totalTrans++;
      if (charRegex.test(vc.translation)) transWithDiacriticals++;
    }

    if (totalTrans >= 3 && transWithDiacriticals / totalTrans < 0.15) {
      issues.push({
        detector: 'missingDiacriticals',
        severity: 'high',
        description: `Only ${transWithDiacriticals}/${totalTrans} VocabCard translations have ${nl} diacriticals — likely plain ASCII`,
        evidence: {
          field: 'translation',
          language: nl,
          withDiacriticals: transWithDiacriticals,
          totalChecked: totalTrans,
          ratio: (transWithDiacriticals / totalTrans).toFixed(2),
          sampleTranslations: vocabCards.slice(0, 4).map(v => v.translation),
        },
      });
    }
  }

  return issues;
}

/**
 * Detector 6: Wrong Language Example (HIGH)
 * VocabCard example sentences in native language instead of target language.
 */
function detectWrongLanguageExample(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;
  let wrongCount = 0;
  const evidence = [];

  for (const vc of vocabCards) {
    if (!vc.example || vc.example.trim().length < 10) continue;
    const example = vc.example.trim();

    // Score example against target vs native language
    const targetScore = scoreFunctionWords(example, tl);
    const nativeScore = scoreFunctionWords(example, nl);

    // Also check English if neither lang is English
    const enScore = (tl !== 'en' && nl !== 'en') ? scoreFunctionWords(example, 'en') : 0;

    // Example is in native language (should be in target language)
    if (nativeScore > targetScore && nativeScore > 0.15 && nativeScore > enScore) {
      wrongCount++;
      if (evidence.length < 3) {
        evidence.push({
          word: vc.word,
          example: example.slice(0, 80),
          targetScore: targetScore.toFixed(2),
          nativeScore: nativeScore.toFixed(2),
        });
      }
    }

    // Example is in English when neither lang is English
    if (tl !== 'en' && nl !== 'en' && enScore > targetScore && enScore > nativeScore && enScore > 0.25) {
      wrongCount++;
      if (evidence.length < 3) {
        evidence.push({
          word: vc.word,
          example: example.slice(0, 80),
          detectedLang: 'en',
          enScore: enScore.toFixed(2),
        });
      }
    }
  }

  if (wrongCount > 0) {
    issues.push({
      detector: 'wrongLanguageExample',
      severity: 'high',
      description: `${wrongCount} VocabCard example(s) appear to be in the wrong language`,
      evidence: { wrongCount, totalExamples: vocabCards.filter(v => v.example.length > 10).length, samples: evidence },
    });
  }

  return issues;
}

/**
 * Detector 7: Example Copies Word (MEDIUM)
 * Example field repeats word verbatim or contains English instructions.
 */
function detectExampleCopiesWord(article, vocabCards) {
  const issues = [];
  let copiedCount = 0;
  let instructionCount = 0;
  const evidence = [];

  const INSTRUCTION_PATTERNS = [
    /^use when\b/i, /^use this\b/i, /^use it\b/i, /^say this\b/i,
    /^say when\b/i, /^said when\b/i, /^used when\b/i, /^used to\b/i,
    /^express /i, /^shows? /i, /^means? /i,
  ];

  for (const vc of vocabCards) {
    if (!vc.example || vc.example.trim().length < 2) continue;
    const exampleTrimmed = vc.example.trim();
    const wordTrimmed = vc.word.trim();

    // Example is just the word copied
    if (exampleTrimmed.toLowerCase() === wordTrimmed.toLowerCase()) {
      copiedCount++;
      if (evidence.length < 3) {
        evidence.push({ word: vc.word, example: exampleTrimmed, type: 'copied' });
      }
      continue;
    }

    // Example is an English instruction
    for (const pat of INSTRUCTION_PATTERNS) {
      if (pat.test(exampleTrimmed)) {
        instructionCount++;
        if (evidence.length < 3) {
          evidence.push({ word: vc.word, example: exampleTrimmed.slice(0, 60), type: 'instruction' });
        }
        break;
      }
    }
  }

  if (copiedCount > 0 || instructionCount > 0) {
    issues.push({
      detector: 'exampleCopiesWord',
      severity: 'medium',
      description: `${copiedCount} example(s) copy the word verbatim, ${instructionCount} are English instructions`,
      evidence: { copiedCount, instructionCount, samples: evidence },
    });
  }

  return issues;
}

/**
 * Detector 8: Title-Content Mismatch (HIGH)
 * Article title promises one topic but VocabCards teach something else.
 */
function detectTitleContentMismatch(article, vocabCards) {
  const issues = [];
  if (vocabCards.length < 3) return issues; // Not enough data

  const title = (article.title || '').toLowerCase();

  // Strip language names and common filler from title to get topic keywords
  const langNames = Object.values(LANG_NAMES).map(n => n.toLowerCase());
  const fillerWords = new Set([
    'learn', 'how', 'to', 'say', 'in', 'the', 'for', 'your', 'partner',
    'with', 'couples', 'love', 'romantic', 'essential', 'top', 'best',
    'most', 'common', 'basic', 'important', 'guide', 'complete', 'ultimate',
    'phrases', 'words', 'vocabulary', 'expressions', 'lernen', 'wie', 'man',
    'sagt', 'naučte', 'jak', 'říct', 'naucz', 'mów', 'aprender', 'como',
    'dizer', 'dire', 'come', 'lære', 'lär', 'dig', 'tanul', 'öğren',
    'a', 'an', 'und', 'et', 'e', 'y', 'i', 'og', 'och', 'és', 've',
    'die', 'der', 'das', 'les', 'des', 'del', 'della', 'la', 'le', 'el',
    'los', 'las', 'il', 'lo', 'de', 'do', 'da', 'pro', 'na', 'se',
  ]);

  // Also strip language names in their native forms
  const nativeLangNames = [
    'polski', 'polsku', 'polsky', 'angličtina', 'anglicky', 'němčina', 'německy',
    'français', 'francesa', 'español', 'española', 'italiano', 'italiana',
    'português', 'portuguesa', 'svenska', 'norsk', 'dansk', 'magyar', 'türkçe',
    'română', 'русский', 'русском', 'українська', 'ελληνικά', 'čeština', 'česky',
    'dutch', 'hungarian', 'greek', 'czech', 'turkish', 'romanian', 'norwegian',
    'swedish', 'danish', 'polish', 'german', 'french', 'spanish', 'italian',
    'portuguese', 'english', 'russian', 'ukrainian',
    'čekçe', 'almanca', 'fransızca', 'ispanyolca', 'italyanca', 'portekizce',
    'lehçe', 'hollandaca', 'romence', 'rusça', 'ukraynaca', 'yunanca',
    'macarca', 'isveççe', 'norveççe', 'danca',
  ];

  const allFiller = new Set([...fillerWords, ...langNames, ...nativeLangNames]);

  const titleWords = title
    .replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňýąćęłńóśźżöüßåæøőűğışăâîșț\u0400-\u04FF\u0370-\u03FF]+/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !allFiller.has(w));

  if (titleWords.length === 0) return issues; // Can't extract topic

  // Check if ANY topic keyword appears in any VocabCard
  let hasOverlap = false;
  for (const kw of titleWords) {
    for (const vc of vocabCards) {
      const combined = `${vc.word} ${vc.translation} ${vc.example}`.toLowerCase();
      if (combined.includes(kw)) {
        hasOverlap = true;
        break;
      }
    }
    if (hasOverlap) break;
  }

  // Also check prose content for topic keywords
  if (!hasOverlap) {
    const prose = stripComponentsAndFrontmatter(article.content).toLowerCase();
    for (const kw of titleWords) {
      if (prose.includes(kw)) {
        hasOverlap = true;
        break;
      }
    }
  }

  if (!hasOverlap && titleWords.length >= 2) {
    issues.push({
      detector: 'titleContentMismatch',
      severity: 'high',
      description: `Title topic keywords [${titleWords.join(', ')}] not found in any VocabCard or prose`,
      evidence: {
        titleKeywords: titleWords,
        sampleVocab: vocabCards.slice(0, 3).map(v => ({ word: v.word, translation: v.translation })),
      },
    });
  }

  return issues;
}

/**
 * Detector 9: Boilerplate Text (MEDIUM)
 * Recycled template text present verbatim.
 */
function detectBoilerplateText(article) {
  const issues = [];
  const content = article.content || '';
  const found = [];

  const BOILERPLATE_PATTERNS = [
    { re: /essential for (?:make|apologize|express|show)\b/i, label: 'grammar error: "essential for make/apologize"' },
    { re: /is the most important phrase to know\b/i, label: '"most important phrase to know"' },
    { re: /Don['']t be afraid to make mistakes/i, label: '"Don\'t be afraid to make mistakes"' },
    { re: /^#+\s*Practice Makes Perfect\s*$/mi, label: '"Practice Makes Perfect" heading' },
    { re: /Use it whenever you (?:feel|want|need) to/i, label: '"Use it whenever you..." boilerplate' },
    { re: /is a beautiful way to (?:express|show|tell)/i, label: '"beautiful way to express" boilerplate' },
    { re: /is the most common way to/i, label: '"most common way to" boilerplate' },
  ];

  for (const { re, label } of BOILERPLATE_PATTERNS) {
    if (re.test(content)) {
      found.push(label);
    }
  }

  if (found.length > 0) {
    issues.push({
      detector: 'boilerplateText',
      severity: 'medium',
      description: `Found ${found.length} boilerplate pattern(s): ${found[0]}`,
      evidence: { patterns: found },
    });
  }

  return issues;
}

/**
 * Detector 10: Thin Content (MEDIUM)
 * Articles too short to be useful.
 */
function detectThinContent(article) {
  const issues = [];
  const content = article.content || '';
  const proseWords = countProseWords(content);
  const vocabCount = (content.match(/<VocabCard/gi) || []).length;
  const phraseCount = (content.match(/<PhraseOfDay/gi) || []).length;
  const cultureCount = (content.match(/<CultureTip/gi) || []).length;
  const conjCount = (content.match(/<ConjugationTable/gi) || []).length;
  const totalComps = vocabCount + phraseCount + cultureCount + conjCount;

  if (proseWords < 150 && totalComps <= 2) {
    issues.push({
      detector: 'thinContent',
      severity: 'medium',
      description: `Extremely thin: ${proseWords} prose words, ${totalComps} components`,
      evidence: { proseWords, components: totalComps, band: 'extremely_thin' },
    });
  } else if (proseWords < 300 && totalComps <= 1) {
    issues.push({
      detector: 'thinContent',
      severity: 'medium',
      description: `Thin: ${proseWords} prose words, ${totalComps} component(s)`,
      evidence: { proseWords, components: totalComps, band: 'thin' },
    });
  }

  return issues;
}

/**
 * Detector 11: Empty or Truncated Props (HIGH)
 * VocabCard/PhraseOfDay with empty, 1-char, or 2-char word/translation.
 */
function detectEmptyOrTruncatedProps(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards.map(v => ({ ...v, type: 'VocabCard' })),
                         ...phrases.map(p => ({ ...p, type: 'PhraseOfDay' }))];
  const evidence = [];

  for (const comp of allComponents) {
    // Empty or very short word
    if (!comp.word || comp.word.trim().length < 3) {
      evidence.push({
        component: comp.type,
        field: 'word',
        value: comp.word || '(empty)',
        translation: comp.translation,
      });
    }

    // Empty translation
    if (!comp.translation || comp.translation.trim().length < 2) {
      evidence.push({
        component: comp.type,
        field: 'translation',
        value: comp.translation || '(empty)',
        word: comp.word,
      });
    }
  }

  if (evidence.length > 0) {
    issues.push({
      detector: 'emptyOrTruncatedProps',
      severity: 'high',
      description: `${evidence.length} component prop(s) are empty or suspiciously short`,
      evidence: { count: evidence.length, samples: evidence.slice(0, 5) },
    });
  }

  return issues;
}

/**
 * Detector 12: Remaining IPA (MEDIUM)
 * IPA symbols still in pronunciation fields.
 */
function detectRemainingIPA(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  const ipaFound = [];

  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    if (IPA_CHARS.test(comp.pronunciation)) {
      ipaFound.push({ word: comp.word, pronunciation: comp.pronunciation });
    }
  }

  if (ipaFound.length > 0) {
    issues.push({
      detector: 'remainingIPA',
      severity: 'medium',
      description: `${ipaFound.length} pronunciation(s) still contain IPA symbols`,
      evidence: { count: ipaFound.length, samples: ipaFound.slice(0, 3) },
    });
  }

  return issues;
}

/**
 * Detector 13: Double Bracket Pronunciation (LOW)
 * Pronunciation value starts with [ — causes [[ ]] rendering.
 */
function detectDoubleBracketPronunciation(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  let count = 0;

  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    if (comp.pronunciation.trim().startsWith('[')) count++;
  }

  if (count > 0) {
    issues.push({
      detector: 'doubleBracketPronunciation',
      severity: 'low',
      description: `${count} pronunciation(s) start with [ — will render as [[ ]]`,
      evidence: { count },
    });
  }

  return issues;
}

/**
 * Detector 14: Pronunciation Equals Word (MEDIUM)
 * Already detected by audit-content.mjs. Include for completeness.
 */
function detectPronunciationEqualsWord(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  let count = 0;
  const evidence = [];

  for (const comp of allComponents) {
    if (!comp.pronunciation || !comp.word) continue;
    if (comp.word.trim().length <= 3) continue; // Short words can legitimately match
    const pron = comp.pronunciation.trim().toLowerCase().replace(/^[/\[(]|[/\])]$/g, '');
    const word = comp.word.trim().toLowerCase();
    if (pron === word) {
      count++;
      if (evidence.length < 3) evidence.push({ word: comp.word, pronunciation: comp.pronunciation });
    }
  }

  if (count > 0) {
    issues.push({
      detector: 'pronunciationEqualsWord',
      severity: 'medium',
      description: `${count} pronunciation(s) are just the word copied`,
      evidence: { count, samples: evidence },
    });
  }

  return issues;
}

/**
 * Detector 15: Import Statements in Content (LOW)
 * import VocabCard from '@components/...' still in content field.
 */
function detectImportStatements(article) {
  const issues = [];
  const content = article.content || '';
  const imports = content.match(/^import\s+\w+.*from\s+['"].*['"]/gm);

  if (imports && imports.length > 0) {
    issues.push({
      detector: 'importStatementsInContent',
      severity: 'low',
      description: `${imports.length} import statement(s) still in content`,
      evidence: { count: imports.length, samples: imports.slice(0, 2) },
    });
  }

  return issues;
}

/**
 * Detector 16: Legacy Props (LOW)
 * polish="X" or english="X" in VocabCard/PhraseOfDay/ConjugationTable.
 */
function detectLegacyProps(article) {
  const issues = [];
  const content = article.content || '';

  const polishProps = (content.match(/\bpolish=["']/gi) || []).length;
  const englishProps = (content.match(/\benglish=["']/gi) || []).length;

  if (polishProps > 0 || englishProps > 0) {
    issues.push({
      detector: 'legacyProps',
      severity: 'low',
      description: `${polishProps + englishProps} legacy prop(s) found (polish=/english=)`,
      evidence: { polishProps, englishProps },
    });
  }

  return issues;
}

/**
 * Detector 17: Missing Turkish Characters (HIGH for tr native)
 */
function detectMissingTurkishChars(article) {
  const issues = [];
  if (article.native_lang !== 'tr') return issues;

  const prose = stripComponentsAndFrontmatter(article.content);
  if (prose.length < 200) return issues;

  // Check for common Turkish → ASCII substitutions in prose
  const substitutions = [
    { pattern: /\bfuer\b/gi, correct: 'für', note: 'German not Turkish but common' },
  ];

  // Check if prose has any Turkish-specific characters
  const turkishChars = /[çğışöüÇĞİŞÖÜ]/;
  if (!turkishChars.test(prose) && prose.length > 300) {
    issues.push({
      detector: 'missingTurkishChars',
      severity: 'high',
      description: 'Turkish-native prose contains zero Turkish-specific characters (ş, ç, ğ, ı, ö, ü)',
      evidence: { proseLength: prose.length, sampleStart: prose.slice(0, 100) },
    });
  }

  return issues;
}

/**
 * Detector 18: Missing Native Umlauts (MEDIUM for de native)
 * German-native articles using ue/oe/ae instead of ü/ö/ä.
 */
function detectMissingNativeUmlauts(article) {
  const issues = [];
  if (article.native_lang !== 'de') return issues;

  const prose = stripComponentsAndFrontmatter(article.content);
  if (prose.length < 200) return issues;

  // Common German words with ue/oe/ae substitution
  const substitutionPatterns = [
    /\bfuer\b/gi, /\bueber\b/gi, /\bSuesser?\b/gi, /\bKaetzchen\b/gi,
    /\bschoensten?\b/gi, /\bAusdruecke\b/gi, /\bGlueck\b/gi, /\bZaertlich/gi,
    /\bmuessen\b/gi, /\bkoennen\b/gi, /\bmoechte\b/gi, /\bwuerden?\b/gi,
    /\bDuft\b/gi, // This is valid — but check for systematic pattern
  ];

  let substitutionCount = 0;
  const found = [];

  for (const pat of substitutionPatterns) {
    const matches = prose.match(pat);
    if (matches) {
      substitutionCount += matches.length;
      found.push(matches[0]);
    }
  }

  if (substitutionCount >= 3) {
    issues.push({
      detector: 'missingNativeUmlauts',
      severity: 'medium',
      description: `${substitutionCount} German umlaut→ae/oe/ue substitution(s) in native prose`,
      evidence: { count: substitutionCount, samples: found.slice(0, 5) },
    });
  }

  return issues;
}

/**
 * Detector 19: Native Language Only Section (HIGH)
 * Sections with only native-language prose and zero target vocabulary.
 */
function detectNativeLanguageOnlySection(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;
  const content = article.content || '';

  // Split by headings
  const sections = content.split(/^(?=#{2,3}\s)/m);
  if (sections.length < 2) return issues; // Not enough sections

  const CYRILLIC_RE = /[\u0400-\u04FF]/;
  const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  const CYRILLIC_LANGS = new Set(['ru', 'uk']);
  const GREEK_LANGS = new Set(['el']);

  let nativeOnlySections = 0;

  for (const section of sections) {
    if (section.trim().length < 50) continue;

    // Skip sections that contain components (they have target-language content)
    if (/<(?:VocabCard|PhraseOfDay|ConjugationTable)/i.test(section)) continue;

    const sectionProse = section.replace(/^#{2,3}\s+.*$/m, '').trim();
    if (sectionProse.length < 50) continue;

    // For script-distinct language pairs, check if section has any target script
    if (CYRILLIC_LANGS.has(tl) && !CYRILLIC_LANGS.has(nl)) {
      if (!CYRILLIC_RE.test(sectionProse)) {
        nativeOnlySections++;
        continue;
      }
    }
    if (GREEK_LANGS.has(tl) && !GREEK_LANGS.has(nl)) {
      if (!GREEK_RE.test(sectionProse)) {
        nativeOnlySections++;
        continue;
      }
    }

    // For same-script pairs, use function word scoring
    if (!CYRILLIC_LANGS.has(tl) && !GREEK_LANGS.has(tl) &&
        !CYRILLIC_LANGS.has(nl) && !GREEK_LANGS.has(nl)) {
      const targetScore = scoreFunctionWords(sectionProse, tl);
      const nativeScore = scoreFunctionWords(sectionProse, nl);

      // Section is entirely in native language with negligible target content
      if (nativeScore > 0.15 && targetScore < 0.03 && nativeScore > targetScore * 5) {
        nativeOnlySections++;
      }
    }
  }

  if (nativeOnlySections >= 2) {
    issues.push({
      detector: 'nativeLanguageOnlySection',
      severity: 'high',
      description: `${nativeOnlySections} section(s) contain only ${nl} prose with zero ${tl} vocabulary`,
      evidence: { nativeOnlySections, totalSections: sections.length },
    });
  }

  return issues;
}

// ─── Detector Registry ───────────────────────────────────────────────────────

const ALL_DETECTORS = {
  apologyTemplateBug:        { fn: detectApologyTemplateBug,        needsVocab: true,  needsPhrases: true,  severity: 'critical' },
  pronunciationMismatch:     { fn: detectPronunciationMismatch,     needsVocab: true,  needsPhrases: true,  severity: 'high' },
  copiedPronunciations:      { fn: detectCopiedPronunciations,      needsVocab: true,  needsPhrases: false, severity: 'high' },
  truncatedPronunciation:    { fn: detectTruncatedPronunciation,    needsVocab: true,  needsPhrases: true,  severity: 'medium' },
  fakePronunciation:         { fn: detectFakePronunciation,         needsVocab: true,  needsPhrases: true,  severity: 'medium' },
  missingDiacriticals:       { fn: detectMissingDiacriticals,       needsVocab: true,  needsPhrases: false, severity: 'high' },
  wrongLanguageExample:      { fn: detectWrongLanguageExample,      needsVocab: true,  needsPhrases: false, severity: 'high' },
  exampleCopiesWord:         { fn: detectExampleCopiesWord,         needsVocab: true,  needsPhrases: false, severity: 'medium' },
  titleContentMismatch:      { fn: detectTitleContentMismatch,      needsVocab: true,  needsPhrases: false, severity: 'high' },
  boilerplateText:           { fn: detectBoilerplateText,           needsVocab: false, needsPhrases: false, severity: 'medium' },
  thinContent:               { fn: detectThinContent,               needsVocab: false, needsPhrases: false, severity: 'medium' },
  emptyOrTruncatedProps:     { fn: detectEmptyOrTruncatedProps,     needsVocab: true,  needsPhrases: true,  severity: 'high' },
  remainingIPA:              { fn: detectRemainingIPA,              needsVocab: true,  needsPhrases: true,  severity: 'medium' },
  doubleBracketPronunciation:{ fn: detectDoubleBracketPronunciation,needsVocab: true,  needsPhrases: true,  severity: 'low' },
  pronunciationEqualsWord:   { fn: detectPronunciationEqualsWord,   needsVocab: true,  needsPhrases: true,  severity: 'medium' },
  importStatementsInContent: { fn: detectImportStatements,          needsVocab: false, needsPhrases: false, severity: 'low' },
  legacyProps:               { fn: detectLegacyProps,               needsVocab: false, needsPhrases: false, severity: 'low' },
  missingTurkishChars:       { fn: detectMissingTurkishChars,       needsVocab: false, needsPhrases: false, severity: 'high' },
  missingNativeUmlauts:      { fn: detectMissingNativeUmlauts,      needsVocab: false, needsPhrases: false, severity: 'medium' },
  nativeLanguageOnlySection: { fn: detectNativeLanguageOnlySection, needsVocab: true,  needsPhrases: false, severity: 'high' },
};

// ─── Scanner ─────────────────────────────────────────────────────────────────

function scanArticle(article, detectorNames) {
  const vocabCards = extractAllVocabCards(article.content);
  const phrases = extractPhraseOfDay(article.content);
  const allIssues = [];

  for (const name of detectorNames) {
    const detector = ALL_DETECTORS[name];
    if (!detector) continue;

    let issues;
    if (detector.needsVocab && detector.needsPhrases) {
      issues = detector.fn(article, vocabCards, phrases);
    } else if (detector.needsVocab) {
      issues = detector.fn(article, vocabCards);
    } else if (detector.needsPhrases) {
      issues = detector.fn(article, [], phrases);
    } else {
      issues = detector.fn(article);
    }

    allIssues.push(...issues);
  }

  return allIssues;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();

// Load articles
const localPath = path.join(__dirname, 'data/articles-local.json');
if (!fs.existsSync(localPath)) {
  console.error('ERROR: articles-local.json not found. Run export-articles.mjs first.');
  process.exit(1);
}

console.error('Loading articles-local.json...');
const data = JSON.parse(fs.readFileSync(localPath, 'utf-8'));
let articles = data.articles.filter(a => a.target_lang !== 'all');

// Apply filters
if (NATIVE_LANG) articles = articles.filter(a => a.native_lang === NATIVE_LANG);
if (TARGET_LANG) articles = articles.filter(a => a.target_lang === TARGET_LANG);
if (CATEGORY) articles = articles.filter(a => a.category === CATEGORY);
if (LIMIT) articles = articles.slice(0, LIMIT);

// Determine which detectors to run
const detectorNames = DETECTORS
  ? [...DETECTORS].filter(d => ALL_DETECTORS[d])
  : Object.keys(ALL_DETECTORS);

console.error(`\n${'═'.repeat(70)}`);
console.error(`  SEMANTIC ISSUE DETECTION`);
console.error(`${'═'.repeat(70)}`);
console.error(`  Articles: ${articles.length.toLocaleString()}`);
console.error(`  Detectors: ${detectorNames.length} (${detectorNames.join(', ')})`);
console.error(`  Filters: native=${NATIVE_LANG || 'all'}, target=${TARGET_LANG || 'all'}, category=${CATEGORY || 'all'}`);
console.error(`${'═'.repeat(70)}\n`);

// Scan all articles
const articleResults = {};
const summary = {
  byDetector: {},
  byNativeLang: {},
  byTargetLang: {},
  byCategory: {},
  bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
};

// Initialize detector summary
for (const name of detectorNames) {
  summary.byDetector[name] = {
    count: 0,
    articles: 0,
    severity: ALL_DETECTORS[name].severity,
  };
}

let totalWithIssues = 0;
let totalIssueCount = 0;

for (let i = 0; i < articles.length; i++) {
  const article = articles[i];

  if ((i + 1) % 2000 === 0) {
    console.error(`  Scanned: ${(i + 1).toLocaleString()} / ${articles.length.toLocaleString()}...`);
  }

  const issues = scanArticle(article, detectorNames);
  if (issues.length === 0) continue;

  totalWithIssues++;
  totalIssueCount += issues.length;

  articleResults[article.id] = {
    slug: article.slug,
    native_lang: article.native_lang,
    target_lang: article.target_lang,
    category: article.category,
    title: article.title,
    issues,
  };

  // Update summary
  const detectorsSeen = new Set();
  for (const issue of issues) {
    // By detector
    if (summary.byDetector[issue.detector]) {
      summary.byDetector[issue.detector].count++;
      if (!detectorsSeen.has(issue.detector)) {
        summary.byDetector[issue.detector].articles++;
        detectorsSeen.add(issue.detector);
      }
    }

    // By severity
    summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;

    // By native lang
    const nl = article.native_lang;
    if (!summary.byNativeLang[nl]) summary.byNativeLang[nl] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    summary.byNativeLang[nl].total++;
    summary.byNativeLang[nl][issue.severity]++;

    // By target lang
    const tl = article.target_lang;
    if (!summary.byTargetLang[tl]) summary.byTargetLang[tl] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    summary.byTargetLang[tl].total++;
    summary.byTargetLang[tl][issue.severity]++;

    // By category
    const cat = article.category || 'unknown';
    if (!summary.byCategory[cat]) summary.byCategory[cat] = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    summary.byCategory[cat].total++;
    summary.byCategory[cat][issue.severity]++;
  }

  if (VERBOSE) {
    for (const issue of issues) {
      console.error(`  [${issue.severity.toUpperCase()}] ${article.slug}: ${issue.detector} — ${issue.description}`);
    }
  }
}

const durationMs = Date.now() - startTime;

// Build manifest
const manifest = {
  meta: {
    timestamp: new Date().toISOString(),
    totalScanned: articles.length,
    totalWithIssues,
    totalClean: articles.length - totalWithIssues,
    totalIssueCount,
    scanDurationMs: durationMs,
    detectorsUsed: detectorNames,
    filters: {
      native_lang: NATIVE_LANG || 'all',
      target_lang: TARGET_LANG || 'all',
      category: CATEGORY || 'all',
      limit: LIMIT || 'all',
    },
  },
  summary,
  articles: articleResults,
};

// Write manifest
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const outPath = path.join(dataDir, 'semantic-issues-manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

// Print summary
console.error(`\n${'═'.repeat(70)}`);
console.error(`  RESULTS`);
console.error(`${'═'.repeat(70)}`);
console.error(`  Scanned:       ${articles.length.toLocaleString()}`);
console.error(`  With Issues:   ${totalWithIssues.toLocaleString()} (${articles.length > 0 ? ((totalWithIssues / articles.length) * 100).toFixed(1) : 0}%)`);
console.error(`  Clean:         ${(articles.length - totalWithIssues).toLocaleString()} (${articles.length > 0 ? (((articles.length - totalWithIssues) / articles.length) * 100).toFixed(1) : 0}%)`);
console.error(`  Total Issues:  ${totalIssueCount.toLocaleString()}`);
console.error(`  Duration:      ${(durationMs / 1000).toFixed(1)}s`);

console.error(`\n  --- By Severity ---`);
for (const [sev, count] of Object.entries(summary.bySeverity)) {
  if (count > 0) console.error(`  ${sev.toUpperCase().padEnd(10)} ${String(count).padStart(6)}`);
}

console.error(`\n  --- By Detector ---`);
const sortedDetectors = Object.entries(summary.byDetector)
  .filter(([, v]) => v.count > 0)
  .sort((a, b) => b[1].count - a[1].count);

for (const [name, data] of sortedDetectors) {
  const sevLabel = data.severity.toUpperCase().slice(0, 4).padEnd(4);
  console.error(`  ${name.padEnd(30)} ${String(data.count).padStart(6)} issues in ${String(data.articles).padStart(5)} articles  [${sevLabel}]`);
}

console.error(`\n  --- By Native Language (top 10) ---`);
const sortedNative = Object.entries(summary.byNativeLang)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10);
for (const [lang, data] of sortedNative) {
  console.error(`  ${(LANG_NAMES[lang] || lang).padEnd(14)} ${String(data.total).padStart(6)} (crit: ${data.critical}, high: ${data.high}, med: ${data.medium})`);
}

console.error(`\n  --- By Target Language (top 10) ---`);
const sortedTarget = Object.entries(summary.byTargetLang)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10);
for (const [lang, data] of sortedTarget) {
  console.error(`  ${(LANG_NAMES[lang] || lang).padEnd(14)} ${String(data.total).padStart(6)} (crit: ${data.critical}, high: ${data.high}, med: ${data.medium})`);
}

console.error(`\n  --- By Category ---`);
const sortedCats = Object.entries(summary.byCategory)
  .sort((a, b) => b[1].total - a[1].total);
for (const [cat, data] of sortedCats) {
  console.error(`  ${cat.padEnd(20)} ${String(data.total).padStart(6)} (crit: ${data.critical}, high: ${data.high}, med: ${data.medium})`);
}

console.error(`\n  Manifest saved to: ${outPath}`);
console.error(`${'═'.repeat(70)}\n`);
