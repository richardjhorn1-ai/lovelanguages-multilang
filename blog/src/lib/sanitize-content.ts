/**
 * Sanitize article content that has MDX component artifacts
 *
 * Handles:
 * - Import statements (remove entirely)
 * - Broken component tags like <PhraseOfDay split across <p> tags
 * - Raw component tags that weren't processed
 */

export function sanitizeArticleContent(content: string): string {
  if (!content) return '';

  let sanitized = content;

  // Remove import statements (both raw and HTML-escaped)
  sanitized = sanitized.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  sanitized = sanitized.replace(/<p>import\s+.*?<\/p>/gi, '');

  // Remove broken component opening tags
  // Pattern: <ComponentName or <ComponentName followed by attributes split into <p> tags
  sanitized = sanitized.replace(/<(PhraseOfDay|VocabCard|CultureTip|CTA|QuickFire)[^>]*>/gi, '');
  sanitized = sanitized.replace(/<\/(PhraseOfDay|VocabCard|CultureTip|CTA|QuickFire)>/gi, '');

  // Clean up attribute lines that got converted to paragraphs
  // Pattern: <p>word="..." or <p>translation="..." etc.
  sanitized = sanitized.replace(/<p>\s*(word|translation|pronunciation|context|tip|phrase|meaning|note|culture)\s*=\s*"[^"]*"\s*<\/p>/gi, '');

  // Remove standalone /> that were part of self-closing components
  sanitized = sanitized.replace(/<p>\s*\/>\s*<\/p>/gi, '');
  sanitized = sanitized.replace(/\s*\/>\s*/g, '');

  // Clean up multiple consecutive empty lines/paragraphs
  sanitized = sanitized.replace(/(<p>\s*<\/p>\s*)+/gi, '');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
