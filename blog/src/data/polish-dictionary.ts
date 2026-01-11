// Polish Dictionary for Programmatic SEO Pages
// Each word gets its own page at /dictionary/[slug]

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'pronoun' | 'preposition' | 'conjunction' | 'interjection';
export type Gender = 'masculine' | 'feminine' | 'neuter' | 'masculine-personal' | 'non-masculine-personal';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface ConjugationTable {
  tense: string;
  forms: {
    ja?: string;
    ty?: string;
    on_ona_ono?: string;
    my?: string;
    wy?: string;
    oni_one?: string;
  };
}

export interface DictionaryWord {
  // Core
  slug: string;  // URL slug
  polish: string;
  english: string;
  pronunciation: string;
  wordType: WordType;

  // Optional details
  gender?: Gender;
  plural?: string;
  difficulty: Difficulty;

  // Content
  examples: Array<{
    polish: string;
    english: string;
  }>;

  // For verbs
  conjugations?: ConjugationTable[];

  // For adjectives
  adjectiveForms?: {
    masculine: string;
    feminine: string;
    neuter: string;
    plural: string;
  };

  // SEO & Relations
  relatedWords: string[];  // slugs of related words
  tags: string[];  // for grouping: "romance", "family", "food", etc.

  // Cultural notes (optional)
  culturalNote?: string;
}

// =============================================================================
// DICTIONARY DATA
// Organized by category for easier maintenance
// =============================================================================

// -----------------------------------------------------------------------------
// ROMANCE & LOVE (High-intent for couples learning Polish)
// -----------------------------------------------------------------------------
const romanceWords: DictionaryWord[] = [
  {
    slug: "kocham",
    polish: "kocham",
    english: "I love",
    pronunciation: "KO-ham",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Kocham cię.", english: "I love you." },
      { polish: "Kocham cię najbardziej na świecie.", english: "I love you the most in the world." },
      { polish: "Kocham, kiedy się uśmiechasz.", english: "I love when you smile." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "kocham",
          ty: "kochasz",
          on_ona_ono: "kocha",
          my: "kochamy",
          wy: "kochacie",
          oni_one: "kochają"
        }
      }
    ],
    relatedWords: ["miłość", "kochanie", "serce", "całować"],
    tags: ["romance", "essential", "verb"],
    culturalNote: "Poles don't say 'kocham cię' casually - it's reserved for deep, romantic love."
  },
  {
    slug: "miłość",
    polish: "miłość",
    english: "love",
    pronunciation: "MEE-woshch",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Miłość jest piękna.", english: "Love is beautiful." },
      { polish: "To jest miłość od pierwszego wejrzenia.", english: "This is love at first sight." },
      { polish: "Nasza miłość jest silna.", english: "Our love is strong." }
    ],
    relatedWords: ["kocham", "kochanie", "zakochany", "serce"],
    tags: ["romance", "essential", "noun"]
  },
  {
    slug: "kochanie",
    polish: "kochanie",
    english: "darling / honey / sweetheart",
    pronunciation: "ko-HA-nyeh",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Kochanie, chodź tutaj.", english: "Darling, come here." },
      { polish: "Dzień dobry, kochanie.", english: "Good morning, sweetheart." },
      { polish: "Kochanie moje!", english: "My darling!" }
    ],
    relatedWords: ["kocham", "miłość", "skarbie", "słońce"],
    tags: ["romance", "pet-names", "essential"],
    culturalNote: "The most common term of endearment between Polish couples."
  },
  {
    slug: "skarbie",
    polish: "skarbie",
    english: "treasure / darling",
    pronunciation: "SKAR-byeh",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Skarbie, kocham cię.", english: "Darling, I love you." },
      { polish: "Mój skarbie.", english: "My treasure." },
      { polish: "Skarbie, gdzie jesteś?", english: "Darling, where are you?" }
    ],
    relatedWords: ["kochanie", "słońce", "misiu"],
    tags: ["romance", "pet-names"],
    culturalNote: "Literally means 'treasure' - a very affectionate term."
  },
  {
    slug: "całować",
    polish: "całować",
    english: "to kiss",
    pronunciation: "tsa-WO-vach",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Chcę cię całować.", english: "I want to kiss you." },
      { polish: "Całuję cię na dobranoc.", english: "I kiss you goodnight." },
      { polish: "Całowali się pod gwiazdami.", english: "They kissed under the stars." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "całuję",
          ty: "całujesz",
          on_ona_ono: "całuje",
          my: "całujemy",
          wy: "całujecie",
          oni_one: "całują"
        }
      }
    ],
    relatedWords: ["pocałunek", "buziaki", "kocham"],
    tags: ["romance", "verb"]
  },
  {
    slug: "przytulić",
    polish: "przytulić",
    english: "to hug / to cuddle",
    pronunciation: "pshi-TOO-leech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Chcę cię przytulić.", english: "I want to hug you." },
      { polish: "Przytul mnie.", english: "Hug me." },
      { polish: "Przytuliliśmy się na pożegnanie.", english: "We hugged goodbye." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "przytulam",
          ty: "przytulasz",
          on_ona_ono: "przytula",
          my: "przytulamy",
          wy: "przytulacie",
          oni_one: "przytulają"
        }
      }
    ],
    relatedWords: ["uścisk", "całować", "kochanie"],
    tags: ["romance", "verb"]
  },
  {
    slug: "tęsknię",
    polish: "tęsknię",
    english: "I miss (you)",
    pronunciation: "TENSK-nyeh",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Tęsknię za tobą.", english: "I miss you." },
      { polish: "Bardzo za tobą tęsknię.", english: "I miss you very much." },
      { polish: "Tęsknię za domem.", english: "I miss home." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "tęsknię",
          ty: "tęsknisz",
          on_ona_ono: "tęskni",
          my: "tęsknimy",
          wy: "tęsknicie",
          oni_one: "tęsknią"
        }
      }
    ],
    relatedWords: ["miłość", "kocham", "serce"],
    tags: ["romance", "essential", "verb", "long-distance"],
    culturalNote: "Essential for long-distance couples - very commonly used in Polish."
  },
  {
    slug: "piękny",
    polish: "piękny",
    english: "beautiful",
    pronunciation: "PYENK-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jesteś piękna.", english: "You are beautiful. (to a woman)" },
      { polish: "To piękny dzień.", english: "It's a beautiful day." },
      { polish: "Masz piękne oczy.", english: "You have beautiful eyes." }
    ],
    adjectiveForms: {
      masculine: "piękny",
      feminine: "piękna",
      neuter: "piękne",
      plural: "piękni/piękne"
    },
    relatedWords: ["śliczny", "uroczy", "wspaniały"],
    tags: ["romance", "compliments", "adjective", "essential"]
  },
  {
    slug: "śliczny",
    polish: "śliczny",
    english: "lovely / gorgeous / cute",
    pronunciation: "SHLEECH-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Wyglądasz ślicznie.", english: "You look lovely." },
      { polish: "Jaka śliczna sukienka!", english: "What a lovely dress!" },
      { polish: "Masz śliczny uśmiech.", english: "You have a lovely smile." }
    ],
    adjectiveForms: {
      masculine: "śliczny",
      feminine: "śliczna",
      neuter: "śliczne",
      plural: "śliczni/śliczne"
    },
    relatedWords: ["piękny", "uroczy", "cudowny"],
    tags: ["romance", "compliments", "adjective"]
  },
  {
    slug: "serce",
    polish: "serce",
    english: "heart",
    pronunciation: "SER-tse",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Moje serce należy do ciebie.", english: "My heart belongs to you." },
      { polish: "Kocham cię z całego serca.", english: "I love you with all my heart." },
      { polish: "Masz dobre serce.", english: "You have a good heart." }
    ],
    relatedWords: ["miłość", "kocham", "uczucie"],
    tags: ["romance", "essential", "noun", "body"]
  },
  {
    slug: "zakochany",
    polish: "zakochany",
    english: "in love",
    pronunciation: "za-ko-HA-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jestem w tobie zakochany.", english: "I'm in love with you. (male speaking)" },
      { polish: "Jestem w tobie zakochana.", english: "I'm in love with you. (female speaking)" },
      { polish: "Są w sobie zakochani.", english: "They are in love with each other." }
    ],
    adjectiveForms: {
      masculine: "zakochany",
      feminine: "zakochana",
      neuter: "zakochane",
      plural: "zakochani"
    },
    relatedWords: ["miłość", "kocham", "związek"],
    tags: ["romance", "essential", "adjective"]
  },
  {
    slug: "ślub",
    polish: "ślub",
    english: "wedding",
    pronunciation: "shloop",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Nasz ślub będzie latem.", english: "Our wedding will be in summer." },
      { polish: "Czy wyjdziesz za mnie?", english: "Will you marry me?" },
      { polish: "To był piękny ślub.", english: "It was a beautiful wedding." }
    ],
    relatedWords: ["małżeństwo", "wesele", "pierścionek", "żona", "mąż"],
    tags: ["romance", "wedding", "noun", "essential"],
    culturalNote: "Polish weddings (wesele) are famous for lasting 2-3 days with lots of food, vodka, and dancing!"
  },
  {
    slug: "żona",
    polish: "żona",
    english: "wife",
    pronunciation: "ZHO-na",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "To jest moja żona.", english: "This is my wife." },
      { polish: "Moja żona jest Polką.", english: "My wife is Polish." },
      { polish: "Kocham moją żonę.", english: "I love my wife." }
    ],
    relatedWords: ["mąż", "małżeństwo", "ślub", "rodzina"],
    tags: ["family", "essential", "noun"]
  },
  {
    slug: "mąż",
    polish: "mąż",
    english: "husband",
    pronunciation: "monzh",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "To jest mój mąż.", english: "This is my husband." },
      { polish: "Mój mąż jest Polakiem.", english: "My husband is Polish." },
      { polish: "Kocham mojego męża.", english: "I love my husband." }
    ],
    relatedWords: ["żona", "małżeństwo", "ślub", "rodzina"],
    tags: ["family", "essential", "noun"]
  },
];

// -----------------------------------------------------------------------------
// GREETINGS & BASICS
// -----------------------------------------------------------------------------
const basicWords: DictionaryWord[] = [
  {
    slug: "cześć",
    polish: "cześć",
    english: "hi / hello / bye",
    pronunciation: "cheshch",
    wordType: "interjection",
    difficulty: "beginner",
    examples: [
      { polish: "Cześć! Jak się masz?", english: "Hi! How are you?" },
      { polish: "Cześć, kochanie!", english: "Hi, darling!" },
      { polish: "Cześć! Do zobaczenia!", english: "Bye! See you!" }
    ],
    relatedWords: ["dzień-dobry", "hej", "pa"],
    tags: ["greetings", "essential", "casual"],
    culturalNote: "Used both for hello and goodbye among friends. More formal greetings are used with strangers or elders."
  },
  {
    slug: "dzień-dobry",
    polish: "dzień dobry",
    english: "good morning / good day",
    pronunciation: "jen DOB-ri",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Dzień dobry! Jak mogę pomóc?", english: "Good day! How can I help?" },
      { polish: "Dzień dobry, pani Kowalska.", english: "Good morning, Mrs. Kowalska." },
      { polish: "Dzień dobry wszystkim!", english: "Good morning everyone!" }
    ],
    relatedWords: ["cześć", "dobry-wieczór", "do-widzenia"],
    tags: ["greetings", "essential", "formal"]
  },
  {
    slug: "dziękuję",
    polish: "dziękuję",
    english: "thank you",
    pronunciation: "jen-KOO-yeh",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Dziękuję bardzo!", english: "Thank you very much!" },
      { polish: "Dziękuję za pomoc.", english: "Thank you for your help." },
      { polish: "Dziękuję, kochanie.", english: "Thank you, darling." }
    ],
    relatedWords: ["proszę", "przepraszam"],
    tags: ["greetings", "essential", "polite"]
  },
  {
    slug: "proszę",
    polish: "proszę",
    english: "please / you're welcome / here you go",
    pronunciation: "PRO-sheh",
    wordType: "interjection",
    difficulty: "beginner",
    examples: [
      { polish: "Proszę, usiądź.", english: "Please, sit down." },
      { polish: "Dziękuję! - Proszę.", english: "Thank you! - You're welcome." },
      { polish: "Proszę bardzo.", english: "Here you go. / You're very welcome." }
    ],
    relatedWords: ["dziękuję", "przepraszam"],
    tags: ["greetings", "essential", "polite"],
    culturalNote: "One of the most versatile Polish words - means please, you're welcome, here you go, and more!"
  },
  {
    slug: "przepraszam",
    polish: "przepraszam",
    english: "I'm sorry / excuse me",
    pronunciation: "psheh-PRA-sham",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Przepraszam za spóźnienie.", english: "I'm sorry for being late." },
      { polish: "Przepraszam, czy mogę przejść?", english: "Excuse me, can I pass?" },
      { polish: "Przepraszam, kochanie.", english: "I'm sorry, darling." }
    ],
    relatedWords: ["wybacz", "proszę"],
    tags: ["greetings", "essential", "polite"]
  },
  {
    slug: "tak",
    polish: "tak",
    english: "yes",
    pronunciation: "tahk",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Tak, kocham cię.", english: "Yes, I love you." },
      { polish: "Tak, proszę.", english: "Yes, please." },
      { polish: "Tak, masz rację.", english: "Yes, you're right." }
    ],
    relatedWords: ["nie", "oczywiście", "pewnie"],
    tags: ["essential", "basic"]
  },
  {
    slug: "nie",
    polish: "nie",
    english: "no / not",
    pronunciation: "nyeh",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Nie, dziękuję.", english: "No, thank you." },
      { polish: "Nie rozumiem.", english: "I don't understand." },
      { polish: "Nie martw się.", english: "Don't worry." }
    ],
    relatedWords: ["tak", "nigdy", "nic"],
    tags: ["essential", "basic"]
  },
  {
    slug: "dobranoc",
    polish: "dobranoc",
    english: "goodnight",
    pronunciation: "do-BRA-nots",
    wordType: "interjection",
    difficulty: "beginner",
    examples: [
      { polish: "Dobranoc, kochanie.", english: "Goodnight, darling." },
      { polish: "Dobranoc, śpij dobrze.", english: "Goodnight, sleep well." },
      { polish: "Dobranoc i słodkich snów.", english: "Goodnight and sweet dreams." }
    ],
    relatedWords: ["dzień-dobry", "dobry-wieczór", "śpij-dobrze"],
    tags: ["greetings", "essential", "romance"]
  },
];

// -----------------------------------------------------------------------------
// FAMILY
// -----------------------------------------------------------------------------
const familyWords: DictionaryWord[] = [
  {
    slug: "rodzina",
    polish: "rodzina",
    english: "family",
    pronunciation: "ro-JEE-na",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Moja rodzina jest bardzo duża.", english: "My family is very big." },
      { polish: "Poznasz moją rodzinę.", english: "You'll meet my family." },
      { polish: "Rodzina jest najważniejsza.", english: "Family is the most important." }
    ],
    relatedWords: ["mama", "tata", "siostra", "brat"],
    tags: ["family", "essential", "noun"],
    culturalNote: "Family is extremely important in Polish culture. Sunday family dinners are a cherished tradition."
  },
  {
    slug: "mama",
    polish: "mama",
    english: "mom / mother",
    pronunciation: "MA-ma",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Moja mama gotuje najlepiej.", english: "My mom cooks the best." },
      { polish: "Kocham cię, mamo.", english: "I love you, mom." },
      { polish: "Mama zawsze ma rację.", english: "Mom is always right." }
    ],
    relatedWords: ["tata", "rodzice", "rodzina", "matka"],
    tags: ["family", "essential", "noun"]
  },
  {
    slug: "tata",
    polish: "tata",
    english: "dad / father",
    pronunciation: "TA-ta",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Mój tata jest wysoki.", english: "My dad is tall." },
      { polish: "Tata, pomóż mi.", english: "Dad, help me." },
      { polish: "Kocham cię, tato.", english: "I love you, dad." }
    ],
    relatedWords: ["mama", "rodzice", "rodzina", "ojciec"],
    tags: ["family", "essential", "noun"]
  },
  {
    slug: "teściowa",
    polish: "teściowa",
    english: "mother-in-law",
    pronunciation: "tesh-CHO-va",
    wordType: "noun",
    gender: "feminine",
    difficulty: "intermediate",
    examples: [
      { polish: "Moja teściowa świetnie gotuje.", english: "My mother-in-law cooks great." },
      { polish: "Poznałem teściową.", english: "I met my mother-in-law." },
      { polish: "Teściowa nas odwiedza.", english: "Mother-in-law is visiting us." }
    ],
    relatedWords: ["teść", "żona", "mąż", "rodzina"],
    tags: ["family", "in-laws", "noun"],
    culturalNote: "Building a good relationship with your teściowa is important in Polish culture!"
  },
  {
    slug: "teść",
    polish: "teść",
    english: "father-in-law",
    pronunciation: "teshch",
    wordType: "noun",
    gender: "masculine",
    difficulty: "intermediate",
    examples: [
      { polish: "Mój teść lubi piwo.", english: "My father-in-law likes beer." },
      { polish: "Teść opowiada historie.", english: "Father-in-law tells stories." },
      { polish: "Jadę do teścia.", english: "I'm going to my father-in-law's." }
    ],
    relatedWords: ["teściowa", "żona", "mąż", "rodzina"],
    tags: ["family", "in-laws", "noun"]
  },
];

// -----------------------------------------------------------------------------
// FOOD & DRINK (Great for couples cooking together)
// -----------------------------------------------------------------------------
const foodWords: DictionaryWord[] = [
  {
    slug: "jeść",
    polish: "jeść",
    english: "to eat",
    pronunciation: "yeshch",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Co chcesz jeść?", english: "What do you want to eat?" },
      { polish: "Jem śniadanie.", english: "I'm eating breakfast." },
      { polish: "Lubię jeść polskie jedzenie.", english: "I like to eat Polish food." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "jem",
          ty: "jesz",
          on_ona_ono: "je",
          my: "jemy",
          wy: "jecie",
          oni_one: "jedzą"
        }
      }
    ],
    relatedWords: ["jedzenie", "pić", "głodny", "obiad"],
    tags: ["food", "essential", "verb"]
  },
  {
    slug: "pić",
    polish: "pić",
    english: "to drink",
    pronunciation: "peech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Co chcesz pić?", english: "What do you want to drink?" },
      { polish: "Piję kawę.", english: "I'm drinking coffee." },
      { polish: "Lubię pić herbatę.", english: "I like to drink tea." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "piję",
          ty: "pijesz",
          on_ona_ono: "pije",
          my: "pijemy",
          wy: "pijecie",
          oni_one: "piją"
        }
      }
    ],
    relatedWords: ["napój", "woda", "kawa", "herbata", "wino"],
    tags: ["food", "essential", "verb"]
  },
  {
    slug: "smacznego",
    polish: "smacznego",
    english: "bon appétit / enjoy your meal",
    pronunciation: "smach-NEH-go",
    wordType: "interjection",
    difficulty: "beginner",
    examples: [
      { polish: "Obiad gotowy! Smacznego!", english: "Dinner is ready! Enjoy!" },
      { polish: "Smacznego, kochanie.", english: "Enjoy your meal, darling." },
      { polish: "Dziękuję! Smacznego!", english: "Thank you! Bon appétit!" }
    ],
    relatedWords: ["jeść", "obiad", "jedzenie"],
    tags: ["food", "essential", "polite"],
    culturalNote: "Always said before eating in Poland - it's considered polite to wish others 'smacznego'!"
  },
  {
    slug: "pierogi",
    polish: "pierogi",
    english: "dumplings",
    pronunciation: "pyeh-RO-gee",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "beginner",
    examples: [
      { polish: "Lubię pierogi z mięsem.", english: "I like dumplings with meat." },
      { polish: "Babcia robi najlepsze pierogi.", english: "Grandma makes the best pierogi." },
      { polish: "Zróbmy razem pierogi!", english: "Let's make pierogi together!" }
    ],
    relatedWords: ["jedzenie", "gotować", "kuchnia-polska"],
    tags: ["food", "polish-cuisine", "noun"],
    culturalNote: "Poland's most famous dish! Traditional fillings include potato & cheese (ruskie), meat, sauerkraut & mushroom, and sweet ones with berries."
  },
  {
    slug: "wino",
    polish: "wino",
    english: "wine",
    pronunciation: "VEE-no",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Napijesz się wina?", english: "Would you like some wine?" },
      { polish: "Lubię czerwone wino.", english: "I like red wine." },
      { polish: "Wino i kolacja przy świecach.", english: "Wine and candlelit dinner." }
    ],
    relatedWords: ["pić", "piwo", "kieliszek", "kolacja"],
    tags: ["food", "drinks", "romance", "noun"]
  },
];

// -----------------------------------------------------------------------------
// COMMON VERBS
// -----------------------------------------------------------------------------
const verbWords: DictionaryWord[] = [
  {
    slug: "być",
    polish: "być",
    english: "to be",
    pronunciation: "bich",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Chcę być z tobą.", english: "I want to be with you." },
      { polish: "Jestem szczęśliwy.", english: "I am happy." },
      { polish: "Będziemy razem.", english: "We will be together." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "jestem",
          ty: "jesteś",
          on_ona_ono: "jest",
          my: "jesteśmy",
          wy: "jesteście",
          oni_one: "są"
        }
      }
    ],
    relatedWords: ["mieć", "chcieć", "móc"],
    tags: ["essential", "verb", "grammar"]
  },
  {
    slug: "mieć",
    polish: "mieć",
    english: "to have",
    pronunciation: "myech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Mam dla ciebie prezent.", english: "I have a gift for you." },
      { polish: "Masz piękne oczy.", english: "You have beautiful eyes." },
      { polish: "Mamy szczęście.", english: "We are lucky. (lit. We have luck)" }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "mam",
          ty: "masz",
          on_ona_ono: "ma",
          my: "mamy",
          wy: "macie",
          oni_one: "mają"
        }
      }
    ],
    relatedWords: ["być", "chcieć", "potrzebować"],
    tags: ["essential", "verb", "grammar"]
  },
  {
    slug: "chcieć",
    polish: "chcieć",
    english: "to want",
    pronunciation: "hchech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Chcę cię zobaczyć.", english: "I want to see you." },
      { polish: "Co chcesz robić?", english: "What do you want to do?" },
      { polish: "Chcemy pojechać do Polski.", english: "We want to go to Poland." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "chcę",
          ty: "chcesz",
          on_ona_ono: "chce",
          my: "chcemy",
          wy: "chcecie",
          oni_one: "chcą"
        }
      }
    ],
    relatedWords: ["potrzebować", "móc", "musieć"],
    tags: ["essential", "verb", "grammar"]
  },
  {
    slug: "iść",
    polish: "iść",
    english: "to go (on foot)",
    pronunciation: "eeshch",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Idziemy na spacer?", english: "Shall we go for a walk?" },
      { polish: "Idę do domu.", english: "I'm going home." },
      { polish: "Chodź ze mną.", english: "Come with me." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "idę",
          ty: "idziesz",
          on_ona_ono: "idzie",
          my: "idziemy",
          wy: "idziecie",
          oni_one: "idą"
        }
      }
    ],
    relatedWords: ["jechać", "wracać", "spacer"],
    tags: ["essential", "verb", "movement"]
  },
  {
    slug: "rozumieć",
    polish: "rozumieć",
    english: "to understand",
    pronunciation: "ro-ZOO-myech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Rozumiem.", english: "I understand." },
      { polish: "Nie rozumiem.", english: "I don't understand." },
      { polish: "Czy mnie rozumiesz?", english: "Do you understand me?" }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "rozumiem",
          ty: "rozumiesz",
          on_ona_ono: "rozumie",
          my: "rozumiemy",
          wy: "rozumiecie",
          oni_one: "rozumieją"
        }
      }
    ],
    relatedWords: ["wiedzieć", "znać", "mówić"],
    tags: ["essential", "verb", "communication"],
    culturalNote: "One of the most useful phrases for language learners - 'Nie rozumiem' (I don't understand)!"
  },
  {
    slug: "mówić",
    polish: "mówić",
    english: "to speak / to say",
    pronunciation: "MOO-veech",
    wordType: "verb",
    difficulty: "beginner",
    examples: [
      { polish: "Mówię po polsku.", english: "I speak Polish." },
      { polish: "Co mówisz?", english: "What are you saying?" },
      { polish: "Mów wolniej, proszę.", english: "Speak slower, please." }
    ],
    conjugations: [
      {
        tense: "Present",
        forms: {
          ja: "mówię",
          ty: "mówisz",
          on_ona_ono: "mówi",
          my: "mówimy",
          wy: "mówicie",
          oni_one: "mówią"
        }
      }
    ],
    relatedWords: ["rozumieć", "słuchać", "pytać"],
    tags: ["essential", "verb", "communication"]
  },
];

// -----------------------------------------------------------------------------
// COMBINE ALL WORDS
// -----------------------------------------------------------------------------
export const polishDictionary: DictionaryWord[] = [
  ...romanceWords,
  ...basicWords,
  ...familyWords,
  ...foodWords,
  ...verbWords,
];

// Helper function to get word by slug
export function getWordBySlug(slug: string): DictionaryWord | undefined {
  return polishDictionary.find(word => word.slug === slug);
}

// Helper function to get related words
export function getRelatedWords(slugs: string[]): DictionaryWord[] {
  return slugs
    .map(slug => getWordBySlug(slug))
    .filter((word): word is DictionaryWord => word !== undefined);
}

// Helper to get words by tag
export function getWordsByTag(tag: string): DictionaryWord[] {
  return polishDictionary.filter(word => word.tags.includes(tag));
}

// Get all unique tags
export function getAllTags(): string[] {
  const tags = new Set<string>();
  polishDictionary.forEach(word => word.tags.forEach(tag => tags.add(tag)));
  return Array.from(tags).sort();
}
