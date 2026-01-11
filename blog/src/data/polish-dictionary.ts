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
// NUMBERS
// -----------------------------------------------------------------------------
const numberWords: DictionaryWord[] = [
  {
    slug: "jeden",
    polish: "jeden",
    english: "one",
    pronunciation: "YEH-den",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Jeden pocałunek.", english: "One kiss." },
      { polish: "Mam jedną siostrę.", english: "I have one sister." },
      { polish: "Jeszcze jeden raz.", english: "One more time." }
    ],
    relatedWords: ["dwa", "trzy", "pierwszy"],
    tags: ["numbers", "essential"]
  },
  {
    slug: "dwa",
    polish: "dwa",
    english: "two",
    pronunciation: "dvah",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Dwa bilety, proszę.", english: "Two tickets, please." },
      { polish: "Mamy dwoje dzieci.", english: "We have two children." },
      { polish: "Dwa lata razem!", english: "Two years together!" }
    ],
    relatedWords: ["jeden", "trzy", "drugi"],
    tags: ["numbers", "essential"]
  },
  {
    slug: "trzy",
    polish: "trzy",
    english: "three",
    pronunciation: "tshi",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Trzy słowa: kocham cię.", english: "Three words: I love you." },
      { polish: "Za trzy dni.", english: "In three days." },
      { polish: "O trzeciej.", english: "At three o'clock." }
    ],
    relatedWords: ["dwa", "cztery", "trzeci"],
    tags: ["numbers", "essential"]
  },
  {
    slug: "pięć",
    polish: "pięć",
    english: "five",
    pronunciation: "pyench",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Pięć minut.", english: "Five minutes." },
      { polish: "Mam pięć lat.", english: "I'm five years old." },
      { polish: "Piątka!", english: "High five!" }
    ],
    relatedWords: ["cztery", "sześć", "piąty"],
    tags: ["numbers", "essential"]
  },
  {
    slug: "dziesięć",
    polish: "dziesięć",
    english: "ten",
    pronunciation: "JEH-shench",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Dziesięć złotych.", english: "Ten zloty." },
      { polish: "Za dziesięć minut.", english: "In ten minutes." },
      { polish: "Dziesięć lat razem!", english: "Ten years together!" }
    ],
    relatedWords: ["pięć", "dwadzieścia", "dziesiąty"],
    tags: ["numbers", "essential"]
  },
  {
    slug: "sto",
    polish: "sto",
    english: "one hundred",
    pronunciation: "stoh",
    wordType: "noun",
    difficulty: "beginner",
    examples: [
      { polish: "Sto lat!", english: "Happy birthday! (lit. 100 years)" },
      { polish: "Sto procent.", english: "One hundred percent." },
      { polish: "Kocham cię na sto procent.", english: "I love you 100 percent." }
    ],
    relatedWords: ["dziesięć", "tysiąc"],
    tags: ["numbers", "essential", "celebrations"],
    culturalNote: "'Sto lat' is sung at birthdays and means 'may you live 100 years' - like 'Happy Birthday'!"
  },
];

// -----------------------------------------------------------------------------
// TIME & DAYS
// -----------------------------------------------------------------------------
const timeWords: DictionaryWord[] = [
  {
    slug: "dzisiaj",
    polish: "dzisiaj",
    english: "today",
    pronunciation: "JEE-shay",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Co robimy dzisiaj?", english: "What are we doing today?" },
      { polish: "Dzisiaj jest piękny dzień.", english: "Today is a beautiful day." },
      { polish: "Kocham cię dzisiaj i zawsze.", english: "I love you today and always." }
    ],
    relatedWords: ["jutro", "wczoraj", "teraz"],
    tags: ["time", "essential"]
  },
  {
    slug: "jutro",
    polish: "jutro",
    english: "tomorrow",
    pronunciation: "YOO-tro",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Do jutra!", english: "See you tomorrow!" },
      { polish: "Jutro idziemy na randkę.", english: "Tomorrow we're going on a date." },
      { polish: "Jutro będzie lepiej.", english: "Tomorrow will be better." }
    ],
    relatedWords: ["dzisiaj", "wczoraj", "pojutrze"],
    tags: ["time", "essential"]
  },
  {
    slug: "wczoraj",
    polish: "wczoraj",
    english: "yesterday",
    pronunciation: "FCHO-ray",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Wczoraj było cudownie.", english: "Yesterday was wonderful." },
      { polish: "Co robiłeś wczoraj?", english: "What did you do yesterday?" },
      { polish: "Wczoraj się poznaliśmy.", english: "We met yesterday." }
    ],
    relatedWords: ["dzisiaj", "jutro", "przedwczoraj"],
    tags: ["time", "essential"]
  },
  {
    slug: "teraz",
    polish: "teraz",
    english: "now",
    pronunciation: "TEH-raz",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Przytul mnie teraz.", english: "Hug me now." },
      { polish: "Co robisz teraz?", english: "What are you doing now?" },
      { polish: "Teraz albo nigdy!", english: "Now or never!" }
    ],
    relatedWords: ["dzisiaj", "później", "zaraz"],
    tags: ["time", "essential"]
  },
  {
    slug: "zawsze",
    polish: "zawsze",
    english: "always",
    pronunciation: "ZAV-sheh",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Będę cię kochać zawsze.", english: "I will love you always." },
      { polish: "Zawsze przy tobie.", english: "Always by your side." },
      { polish: "Zawsze myślę o tobie.", english: "I always think about you." }
    ],
    relatedWords: ["nigdy", "często", "czasami"],
    tags: ["time", "romance", "essential"]
  },
  {
    slug: "nigdy",
    polish: "nigdy",
    english: "never",
    pronunciation: "NEEG-di",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Nigdy cię nie zostawię.", english: "I will never leave you." },
      { polish: "Nigdy nie mów nigdy.", english: "Never say never." },
      { polish: "Nigdy się nie poddam.", english: "I will never give up." }
    ],
    relatedWords: ["zawsze", "czasami", "kiedyś"],
    tags: ["time", "essential"]
  },
  {
    slug: "poniedziałek",
    polish: "poniedziałek",
    english: "Monday",
    pronunciation: "po-nyeh-JAH-wek",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "W poniedziałek idziemy do kina.", english: "On Monday we're going to the cinema." },
      { polish: "Nie lubię poniedziałków.", english: "I don't like Mondays." },
      { polish: "Do poniedziałku!", english: "See you Monday!" }
    ],
    relatedWords: ["wtorek", "weekend", "tydzień"],
    tags: ["time", "days"]
  },
  {
    slug: "weekend",
    polish: "weekend",
    english: "weekend",
    pronunciation: "VEE-kend",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Co robimy w weekend?", english: "What are we doing this weekend?" },
      { polish: "Miłego weekendu!", english: "Have a nice weekend!" },
      { polish: "Weekend tylko dla nas.", english: "Weekend just for us." }
    ],
    relatedWords: ["sobota", "niedziela", "tydzień"],
    tags: ["time", "essential"]
  },
];

// -----------------------------------------------------------------------------
// EMOTIONS & FEELINGS
// -----------------------------------------------------------------------------
const emotionWords: DictionaryWord[] = [
  {
    slug: "szczęśliwy",
    polish: "szczęśliwy",
    english: "happy",
    pronunciation: "shchen-SHLEE-vi",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jestem taki szczęśliwy z tobą.", english: "I'm so happy with you." },
      { polish: "Szczęśliwego Nowego Roku!", english: "Happy New Year!" },
      { polish: "Przy tobie jestem szczęśliwa.", english: "I'm happy with you. (female)" }
    ],
    adjectiveForms: {
      masculine: "szczęśliwy",
      feminine: "szczęśliwa",
      neuter: "szczęśliwe",
      plural: "szczęśliwi"
    },
    relatedWords: ["radosny", "smutny", "zadowolony"],
    tags: ["emotions", "essential", "adjective"]
  },
  {
    slug: "smutny",
    polish: "smutny",
    english: "sad",
    pronunciation: "SMOOT-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Dlaczego jesteś smutna?", english: "Why are you sad? (to female)" },
      { polish: "Nie bądź smutny.", english: "Don't be sad." },
      { polish: "Smutne bez ciebie.", english: "It's sad without you." }
    ],
    adjectiveForms: {
      masculine: "smutny",
      feminine: "smutna",
      neuter: "smutne",
      plural: "smutni"
    },
    relatedWords: ["szczęśliwy", "płakać", "tęsknić"],
    tags: ["emotions", "essential", "adjective"]
  },
  {
    slug: "zmęczony",
    polish: "zmęczony",
    english: "tired",
    pronunciation: "zmeh-CHO-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jestem zmęczony.", english: "I'm tired." },
      { polish: "Wyglądasz na zmęczoną.", english: "You look tired. (to female)" },
      { polish: "Zmęczeni, ale szczęśliwi.", english: "Tired but happy." }
    ],
    adjectiveForms: {
      masculine: "zmęczony",
      feminine: "zmęczona",
      neuter: "zmęczone",
      plural: "zmęczeni"
    },
    relatedWords: ["śpiący", "odpoczywać", "spać"],
    tags: ["emotions", "essential", "adjective"]
  },
  {
    slug: "głodny",
    polish: "głodny",
    english: "hungry",
    pronunciation: "GWOD-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jestem głodny.", english: "I'm hungry." },
      { polish: "Jesteś głodna?", english: "Are you hungry? (to female)" },
      { polish: "Głodny jak wilk!", english: "Hungry as a wolf!" }
    ],
    adjectiveForms: {
      masculine: "głodny",
      feminine: "głodna",
      neuter: "głodne",
      plural: "głodni"
    },
    relatedWords: ["jeść", "jedzenie", "obiad"],
    tags: ["emotions", "essential", "adjective", "food"]
  },
  {
    slug: "zły",
    polish: "zły",
    english: "angry / bad",
    pronunciation: "zwi",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Nie bądź zły.", english: "Don't be angry." },
      { polish: "Przepraszam, jeśli jesteś zła.", english: "Sorry if you're angry. (to female)" },
      { polish: "To był zły pomysł.", english: "That was a bad idea." }
    ],
    adjectiveForms: {
      masculine: "zły",
      feminine: "zła",
      neuter: "złe",
      plural: "źli"
    },
    relatedWords: ["dobry", "smutny", "przepraszam"],
    tags: ["emotions", "essential", "adjective"]
  },
  {
    slug: "podekscytowany",
    polish: "podekscytowany",
    english: "excited",
    pronunciation: "po-dek-si-to-VA-ni",
    wordType: "adjective",
    difficulty: "intermediate",
    examples: [
      { polish: "Jestem podekscytowany naszą podróżą!", english: "I'm excited about our trip!" },
      { polish: "Tak podekscytowana!", english: "So excited! (female)" },
      { polish: "Podekscytowani ślubem.", english: "Excited about the wedding." }
    ],
    adjectiveForms: {
      masculine: "podekscytowany",
      feminine: "podekscytowana",
      neuter: "podekscytowane",
      plural: "podekscytowani"
    },
    relatedWords: ["szczęśliwy", "radosny", "cieszyć-się"],
    tags: ["emotions", "adjective"]
  },
];

// -----------------------------------------------------------------------------
// TRAVEL & PLACES
// -----------------------------------------------------------------------------
const travelWords: DictionaryWord[] = [
  {
    slug: "podróż",
    polish: "podróż",
    english: "journey / trip",
    pronunciation: "POD-roosh",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Nasza podróż do Polski.", english: "Our trip to Poland." },
      { polish: "Szczęśliwej podróży!", english: "Have a good trip!" },
      { polish: "Podróż poślubna.", english: "Honeymoon." }
    ],
    relatedWords: ["samolot", "pociąg", "wakacje"],
    tags: ["travel", "essential", "noun"]
  },
  {
    slug: "samolot",
    polish: "samolot",
    english: "airplane",
    pronunciation: "sa-MO-lot",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Nasz samolot odlatuje o 10.", english: "Our plane departs at 10." },
      { polish: "Pierwszy raz lecę samolotem.", english: "First time flying on a plane." },
      { polish: "Samolot do Warszawy.", english: "Plane to Warsaw." }
    ],
    relatedWords: ["lotnisko", "lot", "podróż"],
    tags: ["travel", "noun"]
  },
  {
    slug: "pociąg",
    polish: "pociąg",
    english: "train",
    pronunciation: "PO-chonk",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Jedziemy pociągiem do Krakowa.", english: "We're taking the train to Krakow." },
      { polish: "O której odjeżdża pociąg?", english: "What time does the train leave?" },
      { polish: "Pociąg się spóźnia.", english: "The train is delayed." }
    ],
    relatedWords: ["dworzec", "bilet", "podróż"],
    tags: ["travel", "noun"]
  },
  {
    slug: "hotel",
    polish: "hotel",
    english: "hotel",
    pronunciation: "HO-tel",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Zarezerwowałem hotel.", english: "I booked a hotel." },
      { polish: "Nasz hotel jest blisko plaży.", english: "Our hotel is near the beach." },
      { polish: "Hotel z widokiem na morze.", english: "Hotel with a sea view." }
    ],
    relatedWords: ["pokój", "rezerwacja", "nocleg"],
    tags: ["travel", "noun"]
  },
  {
    slug: "plaża",
    polish: "plaża",
    english: "beach",
    pronunciation: "PLA-zha",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Idziemy na plażę?", english: "Shall we go to the beach?" },
      { polish: "Romantyczny spacer po plaży.", english: "Romantic walk on the beach." },
      { polish: "Plaża w Sopocie jest piękna.", english: "The beach in Sopot is beautiful." }
    ],
    relatedWords: ["morze", "słońce", "wakacje"],
    tags: ["travel", "noun", "romance"]
  },
  {
    slug: "miasto",
    polish: "miasto",
    english: "city / town",
    pronunciation: "MYAS-to",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Warszawa to piękne miasto.", english: "Warsaw is a beautiful city." },
      { polish: "Zwiedzamy stare miasto.", english: "We're visiting the old town." },
      { polish: "W jakim mieście mieszkasz?", english: "What city do you live in?" }
    ],
    relatedWords: ["wieś", "centrum", "ulica"],
    tags: ["travel", "places", "noun"]
  },
  {
    slug: "restauracja",
    polish: "restauracja",
    english: "restaurant",
    pronunciation: "res-tau-RATS-ya",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Zarezerwowałem stolik w restauracji.", english: "I booked a table at the restaurant." },
      { polish: "Znam dobrą polską restaurację.", english: "I know a good Polish restaurant." },
      { polish: "Kolacja w restauracji.", english: "Dinner at a restaurant." }
    ],
    relatedWords: ["jedzenie", "kelner", "menu"],
    tags: ["travel", "food", "noun"]
  },
  {
    slug: "Polska",
    polish: "Polska",
    english: "Poland",
    pronunciation: "POL-ska",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Jedziemy do Polski!", english: "We're going to Poland!" },
      { polish: "Polska jest piękna.", english: "Poland is beautiful." },
      { polish: "Mój partner jest z Polski.", english: "My partner is from Poland." }
    ],
    relatedWords: ["Warszawa", "Kraków", "polski"],
    tags: ["travel", "places", "essential"],
    culturalNote: "Poland offers incredible history, food, and hospitality. Must-visit cities include Warsaw, Krakow, and Gdańsk."
  },
  {
    slug: "Warszawa",
    polish: "Warszawa",
    english: "Warsaw",
    pronunciation: "var-SHA-va",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Mieszkam w Warszawie.", english: "I live in Warsaw." },
      { polish: "Warszawa to stolica Polski.", english: "Warsaw is the capital of Poland." },
      { polish: "Lecimy do Warszawy.", english: "We're flying to Warsaw." }
    ],
    relatedWords: ["Polska", "Kraków", "miasto"],
    tags: ["travel", "places"]
  },
  {
    slug: "Kraków",
    polish: "Kraków",
    english: "Krakow",
    pronunciation: "KRA-koof",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Kraków jest bardzo romantyczny.", english: "Krakow is very romantic." },
      { polish: "Stare miasto w Krakowie.", english: "The old town in Krakow." },
      { polish: "Musimy odwiedzić Kraków!", english: "We have to visit Krakow!" }
    ],
    relatedWords: ["Polska", "Warszawa", "miasto"],
    tags: ["travel", "places"],
    culturalNote: "Krakow is Poland's most romantic city, with beautiful architecture, amazing food, and the famous Wawel Castle."
  },
];

// -----------------------------------------------------------------------------
// BODY PARTS (useful for compliments!)
// -----------------------------------------------------------------------------
const bodyWords: DictionaryWord[] = [
  {
    slug: "oczy",
    polish: "oczy",
    english: "eyes",
    pronunciation: "O-chi",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "beginner",
    examples: [
      { polish: "Masz piękne oczy.", english: "You have beautiful eyes." },
      { polish: "Twoje oczy są jak gwiazdy.", english: "Your eyes are like stars." },
      { polish: "Nie mogę oderwać od ciebie oczu.", english: "I can't take my eyes off you." }
    ],
    relatedWords: ["twarz", "piękny", "patrzeć"],
    tags: ["body", "romance", "compliments", "noun"]
  },
  {
    slug: "uśmiech",
    polish: "uśmiech",
    english: "smile",
    pronunciation: "OO-shmyeh",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Kocham twój uśmiech.", english: "I love your smile." },
      { polish: "Masz piękny uśmiech.", english: "You have a beautiful smile." },
      { polish: "Uśmiechnij się do mnie.", english: "Smile at me." }
    ],
    relatedWords: ["usta", "śmiech", "szczęśliwy"],
    tags: ["body", "romance", "compliments", "noun"]
  },
  {
    slug: "włosy",
    polish: "włosy",
    english: "hair",
    pronunciation: "VWO-si",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "beginner",
    examples: [
      { polish: "Masz piękne włosy.", english: "You have beautiful hair." },
      { polish: "Lubię twoje włosy.", english: "I like your hair." },
      { polish: "Mogę dotknąć twoich włosów?", english: "Can I touch your hair?" }
    ],
    relatedWords: ["głowa", "twarz", "piękny"],
    tags: ["body", "compliments", "noun"]
  },
  {
    slug: "ręka",
    polish: "ręka",
    english: "hand / arm",
    pronunciation: "REN-ka",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Trzymaj mnie za rękę.", english: "Hold my hand." },
      { polish: "Chcę trzymać cię za rękę.", english: "I want to hold your hand." },
      { polish: "Podaj mi rękę.", english: "Give me your hand." }
    ],
    relatedWords: ["dłoń", "palec", "trzymać"],
    tags: ["body", "romance", "noun"]
  },
  {
    slug: "usta",
    polish: "usta",
    english: "lips / mouth",
    pronunciation: "OOS-ta",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "beginner",
    examples: [
      { polish: "Masz piękne usta.", english: "You have beautiful lips." },
      { polish: "Chcę całować twoje usta.", english: "I want to kiss your lips." },
      { polish: "Uśmiech na ustach.", english: "A smile on your lips." }
    ],
    relatedWords: ["całować", "uśmiech", "twarz"],
    tags: ["body", "romance", "noun"]
  },
];

// -----------------------------------------------------------------------------
// MORE ROMANCE & COMPLIMENTS
// -----------------------------------------------------------------------------
const moreRomanceWords: DictionaryWord[] = [
  {
    slug: "randka",
    polish: "randka",
    english: "date (romantic)",
    pronunciation: "RAND-ka",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Chodźmy na randkę.", english: "Let's go on a date." },
      { polish: "Nasza pierwsza randka.", english: "Our first date." },
      { polish: "To była idealna randka.", english: "It was a perfect date." }
    ],
    relatedWords: ["kino", "restauracja", "miłość"],
    tags: ["romance", "noun", "essential"]
  },
  {
    slug: "związek",
    polish: "związek",
    english: "relationship",
    pronunciation: "ZVYON-zek",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Jesteśmy w związku.", english: "We're in a relationship." },
      { polish: "Nasz związek jest silny.", english: "Our relationship is strong." },
      { polish: "Poważny związek.", english: "Serious relationship." }
    ],
    relatedWords: ["miłość", "partner", "zakochany"],
    tags: ["romance", "noun", "essential"]
  },
  {
    slug: "narzeczony",
    polish: "narzeczony",
    english: "fiancé",
    pronunciation: "na-zhe-CHO-ni",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "To jest mój narzeczony.", english: "This is my fiancé." },
      { polish: "Zostań moim narzeczonym.", english: "Be my fiancé." },
      { polish: "Mój narzeczony jest Polakiem.", english: "My fiancé is Polish." }
    ],
    relatedWords: ["narzeczona", "ślub", "zaręczyny"],
    tags: ["romance", "wedding", "noun"]
  },
  {
    slug: "narzeczona",
    polish: "narzeczona",
    english: "fiancée",
    pronunciation: "na-zhe-CHO-na",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "To jest moja narzeczona.", english: "This is my fiancée." },
      { polish: "Moja narzeczona jest Polką.", english: "My fiancée is Polish." },
      { polish: "Kocham moją narzeczoną.", english: "I love my fiancée." }
    ],
    relatedWords: ["narzeczony", "ślub", "zaręczyny"],
    tags: ["romance", "wedding", "noun"]
  },
  {
    slug: "pierścionek",
    polish: "pierścionek",
    english: "ring",
    pronunciation: "pyer-SHCHO-nek",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Pierścionek zaręczynowy.", english: "Engagement ring." },
      { polish: "Podoba ci się pierścionek?", english: "Do you like the ring?" },
      { polish: "Kupiłem pierścionek.", english: "I bought a ring." }
    ],
    relatedWords: ["zaręczyny", "ślub", "biżuteria"],
    tags: ["romance", "wedding", "noun"]
  },
  {
    slug: "oświadczyny",
    polish: "oświadczyny",
    english: "marriage proposal",
    pronunciation: "o-shvyad-CHI-ni",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "intermediate",
    examples: [
      { polish: "Planuję oświadczyny.", english: "I'm planning a proposal." },
      { polish: "Romantyczne oświadczyny.", english: "Romantic proposal." },
      { polish: "Powiedziała tak na oświadczyny!", english: "She said yes to the proposal!" }
    ],
    relatedWords: ["pierścionek", "ślub", "zaręczyny"],
    tags: ["romance", "wedding", "noun"],
    culturalNote: "In Poland, proposals are often elaborate and romantic. Many happen at special locations or during family gatherings."
  },
  {
    slug: "wesele",
    polish: "wesele",
    english: "wedding reception / wedding party",
    pronunciation: "veh-SEH-leh",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Polskie wesele trwa dwa dni!", english: "Polish wedding reception lasts two days!" },
      { polish: "Zapraszamy na wesele.", english: "We invite you to the wedding reception." },
      { polish: "Tańczyliśmy całą noc na weselu.", english: "We danced all night at the wedding." }
    ],
    relatedWords: ["ślub", "taniec", "muzyka"],
    tags: ["romance", "wedding", "noun", "culture"],
    culturalNote: "Polish weddings (wesele) are legendary - they often last 2-3 days with lots of food, vodka, dancing, and traditional games!"
  },
  {
    slug: "cudowny",
    polish: "cudowny",
    english: "wonderful / amazing",
    pronunciation: "tsoo-DOV-ni",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jesteś cudowna.", english: "You are wonderful. (to female)" },
      { polish: "To był cudowny wieczór.", english: "It was a wonderful evening." },
      { polish: "Cudownie jest z tobą.", english: "It's wonderful to be with you." }
    ],
    adjectiveForms: {
      masculine: "cudowny",
      feminine: "cudowna",
      neuter: "cudowne",
      plural: "cudowni"
    },
    relatedWords: ["wspaniały", "piękny", "fantastyczny"],
    tags: ["romance", "compliments", "adjective"]
  },
  {
    slug: "wspaniały",
    polish: "wspaniały",
    english: "wonderful / magnificent",
    pronunciation: "vspa-NIA-wi",
    wordType: "adjective",
    difficulty: "beginner",
    examples: [
      { polish: "Jesteś wspaniała.", english: "You are wonderful. (to female)" },
      { polish: "Wspaniały pomysł!", english: "Wonderful idea!" },
      { polish: "Masz wspaniałą rodzinę.", english: "You have a wonderful family." }
    ],
    adjectiveForms: {
      masculine: "wspaniały",
      feminine: "wspaniała",
      neuter: "wspaniałe",
      plural: "wspaniali"
    },
    relatedWords: ["cudowny", "piękny", "świetny"],
    tags: ["romance", "compliments", "adjective"]
  },
  {
    slug: "kwiaty",
    polish: "kwiaty",
    english: "flowers",
    pronunciation: "KVYA-ti",
    wordType: "noun",
    gender: "non-masculine-personal",
    difficulty: "beginner",
    examples: [
      { polish: "Kupiłem ci kwiaty.", english: "I bought you flowers." },
      { polish: "Piękne kwiaty!", english: "Beautiful flowers!" },
      { polish: "Róże to romantyczne kwiaty.", english: "Roses are romantic flowers." }
    ],
    relatedWords: ["róża", "bukiet", "prezent"],
    tags: ["romance", "noun", "gifts"],
    culturalNote: "In Poland, always give an odd number of flowers (1, 3, 5, etc.) - even numbers are for funerals!"
  },
  {
    slug: "prezent",
    polish: "prezent",
    english: "gift / present",
    pronunciation: "PRE-zent",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Mam dla ciebie prezent.", english: "I have a gift for you." },
      { polish: "Dziękuję za prezent!", english: "Thank you for the gift!" },
      { polish: "Prezent na urodziny.", english: "Birthday present." }
    ],
    relatedWords: ["kwiaty", "niespodzianka", "urodziny"],
    tags: ["romance", "noun", "gifts", "essential"]
  },
];

// -----------------------------------------------------------------------------
// MORE FAMILY
// -----------------------------------------------------------------------------
const moreFamilyWords: DictionaryWord[] = [
  {
    slug: "brat",
    polish: "brat",
    english: "brother",
    pronunciation: "braht",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Mam starszego brata.", english: "I have an older brother." },
      { polish: "Mój brat mieszka w Krakowie.", english: "My brother lives in Krakow." },
      { polish: "To mój brat.", english: "This is my brother." }
    ],
    relatedWords: ["siostra", "rodzina", "rodzeństwo"],
    tags: ["family", "noun", "essential"]
  },
  {
    slug: "siostra",
    polish: "siostra",
    english: "sister",
    pronunciation: "SHOS-tra",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Mam młodszą siostrę.", english: "I have a younger sister." },
      { polish: "Moja siostra jest podobna do mamy.", english: "My sister is similar to mom." },
      { polish: "Kocham moją siostrę.", english: "I love my sister." }
    ],
    relatedWords: ["brat", "rodzina", "rodzeństwo"],
    tags: ["family", "noun", "essential"]
  },
  {
    slug: "babcia",
    polish: "babcia",
    english: "grandmother / grandma",
    pronunciation: "BAB-cha",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Babcia robi najlepsze pierogi.", english: "Grandma makes the best pierogi." },
      { polish: "Odwiedzamy babcię w niedzielę.", english: "We're visiting grandma on Sunday." },
      { polish: "Kocham babcię.", english: "I love grandma." }
    ],
    relatedWords: ["dziadek", "rodzina", "wnuk"],
    tags: ["family", "noun", "essential"],
    culturalNote: "Polish grandmothers (babcie) are famous for their cooking and hospitality. Expect to be fed constantly!"
  },
  {
    slug: "dziadek",
    polish: "dziadek",
    english: "grandfather / grandpa",
    pronunciation: "JA-dek",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Dziadek opowiada historie.", english: "Grandpa tells stories." },
      { polish: "Mój dziadek jest z Polski.", english: "My grandfather is from Poland." },
      { polish: "Dziadek i babcia.", english: "Grandpa and grandma." }
    ],
    relatedWords: ["babcia", "rodzina", "wnuk"],
    tags: ["family", "noun", "essential"]
  },
  {
    slug: "dziecko",
    polish: "dziecko",
    english: "child",
    pronunciation: "JETS-ko",
    wordType: "noun",
    gender: "neuter",
    plural: "dzieci",
    difficulty: "beginner",
    examples: [
      { polish: "Mamy dwoje dzieci.", english: "We have two children." },
      { polish: "Chcemy mieć dzieci.", english: "We want to have children." },
      { polish: "Nasze dziecko.", english: "Our child." }
    ],
    relatedWords: ["syn", "córka", "rodzina"],
    tags: ["family", "noun", "essential"]
  },
  {
    slug: "syn",
    polish: "syn",
    english: "son",
    pronunciation: "sin",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Mam syna.", english: "I have a son." },
      { polish: "Nasz syn ma trzy lata.", english: "Our son is three years old." },
      { polish: "Syn i córka.", english: "Son and daughter." }
    ],
    relatedWords: ["córka", "dziecko", "rodzina"],
    tags: ["family", "noun"]
  },
  {
    slug: "córka",
    polish: "córka",
    english: "daughter",
    pronunciation: "TSOOR-ka",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Mam córkę.", english: "I have a daughter." },
      { polish: "Nasza córka jest piękna.", english: "Our daughter is beautiful." },
      { polish: "Córka mojego brata.", english: "My brother's daughter." }
    ],
    relatedWords: ["syn", "dziecko", "rodzina"],
    tags: ["family", "noun"]
  },
];

// -----------------------------------------------------------------------------
// MORE FOOD
// -----------------------------------------------------------------------------
const moreFoodWords: DictionaryWord[] = [
  {
    slug: "kawa",
    polish: "kawa",
    english: "coffee",
    pronunciation: "KA-va",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Piję kawę rano.", english: "I drink coffee in the morning." },
      { polish: "Dwie kawy, proszę.", english: "Two coffees, please." },
      { polish: "Chodźmy na kawę.", english: "Let's go for coffee." }
    ],
    relatedWords: ["herbata", "mleko", "cukier"],
    tags: ["food", "drinks", "essential", "noun"]
  },
  {
    slug: "herbata",
    polish: "herbata",
    english: "tea",
    pronunciation: "her-BA-ta",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Herbatę z cytryną, proszę.", english: "Tea with lemon, please." },
      { polish: "Pijesz herbatę?", english: "Do you drink tea?" },
      { polish: "Herbata z miodem.", english: "Tea with honey." }
    ],
    relatedWords: ["kawa", "woda", "pić"],
    tags: ["food", "drinks", "noun"]
  },
  {
    slug: "piwo",
    polish: "piwo",
    english: "beer",
    pronunciation: "PEE-vo",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Jedno piwo, proszę.", english: "One beer, please." },
      { polish: "Polskie piwo jest dobre.", english: "Polish beer is good." },
      { polish: "Piwo czy wino?", english: "Beer or wine?" }
    ],
    relatedWords: ["wino", "wódka", "pić"],
    tags: ["food", "drinks", "noun"]
  },
  {
    slug: "chleb",
    polish: "chleb",
    english: "bread",
    pronunciation: "hlep",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Świeży chleb.", english: "Fresh bread." },
      { polish: "Chleb z masłem.", english: "Bread with butter." },
      { polish: "Kup chleb, proszę.", english: "Buy bread, please." }
    ],
    relatedWords: ["masło", "śniadanie", "piekarnia"],
    tags: ["food", "essential", "noun"]
  },
  {
    slug: "obiad",
    polish: "obiad",
    english: "lunch / dinner (main meal)",
    pronunciation: "O-byad",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Co na obiad?", english: "What's for lunch/dinner?" },
      { polish: "Obiad jest gotowy!", english: "Dinner is ready!" },
      { polish: "Zjemy razem obiad.", english: "Let's eat dinner together." }
    ],
    relatedWords: ["śniadanie", "kolacja", "jeść"],
    tags: ["food", "essential", "noun"],
    culturalNote: "In Poland, 'obiad' is the main meal of the day, traditionally eaten in the early afternoon (2-4 PM)."
  },
  {
    slug: "śniadanie",
    polish: "śniadanie",
    english: "breakfast",
    pronunciation: "shnya-DA-nyeh",
    wordType: "noun",
    gender: "neuter",
    difficulty: "beginner",
    examples: [
      { polish: "Śniadanie w łóżku.", english: "Breakfast in bed." },
      { polish: "Co jesz na śniadanie?", english: "What do you eat for breakfast?" },
      { polish: "Zrobiłem ci śniadanie.", english: "I made you breakfast." }
    ],
    relatedWords: ["obiad", "kolacja", "jeść"],
    tags: ["food", "essential", "noun", "romance"]
  },
  {
    slug: "kolacja",
    polish: "kolacja",
    english: "supper / dinner (evening meal)",
    pronunciation: "ko-LATS-ya",
    wordType: "noun",
    gender: "feminine",
    difficulty: "beginner",
    examples: [
      { polish: "Romantyczna kolacja.", english: "Romantic dinner." },
      { polish: "Kolacja przy świecach.", english: "Candlelit dinner." },
      { polish: "Zapraszam cię na kolację.", english: "I invite you to dinner." }
    ],
    relatedWords: ["obiad", "śniadanie", "restauracja"],
    tags: ["food", "essential", "noun", "romance"]
  },
  {
    slug: "bigos",
    polish: "bigos",
    english: "hunter's stew",
    pronunciation: "BEE-gos",
    wordType: "noun",
    gender: "masculine",
    difficulty: "beginner",
    examples: [
      { polish: "Bigos to tradycyjne polskie danie.", english: "Bigos is a traditional Polish dish." },
      { polish: "Babcia robi najlepszy bigos.", english: "Grandma makes the best bigos." },
      { polish: "Bigos smakuje lepiej następnego dnia.", english: "Bigos tastes better the next day." }
    ],
    relatedWords: ["pierogi", "żurek", "kuchnia-polska"],
    tags: ["food", "polish-cuisine", "noun"],
    culturalNote: "Bigos is called 'hunter's stew' - a hearty dish of sauerkraut, various meats, and sausage. It gets better each time it's reheated!"
  },
  {
    slug: "żurek",
    polish: "żurek",
    english: "sour rye soup",
    pronunciation: "ZHOO-rek",
    wordType: "noun",
    gender: "masculine",
    difficulty: "intermediate",
    examples: [
      { polish: "Żurek z jajkiem i kiełbasą.", english: "Sour rye soup with egg and sausage." },
      { polish: "Na Wielkanoc jemy żurek.", english: "We eat żurek at Easter." },
      { polish: "Spróbuj żurek - to jest pyszne!", english: "Try żurek - it's delicious!" }
    ],
    relatedWords: ["zupa", "pierogi", "bigos"],
    tags: ["food", "polish-cuisine", "noun"],
    culturalNote: "Żurek is a sour soup made from fermented rye flour - a traditional Polish Easter dish often served in a bread bowl!"
  },
];

// -----------------------------------------------------------------------------
// COMMON USEFUL PHRASES
// -----------------------------------------------------------------------------
const phraseWords: DictionaryWord[] = [
  {
    slug: "jak-się-masz",
    polish: "jak się masz?",
    english: "how are you?",
    pronunciation: "yak sheh mash",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Cześć! Jak się masz?", english: "Hi! How are you?" },
      { polish: "Jak się masz, kochanie?", english: "How are you, darling?" },
      { polish: "Jak się macie?", english: "How are you? (plural/formal)" }
    ],
    relatedWords: ["cześć", "dobrze", "dziękuję"],
    tags: ["phrases", "greetings", "essential"]
  },
  {
    slug: "dobrze",
    polish: "dobrze",
    english: "good / well / okay",
    pronunciation: "DOB-zheh",
    wordType: "adverb",
    difficulty: "beginner",
    examples: [
      { polish: "Wszystko dobrze.", english: "Everything's fine." },
      { polish: "Dobrze, zgadzam się.", english: "Okay, I agree." },
      { polish: "Mam się dobrze.", english: "I'm doing well." }
    ],
    relatedWords: ["źle", "świetnie", "super"],
    tags: ["essential", "adverb"]
  },
  {
    slug: "nie-ma-za-co",
    polish: "nie ma za co",
    english: "you're welcome / don't mention it",
    pronunciation: "nyeh ma za tso",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Dziękuję! - Nie ma za co.", english: "Thank you! - You're welcome." },
      { polish: "Nie ma za co, kochanie.", english: "You're welcome, darling." }
    ],
    relatedWords: ["dziękuję", "proszę"],
    tags: ["phrases", "polite", "essential"]
  },
  {
    slug: "na-zdrowie",
    polish: "na zdrowie",
    english: "cheers / bless you",
    pronunciation: "na ZDRO-vyeh",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Na zdrowie! (raising glass)", english: "Cheers!" },
      { polish: "Na zdrowie! (after sneeze)", english: "Bless you!" },
      { polish: "Na nasze zdrowie!", english: "To our health!" }
    ],
    relatedWords: ["wino", "piwo", "toast"],
    tags: ["phrases", "essential", "celebrations"],
    culturalNote: "In Poland, 'na zdrowie' is used both when toasting (like 'cheers!') and when someone sneezes (like 'bless you!')."
  },
  {
    slug: "kocham-cię",
    polish: "kocham cię",
    english: "I love you",
    pronunciation: "KO-ham cheh",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Kocham cię najbardziej.", english: "I love you the most." },
      { polish: "Kocham cię na zawsze.", english: "I love you forever." },
      { polish: "Też cię kocham.", english: "I love you too." }
    ],
    relatedWords: ["miłość", "kochanie", "serce"],
    tags: ["phrases", "romance", "essential"],
    culturalNote: "In Polish, 'kocham cię' is reserved for deep, romantic love - not said casually like in some cultures."
  },
  {
    slug: "tęsknię-za-tobą",
    polish: "tęsknię za tobą",
    english: "I miss you",
    pronunciation: "TENSK-nyeh za TO-bom",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Bardzo tęsknię za tobą.", english: "I miss you very much." },
      { polish: "Tęsknię za tobą każdego dnia.", english: "I miss you every day." },
      { polish: "Też za tobą tęsknię.", english: "I miss you too." }
    ],
    relatedWords: ["tęsknię", "kocham-cię", "miłość"],
    tags: ["phrases", "romance", "essential", "long-distance"]
  },
  {
    slug: "wszystkiego-najlepszego",
    polish: "wszystkiego najlepszego",
    english: "all the best / happy birthday",
    pronunciation: "fshist-KYE-go nay-LEP-sheh-go",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Wszystkiego najlepszego z okazji urodzin!", english: "Happy birthday!" },
      { polish: "Wszystkiego najlepszego!", english: "All the best!" },
      { polish: "Wszystkiego najlepszego z okazji imienin!", english: "Happy name day!" }
    ],
    relatedWords: ["urodziny", "imieniny", "sto-lat"],
    tags: ["phrases", "celebrations", "essential"]
  },
  {
    slug: "miłego-dnia",
    polish: "miłego dnia",
    english: "have a nice day",
    pronunciation: "MEE-weh-go DNYA",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Miłego dnia, kochanie!", english: "Have a nice day, darling!" },
      { polish: "Do zobaczenia! Miłego dnia!", english: "See you! Have a nice day!" }
    ],
    relatedWords: ["dzień-dobry", "do-widzenia"],
    tags: ["phrases", "greetings", "essential"]
  },
  {
    slug: "do-zobaczenia",
    polish: "do zobaczenia",
    english: "see you / goodbye",
    pronunciation: "do zo-ba-CHE-nya",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Do zobaczenia jutro!", english: "See you tomorrow!" },
      { polish: "Do zobaczenia wkrótce.", english: "See you soon." },
      { polish: "Pa! Do zobaczenia!", english: "Bye! See you!" }
    ],
    relatedWords: ["cześć", "pa", "do-widzenia"],
    tags: ["phrases", "greetings", "essential"]
  },
  {
    slug: "gdzie-jest",
    polish: "gdzie jest...?",
    english: "where is...?",
    pronunciation: "g-JEH yest",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Gdzie jest toaleta?", english: "Where is the bathroom?" },
      { polish: "Gdzie jest dworzec?", english: "Where is the train station?" },
      { polish: "Gdzie jest moja kawa?", english: "Where is my coffee?" }
    ],
    relatedWords: ["tutaj", "tam", "blisko"],
    tags: ["phrases", "travel", "essential"]
  },
  {
    slug: "ile-to-kosztuje",
    polish: "ile to kosztuje?",
    english: "how much does it cost?",
    pronunciation: "EE-leh to kosh-TOO-yeh",
    wordType: "phrase",
    difficulty: "beginner",
    examples: [
      { polish: "Przepraszam, ile to kosztuje?", english: "Excuse me, how much does this cost?" },
      { polish: "Ile kosztują te kwiaty?", english: "How much do these flowers cost?" }
    ],
    relatedWords: ["pieniądze", "złoty", "drogi"],
    tags: ["phrases", "shopping", "travel", "essential"]
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
  ...numberWords,
  ...timeWords,
  ...emotionWords,
  ...travelWords,
  ...bodyWords,
  ...moreRomanceWords,
  ...moreFamilyWords,
  ...moreFoodWords,
  ...phraseWords,
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
