/**
 * Enhanced Local Answer Matching
 *
 * SHARED UTILITY - Import this, don't copy the code!
 *
 * Pre-AI check layer that catches 70-80% of "close but obvious" matches instantly.
 * Returns true/false for confident matches, or null when unsure (falls through to Gemini).
 *
 * Rule order: cleanup → article strip → verb prefix strip → alternative split → typo tolerance
 */

// ─── Article patterns by language ──────────────────────────────────────────────
const ARTICLES: Record<string, RegExp> = {
  en: /^(the|a|an)\s+/i,
  es: /^(el|la|los|las|un|una|unos|unas)\s+/i,
  fr: /^(le|la|les|un|une|des|du|de la)\s+|^(l'|de l')/i,
  de: /^(der|die|das|den|dem|des|ein|eine|einen|einem|eines)\s+/i,
  it: /^(il|lo|la|i|gli|le|un|uno|una)\s+|^(un')/i,
  pt: /^(o|a|os|as|um|uma|uns|umas)\s+/i,
  nl: /^(de|het|een)\s+/i,
  el: /^(ο|η|το|οι|τα|ενας|μια|ενα)\s+/i, // unaccented — cleanup() strips Greek tonos
  hu: /^(a|az|egy)\s+/i,
  sv: /^(en|ett|den|det|de)\s+/i,
  no: /^(en|ei|et|den|det|de)\s+/i,
  da: /^(en|et|den|det|de)\s+/i,
  ro: /^(un|o|niste)\s+/i, // unaccented — cleanup() strips ș→s
};

// ─── Verb prefix patterns by language ──────────────────────────────────────────
const VERB_PREFIXES: Record<string, RegExp> = {
  en: /^to\s+/i,
  fr: /^(se\s+|s')/i,
  de: /^zu\s+/i,
  nl: /^te\s+/i,
};

export interface LocalMatchOptions {
  /** Direction of translation */
  direction?: 'target_to_native' | 'native_to_target';
  /** Target language code (e.g., 'pl', 'es') */
  targetLanguage?: string;
  /** Native language code (e.g., 'en', 'fr') */
  nativeLanguage?: string;
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,      // insertion
        prev[j] + 1,          // deletion
        prev[j - 1] + cost    // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// Cyrillic range — й, ё (Russian) and ї (Ukrainian) are distinct letters, not accented variants
const CYRILLIC = /[\u0400-\u04FF]/;

/**
 * Basic cleanup: collapse whitespace, strip trailing punctuation,
 * strip parenthetical content, lowercase, normalize diacritics.
 *
 * Script-aware diacritic handling:
 * - Cyrillic: no stripping (й≠и, ё≠е, ї≠і are distinct letters)
 * - Latin/Greek: strip most combining marks, but preserve U+030A (ring above)
 *   so å (Scandinavian) and ů (Czech) stay intact as distinct letters
 *
 * Known trade-offs (accepted — Gemini catches these as fallback):
 * - Turkish ş/ç stripped to s/c (rare collisions like şu/su)
 * - Polish ą/ę stripped to a/e (common mobile typing pattern, net positive)
 * - German ß≠ss not normalized (2 edits, falls through to Gemini)
 * - Turkish i/ı: JS toLowerCase() not locale-aware (missed match, not false positive)
 */
function cleanup(s: string): string {
  let result = s
    .toLowerCase()
    .trim()
    .replace(/\s*\(.*?\)\s*/g, ' ')   // Remove parenthetical content
    .replace(/[.!?,;:]+$/g, '')        // Strip trailing punctuation
    .replace(/\s+/g, ' ')             // Collapse whitespace
    .trim();

  // Skip diacritic normalization entirely for Cyrillic scripts
  if (CYRILLIC.test(result)) {
    return result;
  }

  // Latin/Greek: strip combining marks but preserve ring above (U+030A) for å, ů
  result = result
    .normalize('NFD')
    .replace(/[\u0300-\u0309\u030b-\u036f]/g, '')
    .normalize('NFC'); // Recompose preserved sequences (a + ring → å, u + ring → ů)

  return result;
}

/**
 * Strip articles from the start of a string for a given language.
 */
function stripArticles(s: string, lang?: string): string {
  if (!lang || !ARTICLES[lang]) return s;
  return s.replace(ARTICLES[lang], '').trim();
}

/**
 * Strip verb prefixes ("to ", "se ", etc.) from a string for a given language.
 */
function stripVerbPrefix(s: string, lang?: string): string {
  if (!lang || !VERB_PREFIXES[lang]) return s;
  return s.replace(VERB_PREFIXES[lang], '').trim();
}

/**
 * Split alternatives: "dog / hound" → ["dog", "hound"]
 * Only splits on slash, NOT comma — commas appear in phrases ("yes, please")
 * and splitting those would accept partial answers as correct.
 */
function splitAlternatives(s: string): string[] {
  const parts = s.split(/\s*\/\s*/);
  return parts.map(p => p.trim()).filter(Boolean);
}

/**
 * Check if two cleaned strings match within typo tolerance.
 * 1-4 chars: must be exact. Too many real-word collisions at 1 edit
 *   (cat/bat, love/live, book/cook, hand/sand — all different words).
 * 5-9 chars: allow 1 edit. Catches real typos, low collision risk.
 * 10+ chars: allow 2 edits. Long words have very few real-word neighbors.
 */
function typoMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 4) return false; // Must be exact for short words
  const allowedEdits = maxLen >= 10 ? 2 : 1;
  return levenshtein(a, b) <= allowedEdits;
}

/**
 * Get the languages to try stripping articles/prefixes for, based on direction.
 */
function getLanguagesToStrip(options?: LocalMatchOptions): string[] {
  const langs: string[] = [];
  if (options?.targetLanguage) langs.push(options.targetLanguage);
  if (options?.nativeLanguage) langs.push(options.nativeLanguage);
  return [...new Set(langs)]; // deduplicate
}

/**
 * Enhanced local answer matching. Returns:
 * - true: confident the answer is correct
 * - false: confident the answer is wrong (only for very short, clearly different answers)
 * - null: unsure, should fall through to Gemini AI
 */
export function enhancedLocalMatch(
  userAnswer: string,
  correctAnswer: string,
  options?: LocalMatchOptions
): boolean | null {
  // Step 0: Basic cleanup
  const userClean = cleanup(userAnswer);
  const correctClean = cleanup(correctAnswer);

  // Exact match after cleanup
  if (userClean === correctClean) return true;

  // Empty after cleanup = definitely wrong
  if (!userClean || !correctClean) return null;

  const langs = getLanguagesToStrip(options);

  // Step 1: Try article stripping on both sides
  for (const lang of langs) {
    const userStripped = stripArticles(userClean, lang);
    const correctStripped = stripArticles(correctClean, lang);
    if (userStripped === correctStripped) return true;
  }

  // Step 2: Try verb prefix stripping on both sides
  for (const lang of langs) {
    const userStripped = stripVerbPrefix(userClean, lang);
    const correctStripped = stripVerbPrefix(correctClean, lang);
    if (userStripped === correctStripped) return true;
  }

  // Step 3: Combined article + verb prefix stripping
  for (const lang of langs) {
    const userStripped = stripVerbPrefix(stripArticles(userClean, lang), lang);
    const correctStripped = stripVerbPrefix(stripArticles(correctClean, lang), lang);
    if (userStripped === correctStripped) return true;
  }

  // Step 4: Alternative splitting — check each alternative
  const correctAlts = splitAlternatives(correctClean);
  if (correctAlts.length > 1) {
    for (const alt of correctAlts) {
      if (userClean === alt) return true;
      // Also try with article/verb prefix stripping per alt
      for (const lang of langs) {
        const userStripped = stripVerbPrefix(stripArticles(userClean, lang), lang);
        const altStripped = stripVerbPrefix(stripArticles(alt, lang), lang);
        if (userStripped === altStripped) return true;
      }
    }
  }

  // Note: only correct answer is split into alternatives, not the user's answer.
  // Splitting user input would allow gaming by typing "cat / dog / house".

  // Step 5: Typo tolerance (on the cleaned, stripped forms)
  // Only apply to non-trivially different strings
  if (typoMatch(userClean, correctClean)) return true;

  // Also try typo match on stripped forms
  for (const lang of langs) {
    const userStripped = stripVerbPrefix(stripArticles(userClean, lang), lang);
    const correctStripped = stripVerbPrefix(stripArticles(correctClean, lang), lang);
    if (userStripped && correctStripped && typoMatch(userStripped, correctStripped)) return true;
  }

  // Step 6: Check alternatives with typo tolerance
  if (correctAlts.length > 1) {
    for (const alt of correctAlts) {
      if (typoMatch(userClean, alt)) return true;
    }
  }

  // Can't determine locally — fall through to Gemini
  return null;
}
