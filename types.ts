
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

// Conjugation table for a single tense
export interface TenseConjugation {
  ja: string;      // I
  ty: string;      // you (singular)
  onOna: string;   // he/she
  my: string;      // we
  wy: string;      // you (plural)
  oni: string;     // they
}

// Full verb conjugations
export interface VerbConjugations {
  present: TenseConjugation;
  past: TenseConjugation;
  future: TenseConjugation;
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
}
