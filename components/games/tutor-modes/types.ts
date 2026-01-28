import { DictionaryEntry } from '../../../types';

/**
 * Answer result for tutor game modes.
 */
export interface TutorAnswerResult {
  wordId: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it' | 'quick_fire';
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Common props for tutor game mode components.
 */
export interface TutorGameModeProps {
  /** Words to practice (partner's vocabulary) */
  words: DictionaryEntry[];
  /** Current word index */
  currentIndex: number;
  /** Current score */
  score: { correct: number; incorrect: number };
  /** Target language name */
  targetLanguageName: string;
  /** Native language name */
  nativeLanguageName: string;
  /** Called when user answers */
  onAnswer: (result: TutorAnswerResult, isCorrect: boolean) => void;
  /** Called to exit game */
  onExit: () => void;
}
