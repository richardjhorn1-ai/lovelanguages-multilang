
export type UserRole = 'student' | 'tutor';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  linked_user_id: string | null;
  full_name: string;
  avatar_url?: string;
  xp?: number;
  level?: number;
  partner_name?: string;
  role_confirmed_at?: string;       // When user confirmed role in RoleSelection
  onboarding_completed_at?: string;
  onboarding_data?: OnboardingData;
  // Theme settings
  accent_color?: 'rose' | 'blush' | 'lavender' | 'wine' | 'teal' | 'honey';
  dark_mode?: 'off' | 'midnight' | 'charcoal' | 'black';
  font_size?: 'small' | 'medium' | 'large';
  font_preset?: 'classic' | 'modern' | 'playful';
  font_weight?: 'light' | 'regular' | 'bold';
  // Answer validation mode
  smart_validation?: boolean; // true = AI-powered (accepts synonyms, typos), false = strict matching
  // Native app settings
  haptics_enabled?: boolean;  // true = haptic feedback on (default), false = off
  // Multi-language support
  active_language?: string;    // Current target language code (e.g., 'pl', 'es')
  native_language?: string;    // User's native language code (e.g., 'en', 'es')
  languages?: string[];        // All unlocked target language codes
  // Subscription
  subscription_plan?: 'none' | 'standard' | 'unlimited';
  subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled';
  subscription_period?: 'weekly' | 'monthly' | 'yearly';
  subscription_ends_at?: string;
  stripe_customer_id?: string;
  // Couple subscription - inherited access from partner
  subscription_granted_by?: string;
  subscription_granted_at?: string;
}

// Onboarding data collected during signup flow
export interface OnboardingData {
  // Student fields
  userName?: string;
  partnerName?: string;
  relationshipVibe?: string;
  couplePhotoUrl?: string;
  learningReason?: string;       // "Why do you want to learn Polish?"
  dailyTime?: string;            // "A quick kiss", "A coffee date", etc.
  preferredTime?: string;        // Morning, Evening, etc.
  biggestFear?: string;          // Pronunciation, Grammar, etc.
  priorExperience?: string;
  firstGoal?: string;

  // Tutor fields
  learnerName?: string;
  relationshipType?: string;     // Partner, Spouse, Friend, Family
  languageConnection?: string;   // Native, Heritage, Fluent, Bilingual
  languageOrigin?: string;       // Country/region of origin
  traditionsToShare?: string[];
  familyLanguageFrequency?: string;  // How often language is spoken in family
  // LEGACY: Polish-specific field names (backward compatibility)
  // TODO: Remove after ML-4 onboarding refactor
  polishConnection?: string;
  polishOrigin?: string;
  dreamPhrase?: string;          // What they want learner to say first
  dreamHear?: string;            // What they want learner to say (legacy)
  teachingPriority?: string;
  teachingStyle?: string;
  grammarComfort?: number;       // 1-5 slider

  // Shared fields
  smartValidation?: boolean;     // true = AI-powered validation, false = strict matching
  nativeLanguage?: string;       // User's native language code (e.g., 'en', 'es')
  targetLanguage?: string;       // Language user is learning (e.g., 'pl', 'fr')

  // Subscription selection (from onboarding)
  selectedPlan?: string;         // 'standard' or 'unlimited'
  selectedPriceId?: string;      // Stripe price ID for checkout
}

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
export type Gender = 'masculine' | 'feminine' | 'neuter';

// Conjugation table for present tense (no gender)
export interface PresentTenseConjugation {
  first_singular: string;   // I (ja, yo, ich, etc.)
  second_singular: string;  // you singular (ty, tú, du, etc.)
  third_singular: string;   // he/she/it (on/ona, él/ella, er/sie, etc.)
  first_plural: string;     // we (my, nosotros, wir, etc.)
  second_plural: string;    // you plural (wy, vosotros, ihr, etc.)
  third_plural: string;     // they (oni, ellos, sie, etc.)
}

// Conjugation with gender variants (for past tense)
export interface GenderedConjugation {
  masculine: string;
  feminine: string;
}

// Past tense with gender support
export interface PastTenseConjugation {
  unlockedAt: string;  // ISO timestamp when unlocked
  first_singular: GenderedConjugation;
  second_singular: GenderedConjugation;
  third_singular: { masculine: string; feminine: string; neuter: string };
  first_plural: GenderedConjugation;
  second_plural: GenderedConjugation;
  third_plural: GenderedConjugation;
}

// Future tense (can be simple or compound depending on aspect)
export interface FutureTenseConjugation {
  unlockedAt: string;  // ISO timestamp when unlocked
  first_singular: string;
  second_singular: string;
  third_singular: string;
  first_plural: string;
  second_plural: string;
  third_plural: string;
}

// Full verb conjugations with unlock tracking
export interface VerbConjugations {
  present: PresentTenseConjugation;           // Always extracted
  past?: PastTenseConjugation | null;         // null = locked, object = unlocked
  future?: FutureTenseConjugation | null;     // null = locked, object = unlocked
}

// Adjective forms by gender
export interface AdjectiveForms {
  masculine: string;
  feminine: string;
  neuter: string;
  plural: string;
}

// Parsed context structure stored in dictionary.context JSON field
export interface WordContext {
  original: string;           // Original sentence from chat
  examples: string[];         // Example sentences
  root: string;               // Root word / lemma
  proTip: string;             // Usage tip
  // Verb-specific
  conjugations?: VerbConjugations;
  // Noun-specific
  gender?: Gender;
  plural?: string;
  // Adjective-specific
  adjectiveForms?: AdjectiveForms;
}

export interface DictionaryEntry {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  word_type: WordType;
  pronunciation?: string;
  gender?: string;
  plural?: string;
  conjugations?: VerbConjugations;
  adjective_forms?: Partial<AdjectiveForms>;
  example_sentence?: string;
  example_translation?: string;
  pro_tip?: string;
  notes?: string;
  source?: string;
  language_code: string;
  enriched_at?: string;
  created_at: string;
  updated_at?: string;
}

export type ChatMode = 'ask' | 'learn' | 'coach';

// Translation direction for games (language-agnostic)
export type TranslationDirection = 'target_to_native' | 'native_to_target';

export type LiveSessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking' | 'error';

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  mode: ChatMode;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  role: 'user' | 'model';
  content: string;
  created_at: string;
  vocabulary_harvested_at?: string | null;
  source?: 'text' | 'voice';
}

// ===========================================
// Level Test System Types
// ===========================================

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'translation';

// A single question in a level test
export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;           // The question text
  context?: string;           // Additional context (e.g., for fill-in-blank)
  options?: string[];         // For multiple choice questions
  correctAnswer: string;      // The correct answer
  theme: string;              // Which concept this tests
  isCore: boolean;            // true = standardized, false = from Love Log
  wordId?: string;            // Reference to dictionary entry if from Love Log
}

// User's answer to a question
export interface TestAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;         // Seconds spent on this question
}

// A complete level test record
export interface LevelTest {
  id: string;
  user_id: string;
  from_level: string;         // e.g., "Beginner 1"
  to_level: string;           // e.g., "Beginner 2"
  passed: boolean;
  score: number;              // Percentage 0-100
  total_questions: number;
  correct_answers: number;
  started_at: string;
  completed_at?: string;
  questions: TestQuestion[];  // Stored as JSONB
  answers?: TestAnswer[];     // User's answers
  created_at: string;
}

// Level information calculated from XP
export interface LevelInfo {
  tier: string;               // e.g., "Beginner"
  level: number;              // 1, 2, or 3
  displayName: string;        // e.g., "Beginner 2"
  xpInTier: number;           // XP accumulated within current tier
  xpForCurrentLevel: number;  // XP accumulated within current sub-level
  xpToNextLevel: number;      // XP needed to reach next sub-level
  totalXp: number;            // Total XP
  canTakeTest: boolean;       // Has enough XP for level-up test
  nextLevel: string | null;   // Next level name, null if maxed
}

// Progress summary from AI
export interface ProgressSummary {
  summary: string;            // Main narrative paragraph
  wordsLearned: number;       // Total words in Love Log
  newWordsSinceLastVisit: number;
  topicsExplored: string[];   // Topics/themes covered
  grammarHighlights: string[]; // Grammar concepts learned
  canNowSay: string[];        // Practical phrases unlocked
  suggestions: string[];      // What to learn next
  generatedAt: string;        // ISO timestamp
}

// Validation patterns from smart answer validation
export interface ValidationPatterns {
  totalAnswers: number;
  exactMatches: number;
  diacriticIssues: number;
  synonymsAccepted: number;
  typosAccepted: number;
  wrongAnswers: number;
}

// Saved progress summary (stored in database)
export interface SavedProgressSummary extends ProgressSummary {
  id: string;
  xpAtTime: number;
  levelAtTime: string;
  createdAt: string;
  validationPatterns?: ValidationPatterns | null;
}

// ===========================================
// Word Mastery & Practice Tracking Types
// ===========================================

export interface WordScore {
  id?: string;
  user_id: string;
  word_id: string;
  total_attempts: number;        // Total times word was practiced
  correct_attempts: number;      // Number of correct answers
  correct_streak: number;        // Current consecutive correct answers
  learned_at: string | null;     // Timestamp when word reached 5-streak, null if not learned
  last_practiced?: string;       // Note: not in DB schema, computed or added later
  language_code?: string;
  // Joined dictionary data (optional)
  dictionary?: {
    word: string;
    translation: string;
    word_type?: WordType;
  };
}

// AI Challenge mode types
export type AIChallengeMode = 'weakest' | 'gauntlet' | 'romantic' | 'least_practiced' | 'review_mastered';

export interface AIChallengeModeInfo {
  id: AIChallengeMode;
  name: string;
  description: string;
  icon: string;
}

export interface RomanticPhrase {
  id: string;
  word: string;                  // Word/phrase in target language
  translation: string;           // Translation in native language
  targetLanguageCode?: string;   // e.g., 'pl', 'es'
  nativeLanguageCode?: string;   // e.g., 'en', 'es'
  context?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// ===========================================
// Partner Invite System Types
// ===========================================

export interface InviteToken {
  id: string;
  token: string;
  inviter_id: string;
  inviter_name: string;
  inviter_email: string;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

// Context about the learner for the tutor's AI coach
export interface PartnerContext {
  learnerName: string;
  vocabulary: Array<{
    word: string;
    translation: string;
    wordType: WordType;
    mastered: boolean;
  }>;
  weakSpots: Array<{
    word: string;
    translation: string;
    failCount: number;
  }>;
  recentWords: Array<{
    word: string;
    translation: string;
    learnedAt: string;
  }>;
  stats: {
    totalWords: number;
    masteredCount: number;
    needsReviewCount: number;
    xp: number;
    level: string;
  };
}

// ===========================================
// Tutor Challenge System Types
// ===========================================

export type ChallengeType = 'quiz' | 'whisper' | 'quickfire';
export type ChallengeStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface QuizConfig {
  wordCount: number;
  questionTypes: ('multiple_choice' | 'type_it' | 'flashcard')[];
  aiSuggestedWeakWords: boolean;
}

export interface WhisperConfig {
  recordings: Array<{
    audioUrl: string;
    word: string;
    translation: string;
  }>;
}

export interface QuickFireConfig {
  wordCount: number;
  timeLimitSeconds: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ChallengeConfig = QuizConfig | WhisperConfig | QuickFireConfig;

export interface TutorChallenge {
  id: string;
  tutor_id: string;
  student_id: string;
  challenge_type: ChallengeType;
  title: string | null;
  config: ChallengeConfig;
  word_ids: string[];
  words_data: Array<{ id?: string; word: string; translation: string; word_type: WordType }>;
  status: ChallengeStatus;
  expires_at: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ChallengeResult {
  id: string;
  challenge_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_spent_seconds: number | null;
  answers: any[];
  xp_earned: number;
  completed_at: string;
}

// ===========================================
// Word Request System Types
// ===========================================

export type WordRequestType = 'free_text' | 'ai_topic';
export type WordRequestStatus = 'pending' | 'learning' | 'completed';

export interface WordSuggestion {
  word: string;
  translation: string;
  word_type: WordType;
  context?: string;
  pronunciation?: string;
  selected?: boolean;
}

export interface WordRequest {
  id: string;
  tutor_id: string;
  student_id: string;
  request_type: WordRequestType;
  input_text: string;
  ai_suggestions: WordSuggestion[] | null;
  selected_words: WordSuggestion[];
  status: WordRequestStatus;
  learning_content: any | null;
  xp_multiplier: number;
  created_at: string;
  viewed_at: string | null;
  completed_at: string | null;
}

export interface GiftWord {
  id: string;
  word_id: string;
  word_request_id: string | null;
  tutor_id: string;
  student_id: string;
  xp_earned: number;
  gifted_at: string;
}

// ===========================================
// Notification System Types
// ===========================================

export type NotificationType = 'challenge' | 'word_request' | 'love_note' | 'challenge_complete' | 'gift_complete';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: any;
  read_at: string | null;
  dismissed_at: string | null;
  created_at: string;
}

// ===========================================
// Bug Report System Types
// ===========================================

export type BugReportSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugReportStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface BugReport {
  id: string;
  user_id: string;
  title: string;
  description: string;
  severity: BugReportSeverity;
  status: BugReportStatus;
  page_url?: string;
  browser_info?: {
    userAgent: string;
    language: string;
    screenWidth: number;
    screenHeight: number;
    platform: string;
  };
  app_state?: {
    role: string;
    level: string;
    xp: number;
    currentPath: string;
  };
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Gemini Service Types
// ===========================================

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance?: number;
  context?: string;
  pronunciation?: string;
  rootWord?: string;
  examples?: string[];
  proTip?: string;
  conjugations?: {
    present?: { first_singular?: string; second_singular?: string; third_singular?: string; first_plural?: string; second_plural?: string; third_plural?: string };
    past?: { first_singular?: string; second_singular?: string; third_singular?: string; first_plural?: string; second_plural?: string; third_plural?: string };
    future?: { first_singular?: string; second_singular?: string; third_singular?: string; first_plural?: string; second_plural?: string; third_plural?: string };
  };
  adjectiveForms?: { masculine?: string; feminine?: string; neuter?: string; plural?: string };
  gender?: string;
  plural?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}

// ===========================================
// Session Boot Context Types
// ===========================================

// Context loaded once per session to avoid repeated DB fetches
export interface SessionContext {
  // Common fields
  userId: string;
  role: 'student' | 'tutor';
  name: string;
  partnerName: string | null;
  bootedAt: string;  // ISO timestamp for cache invalidation

  // Language settings
  targetLanguage: string;      // Current target language code
  nativeLanguage: string;      // User's native language code

  // Student-specific (or learner data for tutors)
  level: string;
  xp: number;

  // Vocabulary context (for AI prompts)
  vocabulary: Array<{
    word: string;
    translation: string;
    wordType?: string;
  }>;

  // Words they struggle with
  weakSpots: Array<{
    word: string;
    translation: string;
    failCount: number;
  }>;

  // Recently learned words
  recentWords: Array<{
    word: string;
    translation: string;
  }>;

  // Stats summary
  stats: {
    totalWords: number;
    masteredCount: number;
  };

  // Tutor-specific: partner's learning data
  partner?: {
    userId: string;
    name: string;
    level: string;
    xp: number;
    targetLanguage?: string;
    nativeLanguage?: string;
    vocabulary: Array<{ word: string; translation: string }>;
    weakSpots: Array<{ word: string; translation: string; failCount: number }>;
    recentWords: Array<{ word: string; translation: string }>;
    stats: { totalWords: number; masteredCount: number };
    lastActive?: string;
  };
}
