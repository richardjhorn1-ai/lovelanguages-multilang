import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

/**
 * Syncs i18n language with user's native language from profile.
 * Call this once at app root level.
 */
export function useI18nSync() {
  const { i18n } = useTranslation();
  const { nativeLanguage, isLoading } = useLanguage();

  useEffect(() => {
    if (!isLoading && nativeLanguage && i18n.language !== nativeLanguage) {
      // Only change if the language is available
      if (i18n.options.resources?.[nativeLanguage]) {
        i18n.changeLanguage(nativeLanguage);
      }
      // If language not available, fallback (en) is used automatically
    }
  }, [nativeLanguage, isLoading, i18n]);
}
