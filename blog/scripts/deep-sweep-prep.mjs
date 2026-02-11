#!/usr/bin/env node
/**
 * deep-sweep-prep.mjs — Pull articles from Supabase for one language pair,
 * run all mechanical detectors + audit checks, split into batches for
 * parallel Opus agent review.
 *
 * Usage:
 *   node blog/scripts/deep-sweep-prep.mjs --native en --target es
 *   node blog/scripts/deep-sweep-prep.mjs --native en --target es --max-agents 6
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
let NATIVE = null, TARGET = null, MAX_AGENTS = 8;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--native': NATIVE = args[++i]; break;
    case '--target': TARGET = args[++i]; break;
    case '--max-agents': MAX_AGENTS = Math.min(8, Math.max(4, parseInt(args[++i], 10))); break;
  }
}

if (!NATIVE || !TARGET) {
  console.error('Usage: node blog/scripts/deep-sweep-prep.mjs --native <code> --target <code> [--max-agents 8]');
  process.exit(1);
}

// ─── Language Data ───────────────────────────────────────────────────────────

const LANG_NAMES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', pl: 'Polish', nl: 'Dutch',
  ro: 'Romanian', ru: 'Russian', uk: 'Ukrainian', tr: 'Turkish',
  sv: 'Swedish', no: 'Norwegian', da: 'Danish', cs: 'Czech',
  el: 'Greek', hu: 'Hungarian',
};

// ─── Apology Word Lists ─────────────────────────────────────────────────────

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

const APOLOGY_TITLE_KEYWORDS = [
  'apolog', 'sorry', 'forgiv', 'forgive', 'entschuldig', 'omlouv', 'promiň', 'przepras',
  'perdón', 'perdon', 'perdão', 'desculp', 'pardon', 'désolé', 'scusa', 'disculp',
  'извин', 'прост', 'özür', 'unnskyld', 'undskyld', 'förlåt', 'bocsánat',
  'elnézés', 'scuze', 'iart', 'vybač', 'vergev', 'συγγνώμη', 'λυπ',
  'saying sorry', 'make up', 'making up', 'reconcil', 'примир', 'versöhn',
  'excus', 'excuser', 's\'excus',
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
  'smíření', 'pojednání', 'pogodzenie', 'riconciliazione', 'reconciliação',
  'reconciliación', 'réconcili', 'verzoening', 'forsoning', 'kibékül',
  'uzlaşma', 'примирен',
  'svarky', 'svarce', 'hádky', 'kłótni', 'fight', 'streit', 'dispute',
  'pelea', 'briga', 'litigio', 'kavga',
];

// ─── Function Word Sets ──────────────────────────────────────────────────────

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
const DIACRITICAL_LANGUAGES = new Set(Object.keys(DIACRITICAL_CHARS));

const IPA_CHARS = /[ʒʃθðŋɲɛɔəæɑɪʊɐɒʌɜɹɾɻʂʐɕʑɡɫɬɮʔçʁħʕβɸɣχˈˌː]/;

// ─── Prop Extraction ─────────────────────────────────────────────────────────

function extractProp(tag, propName) {
  const dq = new RegExp(`${propName}\\s*=\\s*"([^"]*)"`, 's');
  const dm = tag.match(dq);
  if (dm) return dm[1];
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

function scoreFunctionWords(text, langCode) {
  const words = FUNCTION_WORDS[langCode];
  if (!words) return 0;
  const tokens = text.toLowerCase().split(/[\s,.!?;:'"()\[\]{}]+/).filter(w => w.length > 0);
  if (tokens.length === 0) return 0;
  let hits = 0;
  for (const t of tokens) { if (words.has(t)) hits++; }
  return hits / tokens.length;
}

// ─── All 20 Detectors (inlined from detect-semantic-issues.mjs) ─────────────

function detectApologyTemplateBug(article, vocabCards, phrases) {
  const issues = [];
  const tl = article.target_lang;
  const title = (article.title || '').toLowerCase();
  for (const kw of APOLOGY_TITLE_KEYWORDS) { if (title.includes(kw)) return issues; }
  const apologyWords = APOLOGY_WORDS[tl] || [];
  if (apologyWords.length === 0) return issues;
  let apologyCardCount = 0;
  const apologyEvidence = [];
  for (const vc of vocabCards) {
    const wordLower = vc.word.toLowerCase();
    const transLower = vc.translation.toLowerCase();
    const exampleLower = vc.example.toLowerCase();
    let isApology = false;
    for (const aw of apologyWords) {
      if (wordLower.includes(aw) || transLower.includes(aw) || exampleLower.includes(aw)) { isApology = true; break; }
    }
    const nlApology = APOLOGY_WORDS[article.native_lang] || [];
    if (!isApology) {
      for (const aw of nlApology) {
        if (transLower.includes(aw) || exampleLower.includes(aw)) { isApology = true; break; }
      }
    }
    if (isApology) { apologyCardCount++; apologyEvidence.push({ word: vc.word, translation: vc.translation }); }
  }
  let phraseIsApology = false;
  for (const ph of phrases) {
    const wordLower = ph.word.toLowerCase();
    for (const aw of apologyWords) { if (wordLower.includes(aw)) { phraseIsApology = true; break; } }
    if (!phraseIsApology) {
      const nlApology = APOLOGY_WORDS[article.native_lang] || [];
      for (const aw of nlApology) { if (ph.translation.toLowerCase().includes(aw)) { phraseIsApology = true; break; } }
    }
  }
  const content = article.content || '';
  const hasBoilerplate = /essential for make\b/i.test(content) || /essential for apologize/i.test(content) || /is the most important phrase to know\.\s*Use it whenever/i.test(content);
  const apologyRatio = vocabCards.length > 0 ? apologyCardCount / vocabCards.length : 0;
  if (apologyCardCount >= 3 && (apologyRatio >= 0.4 || apologyCardCount >= 5)) {
    issues.push({ detector: 'apologyTemplateBug', severity: 'critical', description: `${apologyCardCount} of ${vocabCards.length} VocabCards (${Math.round(apologyRatio * 100)}%) contain apology words but title is about "${article.title}"` });
  } else if (apologyCardCount >= 2 && (phraseIsApology || hasBoilerplate)) {
    issues.push({ detector: 'apologyTemplateBug', severity: 'critical', description: `${apologyCardCount} apology VocabCards + ${phraseIsApology ? 'apology PhraseOfDay' : 'boilerplate text'} in non-apology article` });
  } else if (hasBoilerplate) {
    issues.push({ detector: 'apologyTemplateBug', severity: 'high', description: 'Contains apology template boilerplate text' });
  }
  return issues;
}

function detectPronunciationMismatch(article, vocabCards, phrases) {
  const issues = [];
  for (const ph of phrases) {
    if (!ph.pronunciation || !ph.word) continue;
    const phPronLower = ph.pronunciation.toLowerCase().trim();
    if (phPronLower.length < 3) continue;
    for (const vc of vocabCards) {
      if (!vc.pronunciation) continue;
      const vcPronLower = vc.pronunciation.toLowerCase().trim();
      if (phPronLower === vcPronLower) {
        const phWordNorm = ph.word.toLowerCase().replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňý\u0400-\u04FF\u0370-\u03FF]/g, '');
        const vcWordNorm = vc.word.toLowerCase().replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňý\u0400-\u04FF\u0370-\u03FF]/g, '');
        if (phWordNorm !== vcWordNorm && phWordNorm.length > 2 && vcWordNorm.length > 2) {
          issues.push({ detector: 'pronunciationMismatch', severity: 'high', description: `PhraseOfDay pronunciation '${ph.pronunciation}' matches VocabCard '${vc.word}' but PhraseOfDay word is '${ph.word}'` });
          break;
        }
      }
    }
  }
  return issues;
}

function detectCopiedPronunciations(article, vocabCards) {
  const issues = [];
  const pronMap = new Map();
  for (const vc of vocabCards) {
    if (!vc.pronunciation || vc.pronunciation.trim().length < 3) continue;
    const pron = vc.pronunciation.trim().toLowerCase();
    if (!pronMap.has(pron)) pronMap.set(pron, []);
    pronMap.get(pron).push(vc.word);
  }
  for (const [pron, words] of pronMap) {
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    if (uniqueWords.length >= 3) {
      issues.push({ detector: 'copiedPronunciations', severity: 'high', description: `Pronunciation '${pron}' reused for ${uniqueWords.length} different words` });
    }
  }
  return issues;
}

function detectTruncatedPronunciation(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  for (const comp of allComponents) {
    if (!comp.pronunciation || !comp.word) continue;
    const pron = comp.pronunciation.trim();
    const word = comp.word.trim();
    if (word.length < 10) continue;
    if (pron.length > 0 && pron.length < word.length * 0.3) {
      issues.push({ detector: 'truncatedPronunciation', severity: 'medium', description: `Pronunciation '${pron}' seems truncated for word '${word}'` });
    }
    if (/\s\S$/.test(pron) && pron.length > 3) {
      const lastPart = pron.split(/\s/).pop();
      if (lastPart.length === 1) {
        issues.push({ detector: 'truncatedPronunciation', severity: 'medium', description: `Pronunciation '${pron}' ends with single char '${lastPart}' — likely truncated` });
      }
    }
  }
  return issues;
}

function detectFakePronunciation(article, vocabCards, phrases) {
  const issues = [];
  const nl = article.native_lang;
  const allComponents = [...vocabCards, ...phrases];
  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    const pron = comp.pronunciation.trim();
    if (pron.length < 5) continue;
    const hasHyphens = /-/.test(pron);
    const hasCaps = /[A-Z]{2,}/.test(pron);
    if (hasHyphens || hasCaps) continue;
    const nativeScore = scoreFunctionWords(pron, nl);
    const enScore = scoreFunctionWords(pron, 'en');
    if (nativeScore > 0.3 || enScore > 0.3) {
      issues.push({ detector: 'fakePronunciation', severity: 'medium', description: `Pronunciation '${pron}' looks like a ${nativeScore > enScore ? nl : 'en'} description, not phonetics` });
    }
  }
  return issues;
}

function detectMissingDiacriticals(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;
  if (DIACRITICAL_LANGUAGES.has(tl) && vocabCards.length >= 3) {
    const charRegex = DIACRITICAL_CHARS[tl];
    let wordsWithDiacriticals = 0, totalWords = 0;
    for (const vc of vocabCards) {
      if (vc.word.trim().length < 3) continue;
      totalWords++;
      if (charRegex.test(vc.word)) wordsWithDiacriticals++;
    }
    if (totalWords >= 3 && wordsWithDiacriticals / totalWords < 0.15) {
      issues.push({ detector: 'missingDiacriticals', severity: 'high', description: `Only ${wordsWithDiacriticals}/${totalWords} VocabCard words have ${tl} diacriticals` });
    }
  }
  if (DIACRITICAL_LANGUAGES.has(nl) && vocabCards.length >= 3) {
    const charRegex = DIACRITICAL_CHARS[nl];
    let transWithDiacriticals = 0, totalTrans = 0;
    for (const vc of vocabCards) {
      if (vc.translation.trim().length < 3) continue;
      totalTrans++;
      if (charRegex.test(vc.translation)) transWithDiacriticals++;
    }
    if (totalTrans >= 3 && transWithDiacriticals / totalTrans < 0.15) {
      issues.push({ detector: 'missingDiacriticals', severity: 'high', description: `Only ${transWithDiacriticals}/${totalTrans} VocabCard translations have ${nl} diacriticals` });
    }
  }
  return issues;
}

function detectWrongLanguageExample(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;
  let wrongCount = 0;
  for (const vc of vocabCards) {
    if (!vc.example || vc.example.trim().length < 10) continue;
    const example = vc.example.trim();
    const targetScore = scoreFunctionWords(example, tl);
    const nativeScore = scoreFunctionWords(example, nl);
    const enScore = (tl !== 'en' && nl !== 'en') ? scoreFunctionWords(example, 'en') : 0;
    if (nativeScore > targetScore && nativeScore > 0.15 && nativeScore > enScore) wrongCount++;
    if (tl !== 'en' && nl !== 'en' && enScore > targetScore && enScore > nativeScore && enScore > 0.25) wrongCount++;
  }
  if (wrongCount > 0) {
    issues.push({ detector: 'wrongLanguageExample', severity: 'high', description: `${wrongCount} VocabCard example(s) appear to be in the wrong language` });
  }
  return issues;
}

function detectExampleCopiesWord(article, vocabCards) {
  const issues = [];
  let copiedCount = 0, instructionCount = 0;
  const INSTRUCTION_PATTERNS = [/^use when\b/i, /^use this\b/i, /^use it\b/i, /^say this\b/i, /^say when\b/i, /^said when\b/i, /^used when\b/i, /^used to\b/i, /^express /i, /^shows? /i, /^means? /i];
  for (const vc of vocabCards) {
    if (!vc.example || vc.example.trim().length < 2) continue;
    const exampleTrimmed = vc.example.trim();
    const wordTrimmed = vc.word.trim();
    if (exampleTrimmed.toLowerCase() === wordTrimmed.toLowerCase()) { copiedCount++; continue; }
    for (const pat of INSTRUCTION_PATTERNS) {
      if (pat.test(exampleTrimmed)) { instructionCount++; break; }
    }
  }
  if (copiedCount > 0 || instructionCount > 0) {
    issues.push({ detector: 'exampleCopiesWord', severity: 'medium', description: `${copiedCount} example(s) copy the word verbatim, ${instructionCount} are English instructions` });
  }
  return issues;
}

function detectTitleContentMismatch(article, vocabCards) {
  const issues = [];
  if (vocabCards.length < 3) return issues;
  const title = (article.title || '').toLowerCase();
  const langNames = Object.values(LANG_NAMES).map(n => n.toLowerCase());
  const fillerWords = new Set(['learn', 'how', 'to', 'say', 'in', 'the', 'for', 'your', 'partner', 'with', 'couples', 'love', 'romantic', 'essential', 'top', 'best', 'most', 'common', 'basic', 'important', 'guide', 'complete', 'ultimate', 'phrases', 'words', 'vocabulary', 'expressions', 'lernen', 'wie', 'man', 'sagt', 'naučte', 'jak', 'říct', 'naucz', 'mów', 'aprender', 'como', 'dizer', 'dire', 'come', 'lære', 'lär', 'dig', 'tanul', 'öğren', 'a', 'an', 'und', 'et', 'e', 'y', 'i', 'og', 'och', 'és', 've', 'die', 'der', 'das', 'les', 'des', 'del', 'della', 'la', 'le', 'el', 'los', 'las', 'il', 'lo', 'de', 'do', 'da', 'pro', 'na', 'se']);
  const nativeLangNames = ['polski', 'polsku', 'polsky', 'angličtina', 'anglicky', 'němčina', 'německy', 'français', 'francesa', 'español', 'española', 'italiano', 'italiana', 'português', 'portuguesa', 'svenska', 'norsk', 'dansk', 'magyar', 'türkçe', 'română', 'русский', 'русском', 'українська', 'ελληνικά', 'čeština', 'česky', 'dutch', 'hungarian', 'greek', 'czech', 'turkish', 'romanian', 'norwegian', 'swedish', 'danish', 'polish', 'german', 'french', 'spanish', 'italian', 'portuguese', 'english', 'russian', 'ukrainian'];
  const allFiller = new Set([...fillerWords, ...langNames, ...nativeLangNames]);
  const titleWords = title.replace(/[^a-záéíóúàâäëïîôùûüçñšžřůěťďňýąćęłńóśźżöüßåæøőűğışăâîșț\u0400-\u04FF\u0370-\u03FF]+/g, ' ').split(/\s+/).filter(w => w.length > 2 && !allFiller.has(w));
  if (titleWords.length === 0) return issues;
  let hasOverlap = false;
  for (const kw of titleWords) {
    for (const vc of vocabCards) {
      const combined = `${vc.word} ${vc.translation} ${vc.example}`.toLowerCase();
      if (combined.includes(kw)) { hasOverlap = true; break; }
    }
    if (hasOverlap) break;
  }
  if (!hasOverlap) {
    const prose = stripComponentsAndFrontmatter(article.content).toLowerCase();
    for (const kw of titleWords) {
      if (prose.includes(kw)) { hasOverlap = true; break; }
    }
  }
  if (!hasOverlap && titleWords.length >= 2) {
    issues.push({ detector: 'titleContentMismatch', severity: 'high', description: `Title topic keywords [${titleWords.join(', ')}] not found in any VocabCard or prose` });
  }
  return issues;
}

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
  for (const { re, label } of BOILERPLATE_PATTERNS) { if (re.test(content)) found.push(label); }
  if (found.length > 0) {
    issues.push({ detector: 'boilerplateText', severity: 'medium', description: `Found ${found.length} boilerplate pattern(s): ${found[0]}` });
  }
  return issues;
}

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
    issues.push({ detector: 'thinContent', severity: 'medium', description: `Extremely thin: ${proseWords} prose words, ${totalComps} components` });
  } else if (proseWords < 300 && totalComps <= 1) {
    issues.push({ detector: 'thinContent', severity: 'medium', description: `Thin: ${proseWords} prose words, ${totalComps} component(s)` });
  }
  return issues;
}

function detectEmptyOrTruncatedProps(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards.map(v => ({ ...v, type: 'VocabCard' })), ...phrases.map(p => ({ ...p, type: 'PhraseOfDay' }))];
  const evidence = [];
  for (const comp of allComponents) {
    if (!comp.word || comp.word.trim().length < 3) evidence.push({ component: comp.type, field: 'word', value: comp.word || '(empty)' });
    if (!comp.translation || comp.translation.trim().length < 2) evidence.push({ component: comp.type, field: 'translation', value: comp.translation || '(empty)' });
  }
  if (evidence.length > 0) {
    issues.push({ detector: 'emptyOrTruncatedProps', severity: 'high', description: `${evidence.length} component prop(s) are empty or suspiciously short` });
  }
  return issues;
}

function detectRemainingIPA(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  let ipaCount = 0;
  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    if (IPA_CHARS.test(comp.pronunciation)) ipaCount++;
  }
  if (ipaCount > 0) {
    issues.push({ detector: 'remainingIPA', severity: 'medium', description: `${ipaCount} pronunciation(s) still contain IPA symbols` });
  }
  return issues;
}

function detectDoubleBracketPronunciation(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  let count = 0;
  for (const comp of allComponents) {
    if (!comp.pronunciation) continue;
    if (comp.pronunciation.trim().startsWith('[')) count++;
  }
  if (count > 0) {
    issues.push({ detector: 'doubleBracketPronunciation', severity: 'low', description: `${count} pronunciation(s) start with [` });
  }
  return issues;
}

function detectPronunciationEqualsWord(article, vocabCards, phrases) {
  const issues = [];
  const allComponents = [...vocabCards, ...phrases];
  let count = 0;
  for (const comp of allComponents) {
    if (!comp.pronunciation || !comp.word) continue;
    if (comp.word.trim().length <= 3) continue;
    const pron = comp.pronunciation.trim().toLowerCase().replace(/^[/\[(]|[/\])]$/g, '');
    const word = comp.word.trim().toLowerCase();
    if (pron === word) count++;
  }
  if (count > 0) {
    issues.push({ detector: 'pronunciationEqualsWord', severity: 'medium', description: `${count} pronunciation(s) are just the word copied` });
  }
  return issues;
}

function detectImportStatements(article) {
  const issues = [];
  const content = article.content || '';
  const imports = content.match(/^import\s+\w+.*from\s+['"].*['"]/gm);
  if (imports && imports.length > 0) {
    issues.push({ detector: 'importStatementsInContent', severity: 'low', description: `${imports.length} import statement(s) still in content` });
  }
  return issues;
}

function detectLegacyProps(article) {
  const issues = [];
  const content = article.content || '';
  const polishProps = (content.match(/\bpolish=["']/gi) || []).length;
  const englishProps = (content.match(/\benglish=["']/gi) || []).length;
  if (polishProps > 0 || englishProps > 0) {
    issues.push({ detector: 'legacyProps', severity: 'low', description: `${polishProps + englishProps} legacy prop(s) found (polish=/english=)` });
  }
  return issues;
}

function detectMissingTurkishChars(article) {
  const issues = [];
  if (article.native_lang !== 'tr') return issues;
  const prose = stripComponentsAndFrontmatter(article.content);
  if (prose.length < 200) return issues;
  const turkishChars = /[çğışöüÇĞİŞÖÜ]/;
  if (!turkishChars.test(prose) && prose.length > 300) {
    issues.push({ detector: 'missingTurkishChars', severity: 'high', description: 'Turkish-native prose contains zero Turkish-specific characters' });
  }
  return issues;
}

function detectMissingNativeUmlauts(article) {
  const issues = [];
  if (article.native_lang !== 'de') return issues;
  const prose = stripComponentsAndFrontmatter(article.content);
  if (prose.length < 200) return issues;
  const substitutionPatterns = [/\bfuer\b/gi, /\bueber\b/gi, /\bSuesser?\b/gi, /\bKaetzchen\b/gi, /\bschoensten?\b/gi, /\bAusdruecke\b/gi, /\bGlueck\b/gi, /\bZaertlich/gi, /\bmuessen\b/gi, /\bkoennen\b/gi, /\bmoechte\b/gi, /\bwuerden?\b/gi];
  let substitutionCount = 0;
  for (const pat of substitutionPatterns) {
    const matches = prose.match(pat);
    if (matches) substitutionCount += matches.length;
  }
  if (substitutionCount >= 3) {
    issues.push({ detector: 'missingNativeUmlauts', severity: 'medium', description: `${substitutionCount} German umlaut substitution(s) in native prose` });
  }
  return issues;
}

function detectNativeLanguageOnlySection(article, vocabCards) {
  const issues = [];
  const tl = article.target_lang;
  const nl = article.native_lang;
  const content = article.content || '';
  const sections = content.split(/^(?=#{2,3}\s)/m);
  if (sections.length < 2) return issues;
  const CYRILLIC_RE = /[\u0400-\u04FF]/;
  const GREEK_RE = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  const CYRILLIC_LANGS = new Set(['ru', 'uk']);
  const GREEK_LANGS = new Set(['el']);
  let nativeOnlySections = 0;
  for (const section of sections) {
    if (section.trim().length < 50) continue;
    if (/<(?:VocabCard|PhraseOfDay|ConjugationTable)/i.test(section)) continue;
    const sectionProse = section.replace(/^#{2,3}\s+.*$/m, '').trim();
    if (sectionProse.length < 50) continue;
    if (CYRILLIC_LANGS.has(tl) && !CYRILLIC_LANGS.has(nl)) { if (!CYRILLIC_RE.test(sectionProse)) { nativeOnlySections++; continue; } }
    if (GREEK_LANGS.has(tl) && !GREEK_LANGS.has(nl)) { if (!GREEK_RE.test(sectionProse)) { nativeOnlySections++; continue; } }
    if (!CYRILLIC_LANGS.has(tl) && !GREEK_LANGS.has(tl) && !CYRILLIC_LANGS.has(nl) && !GREEK_LANGS.has(nl)) {
      const targetScore = scoreFunctionWords(sectionProse, tl);
      const nativeScore = scoreFunctionWords(sectionProse, nl);
      if (nativeScore > 0.15 && targetScore < 0.03 && nativeScore > targetScore * 5) nativeOnlySections++;
    }
  }
  if (nativeOnlySections >= 2) {
    issues.push({ detector: 'nativeLanguageOnlySection', severity: 'high', description: `${nativeOnlySections} section(s) contain only ${nl} prose with zero ${tl} vocabulary` });
  }
  return issues;
}

// ─── Detector Registry ───────────────────────────────────────────────────────

const ALL_DETECTORS = {
  apologyTemplateBug:        { fn: detectApologyTemplateBug,        needsVocab: true,  needsPhrases: true },
  pronunciationMismatch:     { fn: detectPronunciationMismatch,     needsVocab: true,  needsPhrases: true },
  copiedPronunciations:      { fn: detectCopiedPronunciations,      needsVocab: true,  needsPhrases: false },
  truncatedPronunciation:    { fn: detectTruncatedPronunciation,    needsVocab: true,  needsPhrases: true },
  fakePronunciation:         { fn: detectFakePronunciation,         needsVocab: true,  needsPhrases: true },
  missingDiacriticals:       { fn: detectMissingDiacriticals,       needsVocab: true,  needsPhrases: false },
  wrongLanguageExample:      { fn: detectWrongLanguageExample,      needsVocab: true,  needsPhrases: false },
  exampleCopiesWord:         { fn: detectExampleCopiesWord,         needsVocab: true,  needsPhrases: false },
  titleContentMismatch:      { fn: detectTitleContentMismatch,      needsVocab: true,  needsPhrases: false },
  boilerplateText:           { fn: detectBoilerplateText,           needsVocab: false, needsPhrases: false },
  thinContent:               { fn: detectThinContent,               needsVocab: false, needsPhrases: false },
  emptyOrTruncatedProps:     { fn: detectEmptyOrTruncatedProps,     needsVocab: true,  needsPhrases: true },
  remainingIPA:              { fn: detectRemainingIPA,              needsVocab: true,  needsPhrases: true },
  doubleBracketPronunciation:{ fn: detectDoubleBracketPronunciation,needsVocab: true,  needsPhrases: true },
  pronunciationEqualsWord:   { fn: detectPronunciationEqualsWord,   needsVocab: true,  needsPhrases: true },
  importStatementsInContent: { fn: detectImportStatements,          needsVocab: false, needsPhrases: false },
  legacyProps:               { fn: detectLegacyProps,               needsVocab: false, needsPhrases: false },
  missingTurkishChars:       { fn: detectMissingTurkishChars,       needsVocab: false, needsPhrases: false },
  missingNativeUmlauts:      { fn: detectMissingNativeUmlauts,      needsVocab: false, needsPhrases: false },
  nativeLanguageOnlySection: { fn: detectNativeLanguageOnlySection, needsVocab: true,  needsPhrases: false },
};

function scanArticle(article) {
  const vocabCards = extractAllVocabCards(article.content);
  const phrases = extractPhraseOfDay(article.content);
  const allIssues = [];
  for (const [name, detector] of Object.entries(ALL_DETECTORS)) {
    let issues;
    if (detector.needsVocab && detector.needsPhrases) issues = detector.fn(article, vocabCards, phrases);
    else if (detector.needsVocab) issues = detector.fn(article, vocabCards);
    else if (detector.needsPhrases) issues = detector.fn(article, [], phrases);
    else issues = detector.fn(article);
    allIssues.push(...issues);
  }
  return allIssues;
}

// ─── Extra Audit Checks ──────────────────────────────────────────────────────

function runAuditChecks(article) {
  const issues = [];
  const content = article.content || '';

  // Truncated content (abrupt ending)
  if (content.length > 100 && /[a-zA-Z]{3,}$/.test(content.trim()) && !content.trim().endsWith('.') && !content.trim().endsWith('/>')) {
    issues.push({ detector: 'truncatedContent', severity: 'high', description: 'Content appears truncated (no ending punctuation or closing tag)' });
  }

  // Repeated paragraphs (same paragraph appears 3+ times)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
  const paraMap = new Map();
  for (const p of paragraphs) {
    const key = p.trim().slice(0, 100);
    paraMap.set(key, (paraMap.get(key) || 0) + 1);
  }
  for (const [key, count] of paraMap) {
    if (count >= 3) {
      issues.push({ detector: 'repeatedContent', severity: 'high', description: `Paragraph repeated ${count} times: "${key.slice(0, 60)}..."` });
      break;
    }
  }

  // English markers in non-English native articles
  if (article.native_lang !== 'en') {
    const prose = stripComponentsAndFrontmatter(content);
    const enScore = scoreFunctionWords(prose, 'en');
    const nativeScore = scoreFunctionWords(prose, article.native_lang);
    if (enScore > 0.20 && enScore > nativeScore * 1.5 && prose.length > 200) {
      issues.push({ detector: 'englishProseInNonEnglish', severity: 'high', description: `Prose appears to be in English (score ${(enScore * 100).toFixed(0)}%) but native lang is ${article.native_lang}` });
    }
  }

  // Malformed component tags (missing closing />)
  const malformedCount = (content.match(/<VocabCard[^>]*[^/]>\s*(?!\s*<)/gi) || []).length;
  if (malformedCount > 0) {
    issues.push({ detector: 'malformedComponent', severity: 'high', description: `${malformedCount} VocabCard tag(s) may be missing self-closing />` });
  }

  return issues;
}

// ─── Fetch Articles from Supabase ────────────────────────────────────────────

async function fetchArticlesForPair(native, target) {
  const PAGE_SIZE = 1000;
  const allArticles = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('blog_articles')
      .select('id, slug, category, title, description, difficulty, content, native_lang, target_lang')
      .eq('native_lang', native)
      .eq('target_lang', target)
      .range(offset, offset + PAGE_SIZE - 1)
      .order('id');

    if (error) {
      console.error(`Supabase error: ${error.message}`);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allArticles.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allArticles;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const startTime = Date.now();

console.log(`\n${'═'.repeat(70)}`);
console.log(`  DEEP SWEEP PREP: ${NATIVE}→${TARGET} (${LANG_NAMES[NATIVE] || NATIVE} → ${LANG_NAMES[TARGET] || TARGET})`);
console.log(`${'═'.repeat(70)}`);

// 1. Fetch articles from Supabase (fresh data)
console.log(`\n  Fetching articles from Supabase...`);
const articles = await fetchArticlesForPair(NATIVE, TARGET);
console.log(`  Found: ${articles.length} articles`);

if (articles.length === 0) {
  console.log('  No articles found for this pair. Exiting.');
  process.exit(0);
}

// 2. Run all detectors + audit checks on each article
console.log(`  Running 20 detectors + audit checks...`);
const articlesWithData = [];

for (const article of articles) {
  const detectedIssues = [
    ...scanArticle(article),
    ...runAuditChecks(article),
  ];

  articlesWithData.push({
    id: article.id,
    slug: article.slug,
    category: article.category,
    title: article.title,
    description: article.description,
    difficulty: article.difficulty,
    content: article.content,
    detectedIssues,
  });
}

// 3. Sort by issue count descending (worst articles first)
articlesWithData.sort((a, b) => b.detectedIssues.length - a.detectedIssues.length);

// Count stats
const withIssues = articlesWithData.filter(a => a.detectedIssues.length > 0).length;
const totalIssues = articlesWithData.reduce((sum, a) => sum + a.detectedIssues.length, 0);
const criticalCount = articlesWithData.reduce((sum, a) => sum + a.detectedIssues.filter(i => i.severity === 'critical').length, 0);
const highCount = articlesWithData.reduce((sum, a) => sum + a.detectedIssues.filter(i => i.severity === 'high').length, 0);

console.log(`  With issues: ${withIssues}/${articles.length} (${((withIssues / articles.length) * 100).toFixed(0)}%)`);
console.log(`  Total issues: ${totalIssues} (${criticalCount} critical, ${highCount} high)`);

// 4. Dynamic batch sizing
const batchCount = Math.min(MAX_AGENTS, Math.max(4, Math.ceil(articles.length / 6)));
const batchSize = Math.ceil(articles.length / batchCount);

console.log(`\n  Batch config: ${batchCount} batches of ~${batchSize} articles each`);

// 5. Write batch files
const pairDir = path.join(__dirname, 'data', 'deep-sweep', `${NATIVE}-${TARGET}`);
fs.mkdirSync(pairDir, { recursive: true });

const batches = [];
for (let i = 0; i < batchCount; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, articlesWithData.length);
  const batchArticles = articlesWithData.slice(start, end);
  if (batchArticles.length === 0) continue;

  const batchId = `batch-${String(i + 1).padStart(3, '0')}`;
  const batchData = {
    batchId,
    pair: { native: NATIVE, target: TARGET },
    batchIndex: i + 1,
    totalBatches: batchCount,
    articles: batchArticles,
  };

  const batchPath = path.join(pairDir, `${batchId}.json`);
  fs.writeFileSync(batchPath, JSON.stringify(batchData, null, 2));

  const batchIssues = batchArticles.reduce((sum, a) => sum + a.detectedIssues.length, 0);
  console.log(`  ${batchId}: ${batchArticles.length} articles, ${batchIssues} detected issues`);

  batches.push({
    batchId,
    articleCount: batchArticles.length,
    issueCount: batchIssues,
    file: `${batchId}.json`,
  });
}

// 6. Write manifest
const manifest = {
  pair: { native: NATIVE, target: TARGET },
  nativeName: LANG_NAMES[NATIVE] || NATIVE,
  targetName: LANG_NAMES[TARGET] || TARGET,
  preparedAt: new Date().toISOString(),
  totalArticles: articles.length,
  articlesWithIssues: withIssues,
  totalDetectedIssues: totalIssues,
  issueSummary: {
    critical: criticalCount,
    high: highCount,
    medium: articlesWithData.reduce((sum, a) => sum + a.detectedIssues.filter(i => i.severity === 'medium').length, 0),
    low: articlesWithData.reduce((sum, a) => sum + a.detectedIssues.filter(i => i.severity === 'low').length, 0),
  },
  batchConfig: {
    maxAgents: MAX_AGENTS,
    batchCount: batches.length,
    batchSize,
  },
  batches,
};

const manifestPath = path.join(pairDir, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

// 7. Update progress tracker
const progressPath = path.join(__dirname, 'data', 'deep-sweep', 'progress.json');
let progress = { lastUpdated: null, pairs: {}, globalStats: { totalPairs: 306, completed: 0, inProgress: 0, totalArticlesReviewed: 0, totalFixed: 0 } };
if (fs.existsSync(progressPath)) {
  try { progress = JSON.parse(fs.readFileSync(progressPath, 'utf-8')); } catch {}
}

progress.lastUpdated = new Date().toISOString();
progress.pairs[`${NATIVE}-${TARGET}`] = {
  status: 'prepared',
  totalArticles: articles.length,
  totalBatches: batches.length,
  batchesReviewed: 0,
  batchesApplied: 0,
  reviewed: { clean: 0, fixed: 0, needsHuman: 0 },
  applied: { articles: 0, failed: {} },
  issueSummary: {},
};

fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));

const duration = ((Date.now() - startTime) / 1000).toFixed(1);

console.log(`\n${'═'.repeat(70)}`);
console.log(`  PREP COMPLETE`);
console.log(`${'═'.repeat(70)}`);
console.log(`  Output: ${pairDir}/`);
console.log(`  Manifest: manifest.json`);
console.log(`  Batches: ${batches.length} files (batch-001.json ... batch-${String(batches.length).padStart(3, '0')}.json)`);
console.log(`  Duration: ${duration}s`);
console.log(`\n  Next: Spawn ${batches.length} Opus agents to review batches`);
console.log(`${'═'.repeat(70)}\n`);
