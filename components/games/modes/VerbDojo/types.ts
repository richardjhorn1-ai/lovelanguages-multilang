import { DictionaryEntry } from '../../../../types';
import { VerbTense } from '../../../../constants/language-config';

// Game modes
export type DojoMode = 'mixed' | 'match_pairs' | 'fill_template' | 'multiple_choice' | 'audio_type';

// A verb+tense combination in the queue
export interface VerbTenseCombo {
  verb: DictionaryEntry;
  tense: VerbTense;
  correctStreak: number; // 0 = just got wrong, higher = getting mastered
}

// Question types for each mode
export interface BaseQuestion {
  verb: DictionaryEntry;
  tense: VerbTense;
  mode: DojoMode;
}

export interface MatchPairsQuestion extends BaseQuestion {
  mode: 'match_pairs';
  pairs: {
    personKey: string;
    personLabel: string;
    correctAnswer: string; // or { masculine: string; feminine: string } for gendered
  }[];
}

export interface FillTemplateQuestion extends BaseQuestion {
  mode: 'fill_template';
  personKey: string;
  personLabel: string;
  nativeLabel: string;
  correctAnswer: string | { masculine: string; feminine: string };
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  mode: 'multiple_choice';
  personKey: string;
  personLabel: string;
  nativeLabel: string;
  correctAnswer: string;
  options: string[]; // 4 options including correct
}

export interface AudioTypeQuestion extends BaseQuestion {
  mode: 'audio_type';
  personKey: string;
  personLabel: string;
  correctAnswer: string;
  audioText: string; // What to speak via TTS
}

export type DojoQuestion =
  | MatchPairsQuestion
  | FillTemplateQuestion
  | MultipleChoiceQuestion
  | AudioTypeQuestion;

// Game state
export interface DojoGameState {
  mode: DojoMode;
  focusTense: VerbTense | null;
  queue: VerbTenseCombo[];
  currentQuestion: DojoQuestion | null;
  streak: number;
  totalCorrect: number;
  totalWrong: number;
  xpEarned: number;
  isPlaying: boolean;
}

// Session result (on exit)
export interface DojoSessionResult {
  totalQuestions: number;
  correct: number;
  wrong: number;
  longestStreak: number;
  xpEarned: number;
}
