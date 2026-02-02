/**
 * Load couples page translations from JSON files
 */

// Import all translation files
import en from './couples-translations/en.json';
import cs from './couples-translations/cs.json';
import da from './couples-translations/da.json';
import de from './couples-translations/de.json';
import el from './couples-translations/el.json';
import es from './couples-translations/es.json';
import fr from './couples-translations/fr.json';
import hu from './couples-translations/hu.json';
import it from './couples-translations/it.json';
import nl from './couples-translations/nl.json';
import no from './couples-translations/no.json';
import pl from './couples-translations/pl.json';
import pt from './couples-translations/pt.json';
import ro from './couples-translations/ro.json';
import ru from './couples-translations/ru.json';
import sv from './couples-translations/sv.json';
import tr from './couples-translations/tr.json';
import uk from './couples-translations/uk.json';

export interface CouplesBenefit {
  emoji: string;
  title: string;
  description: string;
}

export interface CouplesTip {
  title: string;
  description: string;
}

export interface CouplesFAQ {
  question: string;
  answer: string;
}

export interface CouplesTranslation {
  page: string;
  sections: {
    hero: {
      title: string;
      subtitle: string;
    };
    whyLearnTogether: {
      sectionTitle: string;
      benefits: CouplesBenefit[];
    };
    bestLanguages: {
      sectionTitle: string;
      subtitle: string;
    };
    tips: {
      sectionTitle: string;
      items: CouplesTip[];
    };
    faqs: CouplesFAQ[];
    exploreAll: {
      title: string;
      subtitle: string;
    };
    cta: {
      title: string;
      subtitle: string;
      button: string;
    };
    footer: {
      tagline: string;
    };
  };
}

const translations: Record<string, CouplesTranslation> = {
  en,
  cs,
  da,
  de,
  el,
  es,
  fr,
  hu,
  it,
  nl,
  no,
  pl,
  pt,
  ro,
  ru,
  sv,
  tr,
  uk,
};

/**
 * Get couples page translations for a specific language
 * Falls back to English if language not found
 */
export function getCouplesTranslations(lang: string): CouplesTranslation {
  return translations[lang] || translations.en;
}

/**
 * Check if a language has couples translations
 */
export function hasCouplesTranslation(lang: string): boolean {
  return lang in translations;
}

/**
 * Get all available couples translation language codes
 */
export function getAvailableCouplesLanguages(): string[] {
  return Object.keys(translations);
}
