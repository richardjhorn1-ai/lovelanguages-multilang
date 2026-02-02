// Level System Constants
// Defines tiers, thresholds, and themed content for level-up tests

import { AchievementDefinition, TutorTier } from '../types';

export interface LevelTier {
  tier: string;
  xpRange: [number, number]; // [min, max)
  subLevelThresholds: [number, number, number]; // XP for sub-levels 1, 2, 3
}

export interface LevelTheme {
  name: string;
  description: string;
  concepts: string[];
  examples?: string[];  // Optional: Reference examples (Polish legacy, not used by API)
}

// ===========================================
// Tutor Tier System
// ===========================================

export const TUTOR_TIERS: TutorTier[] = [
  { tier: 1, name: 'Language Whisperer', xpRange: [0, 100] },
  { tier: 2, name: 'Phrase Poet', xpRange: [100, 300] },
  { tier: 3, name: 'Vocabulary Virtuoso', xpRange: [300, 600] },
  { tier: 4, name: 'Grammar Guardian', xpRange: [600, 1000] },
  { tier: 5, name: 'Fluency Fairy', xpRange: [1000, 1500] },
  { tier: 6, name: 'Love Linguist', xpRange: [1500, Infinity] }
];

// Get tutor tier from XP
export function getTutorTierFromXP(xp: number): TutorTier {
  for (let i = TUTOR_TIERS.length - 1; i >= 0; i--) {
    if (xp >= TUTOR_TIERS[i].xpRange[0]) {
      return TUTOR_TIERS[i];
    }
  }
  return TUTOR_TIERS[0];
}

// Get progress to next tutor tier (percentage)
export function getTutorTierProgress(xp: number): number {
  const currentTier = getTutorTierFromXP(xp);
  const tierIndex = TUTOR_TIERS.findIndex(t => t.tier === currentTier.tier);

  if (tierIndex === TUTOR_TIERS.length - 1) {
    // Max tier
    return 100;
  }

  const nextTier = TUTOR_TIERS[tierIndex + 1];
  const xpInTier = xp - currentTier.xpRange[0];
  const xpForTier = nextTier.xpRange[0] - currentTier.xpRange[0];

  return Math.min(100, Math.round((xpInTier / xpForTier) * 100));
}

// Get XP needed for next tutor tier
export function getXPToNextTutorTier(xp: number): number | null {
  const currentTier = getTutorTierFromXP(xp);
  const tierIndex = TUTOR_TIERS.findIndex(t => t.tier === currentTier.tier);

  if (tierIndex === TUTOR_TIERS.length - 1) {
    return null; // Max tier
  }

  return TUTOR_TIERS[tierIndex + 1].xpRange[0] - xp;
}

// ===========================================
// Tutor XP Awards
// ===========================================

export const TUTOR_XP_AWARDS = {
  CREATE_CHALLENGE: 2,
  SEND_WORD_GIFT: 2,
  PARTNER_COMPLETES_CHALLENGE: 3,
  PARTNER_SCORES_80_PLUS: 1,
  PARTNER_SCORES_100: 2,
  PARTNER_MASTERS_GIFTED_WORD: 1,
  STREAK_7_DAYS: 5,
  STREAK_30_DAYS: 15
} as const;

// ===========================================
// Achievement Definitions
// ===========================================

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Tutor Achievements (8)
  {
    code: 'first_challenge',
    name: 'First Challenge',
    description: 'Create your first challenge for your partner',
    icon: '🎯',
    category: 'tutor',
    xp_reward: 5
  },
  {
    code: 'first_gift',
    name: 'First Gift',
    description: 'Send your first word gift',
    icon: '🎁',
    category: 'tutor',
    xp_reward: 5
  },
  {
    code: 'challenge_champion',
    name: 'Challenge Champion',
    description: 'Create 10 challenges',
    icon: '🏆',
    category: 'tutor',
    xp_reward: 15
  },
  {
    code: 'gift_giver',
    name: 'Gift Giver',
    description: 'Send 10 word gifts',
    icon: '💝',
    category: 'tutor',
    xp_reward: 15
  },
  {
    code: 'perfect_score',
    name: 'Perfect Score',
    description: 'Your partner gets 100% on a challenge',
    icon: '💯',
    category: 'tutor',
    xp_reward: 10
  },
  {
    code: 'teaching_pro',
    name: 'Teaching Pro',
    description: 'Your partner gets 5 perfect scores',
    icon: '⭐',
    category: 'tutor',
    xp_reward: 25
  },
  {
    code: 'week_warrior_tutor',
    name: 'Week Warrior',
    description: '7-day teaching streak',
    icon: '🔥',
    category: 'tutor',
    xp_reward: 20
  },
  {
    code: 'month_of_love',
    name: 'Month of Love',
    description: '30-day teaching streak',
    icon: '💕',
    category: 'tutor',
    xp_reward: 50
  },

  // Student Achievements (8)
  {
    code: 'first_word',
    name: 'First Word',
    description: 'Add your first word to the Love Log',
    icon: '📝',
    category: 'student',
    xp_reward: 5
  },
  {
    code: 'word_collector',
    name: 'Word Collector',
    description: 'Learn 50 words',
    icon: '📚',
    category: 'student',
    xp_reward: 20
  },
  {
    code: 'first_mastery',
    name: 'First Mastery',
    description: 'Master your first word (5-streak)',
    icon: '✨',
    category: 'student',
    xp_reward: 10
  },
  {
    code: 'memory_master',
    name: 'Memory Master',
    description: 'Master 10 words',
    icon: '🧠',
    category: 'student',
    xp_reward: 25
  },
  {
    code: 'challenge_accepted',
    name: 'Challenge Accepted',
    description: 'Complete your first partner challenge',
    icon: '💪',
    category: 'student',
    xp_reward: 10
  },
  {
    code: 'challenge_crusher',
    name: 'Challenge Crusher',
    description: 'Complete 10 partner challenges',
    icon: '🎖️',
    category: 'student',
    xp_reward: 30
  },
  {
    code: 'week_of_practice',
    name: 'Week of Practice',
    description: '7-day practice streak',
    icon: '🔥',
    category: 'student',
    xp_reward: 20
  },
  {
    code: 'conversation_ready',
    name: 'Conversation Ready',
    description: 'Reach the Conversational tier',
    icon: '💬',
    category: 'student',
    xp_reward: 50
  },

  // Couple Achievements (4)
  {
    code: 'first_dance',
    name: 'First Dance',
    description: 'Complete your first challenge together',
    icon: '💃',
    category: 'couple',
    xp_reward: 15
  },
  {
    code: 'perfect_pair',
    name: 'Perfect Pair',
    description: 'Exchange 10 challenges',
    icon: '👫',
    category: 'couple',
    xp_reward: 30
  },
  {
    code: 'gift_exchange',
    name: 'Gift Exchange',
    description: 'Both send and receive word gifts',
    icon: '🎀',
    category: 'couple',
    xp_reward: 15
  },
  {
    code: 'one_month_strong',
    name: 'One Month Strong',
    description: '1 month active together',
    icon: '🌙',
    category: 'couple',
    xp_reward: 40
  }
];

// Get achievement by code
export function getAchievementByCode(code: string): AchievementDefinition | undefined {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.code === code);
}

// Get achievements by category
export function getAchievementsByCategory(category: 'tutor' | 'student' | 'couple'): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category);
}

// ===========================================
// Love Note Templates
// ===========================================

export const LOVE_NOTE_TEMPLATES = {
  encouragement: [
    "You're doing amazing! 💪",
    "So proud of you! 🌟",
    "Keep it up, you've got this! 🎉",
    "Your progress is incredible! ✨"
  ],
  check_in: [
    "Miss practicing with you 💕",
    "Ready for a challenge? 🎯",
    "Haven't seen you in a while! 👋",
    "Thinking of you 💭"
  ],
  celebration: [
    "Congrats on leveling up! 🎊",
    "You mastered it! 🏆",
    "Perfect score! Amazing! 💯",
    "What a streak! 🔥"
  ]
} as const;

// Tier definitions with XP ranges
export const LEVEL_TIERS: LevelTier[] = [
  {
    tier: 'Beginner',
    xpRange: [0, 100],
    subLevelThresholds: [0, 30, 60]
  },
  {
    tier: 'Elementary',
    xpRange: [100, 500],
    subLevelThresholds: [100, 230, 360]
  },
  {
    tier: 'Conversational',
    xpRange: [500, 1500],
    subLevelThresholds: [500, 830, 1160]
  },
  {
    tier: 'Proficient',
    xpRange: [1500, 3000],
    subLevelThresholds: [1500, 2000, 2500]
  },
  {
    tier: 'Fluent',
    xpRange: [3000, 6000],
    subLevelThresholds: [3000, 4000, 5000]
  },
  {
    tier: 'Master',
    xpRange: [6000, Infinity],
    subLevelThresholds: [6000, 8000, 10000]
  }
];

// Question counts per tier
export const QUESTION_COUNTS: Record<string, number> = {
  Beginner: 10,
  Elementary: 15,
  Conversational: 20,
  Proficient: 30,
  Fluent: 30,
  Master: 30
};

// Pass threshold (percentage)
export const PASS_THRESHOLD = 80;

// Question type distribution
export const QUESTION_TYPE_DISTRIBUTION = {
  multipleChoice: 0.60,  // 60%
  fillBlank: 0.25,       // 25%
  translation: 0.15      // 15%
};

// Core vs personalized split
export const CORE_QUESTIONS_RATIO = 0.70; // 70% standardized, 30% from Love Log

// Level transition themes
// Each transition has themed concepts that users should master
export const LEVEL_THEMES: Record<string, LevelTheme> = {
  'Beginner 1->2': {
    name: 'First Words of Love',
    description: 'The most essential words to start connecting with your partner',
    concepts: [
      'hello/hi',
      'I love you',
      'good morning',
      'good night',
      'thank you',
      'please',
      'yes',
      'no'
    ],
    examples: [
      'cześć',
      'kocham cię',
      'dzień dobry',
      'dobranoc',
      'dziękuję',
      'proszę',
      'tak',
      'nie'
    ]
  },
  'Beginner 2->3': {
    name: 'Checking In',
    description: 'Simple questions to show you care about their day',
    concepts: [
      'how are you?',
      'are you okay?',
      "what's wrong?",
      "I'm fine",
      "I'm good",
      'and you?',
      'everything okay?',
      'how was your day?'
    ],
    examples: [
      'jak się masz?',
      'wszystko w porządku?',
      'co się stało?',
      'dobrze się mam',
      'w porządku',
      'a ty?',
      'wszystko dobrze?',
      'jak minął dzień?'
    ]
  },
  'Beginner 3->Elementary 1': {
    name: 'Feelings',
    description: 'Express your emotions and understand theirs',
    concepts: [
      "I'm happy",
      "I'm tired",
      "I'm hungry",
      'I miss you',
      "I'm sorry",
      "I'm excited",
      "I'm sad",
      'I feel good'
    ],
    examples: [
      'jestem szczęśliwy/szczęśliwa',
      'jestem zmęczony/zmęczona',
      'jestem głodny/głodna',
      'tęsknię za tobą',
      'przepraszam',
      'jestem podekscytowany/podekscytowana',
      'jestem smutny/smutna',
      'czuję się dobrze'
    ]
  },
  'Elementary 1->2': {
    name: 'Daily Life',
    description: 'Talk about everyday activities together',
    concepts: [
      "let's eat",
      "I'm going to work",
      "I'm home",
      'breakfast/lunch/dinner',
      "let's go",
      'come here',
      "I'm leaving",
      "I'll be back"
    ],
    examples: [
      'jedzmy',
      'idę do pracy',
      'jestem w domu',
      'śniadanie/obiad/kolacja',
      'chodźmy',
      'chodź tutaj',
      'wychodzę',
      'wrócę'
    ]
  },
  'Elementary 2->3': {
    name: 'Preferences',
    description: 'Express what you like, want, and prefer',
    concepts: [
      'I like...',
      'I want...',
      'do you want...?',
      "let's...",
      'I prefer...',
      'I need...',
      'I would like...',
      'what do you want?'
    ],
    examples: [
      'lubię...',
      'chcę...',
      'czy chcesz...?',
      'chodźmy...',
      'wolę...',
      'potrzebuję...',
      'chciałbym/chciałabym...',
      'czego chcesz?'
    ]
  },
  'Elementary 3->Conversational 1': {
    name: 'Making Plans',
    description: 'Plan activities and time together',
    concepts: [
      'when?',
      'where?',
      'tomorrow',
      'today',
      'together',
      'later',
      'this weekend',
      "what time?"
    ],
    examples: [
      'kiedy?',
      'gdzie?',
      'jutro',
      'dzisiaj',
      'razem',
      'później',
      'w ten weekend',
      'o której?'
    ]
  },
  'Conversational 1->2': {
    name: 'Telling Stories',
    description: 'Share what happened in your day',
    concepts: [
      'yesterday',
      'what happened?',
      'I went to...',
      'I saw...',
      'I met...',
      'it was...',
      'then...',
      'after that...'
    ],
    examples: [
      'wczoraj',
      'co się stało?',
      'poszedłem/poszłam do...',
      'widziałem/widziałam...',
      'spotkałem/spotkałam...',
      'to było...',
      'potem...',
      'po tym...'
    ]
  },
  'Conversational 2->3': {
    name: 'Deeper Feelings',
    description: 'Express the depth of your love and connection',
    concepts: [
      'you mean everything to me',
      'I love you so much',
      "I can't imagine life without you",
      'you make me happy',
      'always',
      'forever',
      'my heart',
      'my love'
    ],
    examples: [
      'jesteś dla mnie wszystkim',
      'bardzo cię kocham',
      'nie wyobrażam sobie życia bez ciebie',
      'sprawiasz, że jestem szczęśliwy/szczęśliwa',
      'zawsze',
      'na zawsze',
      'moje serce',
      'moja miłość'
    ]
  },
  'Conversational 3->Proficient 1': {
    name: 'Complex Conversations',
    description: 'Discuss plans, opinions, and deeper topics',
    concepts: [
      'I think that...',
      'in my opinion...',
      'I agree',
      'I disagree',
      'maybe we could...',
      'what if...',
      'I believe...',
      'it depends on...'
    ],
    examples: [
      'myślę, że...',
      'moim zdaniem...',
      'zgadzam się',
      'nie zgadzam się',
      'może moglibyśmy...',
      'a gdyby...',
      'wierzę, że...',
      'to zależy od...'
    ]
  },
  'Proficient 1->2': {
    name: 'Future Dreams',
    description: 'Talk about your future together',
    concepts: [
      'one day we will...',
      'I dream of...',
      'our future',
      'I hope that...',
      'we could live...',
      'I want us to...',
      'someday',
      'when we...'
    ],
    examples: [
      'pewnego dnia będziemy...',
      'marzę o...',
      'nasza przyszłość',
      'mam nadzieję, że...',
      'moglibyśmy mieszkać...',
      'chcę, żebyśmy...',
      'kiedyś',
      'kiedy my...'
    ]
  },
  'Proficient 2->3': {
    name: 'Problem Solving',
    description: 'Work through challenges together',
    concepts: [
      "let's talk about...",
      'I understand',
      'I hear you',
      "it's okay",
      'we can fix this',
      "I'm here for you",
      "let's figure it out",
      'together we can...'
    ],
    examples: [
      'porozmawiajmy o...',
      'rozumiem',
      'słyszę cię',
      'w porządku',
      'możemy to naprawić',
      'jestem tu dla ciebie',
      'rozwiążmy to',
      'razem możemy...'
    ]
  },
  'Proficient 3->Fluent 1': {
    name: 'Cultural Nuance',
    description: 'Understand native expressions and culture',
    concepts: [
      'idioms',
      'cultural expressions',
      'formal vs informal',
      'family terms',
      'holiday greetings',
      'traditional phrases',
      'regional expressions',
      'slang (careful!)'
    ],
    examples: [
      'nie ma sprawy',
      'trzymaj się',
      'Pan/Pani vs ty',
      'teściowie, szwagier',
      'Wesołych Świąt',
      'Sto lat!',
      'spoko',
      'super'
    ]
  },
  'Fluent 1->2': {
    name: 'Advanced Expression',
    description: 'Express complex thoughts with nuance',
    concepts: [
      'subjunctive mood',
      'conditional statements',
      'hypotheticals',
      'reported speech',
      'emphasis and contrast',
      'literary expressions',
      'formal writing',
      'professional communication'
    ],
    examples: [
      'gdybym mógł/mogła...',
      'jeśli by to było możliwe...',
      'załóżmy, że...',
      'powiedział, że...',
      'co prawda... ale...',
      'z głębi serca',
      'szanowny Panie/Pani',
      'z poważaniem'
    ]
  },
  'Fluent 2->3': {
    name: 'Native-Like Fluency',
    description: 'Communicate with near-native proficiency',
    concepts: [
      'subtle humor',
      'wordplay',
      'poetry and literature',
      'news and current events',
      'technical discussions',
      'debate and persuasion',
      'storytelling mastery',
      'emotional depth'
    ],
    examples: [
      'dowcipy i żarty',
      'gra słów',
      'wiersze',
      'wydarzenia bieżące',
      'dyskusje techniczne',
      'argumentacja',
      'opowiadanie historii',
      'głębokie emocje'
    ]
  },
  'Fluent 3->Master 1': {
    name: 'Expert Level',
    description: 'Master the intricacies of the language',
    concepts: [
      'archaic expressions',
      'regional dialects',
      'professional jargon',
      'academic language',
      'legal/medical terms',
      'historical context',
      'linguistic analysis',
      'translation expertise'
    ],
    examples: [
      'archaizmy',
      'gwary regionalne',
      'żargon zawodowy',
      'język akademicki',
      'terminologia prawnicza/medyczna',
      'kontekst historyczny',
      'analiza językowa',
      'tłumaczenia'
    ]
  },
  'Master 1->2': {
    name: 'Cultural Mastery',
    description: 'Deep understanding of the language culture and history',
    concepts: [
      'historical references',
      'literary allusions',
      'cultural symbols',
      'national identity',
      'philosophical discussions',
      'artistic expression',
      'social commentary',
      'generational perspectives'
    ],
    examples: [
      'odniesienia historyczne',
      'aluzje literackie',
      'symbole kulturowe',
      'tożsamość narodowa',
      'dyskusje filozoficzne',
      'wyrażenie artystyczne',
      'komentarz społeczny',
      'perspektywy pokoleniowe'
    ]
  },
  'Master 2->3': {
    name: 'Complete Mastery',
    description: 'You are truly bilingual - congratulations!',
    concepts: [
      'teach others',
      'create content',
      'professional translation',
      'cultural ambassador',
      'linguistic research',
      'preserve traditions',
      'bridge cultures',
      'share your journey'
    ],
    examples: [
      'nauczanie innych',
      'tworzenie treści',
      'profesjonalne tłumaczenia',
      'ambasador kulturowy',
      'badania językowe',
      'zachowanie tradycji',
      'łączenie kultur',
      'dzielenie się podróżą'
    ]
  }
};

// Get theme for a level transition
export function getThemeForTransition(fromLevel: string, toLevel: string): LevelTheme | null {
  // Try full key first (e.g., "Beginner 1->Beginner 2")
  const fullKey = `${fromLevel}->${toLevel}`;
  if (LEVEL_THEMES[fullKey]) {
    return LEVEL_THEMES[fullKey];
  }

  // Try short key format (e.g., "Beginner 1->2")
  // Extract tier and level from both
  const fromMatch = fromLevel.match(/^(\w+)\s+(\d+)$/);
  const toMatch = toLevel.match(/^(\w+)\s+(\d+)$/);

  if (fromMatch && toMatch) {
    const [, fromTier, fromNum] = fromMatch;
    const [, toTier, toNum] = toMatch;

    if (fromTier === toTier) {
      // Same tier: "Beginner 1->2"
      const shortKey = `${fromLevel}->${toNum}`;
      if (LEVEL_THEMES[shortKey]) {
        return LEVEL_THEMES[shortKey];
      }
    } else {
      // Cross tier: "Beginner 3->Elementary 1"
      const crossKey = `${fromLevel}->${toLevel}`;
      if (LEVEL_THEMES[crossKey]) {
        return LEVEL_THEMES[crossKey];
      }
    }
  }

  return null;
}

// Get all available transitions
export function getAllTransitions(): string[] {
  return Object.keys(LEVEL_THEMES);
}
