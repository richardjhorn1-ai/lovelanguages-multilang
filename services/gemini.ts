import { supabase } from './supabase';

export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
  examples?: string[];
  proTip?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}

// Helper to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
}

export const geminiService = {
  async analyzeHistory(messages: {role: string, content: string}[], currentWords: string[]): Promise<ExtractedWord[]> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/analyze-history', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, currentWords })
      });

      if (response.status === 401) {
        console.error("Authentication required for API access");
        return [];
      }

      const data = await response.json();
      return (data.newWords || []).map((w: any) => ({
        ...w,
        word: (w.word || '').toLowerCase().trim(),
        rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
      }));
    } catch (e) {
      console.error("Batch Extraction Error:", e);
      return [];
    }
  },

  async generateReply(prompt: string, mode: string, images: Attachment[] = [], userWords: string[] = []): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, mode, images, userLog: userWords })
      });

      if (response.status === 401) {
        return "Please log in to continue chatting.";
      }

      const data = await response.json();
      return data.replyText || "I'm having a bit of trouble finding the words.";
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return "I'm having a little trouble connecting right now.";
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: firstMessage, action: 'generateTitle' })
      });

      if (response.status === 401) {
        return "New Chat";
      }

      const data = await response.json();
      return data.title || "New Chat";
    } catch (e) {
      return "New Chat";
    }
  }
};
