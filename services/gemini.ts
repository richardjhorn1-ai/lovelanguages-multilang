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

export const geminiService = {
  async analyzeHistory(messages: {role: string, content: string}[], currentWords: string[]): Promise<ExtractedWord[]> {
    try {
      const response = await fetch('/api/analyze-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, currentWords })
      });

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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, images, userLog: userWords })
      });
      const data = await response.json();
      return data.replyText || "I'm having a bit of trouble finding the words.";
    } catch (e) {
      console.error("Gemini Chat Error:", e);
      return "I'm having a little trouble connecting right now.";
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: firstMessage, action: 'generateTitle' })
      });
      const data = await response.json();
      return data.title || "New Chat";
    } catch (e) {
      return "New Chat";
    }
  }
};
