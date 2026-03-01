// ============================================================
// Demo Content — Interfaces + per-language content for all 12
// showcase demos. Each language provides culturally authentic,
// app-consistent content that passes the 7-point review criteria.
// ============================================================

import type { LanguageCode } from '../../../constants/language-config';

// ------ Shared meta for pet-names, family roles, etc. ------

export interface DemoMeta {
  partnerName: string;   // Gender-neutral pet name for the learner's partner (Misia, Schatz, Cariño)
  petName: string;       // Affectionate name the partner calls the learner (Misiu, Schatzi, Mi amor)
  familyElder: string;   // Grandparent figure (Babcia, Oma, Abuela)
  familyParent: string;  // Parent figure (Tata, Papa, Papá)
  languageAdj: string;   // "Polish", "German", "Spanish"
  flag: string;          // 🇵🇱, 🇩🇪, 🇪🇸
}

// ------ Per-demo content interfaces ------

export interface SmartGamesContent {
  card1: { word: string; translation: string; emoji: string; pronunciation: string };
  card2: { word: string; translation: string; emoji: string; pronunciation: string };
  quizPrompt: string;
  quizOptions: [
    { label: string; correct: true },
    { label: string; correct: false },
    { label: string; correct: false },
  ];
  wrongPickLabel: string; // which incorrect option gets the "wrong" animation
}

export interface ConversationContent {
  scenario: { emoji: string; label: string };
  aiMessage: { prefix: string; targetPhrase: string; pronunciation: string };
  userResponse: string;
  feedback: { praiseWord: string; pronunciation: string; comment: string };
}

export interface WeakestWordsContent {
  header: string;     // e.g. "Words from cooking with family"
  subtext: string;    // e.g. "You keep mixing these up when cooking together"
  words: [
    { word: string; translation: string; accuracy: number },
    { word: string; translation: string; accuracy: number },
    { word: string; translation: string; accuracy: number },
  ];
}

export interface ListenModeContent {
  lines: [
    { label: string; text: string; style: 'partner' },
    { label: string; text: string; style: 'partner' },
    { label: string; text: string; style: 'translation' },
  ];
  extractedWords: [
    { word: string; meaning: string },
    { word: string; meaning: string },
    { word: string; meaning: string },
    { word: string; meaning: string },
    { word: string; meaning: string },
  ];
  cultureNote: string;
}

export interface LoveLogContent {
  words: [
    { word: string; translation: string; type: string; badge: 'mastery' | 'streak' | 'gift' | null; streak?: number },
    { word: string; translation: string; type: string; badge: 'mastery' | 'streak' | 'gift' | null; streak?: number },
    { word: string; translation: string; type: string; badge: 'mastery' | 'streak' | 'gift' | null; streak?: number },
    { word: string; translation: string; type: string; badge: 'mastery' | 'streak' | 'gift' | null; streak?: number },
  ];
  detail: {
    word: string;
    translation: string;
    pronunciation: string;
    type: string;
    example: { text: string; translation: string };
    tenses: [string, string, string]; // e.g. ['Present', 'Past', 'Future']
    conjugations: [
      { person: string; form: string },
      { person: string; form: string },
      { person: string; form: string },
    ];
  };
}

export interface VoiceChatContent {
  spokenPhrase: string; // MUST be ≤25 chars (typewriter at 60ms/char)
  feedback: { praiseWord: string; comment: string };
  followUpPills: [
    { label: string; primary: true },
    { label: string; primary: false },
  ];
}

export interface AgenticCoachContent {
  suggestionTitle: string;
  context: string;
  tip: string;
}

export interface WordGiftsContent {
  event: { emoji: string; title: string; subtitle: string; badgeText: string };
  words: [
    { word: string; translation: string },
    { word: string; translation: string },
    { word: string; translation: string },
  ];
  receiverMessage: { title: string; subtitle: string };
  flipCard: { word: string; translation: string; pronunciation: string };
}

export interface ProgressTrackingContent {
  level: string;
  xpDisplay: string;
  xpPercent: number;
  wordBreakdown: [
    { count: number; label: string; color: string },
    { count: number; label: string; color: string },
    { count: number; label: string; color: string },
    { count: number; label: string; color: string },
  ];
  stats: { wordsThisWeek: number; dayStreak: number };
  aiSummary: string;
  motivation: string;
}

export interface PartnerChallengesContent {
  quizWord: string;
  quizOptions: [
    { label: string; correct: true },
    { label: string; correct: false },
    { label: string; correct: false },
  ];
}

export interface AITeachingContent {
  question: string;
  thinkingContext: string;
  explanation: string;
  conjugations: [
    { person: string; form: string; highlight: boolean },
    { person: string; form: string; highlight: boolean },
    { person: string; form: string; highlight: boolean },
    { person: string; form: string; highlight: boolean },
  ];
  cultureNote: string;
  pills: [
    { label: string; primary: true },
    { label: string; primary: false },
  ];
}

export interface ActivityFeedContent {
  filterTabs: [string, string, string]; // e.g. ['Together', 'Mine', 'Jamie']
  activities: [
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
    { icon: string; text: string; detail: string; bgColor: string; borderColor: string },
  ];
}

// ------ Combined language content ------

export interface LanguageDemoContent {
  meta: DemoMeta;
  smartGames: SmartGamesContent;
  conversation: ConversationContent;
  weakestWords: WeakestWordsContent;
  listenMode: ListenModeContent;
  loveLog: LoveLogContent;
  voiceChat: VoiceChatContent;
  agenticCoach: AgenticCoachContent;
  wordGifts: WordGiftsContent;
  progressTracking: ProgressTrackingContent;
  partnerChallenges: PartnerChallengesContent;
  aiTeaching: AITeachingContent;
  activityFeed: ActivityFeedContent;
}

// ============================================================
// Polish (pl) — Gold-standard reference content
// ============================================================

const pl: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Misiu',
    familyElder: 'Babcia',
    familyParent: 'Tata',
    languageAdj: 'Polish',
    flag: '\u{1F1F5}\u{1F1F1}',
  },

  smartGames: {
    card1: { word: '\u015Alub', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[shloob]' },
    card2: { word: 'Na zawsze', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[na ZAV-sheh]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Na zawsze', correct: true },
      { label: '\u015Alub', correct: false },
      { label: 'Na pewno', correct: false },
    ],
    wrongPickLabel: '\u015Alub',
  },

  conversation: {
    scenario: { emoji: '\u{1F5F3}\uFE0F', label: 'Sunday dinner \u00B7 Election talk' },
    aiMessage: {
      prefix: 'Tata asks:',
      targetPhrase: 'Co s\u0105dzisz o wyborach?',
      pronunciation: '[tso SOWN-djeesh]',
    },
    userResponse: 'To skomplikowane, ale wa\u017Cne',
    feedback: {
      praiseWord: 'Brawo!',
      pronunciation: '[BRA-vo]',
      comment: 'Great attempt at joining the conversation \u{1F604}',
    },
  },

  weakestWords: {
    header: "Words from cooking with family",
    subtext: 'You keep mixing these up when cooking together',
    words: [
      { word: 'Pierogi', translation: 'Dumplings', accuracy: 62 },
      { word: 'Barszcz', translation: 'Beetroot soup', accuracy: 41 },
      { word: 'Bigos', translation: "Hunter's stew", accuracy: 35 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Wiesz co, niech si\u0119 k\u0142\u00F3c\u0105 o polityk\u0119...', style: 'partner' },
      { label: 'Partner', text: 'Nie m\u00F3j cyrk, nie moje ma\u0142py \u2014 ja wol\u0119 gotowa\u0107!', style: 'partner' },
      { label: 'Translation', text: "Let them argue \u2014 not my circus, not my monkeys!", style: 'translation' },
    ],
    extractedWords: [
      { word: 'cyrk', meaning: 'circus' },
      { word: 'ma\u0142py', meaning: 'monkeys' },
      { word: 'k\u0142\u00F3ci\u0107', meaning: 'to argue' },
      { word: 'polityka', meaning: 'politics' },
      { word: 'gotowa\u0107', meaning: 'to cook' },
    ],
    cultureNote: "Poland\u2019s most famous proverb \u2014 used worldwide but most Poles don\u2019t know it\u2019s theirs",
  },

  loveLog: {
    words: [
      { word: 'Kocham', translation: 'I love', type: 'verb', badge: 'mastery' },
      { word: 'Ojczyzna', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 3 },
      { word: 'Pierogi', translation: 'Dumplings', type: 'noun', badge: 'gift' },
      { word: '\u015Alub', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Kocham',
      translation: 'I love',
      pronunciation: '[KO-ham]',
      type: 'verb',
      example: { text: '"Kocham ci\u0119, na zawsze"', translation: 'I love you, forever' },
      tenses: ['Present', 'Past', 'Future'],
      conjugations: [
        { person: 'ja', form: 'kocham' },
        { person: 'ty', form: 'kochasz' },
        { person: 'on/ona', form: 'kocha' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Obiecuj\u0119 ci mi\u0142o\u015B\u0107', // 21 chars
    feedback: {
      praiseWord: 'Pi\u0119knie!',
      comment: "Your '\u015B' is perfect now. Pronunciation score: 92%",
    },
    followUpPills: [
      { label: 'Try "na zawsze"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'election night' vocabulary",
    context: "Family gathering this weekend \u2014 election talk likely",
    tip: "Start with 'g\u0142osowa\u0107' (to vote) \u2014 asked about twice this week",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking Wigilia together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: "For learning family recipes",
    },
    words: [
      { word: 'Pierogi', translation: 'Dumplings' },
      { word: 'Barszcz', translation: 'Beetroot soup' },
      { word: 'Makowiec', translation: 'Poppy seed cake' },
    ],
    receiverMessage: { title: 'Misia sent you 3 recipes!', subtitle: 'Wigilia dinner prep \u{1F384}' },
    flipCard: { word: 'Pierogi', translation: 'Dumplings', pronunciation: '[pyeh-RO-gee]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '720 / 1000 XP',
    xpPercent: 72,
    wordBreakdown: [
      { count: 23, label: 'nouns', color: '#3b82f6' },
      { count: 15, label: 'verbs', color: '#8b5cf6' },
      { count: 8, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 12, dayStreak: 3 },
    aiSummary: "Practiced election vocabulary at Sunday dinner",
    motivation: "Writing your vows in two languages",
  },

  partnerChallenges: {
    quizWord: 'Ojczyzna',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Freedom', correct: false },
      { label: 'History', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "b\u0119d\u0119 kocha\u0107" not "b\u0119d\u0119 kocham"?',
    thinkingContext: "Preparing vow phrases, needs this...",
    explanation: 'Future tense uses b\u0119d\u0119 + infinitive:',
    conjugations: [
      { person: 'ja', form: 'b\u0119d\u0119 kocha\u0107', highlight: true },
      { person: 'ty', form: 'b\u0119dziesz kocha\u0107', highlight: false },
      { person: 'on/ona', form: 'b\u0119dzie kocha\u0107', highlight: false },
      { person: 'my', form: 'b\u0119dziemy kocha\u0107', highlight: false },
    ],
    cultureNote: 'Polish future uses b\u0119d\u0119 + infinitive \u2014 perfect for promises that last forever',
    pills: [
      { label: 'Use in vows', primary: true },
      { label: 'More tenses', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F5F3}\uFE0F', text: 'Completed election vocabulary quiz', detail: '8/10 correct \u00B7 12 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F95F}', text: 'Practiced cooking vocabulary', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed wedding vow phrases', detail: 'Pronunciation score: 87%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Polish proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice pronunciation drill', detail: '\u015A and \u0106 sounds \u00B7 15 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 12% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// English (en) — Culturally authentic British/American content
// ============================================================

const en: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Darling',
    familyElder: 'Grandma',
    familyParent: 'Dad',
    languageAdj: 'English',
    flag: '\u{1F1EC}\u{1F1E7}',
  },

  smartGames: {
    card1: { word: 'Bride', translation: 'Novia', emoji: '\u{1F470}', pronunciation: '[brahyd]' },
    card2: { word: 'I do', translation: 'Acepto', emoji: '\u{1F48D}', pronunciation: '[eye doo]' },
    quizPrompt: "At the altar, you say...",
    quizOptions: [
      { label: 'I do', correct: true },
      { label: 'Bride', correct: false },
      { label: 'I will', correct: false },
    ],
    wrongPickLabel: 'Bride',
  },

  conversation: {
    scenario: { emoji: '\u{1F372}', label: 'Sunday roast \u00B7 Meeting the family' },
    aiMessage: {
      prefix: 'Dad asks:',
      targetPhrase: 'Would you like some more gravy?',
      pronunciation: '[wud yoo lahyk sum mor GRAY-vee]',
    },
    userResponse: 'Yes please, it\u2019s delicious!',
    feedback: {
      praiseWord: 'Brilliant!',
      pronunciation: '[BRIL-yuhnt]',
      comment: 'Polite and natural \u2014 well done \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from baking together',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Dough', translation: 'Masa', accuracy: 58 },
      { word: 'Whisk', translation: 'Batir', accuracy: 43 },
      { word: 'Knead', translation: 'Amasar', accuracy: 31 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: "Don\u2019t worry about Uncle Pete\u2019s rant...", style: 'partner' },
      { label: 'Partner', text: "Every cloud has a silver lining \u2014 at least the roast was good!", style: 'partner' },
      { label: 'Translation', text: 'No te preocupes \u2014 todo nublado tiene su lado bueno', style: 'translation' },
    ],
    extractedWords: [
      { word: 'cloud', meaning: 'nube' },
      { word: 'silver', meaning: 'plata' },
      { word: 'lining', meaning: 'forro / revestimiento' },
      { word: 'rant', meaning: 'diatriba' },
      { word: 'roast', meaning: 'asado' },
    ],
    cultureNote: "\u201CEvery cloud has a silver lining\u201D \u2014 a classic English proverb meaning something good comes from every bad situation",
  },

  loveLog: {
    words: [
      { word: 'Cherish', translation: 'Apreciar', type: 'verb', badge: 'mastery' },
      { word: 'Hearth', translation: 'Hogar', type: 'noun', badge: 'streak', streak: 5 },
      { word: 'Scone', translation: 'Panecillo', type: 'noun', badge: 'gift' },
      { word: 'Bride', translation: 'Novia', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Cherish',
      translation: 'Apreciar',
      pronunciation: '[CHER-ish]',
      type: 'verb',
      example: { text: '\u201CI will always cherish you\u201D', translation: 'Siempre te apreciar\u00E9' },
      tenses: ['Present', 'Past', 'Future'],
      conjugations: [
        { person: 'I', form: 'cherish' },
        { person: 'you', form: 'cherish' },
        { person: 'he/she', form: 'cherishes' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'You are my everything', // 22 chars
    feedback: {
      praiseWord: 'Lovely!',
      comment: "Your 'th' sound is getting much clearer. Score: 89%",
    },
    followUpPills: [
      { label: 'Try "I do"', primary: true },
      { label: 'Vow phrases', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Practice 'Sunday roast' vocabulary",
    context: "Family lunch this weekend \u2014 lots of food talk expected",
    tip: "Start with 'gravy' (salsa de carne) \u2014 it came up 3 times last visit",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Christmas baking together!',
      subtitle: 'Send festive words to Jamie',
      badgeText: 'For holiday kitchen fun',
    },
    words: [
      { word: 'Mince pie', translation: 'Pastel de frutas' },
      { word: 'Stuffing', translation: 'Relleno' },
      { word: 'Pudding', translation: 'Bud\u00EDn' },
    ],
    receiverMessage: { title: 'Your partner sent 3 recipes!', subtitle: 'Christmas dinner prep \u{1F384}' },
    flipCard: { word: 'Mince pie', translation: 'Pastel de frutas', pronunciation: '[mins pahy]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '680 / 1000 XP',
    xpPercent: 68,
    wordBreakdown: [
      { count: 26, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 14, dayStreak: 5 },
    aiSummary: 'Practiced family dinner vocabulary and polite phrases',
    motivation: 'Ready to charm the in-laws at Sunday roast',
  },

  partnerChallenges: {
    quizWord: 'Hearth',
    quizOptions: [
      { label: 'Hogar', correct: true },
      { label: 'Coraz\u00F3n', correct: false },
      { label: 'Calor', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "I have eaten" not "I have ate"?',
    thinkingContext: 'Talking about meals with the family, needs this...',
    explanation: 'English uses have/has + past participle:',
    conjugations: [
      { person: 'I', form: 'have eaten', highlight: true },
      { person: 'you', form: 'have eaten', highlight: false },
      { person: 'he/she', form: 'has eaten', highlight: false },
      { person: 'we', form: 'have eaten', highlight: false },
    ],
    cultureNote: 'The present perfect is used heavily in British English \u2014 especially for food and recent events at gatherings',
    pills: [
      { label: 'More irregular verbs', primary: true },
      { label: 'Past simple vs perfect', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F372}', text: 'Completed Sunday roast vocabulary', detail: '9/10 correct \u00B7 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F9C1}', text: 'Practiced baking vocabulary', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F48D}', text: 'Rehearsed English wedding vows', detail: 'Pronunciation score: 91%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied English proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: "th" sounds', detail: 'th and r sounds \u00B7 12 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 15% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// French (fr) — Culturally authentic French content
// ============================================================

const fr: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Mon cœur',
    familyElder: 'Mamie',
    familyParent: 'Papa',
    languageAdj: 'French',
    flag: '🇫🇷',
  },

  smartGames: {
    card1: { word: 'Mariage', translation: 'Wedding', emoji: '💒', pronunciation: '[ma-RYAZH]' },
    card2: { word: 'Pour toujours', translation: 'Forever', emoji: '💍', pronunciation: '[poor too-ZHOOR]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Pour toujours', correct: true },
      { label: 'Mariage', correct: false },
      { label: 'Bien sûr', correct: false },
    ],
    wrongPickLabel: 'Mariage',
  },

  conversation: {
    scenario: { emoji: '🧀', label: 'Sunday lunch · Cheese course debate' },
    aiMessage: {
      prefix: 'Papa asks:',
      targetPhrase: 'Tu préfères le comté ou le brie ?',
      pronunciation: '[too pray-FAIR luh kon-TAY oo luh BREE]',
    },
    userResponse: 'J\u2019aime bien les deux, mais le comté est incroyable',
    feedback: {
      praiseWord: 'Très bien !',
      pronunciation: '[treh BYEHN]',
      comment: 'Natural phrasing — you sound like a local 👏',
    },
  },

  weakestWords: {
    header: 'Words from baking with family',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Pâte', translation: 'Dough / pastry', accuracy: 55 },
      { word: 'Crème', translation: 'Cream', accuracy: 42 },
      { word: 'Fouetter', translation: 'To whisk', accuracy: 33 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Allez, goûte un peu de tout...', style: 'partner' },
      { label: 'Partner', text: "Petit à petit, l\u2019oiseau fait son nid — comme ton français !", style: 'partner' },
      { label: 'Translation', text: 'Little by little, the bird builds its nest — like your French!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'oiseau', meaning: 'bird' },
      { word: 'nid', meaning: 'nest' },
      { word: 'goûter', meaning: 'to taste' },
      { word: 'petit', meaning: 'little / small' },
      { word: 'français', meaning: 'French' },
    ],
    cultureNote: '"Petit à petit, l\u2019oiseau fait son nid" — a beloved French proverb about patience and steady progress',
  },

  loveLog: {
    words: [
      { word: 'Aimer', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Patrie', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Crêpe', translation: 'Crêpe', type: 'noun', badge: 'gift' },
      { word: 'Mariage', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Aimer',
      translation: 'To love',
      pronunciation: '[eh-MAY]',
      type: 'verb',
      example: { text: '\u201CJe t\u2019aimerai pour toujours\u201D', translation: 'I will love you forever' },
      tenses: ['Présent', 'Passé composé', 'Futur simple'],
      conjugations: [
        { person: 'je', form: "j\u2019aime" },
        { person: 'tu', form: 'aimes' },
        { person: 'il/elle', form: 'aime' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Tu es tout pour moi', // 19 chars
    feedback: {
      praiseWord: 'Magnifique !',
      comment: "Your French 'r' is really improving. Score: 91%",
    },
    followUpPills: [
      { label: 'Try "pour toujours"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'cheese course' vocabulary",
    context: "Sunday lunch with the family this weekend — cheese talk guaranteed",
    tip: "Start with 'fromage' (cheese) — it came up 4 times last visit",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Cooking Réveillon together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning holiday recipes',
    },
    words: [
      { word: 'Bûche', translation: 'Yule log cake' },
      { word: 'Chapon', translation: 'Capon' },
      { word: 'Foie gras', translation: 'Foie gras' },
    ],
    receiverMessage: { title: 'Mon cœur sent you 3 recipes!', subtitle: 'Réveillon dinner prep 🎄' },
    flipCard: { word: 'Bûche', translation: 'Yule log cake', pronunciation: '[BOOSH]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '750 / 1000 XP',
    xpPercent: 75,
    wordBreakdown: [
      { count: 25, label: 'nouns', color: '#3b82f6' },
      { count: 16, label: 'verbs', color: '#8b5cf6' },
      { count: 10, label: 'adj', color: '#f59e0b' },
      { count: 13, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 15, dayStreak: 4 },
    aiSummary: 'Practiced cheese vocabulary and family dinner phrases',
    motivation: 'Ready to navigate the cheese course like a pro',
  },

  partnerChallenges: {
    quizWord: 'Patrie',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Party', correct: false },
      { label: 'Pastry', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "je suis allé" not "j\u2019ai allé"?',
    thinkingContext: 'Describing weekend plans with the family, needs this...',
    explanation: 'Some verbs use être (not avoir) in the passé composé:',
    conjugations: [
      { person: 'je', form: 'suis allé(e)', highlight: true },
      { person: 'tu', form: 'es allé(e)', highlight: false },
      { person: 'il/elle', form: 'est allé(e)', highlight: false },
      { person: 'nous', form: 'sommes allé(e)s', highlight: false },
    ],
    cultureNote: 'The "DR MRS VANDERTRAMP" verbs all use être — mostly verbs of motion and state change',
    pills: [
      { label: 'All être verbs', primary: true },
      { label: 'Passé composé vs imparfait', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🧀', text: 'Completed cheese vocabulary quiz', detail: '9/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🥐', text: 'Practiced pâtisserie vocabulary', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed French wedding vow phrases', detail: 'Pronunciation score: 88%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied French proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: French "r" sounds', detail: 'r and nasal vowels · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 11% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Portuguese (pt) — European Portuguese, culturally authentic
// ============================================================

const pt: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Querido/a',
    familyElder: 'Avó',
    familyParent: 'Pai',
    languageAdj: 'Portuguese',
    flag: '🇵🇹',
  },

  smartGames: {
    card1: { word: 'Casamento', translation: 'Wedding', emoji: '💒', pronunciation: '[ka-za-MEN-too]' },
    card2: { word: 'Para sempre', translation: 'Forever', emoji: '💍', pronunciation: '[PA-ra SEM-pruh]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Para sempre', correct: true },
      { label: 'Saudade', correct: false },
      { label: 'Por acaso', correct: false },
    ],
    wrongPickLabel: 'Saudade',
  },

  conversation: {
    scenario: { emoji: '🍷', label: 'Almoço de domingo · Family lunch' },
    aiMessage: {
      prefix: 'Pai asks:',
      targetPhrase: 'Queres mais um bocadinho de bacalhau?',
      pronunciation: '[KEH-rush mahyz oom boh-ka-DEE-nyoo]',
    },
    userResponse: 'Sim, por favor — está delicioso!',
    feedback: {
      praiseWord: 'Muito bem!',
      pronunciation: '[MWEEN-too behm]',
      comment: 'Polite and natural — fits right in at the table 👏',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Bacalhau', translation: 'Salt cod', accuracy: 58 },
      { word: 'Pastéis de nata', translation: 'Custard tarts', accuracy: 39 },
      { word: 'Caldo verde', translation: 'Green broth soup', accuracy: 34 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Olha, deixa o tio discutir sozinho...', style: 'partner' },
      { label: 'Partner', text: 'Água mole em pedra dura, tanto bate até que fura — como o teu português!', style: 'partner' },
      { label: 'Translation', text: 'Soft water on hard stone, strikes until it bores through — like your Portuguese!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'água', meaning: 'water' },
      { word: 'pedra', meaning: 'stone' },
      { word: 'mole', meaning: 'soft' },
      { word: 'bate', meaning: 'strikes / hits' },
      { word: 'fura', meaning: 'pierces / bores through' },
    ],
    cultureNote: '"Água mole em pedra dura, tanto bate até que fura" — a beloved Portuguese proverb about persistence and patience',
  },

  loveLog: {
    words: [
      { word: 'Amar', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Saudade', translation: 'Longing', type: 'noun', badge: 'streak', streak: 5 },
      { word: 'Bacalhau', translation: 'Salt cod', type: 'noun', badge: 'gift' },
      { word: 'Casamento', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Amar',
      translation: 'To love',
      pronunciation: '[a-MAR]',
      type: 'verb',
      example: { text: '\u201CAmo-te para sempre\u201D', translation: 'I love you forever' },
      tenses: ['Presente', 'Pretérito perfeito', 'Futuro'],
      conjugations: [
        { person: 'eu', form: 'amo' },
        { person: 'tu', form: 'amas' },
        { person: 'ele/ela', form: 'ama' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Amo-te para sempre', // 19 chars ✓
    feedback: {
      praiseWord: 'Excelente!',
      comment: "Your nasal vowels are much clearer now. Score: 90%",
    },
    followUpPills: [
      { label: 'Try "para sempre"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Sunday lunch' vocabulary",
    context: "Family almoço this weekend — bacalhau is on the menu",
    tip: "Start with 'sobremesa' (dessert) — Avó always asks what you want",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Cooking Consoada together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas Eve recipes',
    },
    words: [
      { word: 'Bacalhau', translation: 'Salt cod' },
      { word: 'Rabanadas', translation: 'Portuguese French toast' },
      { word: 'Bolo-rei', translation: 'King cake' },
    ],
    receiverMessage: { title: 'Querido/a sent you 3 recipes!', subtitle: 'Consoada dinner prep 🎄' },
    flipCard: { word: 'Rabanadas', translation: 'Portuguese French toast', pronunciation: '[ha-ba-NA-dash]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '710 / 1000 XP',
    xpPercent: 71,
    wordBreakdown: [
      { count: 24, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 13, dayStreak: 4 },
    aiSummary: 'Practiced family lunch vocabulary and cooking phrases',
    motivation: 'Ready to join the conversation at almoço de domingo',
  },

  partnerChallenges: {
    quizWord: 'Saudade',
    quizOptions: [
      { label: 'Longing', correct: true },
      { label: 'Sadness', correct: false },
      { label: 'Memory', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "se eu tiver" not "se eu tenho"?',
    thinkingContext: 'Discussing future plans with family, needs this...',
    explanation: 'Portuguese uses the future subjunctive after "se" (if):',
    conjugations: [
      { person: 'eu', form: 'tiver', highlight: true },
      { person: 'tu', form: 'tiveres', highlight: false },
      { person: 'ele/ela', form: 'tiver', highlight: false },
      { person: 'nós', form: 'tivermos', highlight: false },
    ],
    cultureNote: 'The future subjunctive is rare in other Romance languages but alive in daily Portuguese — used after se, quando, and enquanto',
    pills: [
      { label: 'More subjunctive', primary: true },
      { label: 'Ser vs estar', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🍷', text: 'Completed Sunday lunch vocabulary', detail: '8/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🐟', text: 'Practiced bacalhau recipe words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Portuguese wedding vow phrases', detail: 'Pronunciation score: 86%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Portuguese proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: nasal vowels', detail: 'ão and õe sounds · 13 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 14% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Italian (it) — Culturally authentic Italian content
// ============================================================

const it: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Tesoro',
    familyElder: 'Nonna',
    familyParent: 'Papà',
    languageAdj: 'Italian',
    flag: '🇮🇹',
  },

  smartGames: {
    card1: { word: 'Matrimonio', translation: 'Wedding', emoji: '💒', pronunciation: '[ma-tree-MOH-nyo]' },
    card2: { word: 'Per sempre', translation: 'Forever', emoji: '💍', pronunciation: '[pair SEM-preh]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Per sempre', correct: true },
      { label: 'Matrimonio', correct: false },
      { label: 'Per favore', correct: false },
    ],
    wrongPickLabel: 'Matrimonio',
  },

  conversation: {
    scenario: { emoji: '🍝', label: 'Pranzo della domenica · Sunday lunch' },
    aiMessage: {
      prefix: 'Papà asks:',
      targetPhrase: 'Ti piace la pasta al forno?',
      pronunciation: '[tee PYA-cheh la PA-sta al FOR-no]',
    },
    userResponse: 'Sì, è buonissima! Il sugo è perfetto.',
    feedback: {
      praiseWord: 'Bravissimo!',
      pronunciation: '[bra-VEES-see-mo]',
      comment: 'Natural response — Nonna would be proud 👏',
    },
  },

  weakestWords: {
    header: 'Words from cooking with Nonna',
    subtext: 'You keep mixing these up in the kitchen',
    words: [
      { word: 'Soffritto', translation: 'Sautéed base', accuracy: 58 },
      { word: 'Mascarpone', translation: 'Cream cheese', accuracy: 44 },
      { word: 'Sfogliatella', translation: 'Layered pastry', accuracy: 32 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Lascia stare la politica a tavola...', style: 'partner' },
      { label: 'Partner', text: 'Chi dorme non piglia pesci — meglio mangiare!', style: 'partner' },
      { label: 'Translation', text: "Those who sleep don\u2019t catch fish — better to eat!", style: 'translation' },
    ],
    extractedWords: [
      { word: 'dormire', meaning: 'to sleep' },
      { word: 'pesci', meaning: 'fish' },
      { word: 'pigliare', meaning: 'to catch / grab' },
      { word: 'tavola', meaning: 'table / dinner' },
      { word: 'mangiare', meaning: 'to eat' },
    ],
    cultureNote: "\u201CChi dorme non piglia pesci\u201D — Italy\u2019s way of saying the early bird catches the worm, rooted in fisherman culture",
  },

  loveLog: {
    words: [
      { word: 'Amare', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Famiglia', translation: 'Family', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Tiramisù', translation: 'Pick-me-up cake', type: 'noun', badge: 'gift' },
      { word: 'Matrimonio', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Amare',
      translation: 'To love',
      pronunciation: '[a-MAH-reh]',
      type: 'verb',
      example: { text: '\u201CTi amerò per sempre\u201D', translation: 'I will love you forever' },
      tenses: ['Presente', 'Passato prossimo', 'Futuro'],
      conjugations: [
        { person: 'io', form: 'amo' },
        { person: 'tu', form: 'ami' },
        { person: 'lui/lei', form: 'ama' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Ti amerò per sempre', // 19 chars ✓
    feedback: {
      praiseWord: 'Perfetto!',
      comment: "Your rolled 'r' is beautiful. Pronunciation score: 94%",
    },
    followUpPills: [
      { label: 'Try "per sempre"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Sunday lunch' vocabulary",
    context: "Family pranzo this weekend — lots of food talk expected",
    tip: "Start with 'assaggiare' (to taste) — Nonna asks this every visit",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Vigilia di Natale together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning family recipes',
    },
    words: [
      { word: 'Panettone', translation: 'Christmas cake' },
      { word: 'Capitone', translation: 'Christmas Eve eel' },
      { word: 'Tortellini in brodo', translation: 'Tortellini in broth' },
    ],
    receiverMessage: { title: 'Tesoro sent you 3 recipes!', subtitle: 'Vigilia dinner prep 🎄' },
    flipCard: { word: 'Panettone', translation: 'Christmas cake', pronunciation: '[pa-net-TOH-neh]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '750 / 1000 XP',
    xpPercent: 75,
    wordBreakdown: [
      { count: 28, label: 'nouns', color: '#3b82f6' },
      { count: 16, label: 'verbs', color: '#8b5cf6' },
      { count: 10, label: 'adj', color: '#f59e0b' },
      { count: 14, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 15, dayStreak: 4 },
    aiSummary: 'Practiced family dinner vocabulary and cooking terms',
    motivation: 'Writing your vows in two languages',
  },

  partnerChallenges: {
    quizWord: 'Famiglia',
    quizOptions: [
      { label: 'Family', correct: true },
      { label: 'Famous', correct: false },
      { label: 'Famine', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "che io ami" not "che io amo"?',
    thinkingContext: 'Writing vows with subjunctive mood, needs this...',
    explanation: 'The congiuntivo presente expresses wishes and hopes:',
    conjugations: [
      { person: 'che io', form: 'ami', highlight: true },
      { person: 'che tu', form: 'ami', highlight: false },
      { person: 'che lui/lei', form: 'ami', highlight: false },
      { person: 'che noi', form: 'amiamo', highlight: false },
    ],
    cultureNote: 'The congiuntivo is the heart of expressive Italian — used for hopes, doubts, and declarations of love',
    pills: [
      { label: 'Use in vows', primary: true },
      { label: 'More moods', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🍝', text: 'Completed Italian dinner vocabulary', detail: '9/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🍳', text: 'Practiced cooking with Nonna words', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Italian wedding vow phrases', detail: 'Pronunciation score: 91%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Italian proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: rolled R sounds', detail: 'R and gli sounds · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 14% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Spanish (es) — Culturally authentic content
// ============================================================

const es: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Cariño',
    familyElder: 'Abuela',
    familyParent: 'Papá',
    languageAdj: 'Spanish',
    flag: '🇪🇸',
  },

  smartGames: {
    card1: { word: 'Boda', translation: 'Wedding', emoji: '💒', pronunciation: '[BOH-dah]' },
    card2: { word: 'Para siempre', translation: 'Forever', emoji: '💍', pronunciation: '[PAH-rah SYEM-preh]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Para siempre', correct: true },
      { label: 'Boda', correct: false },
      { label: 'Por supuesto', correct: false },
    ],
    wrongPickLabel: 'Boda',
  },

  conversation: {
    scenario: { emoji: '🥘', label: 'Sunday paella · Family debate' },
    aiMessage: {
      prefix: 'Papá asks:',
      targetPhrase: '¿Qué opinas del partido?',
      pronunciation: '[keh oh-PEE-nahs]',
    },
    userResponse: 'Es complicado, pero emocionante',
    feedback: {
      praiseWord: '¡Muy bien!',
      pronunciation: '[mooy BYEN]',
      comment: 'Natural response for a family discussion 👏',
    },
  },

  weakestWords: {
    header: 'Words from cooking paella together',
    subtext: 'These keep tripping you up at family cookouts',
    words: [
      { word: 'Azafrán', translation: 'Saffron', accuracy: 58 },
      { word: 'Caldo', translation: 'Broth', accuracy: 44 },
      { word: 'Sofrito', translation: 'Sautéed base', accuracy: 37 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Mira, déjalos que discutan sobre fútbol...', style: 'partner' },
      { label: 'Partner', text: 'No hay mal que por bien no venga — ¡así comemos más tranquilos!', style: 'partner' },
      { label: 'Translation', text: 'Let them argue — every cloud has a silver lining!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'mal', meaning: 'bad / harm' },
      { word: 'bien', meaning: 'good' },
      { word: 'discutir', meaning: 'to argue' },
      { word: 'fútbol', meaning: 'football / soccer' },
      { word: 'tranquilo', meaning: 'calm / peaceful' },
    ],
    cultureNote: 'A classic Spanish proverb dating back centuries — used constantly in everyday conversation across Spain and Latin America',
  },

  loveLog: {
    words: [
      { word: 'Querer', translation: 'To love / want', type: 'verb', badge: 'mastery' },
      { word: 'Hogar', translation: 'Home', type: 'noun', badge: 'streak', streak: 5 },
      { word: 'Paella', translation: 'Paella', type: 'noun', badge: 'gift' },
      { word: 'Boda', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Querer',
      translation: 'To love / want',
      pronunciation: '[keh-REHR]',
      type: 'verb',
      example: { text: '"Te quiero, para siempre"', translation: 'I love you, forever' },
      tenses: ['Present', 'Preterite', 'Future'],
      conjugations: [
        { person: 'yo', form: 'quiero' },
        { person: 'tú', form: 'quieres' },
        { person: 'él/ella', form: 'quiere' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Te quiero mucho, cariño', // 24 chars
    feedback: {
      praiseWord: '¡Perfecto!',
      comment: "Your rolled 'r' is getting smoother. Pronunciation score: 91%",
    },
    followUpPills: [
      { label: 'Try "para siempre"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Practice 'Sunday paella' vocabulary",
    context: 'Family lunch this weekend — cooking together likely',
    tip: "Start with 'sofrito' (sautéed base) — came up twice in conversation this week",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Cooking Nochebuena together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning family recipes',
    },
    words: [
      { word: 'Turrón', translation: 'Nougat candy' },
      { word: 'Gambas', translation: 'Prawns' },
      { word: 'Mazapán', translation: 'Marzipan' },
    ],
    receiverMessage: { title: 'Cariño sent you 3 recipes!', subtitle: 'Nochebuena dinner prep 🎄' },
    flipCard: { word: 'Turrón', translation: 'Nougat candy', pronunciation: '[too-RROHN]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '680 / 1000 XP',
    xpPercent: 68,
    wordBreakdown: [
      { count: 21, label: 'nouns', color: '#3b82f6' },
      { count: 17, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 14, dayStreak: 5 },
    aiSummary: 'Practiced cooking vocabulary during family paella',
    motivation: 'Writing your vows in two languages',
  },

  partnerChallenges: {
    quizWord: 'Hogar',
    quizOptions: [
      { label: 'Home', correct: true },
      { label: 'Fire', correct: false },
      { label: 'Kitchen', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "estoy feliz" not "soy feliz"?',
    thinkingContext: 'Describing emotions at family dinner, needs this...',
    explanation: 'Estar is for states and feelings, ser is for identity:',
    conjugations: [
      { person: 'yo', form: 'estoy feliz', highlight: true },
      { person: 'tú', form: 'estás feliz', highlight: false },
      { person: 'él/ella', form: 'está feliz', highlight: false },
      { person: 'nosotros', form: 'estamos felices', highlight: false },
    ],
    cultureNote: 'Ser vs estar is uniquely Spanish — "soy feliz" means happiness is your nature, "estoy feliz" means you feel happy right now',
    pills: [
      { label: 'Ser vs estar quiz', primary: true },
      { label: 'More examples', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🥘', text: 'Completed paella vocabulary quiz', detail: '9/10 correct · 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🍳', text: 'Practiced cooking vocabulary', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed wedding vow phrases', detail: 'Pronunciation score: 91%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Spanish proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice pronunciation drill', detail: 'Rolled R and Ñ sounds · 12 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 15% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Turkish (tr) — Culturally authentic Turkish content
// ============================================================

const tr: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Canım',
    familyElder: 'Anneanne',
    familyParent: 'Baba',
    languageAdj: 'Turkish',
    flag: '🇹🇷',
  },

  smartGames: {
    card1: { word: 'Düğün', translation: 'Wedding', emoji: '💒', pronunciation: '[doo-YOON]' },
    card2: { word: 'Sonsuza dek', translation: 'Forever', emoji: '💍', pronunciation: '[son-SOO-za dek]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Sonsuza dek', correct: true },
      { label: 'Düğün', correct: false },
      { label: 'Sonunda', correct: false },
    ],
    wrongPickLabel: 'Düğün',
  },

  conversation: {
    scenario: { emoji: '🫖', label: 'Çay saati · Afternoon tea with family' },
    aiMessage: {
      prefix: 'Baba asks:',
      targetPhrase: 'Bir bardak daha çay ister misin?',
      pronunciation: '[beer bar-DAK da-HA chai is-TER mi-sin]',
    },
    userResponse: 'Evet lütfen, çok güzel olmuş',
    feedback: {
      praiseWord: 'Harika!',
      pronunciation: '[ha-ree-KA]',
      comment: 'Very polite — Anneanne would be impressed 👏',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'You keep mixing these up in the kitchen',
    words: [
      { word: 'Börek', translation: 'Layered pastry', accuracy: 60 },
      { word: 'Dolma', translation: 'Stuffed vine leaves', accuracy: 42 },
      { word: 'Baklava', translation: 'Layered sweet pastry', accuracy: 35 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Bırak onları tartışsınlar...', style: 'partner' },
      { label: 'Partner', text: 'Damlaya damlaya göl olur — senin Türkçen de öyle!', style: 'partner' },
      { label: 'Translation', text: 'Drop by drop, a lake forms — just like your Turkish!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'damlaya', meaning: 'drop by drop' },
      { word: 'göl', meaning: 'lake' },
      { word: 'tartışmak', meaning: 'to argue' },
      { word: 'bırakmak', meaning: 'to let / leave' },
      { word: 'Türkçe', meaning: 'Turkish' },
    ],
    cultureNote: '\u201CDamlaya damlaya göl olur\u201D — a classic Turkish proverb about patience, meaning steady effort leads to great results',
  },

  loveLog: {
    words: [
      { word: 'Sevmek', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Vatan', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Börek', translation: 'Layered pastry', type: 'noun', badge: 'gift' },
      { word: 'Düğün', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Sevmek',
      translation: 'To love',
      pronunciation: '[sev-MEK]',
      type: 'verb',
      example: { text: '\u201CSeni sonsuza dek seveceğim\u201D', translation: 'I will love you forever' },
      tenses: ['Geniş zaman', 'Geçmiş zaman', 'Gelecek zaman'],
      conjugations: [
        { person: 'ben', form: 'severim' },
        { person: 'sen', form: 'seversin' },
        { person: 'o', form: 'sever' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Seni çok seviyorum', // 19 chars ✓
    feedback: {
      praiseWord: 'Mükemmel!',
      comment: "Your 'ü' and 'ö' vowels are spot on. Score: 91%",
    },
    followUpPills: [
      { label: 'Try "sonsuza dek"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'çay saati' vocabulary",
    context: "Family tea gathering this weekend — food and çay talk guaranteed",
    tip: "Start with 'demlemek' (to brew tea) — Anneanne always asks about çay",
  },

  wordGifts: {
    event: {
      emoji: '🌙',
      title: 'Cooking for Bayram together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Bayram recipes',
    },
    words: [
      { word: 'Baklava', translation: 'Layered sweet pastry' },
      { word: 'Sarma', translation: 'Stuffed cabbage rolls' },
      { word: 'Pilav', translation: 'Rice pilaf' },
    ],
    receiverMessage: { title: 'Canım sent you 3 recipes!', subtitle: 'Bayram dinner prep 🌙' },
    flipCard: { word: 'Baklava', translation: 'Layered sweet pastry', pronunciation: '[bak-la-VA]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '690 / 1000 XP',
    xpPercent: 69,
    wordBreakdown: [
      { count: 22, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 8, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 13, dayStreak: 4 },
    aiSummary: 'Practiced family tea vocabulary and cooking terms',
    motivation: 'Ready to join the conversation at çay saati',
  },

  partnerChallenges: {
    quizWord: 'Vatan',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Citizen', correct: false },
      { label: 'Village', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "evler" not "evlar"?',
    thinkingContext: 'Learning family and home words, needs this...',
    explanation: 'Turkish vowel harmony: back vowels (a, ı, o, u) pair with back suffixes, front vowels (e, i, ö, ü) pair with front suffixes:',
    conjugations: [
      { person: 'ev → evler', form: '(front: e → -ler)', highlight: true },
      { person: 'araba → arabalar', form: '(back: a → -lar)', highlight: false },
      { person: 'göz → gözler', form: '(front: ö → -ler)', highlight: false },
      { person: 'kuş → kuşlar', form: '(back: u → -lar)', highlight: false },
    ],
    cultureNote: 'Vowel harmony is the heartbeat of Turkish — once you feel it, suffixes flow naturally like adding beads to a string',
    pills: [
      { label: 'More suffixes', primary: true },
      { label: 'Agglutination basics', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🫖', text: 'Completed çay saati vocabulary quiz', detail: '8/10 correct · 12 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🥟', text: 'Practiced börek recipe vocabulary', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Turkish wedding vow phrases', detail: 'Pronunciation score: 88%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Turkish proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: ö and ü sounds', detail: 'Front vowels · 13 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 13% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Romanian (ro) — Culturally authentic Romanian content
// ============================================================

const ro: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Dragă',
    familyElder: 'Bunica',
    familyParent: 'Tata',
    languageAdj: 'Romanian',
    flag: '🇷🇴',
  },

  smartGames: {
    card1: { word: 'Nuntă', translation: 'Wedding', emoji: '💒', pronunciation: '[NOON-tuh]' },
    card2: { word: 'Pentru totdeauna', translation: 'Forever', emoji: '💍', pronunciation: '[PEN-troo tot-deh-OO-na]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Pentru totdeauna', correct: true },
      { label: 'Nuntă', correct: false },
      { label: 'Pentru că', correct: false },
    ],
    wrongPickLabel: 'Nuntă',
  },

  conversation: {
    scenario: { emoji: '🍲', label: 'Masa de duminică · Sunday family meal' },
    aiMessage: {
      prefix: 'Tata asks:',
      targetPhrase: 'Mai vrei puțină mămăligă?',
      pronunciation: '[mai vrey poo-TSEE-nuh muh-muh-LI-guh]',
    },
    userResponse: 'Da, te rog — e foarte bună!',
    feedback: {
      praiseWord: 'Excelent!',
      pronunciation: '[ek-se-LENT]',
      comment: 'Natural and polite — Bunica would be delighted 👏',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'You keep mixing these up in the kitchen',
    words: [
      { word: 'Sarmale', translation: 'Cabbage rolls', accuracy: 57 },
      { word: 'Mămăligă', translation: 'Cornmeal polenta', accuracy: 40 },
      { word: 'Cozonac', translation: 'Sweet braided bread', accuracy: 33 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Lasă-i pe ei să se certe...', style: 'partner' },
      { label: 'Partner', text: 'Picătură cu picătură se face lac — ca și româna ta!', style: 'partner' },
      { label: 'Translation', text: 'Drop by drop, a lake forms — just like your Romanian!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'picătură', meaning: 'drop' },
      { word: 'lac', meaning: 'lake' },
      { word: 'a se certa', meaning: 'to argue' },
      { word: 'a lăsa', meaning: 'to let / leave' },
      { word: 'româna', meaning: 'Romanian' },
    ],
    cultureNote: '\u201CPicătură cu picătură se face lac\u201D — a treasured Romanian proverb about persistence, meaning small efforts add up over time',
  },

  loveLog: {
    words: [
      { word: 'A iubi', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Patrie', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 3 },
      { word: 'Sarmale', translation: 'Cabbage rolls', type: 'noun', badge: 'gift' },
      { word: 'Nuntă', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'A iubi',
      translation: 'To love',
      pronunciation: '[a yu-BEE]',
      type: 'verb',
      example: { text: '\u201CTe voi iubi pentru totdeauna\u201D', translation: 'I will love you forever' },
      tenses: ['Prezent', 'Trecut', 'Viitor'],
      conjugations: [
        { person: 'eu', form: 'iubesc' },
        { person: 'tu', form: 'iubești' },
        { person: 'el/ea', form: 'iubește' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Te iubesc foarte mult', // 22 chars ✓
    feedback: {
      praiseWord: 'Minunat!',
      comment: "Your 'ă' and 'î' vowels sound great. Score: 90%",
    },
    followUpPills: [
      { label: 'Try "pentru totdeauna"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Sunday meal' vocabulary",
    context: "Family masa de duminică this weekend — home cooking guaranteed",
    tip: "Start with 'a găti' (to cook) — Bunica always needs help in the kitchen",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Cooking for Crăciun together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas recipes',
    },
    words: [
      { word: 'Cozonac', translation: 'Sweet braided bread' },
      { word: 'Sarmale', translation: 'Cabbage rolls' },
      { word: 'Salată de boeuf', translation: 'Beef salad' },
    ],
    receiverMessage: { title: 'Dragă sent you 3 recipes!', subtitle: 'Crăciun dinner prep 🎄' },
    flipCard: { word: 'Cozonac', translation: 'Sweet braided bread', pronunciation: '[ko-zo-NAK]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '700 / 1000 XP',
    xpPercent: 70,
    wordBreakdown: [
      { count: 23, label: 'nouns', color: '#3b82f6' },
      { count: 13, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 12, dayStreak: 3 },
    aiSummary: 'Practiced Sunday meal vocabulary and family cooking terms',
    motivation: 'Ready to help Bunica in the kitchen this weekend',
  },

  partnerChallenges: {
    quizWord: 'Patrie',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Party', correct: false },
      { label: 'Patience', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "lupul" not "lup-ul"?',
    thinkingContext: 'Learning about Romanian articles and nouns, needs this...',
    explanation: 'Romanian attaches the definite article as a suffix to the noun:',
    conjugations: [
      { person: 'lup → lupul', form: '(masc. sg: -ul)', highlight: true },
      { person: 'casă → casa', form: '(fem. sg: -a)', highlight: false },
      { person: 'copil → copilul', form: '(masc. sg: -ul)', highlight: false },
      { person: 'floare → floarea', form: '(fem. sg: -a)', highlight: false },
    ],
    cultureNote: 'Romanian is the only Romance language that attaches the definite article as a suffix — a Slavic influence that makes it beautifully unique',
    pills: [
      { label: 'Noun cases', primary: true },
      { label: 'Gender patterns', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🍲', text: 'Completed Sunday meal vocabulary quiz', detail: '8/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🥘', text: 'Practiced sarmale recipe vocabulary', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Romanian wedding vow phrases', detail: 'Pronunciation score: 87%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Romanian proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: ă and î sounds', detail: 'Romanian vowels · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 12% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Czech (cs) — Culturally authentic Czech content
// ============================================================

const cs: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'L\u00E1sko',
    familyElder: 'Babi\u010Dka',
    familyParent: 'T\u00E1ta',
    languageAdj: 'Czech',
    flag: '\u{1F1E8}\u{1F1FF}',
  },

  smartGames: {
    card1: { word: 'Svatba', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[SVAT-ba]' },
    card2: { word: 'Nav\u017Edy', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[NAV-zhdi]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Nav\u017Edy', correct: true },
      { label: 'Svatba', correct: false },
      { label: 'Najednou', correct: false },
    ],
    wrongPickLabel: 'Svatba',
  },

  conversation: {
    scenario: { emoji: '\u{1F372}', label: 'Sunday lunch \u00B7 Cooking sv\u00ED\u010Dkov\u00E1' },
    aiMessage: {
      prefix: 'T\u00E1ta asks:',
      targetPhrase: 'D\u00E1\u0161 si je\u0161t\u011B knedl\u00EDky?',
      pronunciation: '[DAHSH see YESH-tyeh KNED-lee-ki]',
    },
    userResponse: 'Ano, pros\u00EDm \u2014 jsou v\u00FDborn\u00E9!',
    feedback: {
      praiseWord: 'V\u00FDborn\u011B!',
      pronunciation: '[VEE-bor-nyeh]',
      comment: 'Natural and polite \u2014 fits right in at the table \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Knedl\u00EDky', translation: 'Dumplings', accuracy: 59 },
      { word: 'Sv\u00ED\u010Dkov\u00E1', translation: 'Marinated beef', accuracy: 42 },
      { word: 'Kopr', translation: 'Dill', accuracy: 31 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Nech je, a\u0165 se h\u00E1daj\u00ED o politiku...', style: 'partner' },
      { label: 'Partner', text: 'Bez pr\u00E1ce nejsou kol\u00E1\u010De \u2014 a ty se fakt sna\u017E\u00ED\u0161!', style: 'partner' },
      { label: 'Translation', text: 'Without work there are no cakes \u2014 and you really are trying!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'pr\u00E1ce', meaning: 'work' },
      { word: 'kol\u00E1\u010De', meaning: 'cakes / pastries' },
      { word: 'h\u00E1dat se', meaning: 'to argue' },
      { word: 'politika', meaning: 'politics' },
      { word: 'sna\u017Eit se', meaning: 'to try / to make effort' },
    ],
    cultureNote: '\u201CBez pr\u00E1ce nejsou kol\u00E1\u010De\u201D \u2014 a classic Czech proverb meaning nothing comes without effort, similar to \u201Cno pain, no gain\u201D',
  },

  loveLog: {
    words: [
      { word: 'Milovat', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Domov', translation: 'Home', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Knedl\u00EDky', translation: 'Dumplings', type: 'noun', badge: 'gift' },
      { word: 'Svatba', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Milovat',
      translation: 'To love',
      pronunciation: '[MI-lo-vat]',
      type: 'verb',
      example: { text: '\u201CMiluji t\u011B nav\u017Edy\u201D', translation: 'I love you forever' },
      tenses: ['P\u0159\u00EDtomn\u00FD', 'Minul\u00FD', 'Budouc\u00ED'],
      conjugations: [
        { person: 'j\u00E1', form: 'miluji' },
        { person: 'ty', form: 'miluje\u0161' },
        { person: 'on/ona', form: 'miluje' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Slibuji ti svou l\u00E1sku', // 22 chars
    feedback: {
      praiseWord: 'Skv\u011Ble!',
      comment: "Your '\u0159' sound is really improving. Score: 88%",
    },
    followUpPills: [
      { label: 'Try "nav\u017Edy"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'family dinner' vocabulary",
    context: "Sunday lunch at Babi\u010Dka\u2019s \u2014 cooking sv\u00ED\u010Dkov\u00E1 together",
    tip: "Start with 'om\u00E1\u010Dka' (sauce) \u2014 Babi\u010Dka\u2019s recipe has 5 ingredients to learn",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking \u0160t\u011Bdr\u00FD den together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas Eve recipes',
    },
    words: [
      { word: 'Kapr', translation: 'Carp' },
      { word: 'Bramborov\u00FD sal\u00E1t', translation: 'Potato salad' },
      { word: 'V\u00E1no\u010Dka', translation: 'Christmas bread' },
    ],
    receiverMessage: { title: 'L\u00E1sko sent you 3 recipes!', subtitle: '\u0160t\u011Bdr\u00FD den dinner prep \u{1F384}' },
    flipCard: { word: 'V\u00E1no\u010Dka', translation: 'Christmas bread', pronunciation: '[VAH-noch-ka]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '690 / 1000 XP',
    xpPercent: 69,
    wordBreakdown: [
      { count: 22, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 8, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 11, dayStreak: 4 },
    aiSummary: 'Practiced cooking vocabulary and family dinner phrases',
    motivation: 'Ready to help Babi\u010Dka in the kitchen this Sunday',
  },

  partnerChallenges: {
    quizWord: 'Domov',
    quizOptions: [
      { label: 'Home', correct: true },
      { label: 'Dream', correct: false },
      { label: 'Door', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "miluji t\u011B" but "vid\u00EDm tebe"?',
    thinkingContext: 'Writing vow phrases with pronouns, needs this...',
    explanation: 'Czech has short and long pronoun forms \u2014 short forms are unstressed clitics:',
    conjugations: [
      { person: 'short (accusative)', form: 't\u011B', highlight: true },
      { person: 'long (accusative)', form: 'tebe', highlight: false },
      { person: 'short (dative)', form: 'ti', highlight: false },
      { person: 'long (dative)', form: 'tob\u011B', highlight: false },
    ],
    cultureNote: 'Short forms (t\u011B, ti, mi) are everyday Czech \u2014 long forms (tebe, tob\u011B, mn\u011B) add emphasis or follow prepositions',
    pills: [
      { label: 'All pronoun forms', primary: true },
      { label: 'Czech cases explained', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F372}', text: 'Completed cooking vocabulary quiz', detail: '8/10 correct \u00B7 12 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F95F}', text: 'Practiced knedl\u00EDky recipe words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Czech wedding vow phrases', detail: 'Pronunciation score: 85%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Czech proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: \u0159 and \u010D sounds', detail: '\u0159, \u010D, and \u017E sounds \u00B7 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 13% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Swedish (sv) — Culturally authentic Swedish content
// ============================================================

const sv: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: '\u00C4lskling',
    familyElder: 'Mormor',
    familyParent: 'Pappa',
    languageAdj: 'Swedish',
    flag: '\u{1F1F8}\u{1F1EA}',
  },

  smartGames: {
    card1: { word: 'Br\u00F6llop', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[BRUL-op]' },
    card2: { word: 'F\u00F6r alltid', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[fur AL-tid]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'F\u00F6r alltid', correct: true },
      { label: 'Br\u00F6llop', correct: false },
      { label: 'F\u00F6rst\u00E5s', correct: false },
    ],
    wrongPickLabel: 'Br\u00F6llop',
  },

  conversation: {
    scenario: { emoji: '\u2615', label: 'Afternoon fika \u00B7 Mormor\u2019s kitchen' },
    aiMessage: {
      prefix: 'Mormor asks:',
      targetPhrase: 'Vill du ha en kanelbulle till?',
      pronunciation: '[vill doo ha en ka-NEL-BUL-eh till]',
    },
    userResponse: 'Ja tack, de \u00E4r j\u00E4ttegoda!',
    feedback: {
      praiseWord: 'J\u00E4ttebra!',
      pronunciation: '[YET-eh-bra]',
      comment: 'So natural \u2014 Mormor would be proud \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from fika with family',
    subtext: 'These keep tripping you up during coffee time',
    words: [
      { word: 'Kanelbulle', translation: 'Cinnamon bun', accuracy: 61 },
      { word: 'Sm\u00F6rg\u00E5s', translation: 'Open sandwich', accuracy: 44 },
      { word: 'Chokladboll', translation: 'Chocolate ball', accuracy: 33 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Sluta oroa dig f\u00F6r vad farbror Erik sa...', style: 'partner' },
      { label: 'Partner', text: '\u00D6vning ger f\u00E4rdighet \u2014 precis som din svenska!', style: 'partner' },
      { label: 'Translation', text: 'Practice makes perfect \u2014 just like your Swedish!', style: 'translation' },
    ],
    extractedWords: [
      { word: '\u00F6vning', meaning: 'practice' },
      { word: 'f\u00E4rdighet', meaning: 'skill / proficiency' },
      { word: 'oroa', meaning: 'to worry' },
      { word: 'farbror', meaning: 'uncle' },
      { word: 'svenska', meaning: 'Swedish' },
    ],
    cultureNote: '\u201C\u00D6vning ger f\u00E4rdighet\u201D \u2014 a classic Swedish proverb meaning practice gives skill, the Swedish equivalent of \u201Cpractice makes perfect\u201D',
  },

  loveLog: {
    words: [
      { word: '\u00C4lska', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Hemma', translation: 'At home', type: 'adverb', badge: 'streak', streak: 5 },
      { word: 'Kanelbulle', translation: 'Cinnamon bun', type: 'noun', badge: 'gift' },
      { word: 'Br\u00F6llop', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: '\u00C4lska',
      translation: 'To love',
      pronunciation: '[EL-ska]',
      type: 'verb',
      example: { text: '\u201CJag kommer alltid att \u00E4lska dig\u201D', translation: 'I will always love you' },
      tenses: ['Presens', 'Preteritum', 'Futurum'],
      conjugations: [
        { person: 'jag', form: '\u00E4lskar' },
        { person: 'du', form: '\u00E4lskar' },
        { person: 'han/hon', form: '\u00E4lskar' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Jag lovar dig min k\u00E4rlek', // 24 chars
    feedback: {
      praiseWord: 'Underbart!',
      comment: "Your Swedish 'sj' sound is clicking. Score: 90%",
    },
    followUpPills: [
      { label: 'Try "f\u00F6r alltid"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'fika' vocabulary",
    context: "Visiting Mormor this weekend \u2014 fika is guaranteed",
    tip: "Start with 'bullar' (buns) \u2014 Mormor always asks which kind you want",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Preparing Julbord together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas table recipes',
    },
    words: [
      { word: 'K\u00F6ttbullar', translation: 'Meatballs' },
      { word: 'Janssons frestelse', translation: 'Jansson\u2019s temptation' },
      { word: 'Lussekatt', translation: 'Saffron bun' },
    ],
    receiverMessage: { title: '\u00C4lskling sent you 3 recipes!', subtitle: 'Julbord dinner prep \u{1F384}' },
    flipCard: { word: 'Lussekatt', translation: 'Saffron bun', pronunciation: '[LUS-eh-kat]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '740 / 1000 XP',
    xpPercent: 74,
    wordBreakdown: [
      { count: 25, label: 'nouns', color: '#3b82f6' },
      { count: 13, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 14, dayStreak: 5 },
    aiSummary: 'Practiced fika vocabulary and family conversation phrases',
    motivation: 'Ready to impress Mormor at Saturday fika',
  },

  partnerChallenges: {
    quizWord: 'Hemma',
    quizOptions: [
      { label: 'At home', correct: true },
      { label: 'Heaven', correct: false },
      { label: 'Secret', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "en stol" but "ett bord"?',
    thinkingContext: 'Setting the table for fika, needs this...',
    explanation: 'Swedish has two genders \u2014 en-words (common) and ett-words (neuter):',
    conjugations: [
      { person: 'en (common)', form: 'en stol \u2192 stolen', highlight: true },
      { person: 'ett (neuter)', form: 'ett bord \u2192 bordet', highlight: true },
      { person: 'en plural', form: 'stolar \u2192 stolarna', highlight: false },
      { person: 'ett plural', form: 'bord \u2192 borden', highlight: false },
    ],
    cultureNote: 'There is no rule for which nouns are en or ett \u2014 you just have to learn each word with its article, like German der/die/das',
    pills: [
      { label: 'Common en/ett words', primary: true },
      { label: 'Definite suffixes', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u2615', text: 'Completed fika vocabulary quiz', detail: '9/10 correct \u00B7 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F9C1}', text: 'Practiced baking vocabulary', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Swedish wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Swedish proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: \u00E5, \u00E4, \u00F6 sounds', detail: 'Vowel sounds \u00B7 11 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 14% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Norwegian (no) — Culturally authentic Norwegian content (Bokm\u00E5l)
// ============================================================

const no_: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Kj\u00E6re',
    familyElder: 'Bestemor',
    familyParent: 'Pappa',
    languageAdj: 'Norwegian',
    flag: '\u{1F1F3}\u{1F1F4}',
  },

  smartGames: {
    card1: { word: 'Bryllup', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[BRIL-up]' },
    card2: { word: 'For alltid', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[for AL-tid]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'For alltid', correct: true },
      { label: 'Bryllup', correct: false },
      { label: 'For \u00F8vrig', correct: false },
    ],
    wrongPickLabel: 'Bryllup',
  },

  conversation: {
    scenario: { emoji: '\u{1F3D4}\uFE0F', label: 'Sunday hike \u00B7 Friluftsliv with family' },
    aiMessage: {
      prefix: 'Pappa asks:',
      targetPhrase: 'Vil du ha litt mer kaffe?',
      pronunciation: '[vill doo ha litt mehr KAF-eh]',
    },
    userResponse: 'Ja takk, det er deilig ute her!',
    feedback: {
      praiseWord: 'Kjempebra!',
      pronunciation: '[KHEM-peh-bra]',
      comment: 'Perfect friluftsliv spirit \u2014 well said \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from outdoor adventures',
    subtext: 'These keep tripping you up on hikes together',
    words: [
      { word: 'Termos', translation: 'Thermos', accuracy: 63 },
      { word: 'Tursti', translation: 'Hiking trail', accuracy: 40 },
      { word: 'Fjelltopp', translation: 'Mountain peak', accuracy: 32 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Ikke tenk p\u00E5 det onkel Lars sa...', style: 'partner' },
      { label: 'Partner', text: '\u00D8velse gj\u00F8r mester \u2014 akkurat som norsken din!', style: 'partner' },
      { label: 'Translation', text: 'Practice makes perfect \u2014 just like your Norwegian!', style: 'translation' },
    ],
    extractedWords: [
      { word: '\u00F8velse', meaning: 'practice / exercise' },
      { word: 'mester', meaning: 'master' },
      { word: 'tenke', meaning: 'to think' },
      { word: 'onkel', meaning: 'uncle' },
      { word: 'norsk', meaning: 'Norwegian' },
    ],
    cultureNote: '\u201C\u00D8velse gj\u00F8r mester\u201D \u2014 a well-known Norwegian proverb meaning practice makes a master, used to encourage steady progress',
  },

  loveLog: {
    words: [
      { word: 'Elske', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Hytte', translation: 'Cabin', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Termos', translation: 'Thermos', type: 'noun', badge: 'gift' },
      { word: 'Bryllup', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Elske',
      translation: 'To love',
      pronunciation: '[EL-skeh]',
      type: 'verb',
      example: { text: '\u201CJeg vil alltid elske deg\u201D', translation: 'I will always love you' },
      tenses: ['Presens', 'Preteritum', 'Futurum'],
      conjugations: [
        { person: 'jeg', form: 'elsker' },
        { person: 'du', form: 'elsker' },
        { person: 'han/hun', form: 'elsker' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Jeg lover deg for alltid', // 24 chars
    feedback: {
      praiseWord: 'Fantastisk!',
      comment: "Your Norwegian 'kj' sound is getting clear. Score: 91%",
    },
    followUpPills: [
      { label: 'Try "for alltid"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'hiking trip' vocabulary",
    context: "Family mountain hike this weekend \u2014 bring good boots and words",
    tip: "Start with 'utsikt' (view) \u2014 Pappa always points out the scenery",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking Julaften together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas Eve recipes',
    },
    words: [
      { word: 'Pinnekj\u00F8tt', translation: 'Cured lamb ribs' },
      { word: 'Riskrem', translation: 'Rice cream dessert' },
      { word: 'Lefse', translation: 'Potato flatbread' },
    ],
    receiverMessage: { title: 'Kj\u00E6re sent you 3 recipes!', subtitle: 'Julaften dinner prep \u{1F384}' },
    flipCard: { word: 'Lefse', translation: 'Potato flatbread', pronunciation: '[LEF-seh]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '700 / 1000 XP',
    xpPercent: 70,
    wordBreakdown: [
      { count: 23, label: 'nouns', color: '#3b82f6' },
      { count: 13, label: 'verbs', color: '#8b5cf6' },
      { count: 7, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 12, dayStreak: 4 },
    aiSummary: 'Practiced outdoor vocabulary and hiking conversation phrases',
    motivation: 'Ready to join the family on a proper fjelltur',
  },

  partnerChallenges: {
    quizWord: 'Hytte',
    quizOptions: [
      { label: 'Cabin', correct: true },
      { label: 'Hut', correct: false },
      { label: 'Hotel', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "en stol" but "ei jente" and "et bord"?',
    thinkingContext: 'Learning nouns at the hytte, needs this...',
    explanation: 'Bokm\u00E5l has three genders \u2014 masculine (en), feminine (ei), and neuter (et):',
    conjugations: [
      { person: 'en (masculine)', form: 'en stol \u2192 stolen', highlight: true },
      { person: 'ei (feminine)', form: 'ei jente \u2192 jenta', highlight: true },
      { person: 'et (neuter)', form: 'et bord \u2192 bordet', highlight: true },
      { person: 'plural', form: 'stoler \u2192 stolene', highlight: false },
    ],
    cultureNote: 'Feminine nouns can also use en (common gender), but using ei sounds more authentically Norwegian and is preferred in everyday speech',
    pills: [
      { label: 'Common gender words', primary: true },
      { label: 'Definite suffixes', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F3D4}\uFE0F', text: 'Completed hiking vocabulary quiz', detail: '9/10 correct \u00B7 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u2615', text: 'Practiced outdoor coffee words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Norwegian wedding vow phrases', detail: 'Pronunciation score: 87%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Norwegian proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: kj and skj sounds', detail: 'kj, skj, and \u00E6 sounds \u00B7 13 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 12% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Danish (da) — Culturally authentic Danish content
// ============================================================

const da: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Skat',
    familyElder: 'Mormor',
    familyParent: 'Far',
    languageAdj: 'Danish',
    flag: '\u{1F1E9}\u{1F1F0}',
  },

  smartGames: {
    card1: { word: 'Bryllup', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[BROO-lup]' },
    card2: { word: 'For evigt', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[for EH-veet]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'For evigt', correct: true },
      { label: 'Bryllup', correct: false },
      { label: 'For altid', correct: false },
    ],
    wrongPickLabel: 'Bryllup',
  },

  conversation: {
    scenario: { emoji: '\u{1F56F}\uFE0F', label: 'Friday hygge \u00B7 Cozy evening at home' },
    aiMessage: {
      prefix: 'Far asks:',
      targetPhrase: 'Vil du have mere \u00E6bleskiver?',
      pronunciation: '[vil doo ha MAIR EH-bluh-skee-vur]',
    },
    userResponse: 'Ja tak, de smager fantastisk!',
    feedback: {
      praiseWord: 'Perfekt!',
      pronunciation: '[pair-FEKT]',
      comment: 'Natural phrasing \u2014 you sound very Danish \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from hygge evenings',
    subtext: 'These keep tripping you up during cozy nights',
    words: [
      { word: '\u00C6bleskiver', translation: 'Danish pancake balls', accuracy: 55 },
      { word: 'Stearinlys', translation: 'Candle', accuracy: 40 },
      { word: 'Hyggeligt', translation: 'Cozy', accuracy: 33 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Slap nu af, det l\u00F8ser sig nok...', style: 'partner' },
      { label: 'Partner', text: '\u00D8velse g\u00F8r mester \u2014 ligesom dit dansk!', style: 'partner' },
      { label: 'Translation', text: 'Practice makes perfect \u2014 just like your Danish!', style: 'translation' },
    ],
    extractedWords: [
      { word: '\u00F8velse', meaning: 'practice' },
      { word: 'mester', meaning: 'master' },
      { word: 'slappe af', meaning: 'to relax' },
      { word: 'l\u00F8se', meaning: 'to solve' },
      { word: 'ligesom', meaning: 'just like' },
    ],
    cultureNote: '\u201C\u00D8velse g\u00F8r mester\u201D \u2014 the Danish equivalent of \u201Cpractice makes perfect,\u201D used to encourage steady improvement',
  },

  loveLog: {
    words: [
      { word: 'Elsker', translation: 'Love (v)', type: 'verb', badge: 'mastery' },
      { word: 'Hjerte', translation: 'Heart', type: 'noun', badge: 'streak', streak: 4 },
      { word: '\u00C6bleskiver', translation: 'Pancake balls', type: 'noun', badge: 'gift' },
      { word: 'Bryllup', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Elsker',
      translation: 'Love (v)',
      pronunciation: '[EL-sker]',
      type: 'verb',
      example: { text: '\u201CJeg elsker dig for evigt\u201D', translation: 'I love you forever' },
      tenses: ['Nutid', 'Datid', 'Fremtid'],
      conjugations: [
        { person: 'jeg', form: 'elsker' },
        { person: 'du', form: 'elsker' },
        { person: 'han/hun', form: 'elsker' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Jeg elsker dig, Skat', // 21 chars
    feedback: {
      praiseWord: 'Fantastisk!',
      comment: "Your soft 'd' is almost native. Score: 91%",
    },
    followUpPills: [
      { label: 'Try "for evigt"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'hygge evening' vocabulary",
    context: "Friday night at Mormor\u2019s house \u2014 candles and \u00E6bleskiver guaranteed",
    tip: "Start with 'hyggeligt' (cozy) \u2014 the most Danish word there is",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking Juleaften together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas Eve recipes',
    },
    words: [
      { word: 'Fl\u00E6skesteg', translation: 'Roast pork' },
      { word: 'R\u00F8dk\u00E5l', translation: 'Red cabbage' },
      { word: 'Risalamande', translation: 'Rice pudding dessert' },
    ],
    receiverMessage: { title: 'Skat sent you 3 recipes!', subtitle: 'Juleaften dinner prep \u{1F384}' },
    flipCard: { word: 'Risalamande', translation: 'Rice pudding dessert', pronunciation: '[rees-a-la-MAHND]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '690 / 1000 XP',
    xpPercent: 69,
    wordBreakdown: [
      { count: 22, label: 'nouns', color: '#3b82f6' },
      { count: 13, label: 'verbs', color: '#8b5cf6' },
      { count: 8, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 11, dayStreak: 4 },
    aiSummary: 'Practiced hygge vocabulary and family evening phrases',
    motivation: 'Ready to join the cozy Danish evening like a local',
  },

  partnerChallenges: {
    quizWord: 'Hjerte',
    quizOptions: [
      { label: 'Heart', correct: true },
      { label: 'Home', correct: false },
      { label: 'Hope', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "et hus" but "en kat"?',
    thinkingContext: 'Learning household vocabulary, needs this...',
    explanation: 'Danish has two genders \u2014 common (en) and neuter (et):',
    conjugations: [
      { person: 'en (common)', form: 'en kat \u2192 katten', highlight: true },
      { person: 'et (neuter)', form: 'et hus \u2192 huset', highlight: true },
      { person: 'en (common)', form: 'en stol \u2192 stolen', highlight: false },
      { person: 'et (neuter)', form: 'et \u00E6ble \u2192 \u00E6blet', highlight: false },
    ],
    cultureNote: 'Danish definite articles are suffixed to the noun \u2014 \u201Chuset\u201D means \u201Cthe house.\u201D No separate word for \u201Cthe\u201D like in English!',
    pills: [
      { label: 'En vs et quiz', primary: true },
      { label: 'St\u00F8d (glottal stop)', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F56F}\uFE0F', text: 'Completed hygge vocabulary quiz', detail: '8/10 correct \u00B7 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F95E}', text: 'Practiced \u00E6bleskiver recipe words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Danish wedding vow phrases', detail: 'Pronunciation score: 88%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Danish proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: "Voice drill: soft 'd' sounds", detail: 'Soft d and st\u00F8d \u00B7 13 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 13% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Greek (el) — Culturally authentic Greek content
// ============================================================

const el: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: '\u0391\u03B3\u03AC\u03C0\u03B7 \u03BC\u03BF\u03C5',
    familyElder: '\u0393\u03B9\u03B1\u03B3\u03B9\u03AC',
    familyParent: '\u039C\u03C0\u03B1\u03BC\u03C0\u03AC',
    languageAdj: 'Greek',
    flag: '\u{1F1EC}\u{1F1F7}',
  },

  smartGames: {
    card1: { word: '\u0393\u03AC\u03BC\u03BF\u03C2', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[GHA-mos]' },
    card2: { word: '\u0393\u03B9\u03B1 \u03C0\u03AC\u03BD\u03C4\u03B1', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[ya PAN-da]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: '\u0393\u03B9\u03B1 \u03C0\u03AC\u03BD\u03C4\u03B1', correct: true },
      { label: '\u0393\u03AC\u03BC\u03BF\u03C2', correct: false },
      { label: '\u039C\u03B1\u03B6\u03AF', correct: false },
    ],
    wrongPickLabel: '\u0393\u03AC\u03BC\u03BF\u03C2',
  },

  conversation: {
    scenario: { emoji: '\u{1F411}', label: '\u03A0\u03AC\u03C3\u03C7\u03B1 (Easter) \u00B7 Lamb on the spit' },
    aiMessage: {
      prefix: '\u039C\u03C0\u03B1\u03BC\u03C0\u03AC asks:',
      targetPhrase: '\u0398\u03AD\u03BB\u03B5\u03B9\u03C2 \u03BB\u03AF\u03B3\u03BF \u03B1\u03BA\u03CC\u03BC\u03B1 \u03B1\u03C1\u03BD\u03AF;',
      pronunciation: '[THEH-lees LEE-gho a-KO-ma ar-NEE]',
    },
    userResponse: '\u039D\u03B1\u03B9, \u03B5\u03C5\u03C7\u03B1\u03C1\u03B9\u03C3\u03C4\u03CE \u2014 \u03B5\u03AF\u03BD\u03B1\u03B9 \u03C0\u03B5\u03BD\u03C4\u03B1\u03BD\u03CC\u03C3\u03C4\u03B9\u03BC\u03BF!',
    feedback: {
      praiseWord: '\u039C\u03C0\u03C1\u03AC\u03B2\u03BF!',
      pronunciation: '[BRA-vo]',
      comment: 'Perfect use of the superlative \u2014 well done \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from Easter cooking',
    subtext: 'These keep tripping you up around the table',
    words: [
      { word: '\u0391\u03C1\u03BD\u03AF', translation: 'Lamb', accuracy: 60 },
      { word: '\u03A4\u03C3\u03BF\u03C5\u03C1\u03AD\u03BA\u03B9', translation: 'Easter bread', accuracy: 42 },
      { word: '\u039C\u03B1\u03B3\u03B5\u03B9\u03C1\u03AF\u03C4\u03C3\u03B1', translation: 'Easter soup', accuracy: 31 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: '\u039C\u03B7\u03BD \u03B1\u03B3\u03C7\u03CE\u03BD\u03B5\u03C3\u03B1\u03B9 \u03B3\u03B9\u03B1 \u03C4\u03B7 \u0393\u03B9\u03B1\u03B3\u03B9\u03AC...', style: 'partner' },
      { label: 'Partner', text: '\u03A3\u03B9\u03B3\u03AC \u03C3\u03B9\u03B3\u03AC \u03B3\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B7 \u03B1\u03B3\u03BF\u03C5\u03C1\u03AF\u03B4\u03B1 \u03BC\u03AD\u03BB\u03B9 \u2014 \u03CC\u03C0\u03C9\u03C2 \u03C4\u03B1 \u03B5\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC \u03C3\u03BF\u03C5!', style: 'partner' },
      { label: 'Translation', text: 'Slowly slowly the sour grape becomes honey \u2014 like your Greek!', style: 'translation' },
    ],
    extractedWords: [
      { word: '\u03B1\u03B3\u03BF\u03C5\u03C1\u03AF\u03B4\u03B1', meaning: 'sour grape' },
      { word: '\u03BC\u03AD\u03BB\u03B9', meaning: 'honey' },
      { word: '\u03C3\u03B9\u03B3\u03AC', meaning: 'slowly' },
      { word: '\u03B1\u03B3\u03C7\u03CE\u03BD\u03BF\u03BC\u03B1\u03B9', meaning: 'to worry' },
      { word: '\u03B3\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9', meaning: 'becomes' },
    ],
    cultureNote: '\u201C\u03A3\u03B9\u03B3\u03AC \u03C3\u03B9\u03B3\u03AC \u03B3\u03AF\u03BD\u03B5\u03C4\u03B1\u03B9 \u03B7 \u03B1\u03B3\u03BF\u03C5\u03C1\u03AF\u03B4\u03B1 \u03BC\u03AD\u03BB\u03B9\u201D \u2014 a classic Greek proverb about patience, often said by grandmothers to encourage perseverance',
  },

  loveLog: {
    words: [
      { word: '\u0391\u03B3\u03B1\u03C0\u03CE', translation: 'I love', type: 'verb', badge: 'mastery' },
      { word: '\u039A\u03B1\u03C1\u03B4\u03B9\u03AC', translation: 'Heart', type: 'noun', badge: 'streak', streak: 5 },
      { word: '\u03A4\u03C3\u03BF\u03C5\u03C1\u03AD\u03BA\u03B9', translation: 'Easter bread', type: 'noun', badge: 'gift' },
      { word: '\u0393\u03AC\u03BC\u03BF\u03C2', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: '\u0391\u03B3\u03B1\u03C0\u03CE',
      translation: 'I love',
      pronunciation: '[a-gha-PO]',
      type: 'verb',
      example: { text: '\u201C\u03A3\u2019\u03B1\u03B3\u03B1\u03C0\u03CE \u03B3\u03B9\u03B1 \u03C0\u03AC\u03BD\u03C4\u03B1\u201D', translation: 'I love you forever' },
      tenses: ['\u0395\u03BD\u03B5\u03C3\u03C4\u03CE\u03C4\u03B1\u03C2', '\u0391\u03CC\u03C1\u03B9\u03C3\u03C4\u03BF\u03C2', '\u039C\u03AD\u03BB\u03BB\u03BF\u03BD\u03C4\u03B1\u03C2'],
      conjugations: [
        { person: '\u03B5\u03B3\u03CE', form: '\u03B1\u03B3\u03B1\u03C0\u03CE' },
        { person: '\u03B5\u03C3\u03CD', form: '\u03B1\u03B3\u03B1\u03C0\u03AC\u03C2' },
        { person: '\u03B1\u03C5\u03C4\u03CC\u03C2/\u03AE', form: '\u03B1\u03B3\u03B1\u03C0\u03AC' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: '\u03A3\u2019\u03B1\u03B3\u03B1\u03C0\u03CE, \u03B1\u03B3\u03AC\u03C0\u03B7 \u03BC\u03BF\u03C5', // 19 chars
    feedback: {
      praiseWord: '\u03A4\u03AD\u03BB\u03B5\u03B9\u03B1!',
      comment: "Your rolled 'r' sounds natural now. Score: 90%",
    },
    followUpPills: [
      { label: 'Try "\u03B3\u03B9\u03B1 \u03C0\u03AC\u03BD\u03C4\u03B1"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Easter table' vocabulary",
    context: "\u03A0\u03AC\u03C3\u03C7\u03B1 dinner at \u0393\u03B9\u03B1\u03B3\u03B9\u03AC\u2019s this weekend \u2014 lamb and toasts expected",
    tip: "Start with '\u03A7\u03C1\u03B9\u03C3\u03C4\u03CC\u03C2 \u0391\u03BD\u03AD\u03C3\u03C4\u03B7' (Christ is Risen) \u2014 the essential Easter greeting",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F95A}',
      title: 'Cooking \u03A0\u03AC\u03C3\u03C7\u03B1 together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Easter recipes',
    },
    words: [
      { word: '\u0391\u03C1\u03BD\u03AF', translation: 'Lamb' },
      { word: '\u03A4\u03C3\u03BF\u03C5\u03C1\u03AD\u03BA\u03B9', translation: 'Easter bread' },
      { word: '\u039C\u03B1\u03B3\u03B5\u03B9\u03C1\u03AF\u03C4\u03C3\u03B1', translation: 'Easter soup' },
    ],
    receiverMessage: { title: '\u0391\u03B3\u03AC\u03C0\u03B7 \u03BC\u03BF\u03C5 sent you 3 recipes!', subtitle: '\u03A0\u03AC\u03C3\u03C7\u03B1 dinner prep \u{1F95A}' },
    flipCard: { word: '\u03A4\u03C3\u03BF\u03C5\u03C1\u03AD\u03BA\u03B9', translation: 'Easter bread', pronunciation: '[tsoo-REH-kee]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '730 / 1000 XP',
    xpPercent: 73,
    wordBreakdown: [
      { count: 24, label: 'nouns', color: '#3b82f6' },
      { count: 15, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 14, dayStreak: 5 },
    aiSummary: 'Practiced Easter vocabulary and family gathering phrases',
    motivation: 'Ready to navigate the \u03A0\u03AC\u03C3\u03C7\u03B1 table like family',
  },

  partnerChallenges: {
    quizWord: '\u039A\u03B1\u03C1\u03B4\u03B9\u03AC',
    quizOptions: [
      { label: 'Heart', correct: true },
      { label: 'Home', correct: false },
      { label: 'Happiness', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03AE\u03C3\u03C9" not "\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03CE"?',
    thinkingContext: 'Writing vow phrases, needs to understand aspect...',
    explanation: 'Greek verbs have two aspects \u2014 perfective for completed actions:',
    conjugations: [
      { person: '\u03B5\u03B3\u03CE', form: '\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03AE\u03C3\u03C9', highlight: true },
      { person: '\u03B5\u03C3\u03CD', form: '\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03AE\u03C3\u03B5\u03B9\u03C2', highlight: false },
      { person: '\u03B1\u03C5\u03C4\u03CC\u03C2/\u03AE', form: '\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03AE\u03C3\u03B5\u03B9', highlight: false },
      { person: '\u03B5\u03BC\u03B5\u03AF\u03C2', form: '\u03B8\u03B1 \u03B1\u03B3\u03B1\u03C0\u03AE\u03C3\u03BF\u03C5\u03BC\u03B5', highlight: false },
    ],
    cultureNote: 'Greek uses \u201C\u03B8\u03B1 + aorist stem\u201D for one-time future actions and \u201C\u03B8\u03B1 + present stem\u201D for ongoing ones \u2014 aspect matters more than tense!',
    pills: [
      { label: 'Aspect practice', primary: true },
      { label: 'Greek alphabet drill', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F411}', text: 'Completed Easter vocabulary quiz', detail: '9/10 correct \u00B7 12 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F95A}', text: 'Practiced \u03A0\u03AC\u03C3\u03C7\u03B1 recipe words', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Greek wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Greek proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: Greek alphabet sounds', detail: '\u03B3 and \u03C7 sounds \u00B7 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 15% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Hungarian (hu) — Culturally authentic Hungarian content
// ============================================================

const hu: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: '\u00C9desem',
    familyElder: 'Nagymama',
    familyParent: 'Apu',
    languageAdj: 'Hungarian',
    flag: '\u{1F1ED}\u{1F1FA}',
  },

  smartGames: {
    card1: { word: 'Esk\u00FCv\u0151', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[ESH-koo-vuh]' },
    card2: { word: '\u00D6r\u00F6kk\u00E9', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[UH-ruhk-keh]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: '\u00D6r\u00F6kk\u00E9', correct: true },
      { label: 'Esk\u00FCv\u0151', correct: false },
      { label: 'Mindig', correct: false },
    ],
    wrongPickLabel: 'Esk\u00FCv\u0151',
  },

  conversation: {
    scenario: { emoji: '\u{1F372}', label: 'Sunday lunch \u00B7 Nagymama\u2019s kitchen' },
    aiMessage: {
      prefix: 'Apu asks:',
      targetPhrase: 'K\u00E9rsz m\u00E9g egy kis guly\u00E1st?',
      pronunciation: '[kehrss mehg ej kish GOO-yaasht]',
    },
    userResponse: 'Igen, k\u00F6sz\u00F6n\u00F6m \u2014 nagyon finom!',
    feedback: {
      praiseWord: 'Remek!',
      pronunciation: '[REH-mek]',
      comment: 'Great word order \u2014 very natural Hungarian \u{1F44F}',
    },
  },

  weakestWords: {
    header: 'Words from cooking with Nagymama',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Guly\u00E1s', translation: 'Goulash', accuracy: 60 },
      { word: 'T\u00FAr\u00F3s csusza', translation: 'Cottage cheese noodles', accuracy: 38 },
      { word: 'P\u00F6rk\u00F6lt', translation: 'Stew', accuracy: 33 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Ne agg\u00F3dj a nagyb\u00E1csi miatt...', style: 'partner' },
      { label: 'Partner', text: 'Gyakorlat teszi a mestert \u2014 mint a magyarod!', style: 'partner' },
      { label: 'Translation', text: 'Practice makes the master \u2014 like your Hungarian!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'gyakorlat', meaning: 'practice' },
      { word: 'mester', meaning: 'master' },
      { word: 'agg\u00F3dni', meaning: 'to worry' },
      { word: 'nagyb\u00E1csi', meaning: 'uncle' },
      { word: 'miatt', meaning: 'because of' },
    ],
    cultureNote: '\u201CGyakorlat teszi a mestert\u201D \u2014 Hungary\u2019s equivalent of \u201Cpractice makes perfect,\u201D a proverb frequently used to encourage learners',
  },

  loveLog: {
    words: [
      { word: 'Szeret', translation: 'Love (v)', type: 'verb', badge: 'mastery' },
      { word: 'Sz\u00EDv', translation: 'Heart', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Guly\u00E1s', translation: 'Goulash', type: 'noun', badge: 'gift' },
      { word: 'Esk\u00FCv\u0151', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Szeret',
      translation: 'Love (v)',
      pronunciation: '[SEH-ret]',
      type: 'verb',
      example: { text: '\u201CSzeretlek \u00F6r\u00F6kk\u00E9\u201D', translation: 'I love you forever' },
      tenses: ['Jelen id\u0151', 'M\u00FAlt id\u0151', 'J\u00F6v\u0151 id\u0151'],
      conjugations: [
        { person: '\u00E9n', form: 'szeretek / szeretlek' },
        { person: 'te', form: 'szeretsz' },
        { person: '\u0151', form: 'szeret' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Szeretlek, \u00C9desem', // 18 chars
    feedback: {
      praiseWord: 'Nagyszer\u0171!',
      comment: "Your vowel harmony is spot-on now. Score: 92%",
    },
    followUpPills: [
      { label: 'Try "\u00F6r\u00F6kk\u00E9"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Sunday lunch' vocabulary",
    context: "Lunch at Nagymama\u2019s this weekend \u2014 guly\u00E1s is on the menu",
    tip: "Start with 'finom' (delicious) \u2014 Nagymama loves hearing it",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking Kar\u00E1csony together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas recipes',
    },
    words: [
      { word: 'T\u00F6lt\u00F6tt k\u00E1poszta', translation: 'Stuffed cabbage' },
      { word: 'Hal\u00E1szl\u00E9', translation: 'Fisherman\u2019s soup' },
      { word: 'Bejgli', translation: 'Walnut/poppy roll' },
    ],
    receiverMessage: { title: '\u00C9desem sent you 3 recipes!', subtitle: 'Kar\u00E1csony dinner prep \u{1F384}' },
    flipCard: { word: 'Bejgli', translation: 'Walnut/poppy roll', pronunciation: '[BEY-glee]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '700 / 1000 XP',
    xpPercent: 70,
    wordBreakdown: [
      { count: 21, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 7, label: 'adj', color: '#f59e0b' },
      { count: 12, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 12, dayStreak: 3 },
    aiSummary: 'Practiced kitchen vocabulary and family gathering phrases',
    motivation: 'Ready to help Nagymama in the kitchen \u2014 in Hungarian',
  },

  partnerChallenges: {
    quizWord: 'Sz\u00EDv',
    quizOptions: [
      { label: 'Heart', correct: true },
      { label: 'Sweet', correct: false },
      { label: 'Soul', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "h\u00E1zban" but "kertben"?',
    thinkingContext: 'Describing locations at Nagymama\u2019s house, needs this...',
    explanation: 'Hungarian uses vowel harmony \u2014 suffixes match the word\u2019s vowels:',
    conjugations: [
      { person: 'back vowel', form: 'h\u00E1z \u2192 h\u00E1zban (in the house)', highlight: true },
      { person: 'front vowel', form: 'kert \u2192 kertben (in the garden)', highlight: true },
      { person: 'back vowel', form: 'szoba \u2192 szob\u00E1ban (in the room)', highlight: false },
      { person: 'front vowel', form: 'sz\u00E9k \u2192 sz\u00E9kben (in the chair)', highlight: false },
    ],
    cultureNote: 'Vowel harmony is the key to sounding natural in Hungarian \u2014 back vowels (a, o, u) take back suffixes, front vowels (e, i, \u00F6, \u00FC) take front ones',
    pills: [
      { label: 'Vowel harmony quiz', primary: true },
      { label: 'All 18 cases', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F372}', text: 'Completed family lunch vocabulary', detail: '8/10 correct \u00B7 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F958}', text: 'Practiced guly\u00E1s recipe words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Hungarian wedding vow phrases', detail: 'Pronunciation score: 87%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Hungarian proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: \u00F6/\u00FC vowel sounds', detail: '\u00F6, \u00FC, \u0151, \u0171 sounds \u00B7 15 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 11% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// German (de) — Culturally authentic German content
// ============================================================

const de: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Schatz',
    familyElder: 'Oma',
    familyParent: 'Papa',
    languageAdj: 'German',
    flag: '🇩🇪',
  },

  smartGames: {
    card1: { word: 'Hochzeit', translation: 'Wedding', emoji: '💒', pronunciation: '[HOKH-tsayt]' },
    card2: { word: 'Für immer', translation: 'Forever', emoji: '💍', pronunciation: '[fyːɐ IM-ɐ]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Für immer', correct: true },
      { label: 'Hochzeit', correct: false },
      { label: 'Bestimmt', correct: false },
    ],
    wrongPickLabel: 'Hochzeit',
  },

  conversation: {
    scenario: { emoji: '☕', label: 'Sunday Kaffee und Kuchen · Family visit' },
    aiMessage: {
      prefix: 'Papa asks:',
      targetPhrase: 'Möchtest du noch ein Stück Kuchen?',
      pronunciation: '[MŒKH-test doo nokh ayn shtyk KOO-khen]',
    },
    userResponse: 'Ja bitte, der Kuchen ist wunderbar',
    feedback: {
      praiseWord: 'Wunderbar!',
      pronunciation: '[VOON-dɐ-baːɐ]',
      comment: 'Great use of complimenting the cake 😄',
    },
  },

  weakestWords: {
    header: 'Words from baking with family',
    subtext: 'You keep mixing these up when baking together',
    words: [
      { word: 'Apfelstrudel', translation: 'Apple strudel', accuracy: 58 },
      { word: 'Schwarzwälder Kirschtorte', translation: 'Black Forest cake', accuracy: 37 },
      { word: 'Streuselkuchen', translation: 'Crumble cake', accuracy: 44 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Weißt du, man muss einfach üben...', style: 'partner' },
      { label: 'Partner', text: 'Übung macht den Meister — das sagt Oma auch immer!', style: 'partner' },
      { label: 'Translation', text: 'Practice makes the master — Oma always says that too!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'Übung', meaning: 'practice' },
      { word: 'Meister', meaning: 'master' },
      { word: 'üben', meaning: 'to practice' },
      { word: 'einfach', meaning: 'simply' },
      { word: 'immer', meaning: 'always' },
    ],
    cultureNote: 'One of Germany\'s most beloved proverbs — the equivalent of "practice makes perfect" but Germans say "master" instead',
  },

  loveLog: {
    words: [
      { word: 'Lieben', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Heimat', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 5 },
      { word: 'Stollen', translation: 'Christmas bread', type: 'noun', badge: 'gift' },
      { word: 'Hochzeit', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Lieben',
      translation: 'To love',
      pronunciation: '[LEE-ben]',
      type: 'verb',
      example: { text: '"Ich liebe dich, für immer"', translation: 'I love you, forever' },
      tenses: ['Präsens', 'Präteritum', 'Futur'],
      conjugations: [
        { person: 'ich', form: 'liebe' },
        { person: 'du', form: 'liebst' },
        { person: 'er/sie', form: 'liebt' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Ich liebe dich, Schatz', // 22 chars
    feedback: {
      praiseWord: 'Wunderbar!',
      comment: "Your 'ch' is spot-on now. Pronunciation score: 91%",
    },
    followUpPills: [
      { label: 'Try "für immer"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Kaffee und Kuchen' vocabulary",
    context: 'Family visit this Sunday — baking conversation likely',
    tip: "Start with 'Kuchen' (cake) — came up three times last visit",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Baking for Weihnachten!',
      subtitle: 'Send holiday baking words to Jamie',
      badgeText: 'For learning family recipes',
    },
    words: [
      { word: 'Stollen', translation: 'Christmas bread' },
      { word: 'Lebkuchen', translation: 'Gingerbread' },
      { word: 'Glühwein', translation: 'Mulled wine' },
    ],
    receiverMessage: { title: 'Schatz sent you 3 recipes!', subtitle: 'Weihnachten baking prep 🎄' },
    flipCard: { word: 'Stollen', translation: 'Christmas bread', pronunciation: '[SHTOL-en]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '680 / 1000 XP',
    xpPercent: 68,
    wordBreakdown: [
      { count: 21, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 10, dayStreak: 4 },
    aiSummary: 'Practiced baking vocabulary at Sunday Kaffee und Kuchen',
    motivation: 'Writing your vows in two languages',
  },

  partnerChallenges: {
    quizWord: 'Heimat',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Freedom', correct: false },
      { label: 'History', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "der Tisch" but "die Lampe" and "das Buch"?',
    thinkingContext: 'Learning household vocabulary, needs article rules...',
    explanation: 'German nouns have grammatical gender — der (masc.), die (fem.), das (neut.):',
    conjugations: [
      { person: 'masculine', form: 'der Tisch (the table)', highlight: true },
      { person: 'feminine', form: 'die Lampe (the lamp)', highlight: true },
      { person: 'neuter', form: 'das Buch (the book)', highlight: true },
      { person: 'plural (all)', form: 'die Bücher (the books)', highlight: false },
    ],
    cultureNote: 'German articles must be memorized with each noun — there are patterns (e.g. -ung is always die) but many exceptions',
    pills: [
      { label: 'Article quiz', primary: true },
      { label: 'Gender patterns', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '☕', text: 'Completed Kaffee und Kuchen vocabulary', detail: '9/10 correct · 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🍰', text: 'Practiced German baking words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed German wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied German proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: ü and ö sounds', detail: 'ü, ö, äu sounds · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 9% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Ukrainian (uk) — Culturally authentic Ukrainian content
// ============================================================

const uk: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Коханий/а',
    familyElder: 'Бабуся',
    familyParent: 'Тато',
    languageAdj: 'Ukrainian',
    flag: '🇺🇦',
  },

  smartGames: {
    card1: { word: 'Весілля', translation: 'Wedding', emoji: '💒', pronunciation: '[veh-SEEL-lya]' },
    card2: { word: 'Назавжди', translation: 'Forever', emoji: '💍', pronunciation: '[nah-ZAVZH-dy]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Назавжди', correct: true },
      { label: 'Весілля', correct: false },
      { label: 'Навпаки', correct: false },
    ],
    wrongPickLabel: 'Весілля',
  },

  conversation: {
    scenario: { emoji: '🍲', label: 'Sunday dinner · Borshch time' },
    aiMessage: {
      prefix: 'Тато asks:',
      targetPhrase: 'Хочеш ще борщу?',
      pronunciation: '[HO-chesh shche BOR-shchu]',
    },
    userResponse: 'Так, дуже смачно, дякую!',
    feedback: {
      praiseWord: 'Чудово!',
      pronunciation: '[chu-DO-vo]',
      comment: 'Great job asking for seconds at the table 😄',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'You keep mixing these up when cooking together',
    words: [
      { word: 'Борщ', translation: 'Beetroot soup', accuracy: 58 },
      { word: 'Вареники', translation: 'Dumplings', accuracy: 44 },
      { word: 'Сало', translation: 'Cured pork fat', accuracy: 32 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Знаєш що, нехай сперечаються про політику...', style: 'partner' },
      { label: 'Partner', text: 'Де любов, там і рай — а я краще буду їсти!', style: 'partner' },
      { label: 'Translation', text: "Where there is love, there is paradise — and I'd rather eat!", style: 'translation' },
    ],
    extractedWords: [
      { word: 'любов', meaning: 'love' },
      { word: 'рай', meaning: 'paradise' },
      { word: 'сперечатися', meaning: 'to argue' },
      { word: 'політика', meaning: 'politics' },
      { word: 'їсти', meaning: 'to eat' },
    ],
    cultureNote: '"Де любов, там і рай" — a beloved Ukrainian proverb meaning where there is love, there is paradise',
  },

  loveLog: {
    words: [
      { word: 'Кохаю', translation: 'I love', type: 'verb', badge: 'mastery' },
      { word: 'Батьківщина', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 4 },
      { word: 'Вареники', translation: 'Dumplings', type: 'noun', badge: 'gift' },
      { word: 'Весілля', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Кохати',
      translation: 'To love',
      pronunciation: '[ko-HA-ty]',
      type: 'verb',
      example: { text: '"Я кохаю тебе назавжди"', translation: 'I love you forever' },
      tenses: ['Present', 'Past', 'Future'],
      conjugations: [
        { person: 'я', form: 'кохаю' },
        { person: 'ти', form: 'кохаєш' },
        { person: 'він/вона', form: 'кохає' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Я тебе кохаю', // 14 chars
    feedback: {
      praiseWord: 'Чудово!',
      comment: "Your 'х' sounds natural now. Pronunciation score: 91%",
    },
    followUpPills: [
      { label: 'Try "назавжди"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'Sunday borshch' vocabulary",
    context: "Dinner at Бабуся's this weekend — borshch is on the menu",
    tip: "Start with 'смачно' (delicious) — Бабуся loves hearing it",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Cooking Свята Вечеря together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Christmas Eve recipes',
    },
    words: [
      { word: 'Кутя', translation: 'Wheat berry pudding' },
      { word: 'Борщ', translation: 'Beetroot soup' },
      { word: 'Узвар', translation: 'Dried fruit compote' },
    ],
    receiverMessage: { title: 'Коханий/а sent you 3 recipes!', subtitle: 'Свята Вечеря dinner prep 🎄' },
    flipCard: { word: 'Кутя', translation: 'Wheat berry pudding', pronunciation: '[KU-tya]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '710 / 1000 XP',
    xpPercent: 71,
    wordBreakdown: [
      { count: 22, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 7, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 11, dayStreak: 3 },
    aiSummary: 'Practiced borshch vocabulary and family dinner phrases',
    motivation: 'Ready to help Бабуся in the kitchen — in Ukrainian',
  },

  partnerChallenges: {
    quizWord: 'Батьківщина',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Freedom', correct: false },
      { label: 'History', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "я буду кохати" not "я буду кохаю"?',
    thinkingContext: 'Preparing vow phrases, needs this...',
    explanation: 'Imperfective future uses буду + infinitive:',
    conjugations: [
      { person: 'я', form: 'буду кохати', highlight: true },
      { person: 'ти', form: 'будеш кохати', highlight: false },
      { person: 'він/вона', form: 'буде кохати', highlight: false },
      { person: 'ми', form: 'будемо кохати', highlight: false },
    ],
    cultureNote: 'Ukrainian imperfective future uses буду + infinitive — perfect for promises that last forever',
    pills: [
      { label: 'Use in vows', primary: true },
      { label: 'More tenses', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🍲', text: 'Completed borshch vocabulary quiz', detail: '8/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🥟', text: 'Practiced Ukrainian dumpling words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Ukrainian wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Ukrainian proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: х and г sounds', detail: 'х, г, ґ sounds · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 10% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Russian (ru) — Culturally authentic Russian content
// ============================================================

const ru: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Милый/ая',
    familyElder: 'Бабушка',
    familyParent: 'Папа',
    languageAdj: 'Russian',
    flag: '🇷🇺',
  },

  smartGames: {
    card1: { word: 'Свадьба', translation: 'Wedding', emoji: '💒', pronunciation: '[SVAD-ba]' },
    card2: { word: 'Навсегда', translation: 'Forever', emoji: '💍', pronunciation: '[na-vseh-GDA]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Навсегда', correct: true },
      { label: 'Всегда', correct: false },
      { label: 'Никогда', correct: false },
    ],
    wrongPickLabel: 'Свадьба',
  },

  conversation: {
    scenario: { emoji: '🍲', label: 'Sunday dinner · Family cooking' },
    aiMessage: {
      prefix: 'Папа asks:',
      targetPhrase: 'Борщ или пельмени?',
      pronunciation: '[borshch EE-lee pel-MYE-nee]',
    },
    userResponse: 'Давай и то и другое!',
    feedback: {
      praiseWord: 'Молодец!',
      pronunciation: '[ma-la-DYETS]',
      comment: 'Perfect casual response — Папа will be impressed 😄',
    },
  },

  weakestWords: {
    header: 'Words from cooking with family',
    subtext: 'You keep mixing these up when cooking together',
    words: [
      { word: 'Борщ', translation: 'Beetroot soup', accuracy: 58 },
      { word: 'Пельмени', translation: 'Dumplings', accuracy: 43 },
      { word: 'Блины', translation: 'Pancakes/crepes', accuracy: 37 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Знаешь, как говорят...', style: 'partner' as const },
      { label: 'Partner', text: 'Повторение — мать учения!', style: 'partner' as const },
      { label: 'Translation', text: 'Repetition is the mother of learning!', style: 'translation' as const },
    ],
    extractedWords: [
      { word: 'повторение', meaning: 'repetition' },
      { word: 'мать', meaning: 'mother' },
      { word: 'учение', meaning: 'learning' },
      { word: 'знаешь', meaning: 'you know' },
      { word: 'говорят', meaning: 'they say' },
    ],
    cultureNote: 'One of Russia\u2019s most beloved proverbs — every student hears it from teachers and parents alike',
  },

  loveLog: {
    words: [
      { word: 'Любить', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Родина', translation: 'Homeland', type: 'noun', badge: 'streak', streak: 3 },
      { word: 'Пельмени', translation: 'Dumplings', type: 'noun', badge: 'gift' },
      { word: 'Свадьба', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Любить',
      translation: 'To love',
      pronunciation: '[lyu-BIT\u2019]',
      type: 'verb',
      example: { text: '\u00ABЯ люблю тебя навсегда\u00BB', translation: 'I love you forever' },
      tenses: ['Настоящее', 'Прошедшее', 'Будущее'],
      conjugations: [
        { person: 'я', form: 'люблю' },
        { person: 'ты', form: 'любишь' },
        { person: 'он/она', form: 'любит' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Я тебя люблю навсегда', // 22 chars
    feedback: {
      praiseWord: 'Прекрасно!',
      comment: "Your soft 'л' is natural now. Pronunciation score: 91%",
    },
    followUpPills: [
      { label: 'Try "навсегда"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'family dinner' vocabulary",
    context: 'Sunday dinner with Папа this weekend — cooking talk likely',
    tip: "Start with 'готовить' (to cook) — came up three times last visit",
  },

  wordGifts: {
    event: {
      emoji: '🎄',
      title: 'Celebrating Новый год together!',
      subtitle: 'Send holiday recipe words to Jamie',
      badgeText: 'For learning New Year recipes',
    },
    words: [
      { word: 'Оливье', translation: 'Russian salad' },
      { word: 'Селёдка под шубой', translation: 'Herring under fur coat' },
      { word: 'Холодец', translation: 'Meat jelly' },
    ],
    receiverMessage: { title: 'Милый/ая sent you 3 recipes!', subtitle: 'Новый год dinner prep 🎄' },
    flipCard: { word: 'Оливье', translation: 'Russian salad', pronunciation: '[a-lee-VYE]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '680 / 1000 XP',
    xpPercent: 68,
    wordBreakdown: [
      { count: 21, label: 'nouns', color: '#3b82f6' },
      { count: 14, label: 'verbs', color: '#8b5cf6' },
      { count: 7, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 11, dayStreak: 3 },
    aiSummary: 'Practiced cooking vocabulary and family dinner phrases',
    motivation: 'Writing your vows in two languages',
  },

  partnerChallenges: {
    quizWord: 'Родина',
    quizOptions: [
      { label: 'Homeland', correct: true },
      { label: 'Family', correct: false },
      { label: 'Village', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "я буду любить" not "я полюблю"?',
    thinkingContext: 'Preparing vow phrases, needs this...',
    explanation: 'Russian verbs have aspect — imperfective for ongoing, perfective for completed:',
    conjugations: [
      { person: 'impf. future', form: 'я буду любить (I will love / keep loving)', highlight: true },
      { person: 'perf. future', form: 'я полюблю (I will fall in love)', highlight: true },
      { person: 'impf. present', form: 'я люблю (I love)', highlight: false },
      { person: 'perf. past', form: 'я полюбил(а) (I fell in love)', highlight: false },
    ],
    cultureNote: 'In vows use imperfective "буду любить" — it promises continuous, unending love rather than a one-time event',
    pills: [
      { label: 'Use in vows', primary: true },
      { label: 'More aspects', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '🍲', text: 'Completed family dinner vocabulary', detail: '8/10 correct · 11 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '🥟', text: 'Practiced Russian recipe words', detail: '5 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '💒', text: 'Rehearsed Russian wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '📖', text: 'Studied Russian proverbs', detail: '3 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '🔊', text: 'Voice drill: ы and soft/hard consonants', detail: 'ы, ш/щ, л/ль sounds · 14 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '🎯', text: 'Weakest words review', detail: 'Accuracy up 10% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Dutch (nl) — Culturally authentic Dutch content
// ============================================================

const nl: LanguageDemoContent = {
  meta: {
    partnerName: 'Jamie',
    petName: 'Lieverd',
    familyElder: 'Oma',
    familyParent: 'Papa',
    languageAdj: 'Dutch',
    flag: '\u{1F1F3}\u{1F1F1}',
  },

  smartGames: {
    card1: { word: 'Bruiloft', translation: 'Wedding', emoji: '\u{1F492}', pronunciation: '[BROW-loft]' },
    card2: { word: 'Voor altijd', translation: 'Forever', emoji: '\u{1F48D}', pronunciation: '[vohr AL-tide]' },
    quizPrompt: "In your vows, 'forever' is...",
    quizOptions: [
      { label: 'Voor altijd', correct: true },
      { label: 'Bruiloft', correct: false },
      { label: 'Altijd maar', correct: false },
    ],
    wrongPickLabel: 'Bruiloft',
  },

  conversation: {
    scenario: { emoji: '\u{1F372}', label: 'Gezellig family gathering \u00B7 Oma\u2019s kitchen' },
    aiMessage: {
      prefix: 'Papa asks:',
      targetPhrase: 'Wil je nog stamppot?',
      pronunciation: '[vil yuh nogh STAM-pot]',
    },
    userResponse: 'Ja graag \u2014 het is heerlijk!',
    feedback: {
      praiseWord: 'Prima!',
      pronunciation: '[PREE-mah]',
      comment: 'Very natural Dutch phrasing \u2014 Oma would be proud \u{1F604}',
    },
  },

  weakestWords: {
    header: 'Words from cooking with Oma',
    subtext: 'These keep tripping you up in the kitchen',
    words: [
      { word: 'Stamppot', translation: 'Mashed pot dish', accuracy: 58 },
      { word: 'Kroket', translation: 'Croquette', accuracy: 42 },
      { word: 'Poffertjes', translation: 'Mini pancakes', accuracy: 34 },
    ],
  },

  listenMode: {
    lines: [
      { label: 'Partner', text: 'Maak je niet druk over het weer...', style: 'partner' },
      { label: 'Partner', text: 'Oefening baart kunst \u2014 net als jouw Nederlands!', style: 'partner' },
      { label: 'Translation', text: 'Practice creates art \u2014 just like your Dutch!', style: 'translation' },
    ],
    extractedWords: [
      { word: 'oefening', meaning: 'practice' },
      { word: 'kunst', meaning: 'art / skill' },
      { word: 'druk', meaning: 'busy / pressure' },
      { word: 'weer', meaning: 'weather' },
      { word: 'baren', meaning: 'to create / give birth' },
    ],
    cultureNote: '\u201COefening baart kunst\u201D \u2014 the Dutch equivalent of \u201Cpractice makes perfect,\u201D used daily to encourage perseverance',
  },

  loveLog: {
    words: [
      { word: 'Houden van', translation: 'To love', type: 'verb', badge: 'mastery' },
      { word: 'Hart', translation: 'Heart', type: 'noun', badge: 'streak', streak: 5 },
      { word: 'Stamppot', translation: 'Mashed pot dish', type: 'noun', badge: 'gift' },
      { word: 'Bruiloft', translation: 'Wedding', type: 'noun', badge: null },
    ],
    detail: {
      word: 'Houden van',
      translation: 'To love',
      pronunciation: '[HOW-dun van]',
      type: 'verb',
      example: { text: '\u201CIk hou van jou, voor altijd\u201D', translation: 'I love you, forever' },
      tenses: ['Tegenwoordige tijd', 'Verleden tijd', 'Toekomende tijd'],
      conjugations: [
        { person: 'ik', form: 'hou van' },
        { person: 'jij', form: 'houdt van' },
        { person: 'hij/zij', form: 'houdt van' },
      ],
    },
  },

  voiceChat: {
    spokenPhrase: 'Ik hou van jou, Lieverd', // 23 chars
    feedback: {
      praiseWord: 'Prachtig!',
      comment: "Your Dutch 'g' sound is really improving. Score: 91%",
    },
    followUpPills: [
      { label: 'Try "voor altijd"', primary: true },
      { label: 'Full vow practice', primary: false },
    ],
  },

  agenticCoach: {
    suggestionTitle: "Build 'gezellig dinner' vocabulary",
    context: "Family dinner at Oma\u2019s this weekend \u2014 stamppot is on the menu",
    tip: "Start with 'lekker' (tasty) \u2014 it\u2019s the most-used Dutch compliment at the table",
  },

  wordGifts: {
    event: {
      emoji: '\u{1F384}',
      title: 'Cooking Kerst together!',
      subtitle: 'Send recipe words to Jamie',
      badgeText: 'For learning Dutch Christmas recipes',
    },
    words: [
      { word: 'Oliebollen', translation: 'Dutch doughnuts' },
      { word: 'Gevulde speculaas', translation: 'Filled spice cookie' },
      { word: 'Appelbeignets', translation: 'Apple fritters' },
    ],
    receiverMessage: { title: 'Lieverd sent you 3 recipes!', subtitle: 'Kerst dinner prep \u{1F384}' },
    flipCard: { word: 'Oliebollen', translation: 'Dutch doughnuts', pronunciation: '[OH-lee-bol-un]' },
  },

  progressTracking: {
    level: 'Elementary 2',
    xpDisplay: '680 / 1000 XP',
    xpPercent: 68,
    wordBreakdown: [
      { count: 22, label: 'nouns', color: '#3b82f6' },
      { count: 13, label: 'verbs', color: '#8b5cf6' },
      { count: 9, label: 'adj', color: '#f59e0b' },
      { count: 11, label: 'phrases', color: '#10b981' },
    ],
    stats: { wordsThisWeek: 11, dayStreak: 4 },
    aiSummary: 'Practiced kitchen vocabulary and family gathering phrases',
    motivation: 'Ready to impress Oma at the dinner table \u2014 in Dutch',
  },

  partnerChallenges: {
    quizWord: 'Gezellig',
    quizOptions: [
      { label: 'Cozy / convivial', correct: true },
      { label: 'Generous', correct: false },
      { label: 'Cheerful', correct: false },
    ],
  },

  aiTeaching: {
    question: 'Why "de stoel" but "het huis"?',
    thinkingContext: 'Describing things at Oma\u2019s house, needs this...',
    explanation: 'Dutch has two articles \u2014 de (common) and het (neuter):',
    conjugations: [
      { person: 'de (common)', form: 'de stoel (the chair)', highlight: true },
      { person: 'het (neuter)', form: 'het huis (the house)', highlight: true },
      { person: 'de (common)', form: 'de tafel (the table)', highlight: false },
      { person: 'het (neuter)', form: 'het kind (the child)', highlight: false },
    ],
    cultureNote: 'About 2/3 of Dutch nouns use \u201Cde\u201D and 1/3 use \u201Chet\u201D \u2014 even native speakers sometimes disagree on tricky ones',
    pills: [
      { label: 'De/het quiz', primary: true },
      { label: 'More articles', primary: false },
    ],
  },

  activityFeed: {
    filterTabs: ['Together', 'Mine', 'Jamie'],
    activities: [
      { icon: '\u{1F372}', text: 'Completed family dinner vocabulary', detail: '9/10 correct \u00B7 10 min', bgColor: '#dcfce7', borderColor: '#10b981' },
      { icon: '\u{1F958}', text: 'Practiced stamppot recipe words', detail: '6 new words learned', bgColor: '#fef3c7', borderColor: '#f59e0b' },
      { icon: '\u{1F492}', text: 'Rehearsed Dutch wedding vow phrases', detail: 'Pronunciation score: 89%', bgColor: '#ffedd5', borderColor: '#f97316' },
      { icon: '\u{1F4D6}', text: 'Studied Dutch proverbs', detail: '4 bookmarked for review', bgColor: '#fce7f3', borderColor: '#ec4899' },
      { icon: '\u{1F50A}', text: 'Voice drill: g/ch guttural sounds', detail: 'g and ch sounds \u00B7 13 min', bgColor: '#dbeafe', borderColor: '#3b82f6' },
      { icon: '\u{1F3AF}', text: 'Weakest words review', detail: 'Accuracy up 14% this week', bgColor: '#f3e8ff', borderColor: '#8b5cf6' },
    ],
  },
};

// ============================================================
// Content registry — languages added in batches (Phase 3+4)
// ============================================================

export const DEMO_CONTENT: Partial<Record<LanguageCode, LanguageDemoContent>> = {
  pl,
  en,
  fr,
  pt,
  it,
  es,
  tr,
  ro,
  cs,
  sv,
  no: no_,
  da,
  el,
  hu,
  de,
  uk,
  ru,
  nl,
};

// Helper: get content for a language, falling back to Polish
export function getDemoContent(lang: LanguageCode): LanguageDemoContent {
  return DEMO_CONTENT[lang] ?? pl;
}
