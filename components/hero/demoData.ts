// Demo words for landing page game showcase
// Mix of romantic, practical, and funny words - now language-aware!

import { shuffleArray } from '../../utils/array';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';

// Re-export for consumers that import from this file
export { shuffleArray };

export interface DemoWord {
  id: string;
  word: string;
  translation: string;
  type: 'verb' | 'noun' | 'adjective' | 'phrase';
}

// Default Polish words for fallback
const DEFAULT_DEMO_WORDS: DemoWord[] = [
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
  { id: '9', word: 'żółw', translation: 'turtle', type: 'noun' },
  { id: '10', word: 'chrząszcz', translation: 'beetle (try saying it!)', type: 'noun' },
];

// Generate demo words dynamically based on language config
export const getDemoWords = (targetLanguage: string, nativeLanguage: string): DemoWord[] => {
  const target = LANGUAGE_CONFIGS[targetLanguage];
  const native = LANGUAGE_CONFIGS[nativeLanguage];

  if (!target || !native) {
    // Fallback to defaults if languages not found
    return DEFAULT_DEMO_WORDS;
  }

  // Generate demo words from language examples
  return [
    { id: '1', word: target.examples.hello, translation: native.examples.hello, type: 'phrase' },
    { id: '2', word: target.examples.iLoveYou, translation: native.examples.iLoveYou, type: 'phrase' },
    { id: '3', word: target.examples.thankYou, translation: native.examples.thankYou, type: 'phrase' },
    // Duplicate entries to have enough variety for games
    { id: '4', word: target.examples.hello, translation: native.examples.hello, type: 'phrase' },
    { id: '5', word: target.examples.iLoveYou, translation: native.examples.iLoveYou, type: 'phrase' },
    { id: '6', word: target.examples.thankYou, translation: native.examples.thankYou, type: 'phrase' },
  ];
};

// Keep DEMO_WORDS for backward compatibility (uses Polish → English)
export const DEMO_WORDS: DemoWord[] = DEFAULT_DEMO_WORDS;

// Generate wrong options for multiple choice
export const generateMCOptions = (
  correctAnswer: string,
  allWords: DemoWord[],
  isTargetToNative: boolean = true
): string[] => {
  const correct = correctAnswer;
  const others = allWords
    .map(w => isTargetToNative ? w.translation : w.word)
    .filter(t => t !== correct);

  const wrongOptions = shuffleArray(others).slice(0, 3);
  return shuffleArray([correct, ...wrongOptions]);
};
