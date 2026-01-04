
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

export type ChatMode = 'ask' | 'learn';

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
