import { supabase } from './supabase';
import { ExtractedWord, Attachment, SessionContext, ProposedAction } from '../types';
import type { VerbTense } from '../constants/language-config';

export type { ExtractedWord, Attachment, SessionContext, ProposedAction };

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

export interface BootSessionResult {
  context: SessionContext;
  milestones: { hasWords: boolean; hasGames: boolean; hasChats: boolean };
  daysSinceLastActive: number | null;
}

export const geminiService = {
  // Boot session - fetch context once per chat session
  async bootSession(): Promise<BootSessionResult | null> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/boot-session/', {
        method: 'POST',
        headers
      });

      if (response.status === 401) {
        console.error('Boot session: unauthorized');
        return null;
      }

      const data = await response.json();
      if (data.success && data.context) {
        return {
          context: data.context as SessionContext,
          milestones: data.milestones || { hasWords: true, hasGames: true, hasChats: true },
          daysSinceLastActive: data.daysSinceLastActive ?? null,
        };
      }
      return null;
    } catch (e) {
      console.error('Boot session error:', e);
      return null;
    }
  },

  async analyzeHistory(
    messages: {role: string, content: string}[],
    currentWords: string[],
    languageParams?: { targetLanguage: string; nativeLanguage: string }
  ): Promise<ExtractedWord[]> {
    let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const headers = await getAuthHeaders();

      const controller = new AbortController();
      fetchTimeout = setTimeout(() => controller.abort(), 55_000);

      const response = await fetch('/api/analyze-history/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ messages, currentWords, ...languageParams }),
        signal: controller.signal
      });

      clearTimeout(fetchTimeout);

      if (response.status === 401) {
        console.error("Authentication required for API access");
        return [];
      }

      // Guard against non-JSON responses (e.g. 504 HTML from gateway)
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        console.warn("analyzeHistory: non-JSON response (status %d, type %s)", response.status, contentType);
        return [];
      }

      const data = await response.json();
      return (data.newWords || []).map((w: any) => ({
        ...w,
        word: (w.word || '').toLowerCase().trim(),
        rootWord: ((w.rootWord || w.word || '') as string).toLowerCase().trim()
      }));
    } catch (e: any) {
      clearTimeout(fetchTimeout);
      if (e.name === 'AbortError') {
        console.warn("analyzeHistory: request aborted (55s timeout)");
        return [];
      }
      console.error("Batch Extraction Error:", e);
      return [];
    }
  },

  async generateReply(
    prompt: string,
    mode: string,
    images: Attachment[] = [],
    messageHistory: { role: string; content: string }[] = [],
    sessionContext?: SessionContext | null,
    languageParams?: { targetLanguage: string; nativeLanguage: string }
  ): Promise<{ replyText: string; newWords: ExtractedWord[]; proposedAction?: ProposedAction }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          mode,
          images,
          messages: messageHistory.slice(-50),
          sessionContext: sessionContext || undefined,
          ...languageParams
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
        newWords,
        proposedAction: data.proposedAction || undefined
      };
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return { replyText: "I'm having a little trouble connecting right now.", newWords: [] };
    }
  },

  async generateReplyStream(
    prompt: string,
    mode: string,
    messageHistory: { role: string; content: string }[] = [],
    sessionContext?: SessionContext | null,
    languageParams?: { targetLanguage: string; nativeLanguage: string },
    onChunk?: (text: string) => void
  ): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat-stream/', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt,
          mode,
          messages: messageHistory.slice(-20),
          sessionContext: sessionContext || undefined,
          ...languageParams
        })
      });

      if (response.status === 401) {
        return "Please log in to continue chatting.";
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Stream failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = ''; // Buffer for incomplete lines split across chunks

      while (true) {
        const { done, value } = await reader.read();

        // Process any data in this chunk (even if done is true)
        if (value) {
          // Flush decoder on final chunk (stream: false)
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n');

          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullText += data.text;
                  onChunk?.(data.text);
                }
                if (data.error) throw new Error(data.error);
              } catch (e) {
                // Skip malformed JSON lines
              }
            }
          }
        }

        // Exit after processing final chunk
        if (done) break;
      }

      return fullText || "I'm having a bit of trouble finding the words.";
    } catch (e) {
      console.error("Gemini Stream Error:", e);
      return "I'm having a little trouble connecting right now.";
    }
  },

  async generateTitle(firstMessage: string, languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<string> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/chat/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt: firstMessage, action: 'generateTitle', ...languageParams })
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

  async unlockTense(wordId: string, word: string, tense: VerbTense): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/unlock-tense/', {
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

  async completeEntry(wordId: string): Promise<any> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/complete-entry/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ wordId })
      });

      if (!response.ok) return null;
      return response.json();
    } catch (e) {
      console.error("Complete Entry Error:", e);
      return null;
    }
  },

  async incrementXP(amount: number): Promise<{ success: boolean; newXp?: number; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/increment-xp/', {
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

  async generateLevelTest(fromLevel: string, toLevel: string, languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const headers = await getAuthHeaders();

      const controller = new AbortController();
      fetchTimeout = setTimeout(() => controller.abort(), 65_000);

      const response = await fetch('/api/generate-level-test/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fromLevel, toLevel, ...languageParams }),
        signal: controller.signal
      });

      clearTimeout(fetchTimeout);

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to generate test" };
      }

      return { success: true, data };
    } catch (e: any) {
      clearTimeout(fetchTimeout);
      if (e.name === 'AbortError') {
        return { success: false, error: "Test generation timed out. Please try again." };
      }
      console.error("Generate Level Test Error:", e);
      return { success: false, error: "Failed to connect to server" };
    }
  },

  async submitLevelTest(testId: string, answers: { questionId: string; userAnswer: string }[], languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/submit-level-test/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ testId, answers, ...languageParams })
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

  async getProgressSummary(languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<{ success: boolean; data?: any; error?: string; retryable?: boolean }> {
    let fetchTimeout: ReturnType<typeof setTimeout> | undefined;

    try {
      const headers = await getAuthHeaders();

      const controller = new AbortController();
      fetchTimeout = setTimeout(() => controller.abort(), 45_000);

      const response = await fetch('/api/progress-summary/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'generate', ...languageParams }),
        signal: controller.signal
      });

      clearTimeout(fetchTimeout);

      if (response.status === 401) {
        return { success: false, error: "Please log in." };
      }

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to get progress summary", retryable: data.retryable || false };
      }

      return { success: true, data };
    } catch (e: any) {
      clearTimeout(fetchTimeout);
      if (e.name === 'AbortError') {
        return { success: false, error: "Summary generation timed out. Please try again.", retryable: true };
      }
      console.error("Progress Summary Error:", e);
      return { success: false, error: "Failed to connect to server", retryable: true };
    }
  },

  async listProgressSummaries(languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/progress-summary/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'list', ...languageParams })
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

  async getProgressSummaryById(summaryId: string, languageParams?: { targetLanguage: string; nativeLanguage: string }): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/progress-summary/', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'get', summaryId, ...languageParams })
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
