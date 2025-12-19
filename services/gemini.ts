
export interface ExtractedWord {
  word: string;
  translation: string;
  type: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'other';
  importance: number;
  context: string;
  rootWord?: string;
}

export const geminiService = {
  /**
   * Generates a response based on the mode and extracts Polish words from the dialogue.
   * Now proxies through the server-side API to keep keys secure.
   */
  async generateAndExtract(prompt: string, mode: string, userLog: string[]): Promise<{ text: string; words: ExtractedWord[] }> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          mode,
          userLog,
          action: 'generateAndExtract'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

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
      return { text: "I'm sorry, I had a little hiccup connecting to the brain!", words: [] };
    }
  },

  async generateTitle(firstMessage: string): Promise<string> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: firstMessage,
          action: 'generateTitle'
        })
      });
      const data = await response.json();
      return data.title || "New Chat";
    } catch (e) {
      console.error("Title Gen Error:", e);
      return "New Chat";
    }
  }
};
