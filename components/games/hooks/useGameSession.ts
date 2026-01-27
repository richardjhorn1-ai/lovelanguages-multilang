import { useState, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { useLanguage } from '../../../context/LanguageContext';

export interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it';
  isCorrect: boolean;
  explanation?: string;
}

interface SessionScore {
  correct: number;
  incorrect: number;
}

interface UseGameSessionOptions {
  onSessionEnd?: (results: {
    score: SessionScore;
    answers: GameSessionAnswer[];
    durationSeconds: number;
  }) => void;
}

interface UseGameSessionReturn {
  // Session state
  sessionScore: SessionScore;
  sessionAnswers: GameSessionAnswer[];
  sessionStartTime: number;
  finished: boolean;
  durationSeconds: number;

  // Actions
  recordAnswer: (answer: GameSessionAnswer) => void;
  endSession: () => void;
  resetSession: () => void;
  saveSession: (gameMode: string) => Promise<void>;

  // Computed
  totalAnswered: number;
  accuracy: number;
}

/**
 * Hook for managing a game session's state.
 * Tracks answers, score, timing, and handles persistence.
 */
export function useGameSession(options?: UseGameSessionOptions): UseGameSessionReturn {
  const [sessionScore, setSessionScore] = useState<SessionScore>({ correct: 0, incorrect: 0 });
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const [finished, setFinished] = useState(false);
  const sessionStartTimeRef = useRef<number>(Date.now());

  const { languageParams } = useLanguage();

  /**
   * Record an answer in the current session.
   */
  const recordAnswer = useCallback((answer: GameSessionAnswer) => {
    setSessionAnswers((prev) => [...prev, answer]);
    setSessionScore((prev) => ({
      correct: prev.correct + (answer.isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (answer.isCorrect ? 0 : 1),
    }));
  }, []);

  /**
   * Mark the session as finished.
   */
  const endSession = useCallback(() => {
    setFinished(true);
    const durationSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

    if (options?.onSessionEnd) {
      options.onSessionEnd({
        score: sessionScore,
        answers: sessionAnswers,
        durationSeconds,
      });
    }
  }, [sessionScore, sessionAnswers, options]);

  /**
   * Reset the session for a new game.
   */
  const resetSession = useCallback(() => {
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setFinished(false);
    sessionStartTimeRef.current = Date.now();
  }, []);

  /**
   * Save the session to the database.
   */
  const saveSession = useCallback(
    async (gameMode: string) => {
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) {
          console.error('No auth token available for saving session');
          return;
        }

        const totalTimeSeconds = Math.floor(
          (Date.now() - sessionStartTimeRef.current) / 1000
        );

        const response = await fetch('/api/submit-game-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameMode,
            correctCount: sessionScore.correct,
            incorrectCount: sessionScore.incorrect,
            totalTimeSeconds,
            answers: sessionAnswers,
            ...languageParams,
          }),
        });

        if (!response.ok) {
          console.error('Failed to save game session:', await response.text());
        }
      } catch (error) {
        console.error('Error saving game session:', error);
      }
    },
    [sessionScore, sessionAnswers, languageParams]
  );

  const durationSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
  const totalAnswered = sessionScore.correct + sessionScore.incorrect;
  const accuracy = totalAnswered > 0 ? Math.round((sessionScore.correct / totalAnswered) * 100) : 0;

  return {
    sessionScore,
    sessionAnswers,
    sessionStartTime: sessionStartTimeRef.current,
    finished,
    durationSeconds,
    recordAnswer,
    endSession,
    resetSession,
    saveSession,
    totalAnswered,
    accuracy,
  };
}

export default useGameSession;
