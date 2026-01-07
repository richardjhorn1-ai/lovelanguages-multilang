import { supabase } from './supabase';
import { ExtractedWord, Attachment, SessionContext } from '../types';

export type { ExtractedWord, Attachment, SessionContext };

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
  // Boot session - fetch context once per chat session
  async bootSession(): Promise<SessionContext | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/boot-session', {
        method: 'POST',
        headers
      });

      if (response.status === 401) {
        console.error('Boot session: unauthorized');
        return null;
      }

      const data = await response.json();
      if (data.success && data.context) {
        return data.context as SessionContext;
      }
      return null;
    } catch (e) {
      console.error('Boot session error:', e);
      return null;
    }
  },

  // Streaming response - calls onChunk for each text piece
  async generateReplyStream(
    prompt: string,
    mode: string,
    userWords: string[] = [],
    onChunk: (text: string) => void,
    messageHistory: { role: string; content: string }[] = []
  ): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat-stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt, mode, userLog: userWords, messages: messageHistory.slice(-10) })
      });

      if (response.status === 401) {
        return "Please log in to continue chatting.";
      }

      if (!response.body) {
        return "Streaming not supported.";
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.error) {
                console.error('Stream error:', data.error);
                return data.error;
              }
              if (data.type === 'chunk' && data.text) {
                fullText += data.text;
                onChunk(data.text);
              }
              if (data.type === 'done') {
                return fullText;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return fullText;
    } catch (e) {
      console.error("Streaming Error:", e);
      return "I'm having trouble connecting right now.";
    }
  },

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

  async generateReply(
    prompt: string,
    mode: string,
    images: Attachment[] = [],
    userWords: string[] = [],
    messageHistory: { role: string; content: string }[] = [],
    sessionContext?: SessionContext | null
  ): Promise<{ replyText: string; newWords: ExtractedWord[] }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          mode,
          images,
          userLog: userWords,
          messages: messageHistory.slice(-10),
          sessionContext: sessionContext || undefined
        })
      });

      if (response.status === 401) {
        return { replyText: "Please log in to continue chatting.", newWords: [] };
      }

      const data = await response.json();
      const newWords = (data.newWords || []).map((w: any) => ({
        ...w,
        word: (w.word || '').toLowerCase().trim(),
        rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
      }));

      return {
        replyText: data.replyText || "I'm having a bit of trouble finding the words.",
        newWords
      };
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return { replyText: "I'm having a little trouble connecting right now.", newWords: [] };
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
  },

  async unlockTense(wordId: string, word: string, tense: 'past' | 'future'): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/unlock-tense', {
        method: 'POST',
        headers,
        body: JSON.stringify({ wordId, word, tense })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in to unlock tenses." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to unlock tense" };
      }

      return { success: true, data: data.data };
    } catch (e) {
      console.error("Unlock Tense Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async incrementXP(amount: number): Promise<{ success: boolean; newXp?: number; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/increment-xp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ amount })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to increment XP" };
      }

      return { success: true, newXp: data.newXp };
    } catch (e) {
      console.error("Increment XP Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async generateLevelTest(fromLevel: string, toLevel: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/generate-level-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fromLevel, toLevel })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to generate test" };
      }

      return { success: true, data };
    } catch (e) {
      console.error("Generate Level Test Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async submitLevelTest(testId: string, answers: { questionId: string; userAnswer: string }[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/submit-level-test', {
        method: 'POST',
        headers,
        body: JSON.stringify({ testId, answers })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to submit test" };
      }

      return { success: true, data };
    } catch (e) {
      console.error("Submit Level Test Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async getProgressSummary(): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/progress-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate' })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to get progress summary" };
      }

      return { success: true, data };
    } catch (e) {
      console.error("Progress Summary Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async listProgressSummaries(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/progress-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'list' })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to list summaries" };
      }

      return { success: true, data: data.summaries };
    } catch (e) {
      console.error("List Summaries Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async getProgressSummaryById(summaryId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/progress-summary', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get', summaryId })
      });

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to get summary" };
      }

      return { success: true, data: data.summary };
    } catch (e) {
      console.error("Get Summary Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  }
};
