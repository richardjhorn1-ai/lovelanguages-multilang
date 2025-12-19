
export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
}

export interface Attachment {
  data: string;
  mimeType: string;
}

export const geminiService = {
  async generateAndExtract(prompt: string, mode: string, userLog: string[], images: Attachment[] = []): Promise<{ text: string; words: ExtractedWord[] }> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode, userLog, action: 'generateAndExtract', images }),
      });

      if (!response.ok) throw new Error(await response.text());
      const parsed = await response.json();
      
      return {
        text: parsed.replyText || '',
        words: (parsed.newWords || []).map((w: any) => ({
          ...w,
          word: w.word.toLowerCase().trim(),
          rootWord: w.rootWord?.toLowerCase().trim()
        }))
      };
    } catch (e) {
      console.error("Gemini Service Error:", e);
      return { text: "I'm sorry, I had a little hiccup connecting to the brain! Please try again.", words: [] };
    }
  },

  async extractFromTranscript(transcript: string): Promise<ExtractedWord[]> {
    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transcript, action: 'extractFromTranscript' })
        });
        const data = await response.json();
        return (data.newWords || []).map((w: any) => ({
            ...w,
            word: w.word.toLowerCase().trim(),
            rootWord: w.rootWord?.toLowerCase().trim()
        }));
    } catch (e) {
        console.error("Extraction Error:", e);
        return [];
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
      console.error("Title Gen Error:", e);
      return "New Chat";
    }
  }
};
