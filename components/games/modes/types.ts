import { DictionaryEntry, WordScore } from '../../../types';

/**
 * Common props for all game mode components.
 */
export interface GameModeProps {
  /** Array of words to practice */
  words: DictionaryEntry[];
  /** Map of word scores for streak display */
  scoresMap: Map<string, WordScore>;
  /** Current word index (0-indexed) */
  currentIndex: number;
  /** Accent/tier color for styling */
  accentColor: string;
  /** Target language name (e.g., "Polish") */
  targetLanguageName: string;
  /** Native language name (e.g., "English") */
  nativeLanguageName: string;
  /** Current streak for the displayed word */
  currentWordStreak: number;
  /** Whether to show shake animation on incorrect */
  showIncorrectShake?: boolean;
}

/**
 * Answer result passed to parent when user answers.
 */
export interface AnswerResult {
  wordId: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  isCorrect: boolean;
}

/**
 * Props for game modes that handle their own answer submission.
 */
export interface InteractiveGameModeProps extends GameModeProps {
  /** Called when user submits an answer */
  onAnswer: (result: AnswerResult) => void;
  /** Called to move to next word (after answer feedback) */
  onNext: () => void;
  /** Called when game is complete */
  onComplete: () => void;
}
