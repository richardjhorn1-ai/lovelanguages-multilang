/**
 * Language Information with Translated Names
 *
 * Each language has:
 * - code: ISO 639-1 code
 * - flag: Emoji flag
 * - name: English name (fallback)
 * - nativeName: Name in that language
 * - names: Translations of this language's name in all supported languages
 */

export interface LanguageInfo {
  code: string;
  flag: string;
  name: string;
  nativeName: string;
  names: Record<string, string>; // { en: "Spanish", de: "Spanisch", no: "Spansk", ... }
}

export const LANGUAGES: Record<string, LanguageInfo> = {
  en: {
    code: 'en',
    flag: '🇬🇧',
    name: 'English',
    nativeName: 'English',
    names: {
      en: 'English',
      es: 'Inglés',
      fr: 'Anglais',
      de: 'Englisch',
      it: 'Inglese',
      pt: 'Inglês',
      pl: 'Angielski',
      nl: 'Engels',
      ro: 'Engleză',
      ru: 'Английский',
      tr: 'İngilizce',
      uk: 'Англійська',
      sv: 'Engelska',
      no: 'Engelsk',
      da: 'Engelsk',
      cs: 'Angličtina',
      el: 'Αγγλικά',
      hu: 'Angol',
    },
  },
  es: {
    code: 'es',
    flag: '🇪🇸',
    name: 'Spanish',
    nativeName: 'Español',
    names: {
      en: 'Spanish',
      es: 'Español',
      fr: 'Espagnol',
      de: 'Spanisch',
      it: 'Spagnolo',
      pt: 'Espanhol',
      pl: 'Hiszpański',
      nl: 'Spaans',
      ro: 'Spaniolă',
      ru: 'Испанский',
      tr: 'İspanyolca',
      uk: 'Іспанська',
      sv: 'Spanska',
      no: 'Spansk',
      da: 'Spansk',
      cs: 'Španělština',
      el: 'Ισπανικά',
      hu: 'Spanyol',
    },
  },
  fr: {
    code: 'fr',
    flag: '🇫🇷',
    name: 'French',
    nativeName: 'Français',
    names: {
      en: 'French',
      es: 'Francés',
      fr: 'Français',
      de: 'Französisch',
      it: 'Francese',
      pt: 'Francês',
      pl: 'Francuski',
      nl: 'Frans',
      ro: 'Franceză',
      ru: 'Французский',
      tr: 'Fransızca',
      uk: 'Французька',
      sv: 'Franska',
      no: 'Fransk',
      da: 'Fransk',
      cs: 'Francouzština',
      el: 'Γαλλικά',
      hu: 'Francia',
    },
  },
  de: {
    code: 'de',
    flag: '🇩🇪',
    name: 'German',
    nativeName: 'Deutsch',
    names: {
      en: 'German',
      es: 'Alemán',
      fr: 'Allemand',
      de: 'Deutsch',
      it: 'Tedesco',
      pt: 'Alemão',
      pl: 'Niemiecki',
      nl: 'Duits',
      ro: 'Germană',
      ru: 'Немецкий',
      tr: 'Almanca',
      uk: 'Німецька',
      sv: 'Tyska',
      no: 'Tysk',
      da: 'Tysk',
      cs: 'Němčina',
      el: 'Γερμανικά',
      hu: 'Német',
    },
  },
  it: {
    code: 'it',
    flag: '🇮🇹',
    name: 'Italian',
    nativeName: 'Italiano',
    names: {
      en: 'Italian',
      es: 'Italiano',
      fr: 'Italien',
      de: 'Italienisch',
      it: 'Italiano',
      pt: 'Italiano',
      pl: 'Włoski',
      nl: 'Italiaans',
      ro: 'Italiană',
      ru: 'Итальянский',
      tr: 'İtalyanca',
      uk: 'Італійська',
      sv: 'Italienska',
      no: 'Italiensk',
      da: 'Italiensk',
      cs: 'Italština',
      el: 'Ιταλικά',
      hu: 'Olasz',
    },
  },
  pt: {
    code: 'pt',
    flag: '🇵🇹',
    name: 'Portuguese',
    nativeName: 'Português',
    names: {
      en: 'Portuguese',
      es: 'Portugués',
      fr: 'Portugais',
      de: 'Portugiesisch',
      it: 'Portoghese',
      pt: 'Português',
      pl: 'Portugalski',
      nl: 'Portugees',
      ro: 'Portugheză',
      ru: 'Португальский',
      tr: 'Portekizce',
      uk: 'Португальська',
      sv: 'Portugisiska',
      no: 'Portugisisk',
      da: 'Portugisisk',
      cs: 'Portugalština',
      el: 'Πορτογαλικά',
      hu: 'Portugál',
    },
  },
  pl: {
    code: 'pl',
    flag: '🇵🇱',
    name: 'Polish',
    nativeName: 'Polski',
    names: {
      en: 'Polish',
      es: 'Polaco',
      fr: 'Polonais',
      de: 'Polnisch',
      it: 'Polacco',
      pt: 'Polonês',
      pl: 'Polski',
      nl: 'Pools',
      ro: 'Poloneză',
      ru: 'Польский',
      tr: 'Lehçe',
      uk: 'Польська',
      sv: 'Polska',
      no: 'Polsk',
      da: 'Polsk',
      cs: 'Polština',
      el: 'Πολωνικά',
      hu: 'Lengyel',
    },
  },
  nl: {
    code: 'nl',
    flag: '🇳🇱',
    name: 'Dutch',
    nativeName: 'Nederlands',
    names: {
      en: 'Dutch',
      es: 'Neerlandés',
      fr: 'Néerlandais',
      de: 'Niederländisch',
      it: 'Olandese',
      pt: 'Holandês',
      pl: 'Niderlandzki',
      nl: 'Nederlands',
      ro: 'Olandeză',
      ru: 'Нидерландский',
      tr: 'Felemenkçe',
      uk: 'Нідерландська',
      sv: 'Nederländska',
      no: 'Nederlandsk',
      da: 'Nederlandsk',
      cs: 'Nizozemština',
      el: 'Ολλανδικά',
      hu: 'Holland',
    },
  },
  ro: {
    code: 'ro',
    flag: '🇷🇴',
    name: 'Romanian',
    nativeName: 'Română',
    names: {
      en: 'Romanian',
      es: 'Rumano',
      fr: 'Roumain',
      de: 'Rumänisch',
      it: 'Rumeno',
      pt: 'Romeno',
      pl: 'Rumuński',
      nl: 'Roemeens',
      ro: 'Română',
      ru: 'Румынский',
      tr: 'Rumence',
      uk: 'Румунська',
      sv: 'Rumänska',
      no: 'Rumensk',
      da: 'Rumænsk',
      cs: 'Rumunština',
      el: 'Ρουμανικά',
      hu: 'Román',
    },
  },
  ru: {
    code: 'ru',
    flag: '🇷🇺',
    name: 'Russian',
    nativeName: 'Русский',
    names: {
      en: 'Russian',
      es: 'Ruso',
      fr: 'Russe',
      de: 'Russisch',
      it: 'Russo',
      pt: 'Russo',
      pl: 'Rosyjski',
      nl: 'Russisch',
      ro: 'Rusă',
      ru: 'Русский',
      tr: 'Rusça',
      uk: 'Російська',
      sv: 'Ryska',
      no: 'Russisk',
      da: 'Russisk',
      cs: 'Ruština',
      el: 'Ρωσικά',
      hu: 'Orosz',
    },
  },
  tr: {
    code: 'tr',
    flag: '🇹🇷',
    name: 'Turkish',
    nativeName: 'Türkçe',
    names: {
      en: 'Turkish',
      es: 'Turco',
      fr: 'Turc',
      de: 'Türkisch',
      it: 'Turco',
      pt: 'Turco',
      pl: 'Turecki',
      nl: 'Turks',
      ro: 'Turcă',
      ru: 'Турецкий',
      tr: 'Türkçe',
      uk: 'Турецька',
      sv: 'Turkiska',
      no: 'Tyrkisk',
      da: 'Tyrkisk',
      cs: 'Turečtina',
      el: 'Τουρκικά',
      hu: 'Török',
    },
  },
  uk: {
    code: 'uk',
    flag: '🇺🇦',
    name: 'Ukrainian',
    nativeName: 'Українська',
    names: {
      en: 'Ukrainian',
      es: 'Ucraniano',
      fr: 'Ukrainien',
      de: 'Ukrainisch',
      it: 'Ucraino',
      pt: 'Ucraniano',
      pl: 'Ukraiński',
      nl: 'Oekraïens',
      ro: 'Ucraineană',
      ru: 'Украинский',
      tr: 'Ukraynaca',
      uk: 'Українська',
      sv: 'Ukrainska',
      no: 'Ukrainsk',
      da: 'Ukrainsk',
      cs: 'Ukrajinština',
      el: 'Ουκρανικά',
      hu: 'Ukrán',
    },
  },
  sv: {
    code: 'sv',
    flag: '🇸🇪',
    name: 'Swedish',
    nativeName: 'Svenska',
    names: {
      en: 'Swedish',
      es: 'Sueco',
      fr: 'Suédois',
      de: 'Schwedisch',
      it: 'Svedese',
      pt: 'Sueco',
      pl: 'Szwedzki',
      nl: 'Zweeds',
      ro: 'Suedeză',
      ru: 'Шведский',
      tr: 'İsveççe',
      uk: 'Шведська',
      sv: 'Svenska',
      no: 'Svensk',
      da: 'Svensk',
      cs: 'Švédština',
      el: 'Σουηδικά',
      hu: 'Svéd',
    },
  },
  no: {
    code: 'no',
    flag: '🇳🇴',
    name: 'Norwegian',
    nativeName: 'Norsk',
    names: {
      en: 'Norwegian',
      es: 'Noruego',
      fr: 'Norvégien',
      de: 'Norwegisch',
      it: 'Norvegese',
      pt: 'Norueguês',
      pl: 'Norweski',
      nl: 'Noors',
      ro: 'Norvegiană',
      ru: 'Норвежский',
      tr: 'Norveççe',
      uk: 'Норвезька',
      sv: 'Norska',
      no: 'Norsk',
      da: 'Norsk',
      cs: 'Norština',
      el: 'Νορβηγικά',
      hu: 'Norvég',
    },
  },
  da: {
    code: 'da',
    flag: '🇩🇰',
    name: 'Danish',
    nativeName: 'Dansk',
    names: {
      en: 'Danish',
      es: 'Danés',
      fr: 'Danois',
      de: 'Dänisch',
      it: 'Danese',
      pt: 'Dinamarquês',
      pl: 'Duński',
      nl: 'Deens',
      ro: 'Daneză',
      ru: 'Датский',
      tr: 'Danca',
      uk: 'Данська',
      sv: 'Danska',
      no: 'Dansk',
      da: 'Dansk',
      cs: 'Dánština',
      el: 'Δανικά',
      hu: 'Dán',
    },
  },
  cs: {
    code: 'cs',
    flag: '🇨🇿',
    name: 'Czech',
    nativeName: 'Čeština',
    names: {
      en: 'Czech',
      es: 'Checo',
      fr: 'Tchèque',
      de: 'Tschechisch',
      it: 'Ceco',
      pt: 'Tcheco',
      pl: 'Czeski',
      nl: 'Tsjechisch',
      ro: 'Cehă',
      ru: 'Чешский',
      tr: 'Çekçe',
      uk: 'Чеська',
      sv: 'Tjeckiska',
      no: 'Tsjekkisk',
      da: 'Tjekkisk',
      cs: 'Čeština',
      el: 'Τσεχικά',
      hu: 'Cseh',
    },
  },
  el: {
    code: 'el',
    flag: '🇬🇷',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    names: {
      en: 'Greek',
      es: 'Griego',
      fr: 'Grec',
      de: 'Griechisch',
      it: 'Greco',
      pt: 'Grego',
      pl: 'Grecki',
      nl: 'Grieks',
      ro: 'Greacă',
      ru: 'Греческий',
      tr: 'Yunanca',
      uk: 'Грецька',
      sv: 'Grekiska',
      no: 'Gresk',
      da: 'Græsk',
      cs: 'Řečtina',
      el: 'Ελληνικά',
      hu: 'Görög',
    },
  },
  hu: {
    code: 'hu',
    flag: '🇭🇺',
    name: 'Hungarian',
    nativeName: 'Magyar',
    names: {
      en: 'Hungarian',
      es: 'Húngaro',
      fr: 'Hongrois',
      de: 'Ungarisch',
      it: 'Ungherese',
      pt: 'Húngaro',
      pl: 'Węgierski',
      nl: 'Hongaars',
      ro: 'Maghiară',
      ru: 'Венгерский',
      tr: 'Macarca',
      uk: 'Угорська',
      sv: 'Ungerska',
      no: 'Ungarsk',
      da: 'Ungarsk',
      cs: 'Maďarština',
      el: 'Ουγγρικά',
      hu: 'Magyar',
    },
  },
};

/**
 * Get language info by code
 */
export function getLanguage(code: string): LanguageInfo | undefined {
  return LANGUAGES[code];
}

/**
 * Get all language codes
 */
export function getAllLanguageCodes(): string[] {
  return Object.keys(LANGUAGES);
}

/**
 * Get language name in a specific language
 * @param langCode - The language to get the name of (e.g., 'es' for Spanish)
 * @param inLang - The language to return the name in (e.g., 'no' for Norwegian)
 * @returns The translated name (e.g., 'Spansk') or English fallback
 */
export function getLanguageName(langCode: string, inLang: string): string {
  const lang = LANGUAGES[langCode];
  if (!lang) return langCode;
  return lang.names[inLang] || lang.names.en || lang.name;
}

/**
 * Get language info with name translated to a specific language
 */
export function getLanguageForDisplay(langCode: string, displayLang: string): {
  code: string;
  flag: string;
  name: string;
  nativeName: string;
} {
  const lang = LANGUAGES[langCode];
  if (!lang) {
    return { code: langCode, flag: '🏳️', name: langCode, nativeName: langCode };
  }
  return {
    code: lang.code,
    flag: lang.flag,
    name: getLanguageName(langCode, displayLang),
    nativeName: lang.nativeName,
  };
}

/**
 * Get all languages formatted for display in a specific language
 */
export function getAllLanguagesForDisplay(displayLang: string): Array<{
  code: string;
  flag: string;
  name: string;
  nativeName: string;
}> {
  return Object.keys(LANGUAGES).map(code => getLanguageForDisplay(code, displayLang));
}

/**
 * Supported native languages (languages we have UI translations for)
 */
export const SUPPORTED_NATIVE_LANGS = [
  'en', 'es', 'fr', 'de', 'it', 'pt', 'pl', 'nl', 'ro', 'ru', 'tr', 'uk', 'sv', 'no', 'da', 'cs', 'el', 'hu'
];
