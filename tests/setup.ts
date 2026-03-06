import '@testing-library/jest-dom';
import i18n from 'i18next';
import en from '../i18n/locales/en.json';

// Initialize i18n for tests (ErrorBoundary and other components use i18n.t() directly)
i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});
