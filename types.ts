
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

export interface DictionaryEntry {
  id: string;
  user_id: string;
  word: string;
  translation: string;
  word_type: WordType;
  importance: number;
  context: string;
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
