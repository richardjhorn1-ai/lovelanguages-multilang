
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
