// Navigation configuration - designed for multi-language expansion
// When adding new languages, duplicate this structure per language

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
      id: 'learn',
      label: 'Learn',
      items: [
        {
          label: 'All Articles',
          href: '/learn',
          icon: '📖',
          description: 'Browse all Polish lessons'
        },
        {
          label: 'Grammar',
          href: '/learn?category=grammar',
          icon: '📝',
          description: 'Cases, conjugation, tenses'
        },
        {
          label: 'Vocabulary',
          href: '/learn?category=vocabulary',
          icon: '📚',
          description: 'Words and phrases for couples'
        },
        {
          label: 'Phrases',
          href: '/learn?category=phrases',
          icon: '💬',
          description: 'Romantic & everyday expressions'
        },
        {
          label: 'Culture',
          href: '/learn?category=culture',
          icon: '🇵🇱',
          description: 'Traditions and customs'
        },
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      items: [
        {
          label: 'Name Day Finder',
          href: '/tools/name-day-finder',
          icon: '📅',
          description: 'Find your Polish imieniny',
          badge: 'Free'
        },
        {
          label: 'All Tools',
          href: '/tools',
          icon: '🛠️',
          description: 'View all free tools'
        },
      ]
    },
    {
      id: 'compare',
      label: 'Compare',
      items: [
        {
          label: 'vs Duolingo',
          href: '/compare/love-languages-vs-duolingo',
          icon: '🦉',
          description: 'Gamified vs couple-focused'
        },
        {
          label: 'vs Babbel',
          href: '/compare/love-languages-vs-babbel',
          icon: '📚',
          description: 'Structured vs AI-powered'
        },
        {
          label: 'All Comparisons',
          href: '/compare',
          icon: '⚖️',
          description: 'See all app comparisons'
        },
      ]
    },
  ]
};

// Export default navigation (Polish for now)
export const navigation = polishNavigation;

// Helper to get navigation for a specific language (future use)
export function getNavigation(langCode: string = 'pl'): NavigationConfig {
  // When multi-language is implemented, this will return the right config
  // For now, always return Polish
  return polishNavigation;
}
