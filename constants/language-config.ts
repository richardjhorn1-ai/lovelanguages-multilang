// Language Configuration for Multi-Language Support
// Central source of truth for all 18 supported languages
// Every API endpoint, component, and prompt template imports from this file

export interface LanguageGrammar {
  hasGender: boolean;
  genderTypes?: ('masculine' | 'feminine' | 'neuter' | 'common')[];
  hasCases: boolean;
  caseCount?: number;
  caseNames?: string[];
  hasConjugation: boolean;
  conjugationPersons?: string[];
  hasArticles: boolean;
  articleTypes?: ('definite' | 'indefinite' | 'partitive')[];
  // Language-specific grammar notes
  notes?: string;
}

export interface LanguageConfig {
  code: string;           // ISO 639-1 code
  name: string;           // English name
  nativeName: string;     // Name in that language
  flag: string;           // Emoji flag
  direction: 'ltr' | 'rtl';

  // Text-to-Speech
  ttsCode: string;        // Google Cloud TTS language code
  ttsVoice: string;       // Preferred voice name

  // Grammar features (affects schema generation)
  grammar: LanguageGrammar;

  // Special characters for diacritic tolerance
  specialChars: string[];

  // Example phrases (for onboarding/demos)
  examples: {
    hello: string;
    iLoveYou: string;
    thankYou: string;
  };
}

// Complete configurations for all 18 supported languages
export const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  // ============================================================
  // ROMANCE LANGUAGES
  // ============================================================

  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr',
    ttsCode: 'en-GB',
    ttsVoice: 'en-GB-Wavenet-A',
    grammar: {
      hasGender: false,
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['I', 'you', 'he/she/it', 'we', 'you (pl)', 'they'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Minimal conjugation - mainly 3rd person singular differs'
    },
    specialChars: [],
    examples: {
      hello: 'Hello',
      iLoveYou: 'I love you',
      thankYou: 'Thank you'
    }
  },

  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr',
    ttsCode: 'es-ES',
    ttsVoice: 'es-ES-Wavenet-B',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['yo', 'tú', 'él/ella/usted', 'nosotros', 'vosotros', 'ellos/ustedes'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Extensive verb conjugation with subjunctive mood'
    },
    specialChars: ['á', 'é', 'í', 'ó', 'ú', 'ü', 'ñ', '¿', '¡'],
    examples: {
      hello: 'Hola',
      iLoveYou: 'Te quiero',
      thankYou: 'Gracias'
    }
  },

  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    direction: 'ltr',
    ttsCode: 'fr-FR',
    ttsVoice: 'fr-FR-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['je', 'tu', 'il/elle/on', 'nous', 'vous', 'ils/elles'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite', 'partitive'],
      notes: 'Partitive articles (du, de la) and liaisons'
    },
    specialChars: ['à', 'â', 'ç', 'é', 'è', 'ê', 'ë', 'î', 'ï', 'ô', 'ù', 'û', 'ü', 'ÿ', 'œ', 'æ'],
    examples: {
      hello: 'Bonjour',
      iLoveYou: "Je t'aime",
      thankYou: 'Merci'
    }
  },

  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    direction: 'ltr',
    ttsCode: 'it-IT',
    ttsVoice: 'it-IT-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['io', 'tu', 'lui/lei/Lei', 'noi', 'voi', 'loro'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Article forms vary by following sound (il/lo/la/l\')'
    },
    specialChars: ['à', 'è', 'é', 'ì', 'ò', 'ù'],
    examples: {
      hello: 'Ciao',
      iLoveYou: 'Ti amo',
      thankYou: 'Grazie'
    }
  },

  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    direction: 'ltr',
    ttsCode: 'pt-PT',
    ttsVoice: 'pt-PT-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['eu', 'tu', 'ele/ela/você', 'nós', 'vós', 'eles/vocês'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Personal infinitive is unique to Portuguese'
    },
    specialChars: ['á', 'à', 'â', 'ã', 'ç', 'é', 'ê', 'í', 'ó', 'ô', 'õ', 'ú'],
    examples: {
      hello: 'Olá',
      iLoveYou: 'Eu te amo',
      thankYou: 'Obrigado'
    }
  },

  ro: {
    code: 'ro',
    name: 'Romanian',
    nativeName: 'Română',
    flag: '🇷🇴',
    direction: 'ltr',
    ttsCode: 'ro-RO',
    ttsVoice: 'ro-RO-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 5,
      caseNames: ['nominativ', 'acuzativ', 'genitiv', 'dativ', 'vocativ'],
      hasConjugation: true,
      conjugationPersons: ['eu', 'tu', 'el/ea', 'noi', 'voi', 'ei/ele'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Definite article is suffixed to the noun'
    },
    specialChars: ['ă', 'â', 'î', 'ș', 'ț'],
    examples: {
      hello: 'Bună',
      iLoveYou: 'Te iubesc',
      thankYou: 'Mulțumesc'
    }
  },

  // ============================================================
  // GERMANIC LANGUAGES
  // ============================================================

  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    direction: 'ltr',
    ttsCode: 'de-DE',
    ttsVoice: 'de-DE-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 4,
      caseNames: ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv'],
      hasConjugation: true,
      conjugationPersons: ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Compound nouns are common; adjective declension follows case/gender'
    },
    specialChars: ['ä', 'ö', 'ü', 'ß'],
    examples: {
      hello: 'Hallo',
      iLoveYou: 'Ich liebe dich',
      thankYou: 'Danke'
    }
  },

  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    direction: 'ltr',
    ttsCode: 'nl-NL',
    ttsVoice: 'nl-NL-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['common', 'neuter'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['ik', 'jij/je', 'hij/zij/het', 'wij/we', 'jullie', 'zij/ze'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Common gender (de words) vs neuter (het words); V2 word order'
    },
    specialChars: ['ë', 'ï', 'ij'],
    examples: {
      hello: 'Hallo',
      iLoveYou: 'Ik hou van jou',
      thankYou: 'Dank je'
    }
  },

  sv: {
    code: 'sv',
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    direction: 'ltr',
    ttsCode: 'sv-SE',
    ttsVoice: 'sv-SE-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['common', 'neuter'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['jag', 'du', 'han/hon/den/det', 'vi', 'ni', 'de'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Definite article is suffixed; verbs do not conjugate by person'
    },
    specialChars: ['å', 'ä', 'ö'],
    examples: {
      hello: 'Hej',
      iLoveYou: 'Jag älskar dig',
      thankYou: 'Tack'
    }
  },

  no: {
    code: 'no',
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    direction: 'ltr',
    ttsCode: 'nb-NO',
    ttsVoice: 'nb-NO-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['jeg', 'du', 'han/hun/den/det', 'vi', 'dere', 'de'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Three genders in Bokmål; definite article suffixed; verbs do not conjugate by person'
    },
    specialChars: ['æ', 'ø', 'å'],
    examples: {
      hello: 'Hei',
      iLoveYou: 'Jeg elsker deg',
      thankYou: 'Takk'
    }
  },

  da: {
    code: 'da',
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '🇩🇰',
    direction: 'ltr',
    ttsCode: 'da-DK',
    ttsVoice: 'da-DK-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['common', 'neuter'],
      hasCases: false,
      hasConjugation: true,
      conjugationPersons: ['jeg', 'du', 'han/hun/den/det', 'vi', 'I', 'de'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Definite article suffixed; stød (glottal stop) affects pronunciation'
    },
    specialChars: ['æ', 'ø', 'å'],
    examples: {
      hello: 'Hej',
      iLoveYou: 'Jeg elsker dig',
      thankYou: 'Tak'
    }
  },

  // ============================================================
  // SLAVIC LANGUAGES
  // ============================================================

  pl: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    direction: 'ltr',
    ttsCode: 'pl-PL',
    ttsVoice: 'pl-PL-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 7,
      caseNames: ['mianownik', 'dopełniacz', 'celownik', 'biernik', 'narzędnik', 'miejscownik', 'wołacz'],
      hasConjugation: true,
      conjugationPersons: ['ja', 'ty', 'on/ona/ono', 'my', 'wy', 'oni/one'],
      hasArticles: false,
      notes: 'Complex case and gender system; aspect pairs (imperfective/perfective)'
    },
    specialChars: ['ą', 'ć', 'ę', 'ł', 'ń', 'ó', 'ś', 'ź', 'ż'],
    examples: {
      hello: 'Cześć',
      iLoveYou: 'Kocham cię',
      thankYou: 'Dziękuję'
    }
  },

  cs: {
    code: 'cs',
    name: 'Czech',
    nativeName: 'Čeština',
    flag: '🇨🇿',
    direction: 'ltr',
    ttsCode: 'cs-CZ',
    ttsVoice: 'cs-CZ-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 7,
      caseNames: ['nominativ', 'genitiv', 'dativ', 'akuzativ', 'vokativ', 'lokál', 'instrumentál'],
      hasConjugation: true,
      conjugationPersons: ['já', 'ty', 'on/ona/ono', 'my', 'vy', 'oni/ony/ona'],
      hasArticles: false,
      notes: 'Animate vs inanimate masculine distinction; aspect pairs'
    },
    specialChars: ['á', 'č', 'ď', 'é', 'ě', 'í', 'ň', 'ó', 'ř', 'š', 'ť', 'ú', 'ů', 'ý', 'ž'],
    examples: {
      hello: 'Ahoj',
      iLoveYou: 'Miluji tě',
      thankYou: 'Děkuji'
    }
  },

  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    direction: 'ltr',
    ttsCode: 'ru-RU',
    ttsVoice: 'ru-RU-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 6,
      caseNames: ['именительный', 'родительный', 'дательный', 'винительный', 'творительный', 'предложный'],
      hasConjugation: true,
      conjugationPersons: ['я', 'ты', 'он/она/оно', 'мы', 'вы', 'они'],
      hasArticles: false,
      notes: 'Cyrillic alphabet; animate accusative = genitive; aspect pairs'
    },
    specialChars: ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'],
    examples: {
      hello: 'Привет',
      iLoveYou: 'Я тебя люблю',
      thankYou: 'Спасибо'
    }
  },

  uk: {
    code: 'uk',
    name: 'Ukrainian',
    nativeName: 'Українська',
    flag: '🇺🇦',
    direction: 'ltr',
    ttsCode: 'uk-UA',
    ttsVoice: 'uk-UA-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 7,
      caseNames: ['називний', 'родовий', 'давальний', 'знахідний', 'орудний', 'місцевий', 'кличний'],
      hasConjugation: true,
      conjugationPersons: ['я', 'ти', 'він/вона/воно', 'ми', 'ви', 'вони'],
      hasArticles: false,
      notes: 'Cyrillic alphabet (differs from Russian); vocative case actively used; aspect pairs'
    },
    specialChars: ['а', 'б', 'в', 'г', 'ґ', 'д', 'е', 'є', 'ж', 'з', 'и', 'і', 'ї', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ь', 'ю', 'я'],
    examples: {
      hello: 'Привіт',
      iLoveYou: 'Я тебе кохаю',
      thankYou: 'Дякую'
    }
  },

  // ============================================================
  // OTHER EUROPEAN LANGUAGES
  // ============================================================

  el: {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    flag: '🇬🇷',
    direction: 'ltr',
    ttsCode: 'el-GR',
    ttsVoice: 'el-GR-Wavenet-A',
    grammar: {
      hasGender: true,
      genderTypes: ['masculine', 'feminine', 'neuter'],
      hasCases: true,
      caseCount: 4,
      caseNames: ['ονομαστική', 'γενική', 'αιτιατική', 'κλητική'],
      hasConjugation: true,
      conjugationPersons: ['εγώ', 'εσύ', 'αυτός/αυτή/αυτό', 'εμείς', 'εσείς', 'αυτοί/αυτές/αυτά'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Greek alphabet; definite article declines for case/gender/number'
    },
    specialChars: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'ς', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω', 'ά', 'έ', 'ή', 'ί', 'ό', 'ύ', 'ώ', 'ϊ', 'ϋ'],
    examples: {
      hello: 'Γεια σου',
      iLoveYou: 'Σ\'αγαπώ',
      thankYou: 'Ευχαριστώ'
    }
  },

  hu: {
    code: 'hu',
    name: 'Hungarian',
    nativeName: 'Magyar',
    flag: '🇭🇺',
    direction: 'ltr',
    ttsCode: 'hu-HU',
    ttsVoice: 'hu-HU-Wavenet-A',
    grammar: {
      hasGender: false,
      hasCases: true,
      caseCount: 18,
      caseNames: ['alanyeset', 'tárgyeset', 'birtokos', 'részeseset', 'eszközhatározó', 'okhatározó',
                  'helyhatározók (inessivus)', 'helyhatározók (illativus)', 'helyhatározók (elativus)',
                  'helyhatározók (superessivus)', 'helyhatározók (sublativus)', 'helyhatározók (delativus)',
                  'helyhatározók (adessivus)', 'helyhatározók (allativus)', 'helyhatározók (ablativus)',
                  'állapothatározó', 'véghatározó', 'módhatározó'],
      hasConjugation: true,
      conjugationPersons: ['én', 'te', 'ő', 'mi', 'ti', 'ők'],
      hasArticles: true,
      articleTypes: ['definite', 'indefinite'],
      notes: 'Agglutinative language with extensive case system; vowel harmony; definite vs indefinite conjugation'
    },
    specialChars: ['á', 'é', 'í', 'ó', 'ö', 'ő', 'ú', 'ü', 'ű'],
    examples: {
      hello: 'Szia',
      iLoveYou: 'Szeretlek',
      thankYou: 'Köszönöm'
    }
  },

  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    direction: 'ltr',
    ttsCode: 'tr-TR',
    ttsVoice: 'tr-TR-Wavenet-A',
    grammar: {
      hasGender: false,
      hasCases: true,
      caseCount: 6,
      caseNames: ['yalın', 'belirtme', 'yönelme', 'bulunma', 'ayrılma', 'tamlayan'],
      hasConjugation: true,
      conjugationPersons: ['ben', 'sen', 'o', 'biz', 'siz', 'onlar'],
      hasArticles: false,
      notes: 'Agglutinative language; vowel harmony (front/back, rounded/unrounded); SOV word order'
    },
    specialChars: ['ç', 'ğ', 'ı', 'İ', 'ö', 'ş', 'ü'],
    examples: {
      hello: 'Merhaba',
      iLoveYou: 'Seni seviyorum',
      thankYou: 'Teşekkür ederim'
    }
  }
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get the full configuration for a language code
 */
export function getLanguageConfig(code: string): LanguageConfig | undefined {
  return LANGUAGE_CONFIGS[code];
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code: string): boolean {
  return code in LANGUAGE_CONFIGS;
}

/**
 * Get all language configurations as an array
 */
export function getAllLanguages(): LanguageConfig[] {
  return Object.values(LANGUAGE_CONFIGS);
}

/**
 * Get all language codes
 */
export function getAllLanguageCodes(): string[] {
  return Object.keys(LANGUAGE_CONFIGS);
}

/**
 * Get the English name of a language
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_CONFIGS[code]?.name ?? code;
}

/**
 * Get the emoji flag for a language
 */
export function getLanguageFlag(code: string): string {
  return LANGUAGE_CONFIGS[code]?.flag ?? '🏳️';
}

/**
 * Get the native name of a language
 */
export function getLanguageNativeName(code: string): string {
  return LANGUAGE_CONFIGS[code]?.nativeName ?? code;
}

/**
 * Get the TTS language code (for Google Cloud TTS)
 */
export function getTTSLangCode(code: string): string {
  return LANGUAGE_CONFIGS[code]?.ttsCode ?? 'en-US';
}

/**
 * Get the preferred TTS voice name
 */
export function getTTSVoice(code: string): string {
  return LANGUAGE_CONFIGS[code]?.ttsVoice ?? 'en-US-Wavenet-A';
}

/**
 * Get special characters for a language (diacritics, etc.)
 */
export function getSpecialChars(code: string): string[] {
  return LANGUAGE_CONFIGS[code]?.specialChars ?? [];
}

/**
 * Get conjugation persons for a language (in that language)
 */
export function getConjugationPersons(code: string): string[] {
  return LANGUAGE_CONFIGS[code]?.grammar.conjugationPersons ?? [];
}

/**
 * Get case names for a language (in that language)
 */
export function getCaseNames(code: string): string[] {
  return LANGUAGE_CONFIGS[code]?.grammar.caseNames ?? [];
}

/**
 * Check if a language has grammatical gender
 */
export function hasGrammaticalGender(code: string): boolean {
  return LANGUAGE_CONFIGS[code]?.grammar.hasGender ?? false;
}

/**
 * Check if a language has grammatical cases
 */
export function hasGrammaticalCases(code: string): boolean {
  return LANGUAGE_CONFIGS[code]?.grammar.hasCases ?? false;
}

/**
 * Check if a language has articles
 */
export function hasArticles(code: string): boolean {
  return LANGUAGE_CONFIGS[code]?.grammar.hasArticles ?? false;
}

/**
 * Get gender types for a language
 */
export function getGenderTypes(code: string): string[] {
  return LANGUAGE_CONFIGS[code]?.grammar.genderTypes ?? [];
}

/**
 * Get languages grouped by family for UI display
 */
export function getLanguagesByFamily(): Record<string, LanguageConfig[]> {
  const romance = ['es', 'fr', 'it', 'pt', 'ro'];
  const germanic = ['en', 'de', 'nl', 'sv', 'no', 'da'];
  const slavic = ['pl', 'cs', 'ru', 'uk'];
  const other = ['el', 'hu', 'tr'];

  return {
    'Romance': romance.map(code => LANGUAGE_CONFIGS[code]),
    'Germanic': germanic.map(code => LANGUAGE_CONFIGS[code]),
    'Slavic': slavic.map(code => LANGUAGE_CONFIGS[code]),
    'Other': other.map(code => LANGUAGE_CONFIGS[code])
  };
}

/**
 * Get example phrases for a language
 */
export function getExamplePhrases(code: string): { hello: string; iLoveYou: string; thankYou: string } {
  return LANGUAGE_CONFIGS[code]?.examples ?? { hello: 'Hello', iLoveYou: 'I love you', thankYou: 'Thank you' };
}

// ============================================================
// TYPE EXPORTS
// ============================================================

/**
 * Union type of all supported language codes
 */
export type LanguageCode = keyof typeof LANGUAGE_CONFIGS;

/**
 * Array of all language codes for iteration
 */
export const SUPPORTED_LANGUAGE_CODES: LanguageCode[] = Object.keys(LANGUAGE_CONFIGS) as LanguageCode[];

/**
 * Default language (for fallbacks)
 */
export const DEFAULT_LANGUAGE: LanguageCode = 'en';
