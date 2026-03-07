// Navigation configuration - multi-language aware
// Supports all 18 languages from the main app

export interface NavItem {
  label: string;
  href: string;
  description?: string;
  icon?: string;
  badge?: string;
}

export interface NavSection {
  id: string;
  label: string;
  href?: string;  // Direct link (no dropdown)
  items?: NavItem[];  // Dropdown items
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  href: string;
}

export interface NavigationConfig {
  currentLanguage: LanguageConfig;
  availableLanguages: LanguageConfig[];
  sections: NavSection[];
}

// Language info for all 18 supported languages
export const LANGUAGE_INFO: Record<string, { flag: string; name: string; nativeName: string }> = {
  en: { flag: '🇬🇧', name: 'English', nativeName: 'English' },
  es: { flag: '🇪🇸', name: 'Spanish', nativeName: 'Espanol' },
  fr: { flag: '🇫🇷', name: 'French', nativeName: 'Francais' },
  it: { flag: '🇮🇹', name: 'Italian', nativeName: 'Italiano' },
  pt: { flag: '🇵🇹', name: 'Portuguese', nativeName: 'Portugues' },
  ro: { flag: '🇷🇴', name: 'Romanian', nativeName: 'Romana' },
  de: { flag: '🇩🇪', name: 'German', nativeName: 'Deutsch' },
  nl: { flag: '🇳🇱', name: 'Dutch', nativeName: 'Nederlands' },
  sv: { flag: '🇸🇪', name: 'Swedish', nativeName: 'Svenska' },
  no: { flag: '🇳🇴', name: 'Norwegian', nativeName: 'Norsk' },
  da: { flag: '🇩🇰', name: 'Danish', nativeName: 'Dansk' },
  pl: { flag: '🇵🇱', name: 'Polish', nativeName: 'Polski' },
  cs: { flag: '🇨🇿', name: 'Czech', nativeName: 'Cestina' },
  ru: { flag: '🇷🇺', name: 'Russian', nativeName: 'Russkij' },
  uk: { flag: '🇺🇦', name: 'Ukrainian', nativeName: 'Ukrainska' },
  el: { flag: '🇬🇷', name: 'Greek', nativeName: 'Ellinika' },
  hu: { flag: '🇭🇺', name: 'Hungarian', nativeName: 'Magyar' },
  tr: { flag: '🇹🇷', name: 'Turkish', nativeName: 'Turkce' },
};

// Polish navigation (current/default)
export const polishNavigation: NavigationConfig = {
  currentLanguage: {
    code: 'pl',
    name: 'Polish',
    nativeName: 'Polski',
    flag: '🇵🇱',
    href: '/'
  },
  // Future languages will be added here
  availableLanguages: [
    { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', href: '/' },
    // { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', href: '/de' },
    // { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', href: '/es' },
    // { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', href: '/fr' },
    // { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', href: '/it' },
    // { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', href: '/pt' },
  ],
  sections: [
    {
      id: 'dictionary',
      label: 'Dictionary',
      href: '/dictionary/'
    },
    {
      id: 'tools',
      label: 'Tools',
      href: '/tools/'
    },
    {
      id: 'compare',
      label: 'Compare',
      items: [
        {
          label: 'vs Duolingo',
          href: '/compare/en/love-languages-vs-duolingo/',
          icon: '🦉',
          description: 'Gamified vs couple-focused'
        },
        {
          label: 'vs Babbel',
          href: '/compare/en/love-languages-vs-babbel/',
          icon: '📚',
          description: 'Structured vs AI-powered'
        },
        {
          label: 'All Comparisons',
          href: '/compare/en/',
          icon: '⚖️',
          description: 'See all app comparisons'
        },
      ]
    },
  ]
};

// Export default navigation (Polish for now)
export const navigation = polishNavigation;

// Build navigation for any supported language
export function buildNavigation(langCode: string): NavigationConfig {
  const lang = LANGUAGE_INFO[langCode];
  if (!lang) {
    // Fallback to Polish if language not found
    return polishNavigation;
  }

  return {
    currentLanguage: {
      code: langCode,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag,
      href: `/learn/en/${langCode}/`
    },
    availableLanguages: Object.entries(LANGUAGE_INFO).map(([code, info]) => ({
      code,
      name: info.name,
      nativeName: info.nativeName,
      flag: info.flag,
      href: `/learn/en/${code}/`
    })),
    sections: [
      {
        id: 'dictionary',
        label: 'Dictionary',
        href: '/dictionary/'
      },
      {
        id: 'tools',
        label: 'Tools',
        href: '/tools/'
      },
      {
        id: 'compare',
        label: 'Compare',
        items: [
          {
            label: 'vs Duolingo',
            href: `/compare/${langCode}/love-languages-vs-duolingo/`,
            icon: '🦉',
            description: 'Gamified vs couple-focused'
          },
          {
            label: 'vs Babbel',
            href: `/compare/${langCode}/love-languages-vs-babbel/`,
            icon: '📚',
            description: 'Structured vs AI-powered'
          },
          {
            label: 'All Comparisons',
            href: `/compare/${langCode}/`,
            icon: '⚖️',
            description: 'See all app comparisons'
          },
        ]
      },
    ]
  };
}

// Helper to get navigation for a specific language
export function getNavigation(langCode: string = 'pl'): NavigationConfig {
  return buildNavigation(langCode);
}
