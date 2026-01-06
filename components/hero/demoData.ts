// Demo words for landing page game showcase
// Mix of romantic, practical, and funny words

export interface DemoWord {
  id: string;
  word: string;
  translation: string;
  type: 'verb' | 'noun' | 'adjective' | 'phrase';
}

export const DEMO_WORDS: DemoWord[] = [
  // Romantic
  { id: '1', word: 'kocham', translation: 'I love', type: 'verb' },
  { id: '2', word: 'serce', translation: 'heart', type: 'noun' },
  { id: '3', word: 'piękna', translation: 'beautiful', type: 'adjective' },
  { id: '4', word: 'kocham cię', translation: 'I love you', type: 'phrase' },

  // Practical
  { id: '5', word: 'dziękuję', translation: 'thank you', type: 'phrase' },
  { id: '6', word: 'przepraszam', translation: 'sorry / excuse me', type: 'phrase' },
  { id: '7', word: 'smacznego', translation: 'enjoy your meal', type: 'phrase' },
  { id: '8', word: 'dobranoc', translation: 'goodnight', type: 'phrase' },

  // Funny
  { id: '9', word: 'żółć', translation: 'bile (hardest word!)', type: 'noun' },
  { id: '10', word: 'chrząszcz', translation: 'beetle (try saying it!)', type: 'noun' },
];

// Helper to shuffle array
export const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Generate wrong options for multiple choice
export const generateMCOptions = (
  correctAnswer: string,
  allWords: DemoWord[],
  isPolishToEnglish: boolean
): string[] => {
  const correct = correctAnswer;
  const others = allWords
    .map(w => isPolishToEnglish ? w.translation : w.word)
    .filter(t => t !== correct);

  const wrongOptions = shuffleArray(others).slice(0, 3);
  return shuffleArray([correct, ...wrongOptions]);
};
