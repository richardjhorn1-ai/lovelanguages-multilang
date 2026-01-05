
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
}

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
export type Gender = 'masculine' | 'feminine' | 'neuter';

// Conjugation table for present tense (no gender)
export interface PresentTenseConjugation {
  ja: string;      // I
  ty: string;      // you (singular)
  onOna: string;   // he/she
  my: string;      // we
  wy: string;      // you (plural)
  oni: string;     // they
}

// Conjugation with gender variants (for past tense)
export interface GenderedConjugation {
  masculine: string;
  feminine: string;
}

// Past tense with gender support
export interface PastTenseConjugation {
  unlockedAt: string;  // ISO timestamp when unlocked
  ja: GenderedConjugation;      // byłem/byłam
  ty: GenderedConjugation;      // byłeś/byłaś
  onOna: { masculine: string; feminine: string; neuter: string };  // był/była/było
  my: GenderedConjugation;      // byliśmy/byłyśmy
  wy: GenderedConjugation;      // byliście/byłyście
  oni: GenderedConjugation;     // byli/były
}

// Future tense (can be simple or compound depending on aspect)
export interface FutureTenseConjugation {
  unlockedAt: string;  // ISO timestamp when unlocked
  ja: string;
  ty: string;
  onOna: string;
  my: string;
  wy: string;
  oni: string;
}

// Full verb conjugations with unlock tracking
export interface VerbConjugations {
  present: PresentTenseConjugation;           // Always extracted
  past?: PastTenseConjugation | null;         // null = locked, object = unlocked
  future?: FutureTenseConjugation | null;     // null = locked, object = unlocked
}

// Legacy type for backwards compatibility
export type TenseConjugation = PresentTenseConjugation;

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
  importance: number;
  context: string;  // JSON stringified WordContext
  unlocked_at: string;
}

export type ChatMode = 'ask' | 'learn' | 'coach';

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

// Saved progress summary (stored in database)
export interface SavedProgressSummary extends ProgressSummary {
  id: string;
  xpAtTime: number;
  levelAtTime: string;
  createdAt: string;
}

// ===========================================
// Word Mastery & Practice Tracking Types
// ===========================================

export interface WordScore {
  id?: string;
  user_id: string;
  word_id: string;
  success_count: number;
  fail_count: number;
  correct_streak: number;        // Current consecutive correct answers
  learned_at: string | null;     // Timestamp when word reached 5-streak, null if not learned
  last_practiced: string;
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
  polish: string;
  english: string;
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
