import DOMPurify from 'dompurify';

/**
 * Whitelist of allowed HTML tags for markdown rendering.
 * Minimal set to support formatting while preventing XSS.
 */
const ALLOWED_TAGS = ['span', 'strong', 'br', 'em', 'p', 'b', 'i'];

/**
 * Whitelist of allowed HTML attributes.
 * Only class and style for Tailwind/inline styling.
 */
const ALLOWED_ATTR = ['class', 'style'];

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * Uses DOMPurify with strict whitelisting.
 *
 * @param dirty - Raw HTML string that may contain malicious content
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'link', 'style', 'svg', 'math'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'onsubmit', 'onkeydown', 'onkeyup', 'onkeypress'],
  });
}

/**
 * Escapes HTML special characters to prevent injection.
 * Use this BEFORE applying markdown transformations.
 *
 * @param text - Raw text that may contain HTML characters
 * @returns Text with HTML characters escaped
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
