// Demo words for landing page game showcase
// Rich vocabulary for all 18 supported languages

import { LANGUAGE_CONFIGS } from '../../constants/language-config';

export interface DemoWord {
  id: string;
  word: string;
  translation: string;
  type: 'verb' | 'noun' | 'adjective' | 'phrase';
}

// Shuffle array utility
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Comprehensive demo vocabulary with translations in all 18 languages
// Format: { conceptKey: { languageCode: translation } }
const DEMO_VOCABULARY: Record<string, { translations: Record<string, string>; type: DemoWord['type'] }> = {
  hello: {
    translations: {
      en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', pl: 'Cześć',
      it: 'Ciao', pt: 'Olá', nl: 'Hallo', ru: 'Привет', sv: 'Hej',
      no: 'Hei', da: 'Hej', cs: 'Ahoj', uk: 'Привіт', el: 'Γεια σου',
      hu: 'Szia', tr: 'Merhaba', ro: 'Bună'
    },
    type: 'phrase'
  },
  iLoveYou: {
    translations: {
      en: 'I love you', es: 'Te quiero', fr: "Je t'aime", de: 'Ich liebe dich', pl: 'Kocham cię',
      it: 'Ti amo', pt: 'Eu te amo', nl: 'Ik hou van jou', ru: 'Я тебя люблю', sv: 'Jag älskar dig',
      no: 'Jeg elsker deg', da: 'Jeg elsker dig', cs: 'Miluji tě', uk: 'Я тебе кохаю', el: "Σ'αγαπώ",
      hu: 'Szeretlek', tr: 'Seni seviyorum', ro: 'Te iubesc'
    },
    type: 'phrase'
  },
  thankYou: {
    translations: {
      en: 'Thank you', es: 'Gracias', fr: 'Merci', de: 'Danke', pl: 'Dziękuję',
      it: 'Grazie', pt: 'Obrigado', nl: 'Dank je', ru: 'Спасибо', sv: 'Tack',
      no: 'Takk', da: 'Tak', cs: 'Děkuji', uk: 'Дякую', el: 'Ευχαριστώ',
      hu: 'Köszönöm', tr: 'Teşekkürler', ro: 'Mulțumesc'
    },
    type: 'phrase'
  },
  goodnight: {
    translations: {
      en: 'Goodnight', es: 'Buenas noches', fr: 'Bonne nuit', de: 'Gute Nacht', pl: 'Dobranoc',
      it: 'Buonanotte', pt: 'Boa noite', nl: 'Welterusten', ru: 'Спокойной ночи', sv: 'God natt',
      no: 'God natt', da: 'Godnat', cs: 'Dobrou noc', uk: 'На добраніч', el: 'Καληνύχτα',
      hu: 'Jó éjt', tr: 'İyi geceler', ro: 'Noapte bună'
    },
    type: 'phrase'
  },
  beautiful: {
    translations: {
      en: 'Beautiful', es: 'Hermoso/a', fr: 'Beau/Belle', de: 'Schön', pl: 'Piękny/a',
      it: 'Bello/a', pt: 'Bonito/a', nl: 'Mooi', ru: 'Красивый/ая', sv: 'Vacker',
      no: 'Vakker', da: 'Smuk', cs: 'Krásný/á', uk: 'Гарний/а', el: 'Όμορφος/η',
      hu: 'Gyönyörű', tr: 'Güzel', ro: 'Frumos/ă'
    },
    type: 'adjective'
  },
  heart: {
    translations: {
      en: 'Heart', es: 'Corazón', fr: 'Cœur', de: 'Herz', pl: 'Serce',
      it: 'Cuore', pt: 'Coração', nl: 'Hart', ru: 'Сердце', sv: 'Hjärta',
      no: 'Hjerte', da: 'Hjerte', cs: 'Srdce', uk: 'Серце', el: 'Καρδιά',
      hu: 'Szív', tr: 'Kalp', ro: 'Inimă'
    },
    type: 'noun'
  },
  kiss: {
    translations: {
      en: 'Kiss', es: 'Beso', fr: 'Bisou', de: 'Kuss', pl: 'Pocałunek',
      it: 'Bacio', pt: 'Beijo', nl: 'Kus', ru: 'Поцелуй', sv: 'Kyss',
      no: 'Kyss', da: 'Kys', cs: 'Polibek', uk: 'Поцілунок', el: 'Φιλί',
      hu: 'Csók', tr: 'Öpücük', ro: 'Sărut'
    },
    type: 'noun'
  },
  darling: {
    translations: {
      en: 'Darling', es: 'Cariño', fr: 'Chéri/e', de: 'Liebling', pl: 'Kochanie',
      it: 'Tesoro', pt: 'Querido/a', nl: 'Schat', ru: 'Дорогой/ая', sv: 'Älskling',
      no: 'Kjære', da: 'Skat', cs: 'Miláčku', uk: 'Любий/а', el: 'Αγάπη μου',
      hu: 'Drágám', tr: 'Sevgilim', ro: 'Dragă'
    },
    type: 'noun'
  },
  missYou: {
    translations: {
      en: 'I miss you', es: 'Te extraño', fr: 'Tu me manques', de: 'Ich vermisse dich', pl: 'Tęsknię za tobą',
      it: 'Mi manchi', pt: 'Sinto sua falta', nl: 'Ik mis je', ru: 'Я скучаю по тебе', sv: 'Jag saknar dig',
      no: 'Jeg savner deg', da: 'Jeg savner dig', cs: 'Chybíš mi', uk: 'Я сумую за тобою', el: 'Μου λείπεις',
      hu: 'Hiányzol', tr: 'Seni özlüyorum', ro: 'Mi-e dor de tine'
    },
    type: 'phrase'
  },
  please: {
    translations: {
      en: 'Please', es: 'Por favor', fr: "S'il te plaît", de: 'Bitte', pl: 'Proszę',
      it: 'Per favore', pt: 'Por favor', nl: 'Alsjeblieft', ru: 'Пожалуйста', sv: 'Snälla',
      no: 'Vær så snill', da: 'Vær venlig', cs: 'Prosím', uk: 'Будь ласка', el: 'Παρακαλώ',
      hu: 'Kérem', tr: 'Lütfen', ro: 'Te rog'
    },
    type: 'phrase'
  },
  sorry: {
    translations: {
      en: 'Sorry', es: 'Lo siento', fr: 'Désolé/e', de: 'Entschuldigung', pl: 'Przepraszam',
      it: 'Scusa', pt: 'Desculpe', nl: 'Sorry', ru: 'Извини', sv: 'Förlåt',
      no: 'Unnskyld', da: 'Undskyld', cs: 'Promiň', uk: 'Вибач', el: 'Συγγνώμη',
      hu: 'Bocsánat', tr: 'Özür dilerim', ro: 'Scuze'
    },
    type: 'phrase'
  },
  happy: {
    translations: {
      en: 'Happy', es: 'Feliz', fr: 'Heureux/se', de: 'Glücklich', pl: 'Szczęśliwy/a',
      it: 'Felice', pt: 'Feliz', nl: 'Gelukkig', ru: 'Счастливый/ая', sv: 'Lycklig',
      no: 'Lykkelig', da: 'Lykkelig', cs: 'Šťastný/á', uk: 'Щасливий/а', el: 'Ευτυχισμένος/η',
      hu: 'Boldog', tr: 'Mutlu', ro: 'Fericit/ă'
    },
    type: 'adjective'
  },
  forever: {
    translations: {
      en: 'Forever', es: 'Para siempre', fr: 'Pour toujours', de: 'Für immer', pl: 'Na zawsze',
      it: 'Per sempre', pt: 'Para sempre', nl: 'Voor altijd', ru: 'Навсегда', sv: 'För alltid',
      no: 'For alltid', da: 'For evigt', cs: 'Navždy', uk: 'Назавжди', el: 'Για πάντα',
      hu: 'Örökké', tr: 'Sonsuza dek', ro: 'Pentru totdeauna'
    },
    type: 'phrase'
  },
  myLove: {
    translations: {
      en: 'My love', es: 'Mi amor', fr: 'Mon amour', de: 'Meine Liebe', pl: 'Moja miłość',
      it: 'Amore mio', pt: 'Meu amor', nl: 'Mijn liefde', ru: 'Моя любовь', sv: 'Min kärlek',
      no: 'Min kjærlighet', da: 'Min kærlighed', cs: 'Má lásko', uk: 'Моя любов', el: 'Αγάπη μου',
      hu: 'Szerelmem', tr: 'Aşkım', ro: 'Dragostea mea'
    },
    type: 'phrase'
  },
  yes: {
    translations: {
      en: 'Yes', es: 'Sí', fr: 'Oui', de: 'Ja', pl: 'Tak',
      it: 'Sì', pt: 'Sim', nl: 'Ja', ru: 'Да', sv: 'Ja',
      no: 'Ja', da: 'Ja', cs: 'Ano', uk: 'Так', el: 'Ναι',
      hu: 'Igen', tr: 'Evet', ro: 'Da'
    },
    type: 'phrase'
  },
  no: {
    translations: {
      en: 'No', es: 'No', fr: 'Non', de: 'Nein', pl: 'Nie',
      it: 'No', pt: 'Não', nl: 'Nee', ru: 'Нет', sv: 'Nej',
      no: 'Nei', da: 'Nej', cs: 'Ne', uk: 'Ні', el: 'Όχι',
      hu: 'Nem', tr: 'Hayır', ro: 'Nu'
    },
    type: 'phrase'
  }
};

// Generate demo words dynamically based on language pair
export const getDemoWords = (targetLanguage: string, nativeLanguage: string): DemoWord[] => {
  const words: DemoWord[] = [];
  let id = 1;

  for (const [key, data] of Object.entries(DEMO_VOCABULARY)) {
    const targetWord = data.translations[targetLanguage];
    const nativeWord = data.translations[nativeLanguage];

    if (targetWord && nativeWord) {
      words.push({
        id: String(id++),
        word: targetWord,
        translation: nativeWord,
        type: data.type
      });
    }
  }

  // If we somehow got no words, fall back to language config examples
  if (words.length === 0) {
    const target = LANGUAGE_CONFIGS[targetLanguage];
    const native = LANGUAGE_CONFIGS[nativeLanguage];
    if (target && native) {
      return [
        { id: '1', word: target.examples.hello, translation: native.examples.hello, type: 'phrase' },
        { id: '2', word: target.examples.iLoveYou, translation: native.examples.iLoveYou, type: 'phrase' },
        { id: '3', word: target.examples.thankYou, translation: native.examples.thankYou, type: 'phrase' },
      ];
    }
  }

  return words;
};

// Keep DEMO_WORDS for backward compatibility (uses Polish → English)
export const DEMO_WORDS: DemoWord[] = getDemoWords('pl', 'en');

// Generate wrong options for multiple choice
export const generateMCOptions = (
  correctAnswer: string,
  allWords: DemoWord[],
  isTargetToNative: boolean = true
): string[] => {
  const correct = correctAnswer;
  const others = allWords
    .map(w => isTargetToNative ? w.translation : w.word)
    .filter(t => t !== correct);

  const wrongOptions = shuffleArray(others).slice(0, 3);
  return shuffleArray([correct, ...wrongOptions]);
};
