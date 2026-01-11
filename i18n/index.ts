import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import pl from './locales/pl.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import nl from './locales/nl.json';
import ru from './locales/ru.json';
import sv from './locales/sv.json';
import no from './locales/no.json';
import da from './locales/da.json';
import cs from './locales/cs.json';
import uk from './locales/uk.json';
import el from './locales/el.json';
import hu from './locales/hu.json';
import tr from './locales/tr.json';
import ro from './locales/ro.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pl: { translation: pl },
  it: { translation: it },
  pt: { translation: pt },
  nl: { translation: nl },
  ru: { translation: ru },
  sv: { translation: sv },
  no: { translation: no },
  da: { translation: da },
  cs: { translation: cs },
  uk: { translation: uk },
  el: { translation: el },
  hu: { translation: hu },
  tr: { translation: tr },
  ro: { translation: ro },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
