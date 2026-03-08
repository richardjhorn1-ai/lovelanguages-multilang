export const SITE_URL = 'https://www.lovelanguages.io';

export const VALID_LANGS = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'sv',
  'no', 'da', 'cs', 'ru', 'uk', 'el', 'hu', 'tr', 'ro',
];

export const ARTICLE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const KNOWN_LEARN_SUBROUTES = new Set(['couples-language-learning', 'topics']);

const CHAR_MAP = new Map([
  ['&', ' and '],
  ['@', ' at '],
  ['+', ' plus '],
  ['æ', 'ae'],
  ['œ', 'oe'],
  ['ø', 'o'],
  ['å', 'a'],
  ['ä', 'a'],
  ['ö', 'o'],
  ['ü', 'u'],
  ['ß', 'ss'],
  ['ð', 'd'],
  ['þ', 'th'],
  ['ł', 'l'],
  ['đ', 'd'],
  ['ı', 'i'],
  ['İ', 'i'],
  ['ş', 's'],
  ['ğ', 'g'],
  ['č', 'c'],
  ['ć', 'c'],
  ['ž', 'z'],
  ['ź', 'z'],
  ['ż', 'z'],
  ['ś', 's'],
  ['ą', 'a'],
  ['ę', 'e'],
  ['ó', 'o'],
  ['ń', 'n'],
  ['ř', 'r'],
  ['ů', 'u'],
  ['ý', 'y'],
  ['č', 'c'],
  ['š', 's'],
  ['ť', 't'],
  ['ď', 'd'],
  ['ľ', 'l'],
  ['ĺ', 'l'],
  ['ň', 'n'],
  ['ŕ', 'r'],
  ['ă', 'a'],
  ['â', 'a'],
  ['î', 'i'],
  ['ș', 's'],
  ['ş', 's'],
  ['ț', 't'],
  ['ţ', 't'],
  ['ё', 'e'],
  ['й', 'i'],
  ['х', 'kh'],
  ['ц', 'ts'],
  ['ч', 'ch'],
  ['ш', 'sh'],
  ['щ', 'shch'],
  ['ъ', ''],
  ['ы', 'y'],
  ['ь', ''],
  ['э', 'e'],
  ['ю', 'yu'],
  ['я', 'ya'],
  ['а', 'a'],
  ['б', 'b'],
  ['в', 'v'],
  ['г', 'g'],
  ['д', 'd'],
  ['е', 'e'],
  ['ж', 'zh'],
  ['з', 'z'],
  ['и', 'i'],
  ['к', 'k'],
  ['л', 'l'],
  ['м', 'm'],
  ['н', 'n'],
  ['о', 'o'],
  ['п', 'p'],
  ['р', 'r'],
  ['с', 's'],
  ['т', 't'],
  ['у', 'u'],
  ['ф', 'f'],
  ['α', 'a'],
  ['β', 'v'],
  ['γ', 'g'],
  ['δ', 'd'],
  ['ε', 'e'],
  ['ζ', 'z'],
  ['η', 'i'],
  ['θ', 'th'],
  ['ι', 'i'],
  ['κ', 'k'],
  ['λ', 'l'],
  ['μ', 'm'],
  ['ν', 'n'],
  ['ξ', 'x'],
  ['ο', 'o'],
  ['π', 'p'],
  ['ρ', 'r'],
  ['σ', 's'],
  ['ς', 's'],
  ['τ', 't'],
  ['υ', 'y'],
  ['φ', 'f'],
  ['χ', 'ch'],
  ['ψ', 'ps'],
  ['ω', 'o'],
]);

function stripCombiningMarks(input) {
  return input.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeLanguageCode(value) {
  return String(value || '').trim().toLowerCase();
}

export function normalizeArticleSlugInput(value) {
  return transliterateToAscii(String(value || ''))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

export function transliterateToAscii(input) {
  const lower = String(input || '').trim().toLowerCase();
  let output = '';

  for (const char of lower) {
    if (CHAR_MAP.has(char)) {
      output += CHAR_MAP.get(char);
      continue;
    }

    const stripped = stripCombiningMarks(char);
    if (/^[a-z0-9\s-]$/.test(stripped)) {
      output += stripped;
      continue;
    }

    output += char;
  }

  return stripCombiningMarks(output)
    .replace(/[’'`"]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugifyLocalizedTitle(input, options = {}) {
  const fallback = options.fallback || 'article';
  const suffix = options.suffix || '';

  const base = transliterateToAscii(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const fallbackSlug = transliterateToAscii(fallback)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'article';

  const suffixSlug = transliterateToAscii(suffix)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const slug = base || fallbackSlug;
  return suffixSlug ? `${slug}-${suffixSlug}` : slug;
}

export function looksLikeCanonicalSlug(slug) {
  return ARTICLE_SLUG_REGEX.test(normalizeArticleSlugInput(slug));
}

export function dedupeSlug(baseSlug, options = {}) {
  const usedSlugs = options.usedSlugs || new Set();
  const topicId = options.topicId || '';
  const articleId = options.articleId || '';

  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  const topicSuffix = slugifyLocalizedTitle(topicId, { fallback: articleId }).slice(0, 24);
  const articleSuffix = slugifyLocalizedTitle(articleId, { fallback: 'article' }).slice(0, 8);
  const candidates = [
    topicSuffix ? `${baseSlug}-${topicSuffix}` : '',
    articleSuffix ? `${baseSlug}-${articleSuffix}` : '',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!usedSlugs.has(candidate)) {
      return candidate;
    }
  }

  let counter = 2;
  while (usedSlugs.has(`${baseSlug}-${counter}`)) {
    counter += 1;
  }

  return `${baseSlug}-${counter}`;
}

export function buildArticlePath(nativeLang, targetLang, slug) {
  return `/learn/${normalizeLanguageCode(nativeLang)}/${normalizeLanguageCode(targetLang)}/${normalizeArticleSlugInput(slug)}/`;
}

export function parseLearnArticlePath(pathOrUrl) {
  const raw = String(pathOrUrl || '').trim();
  if (!raw) return null;

  let pathname = raw;
  try {
    pathname = new URL(raw).pathname;
  } catch {
    pathname = raw.split(/[?#]/)[0];
  }

  const normalizedPath = pathname.replace(/\/+$/g, '');
  const match = normalizedPath.match(/^\/learn\/([^/]+)\/([^/]+)\/([^/]+)$/i);
  if (!match) {
    return null;
  }

  const nativeLang = normalizeLanguageCode(match[1]);
  const targetLang = normalizeLanguageCode(match[2]);
  const slug = normalizeArticleSlugInput(match[3]);

  if (!VALID_LANGS.includes(nativeLang) || !VALID_LANGS.includes(targetLang)) {
    return null;
  }

  if (!slug || KNOWN_LEARN_SUBROUTES.has(slug)) {
    return null;
  }

  return {
    nativeLang,
    targetLang,
    slug,
    path: buildArticlePath(nativeLang, targetLang, slug),
  };
}

export function replaceArticleUrlsInText(input, resolveCanonicalPath, options = {}) {
  const text = String(input || '');
  if (!text) return text;

  const siteUrl = options.siteUrl || SITE_URL;
  const pattern = /(https?:\/\/www\.lovelanguages\.io)?(\/learn\/[A-Za-z]{2}\/[A-Za-z]{2}\/[^"'`\s)<\]}?#<]+\/?)([?#][^"'`\s)<\]}]*)?/g;

  return text.replace(pattern, (fullMatch, host = '', path = '', suffix = '') => {
    const parsed = parseLearnArticlePath(path);
    if (!parsed) {
      return fullMatch;
    }

    const canonicalPath = resolveCanonicalPath(parsed);
    if (!canonicalPath) {
      return fullMatch;
    }

    const normalizedCanonicalPath = canonicalPath.endsWith('/') ? canonicalPath : `${canonicalPath}/`;
    const prefix = host ? siteUrl : '';
    return `${prefix}${normalizedCanonicalPath}${suffix}`;
  });
}
