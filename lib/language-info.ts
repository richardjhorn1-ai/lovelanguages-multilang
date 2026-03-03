/**
 * Language display info (flags, names) for blog pages.
 * Shared across all blog route handlers.
 */

export const LANGUAGE_INFO: Record<string, { flag: string; name: string; nativeName: string }> = {
  en: { flag: '\u{1F1EC}\u{1F1E7}', name: 'English', nativeName: 'English' },
  es: { flag: '\u{1F1EA}\u{1F1F8}', name: 'Spanish', nativeName: 'Espa\u00F1ol' },
  fr: { flag: '\u{1F1EB}\u{1F1F7}', name: 'French', nativeName: 'Fran\u00E7ais' },
  it: { flag: '\u{1F1EE}\u{1F1F9}', name: 'Italian', nativeName: 'Italiano' },
  pt: { flag: '\u{1F1F5}\u{1F1F9}', name: 'Portuguese', nativeName: 'Portugu\u00EAs' },
  ro: { flag: '\u{1F1F7}\u{1F1F4}', name: 'Romanian', nativeName: 'Rom\u00E2n\u0103' },
  de: { flag: '\u{1F1E9}\u{1F1EA}', name: 'German', nativeName: 'Deutsch' },
  nl: { flag: '\u{1F1F3}\u{1F1F1}', name: 'Dutch', nativeName: 'Nederlands' },
  sv: { flag: '\u{1F1F8}\u{1F1EA}', name: 'Swedish', nativeName: 'Svenska' },
  no: { flag: '\u{1F1F3}\u{1F1F4}', name: 'Norwegian', nativeName: 'Norsk' },
  da: { flag: '\u{1F1E9}\u{1F1F0}', name: 'Danish', nativeName: 'Dansk' },
  pl: { flag: '\u{1F1F5}\u{1F1F1}', name: 'Polish', nativeName: 'Polski' },
  cs: { flag: '\u{1F1E8}\u{1F1FF}', name: 'Czech', nativeName: '\u010Ce\u0161tina' },
  ru: { flag: '\u{1F1F7}\u{1F1FA}', name: 'Russian', nativeName: '\u0420\u0443\u0441\u0441\u043A\u0438\u0439' },
  uk: { flag: '\u{1F1FA}\u{1F1E6}', name: 'Ukrainian', nativeName: '\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430' },
  el: { flag: '\u{1F1EC}\u{1F1F7}', name: 'Greek', nativeName: '\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC' },
  hu: { flag: '\u{1F1ED}\u{1F1FA}', name: 'Hungarian', nativeName: 'Magyar' },
  tr: { flag: '\u{1F1F9}\u{1F1F7}', name: 'Turkish', nativeName: 'T\u00FCrk\u00E7e' },
};

export const VALID_LANG_CODES = Object.keys(LANGUAGE_INFO);
