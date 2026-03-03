/**
 * Sanitize article content_html
 *
 * After Phase 3 migration, content_html contains standard HTML with styled divs
 * for components (VocabCard, CultureTip, etc.). This sanitizer only needs to:
 * - Remove any stray import statements (safety net)
 * - Clean up empty paragraphs and excessive whitespace
 */

export function sanitizeArticleContent(content: string): string {
  if (!content) return '';

  let sanitized = content;

  // Remove import statements (safety net — should already be stripped by migration)
  sanitized = sanitized.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  sanitized = sanitized.replace(/<p>import\s+.*?<\/p>/gi, '');

  // Clean up multiple consecutive empty lines/paragraphs
  sanitized = sanitized.replace(/(<p>\s*<\/p>\s*)+/gi, '');
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  // Convert h1 tags to h2 (page should only have one h1 — the article title rendered by the layout)
  sanitized = sanitized.replace(/<h1([^>]*)>/gi, '<h2$1>').replace(/<\/h1>/gi, '</h2>');

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}
