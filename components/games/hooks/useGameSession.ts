import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../../../services/supabase';
import { useLanguage } from '../../../context/LanguageContext';
import { useOffline } from '../../../hooks/useOffline';
import { apiFetch } from '../../../services/api-config';

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

interface SessionEndData {
  score: SessionScore;
  answers: GameSessionAnswer[];
  durationSeconds: number;
}

interface UseGameSessionOptions {
  userId?: string;
  onSessionEnd?: (results: SessionEndData) => void;
}

interface UseGameSessionReturn {
  // Session state
  sessionScore: SessionScore;
  sessionAnswers: GameSessionAnswer[];
  finished: boolean;

  // Actions
  recordAnswer: (answer: GameSessionAnswer) => void;
  endSession: () => void;
  resetSession: () => void;
  saveSession: (gameMode: string) => Promise<void>;

  // Computed (snapshot at time of call)
  getDurationSeconds: () => number;
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

  const { languageParams, targetLanguage } = useLanguage();
  const { isOnline, queueGameSession } = useOffline(options?.userId, targetLanguage);

  // Use refs to avoid stale closures in callbacks
  const sessionScoreRef = useRef(sessionScore);
  const sessionAnswersRef = useRef(sessionAnswers);
  const onSessionEndRef = useRef(options?.onSessionEnd);

  // Keep refs in sync with state
  useEffect(() => {
    sessionScoreRef.current = sessionScore;
  }, [sessionScore]);

  useEffect(() => {
    sessionAnswersRef.current = sessionAnswers;
  }, [sessionAnswers]);

  useEffect(() => {
    onSessionEndRef.current = options?.onSessionEnd;
  }, [options?.onSessionEnd]);

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
   * Mark the session as finished and trigger callback.
   */
  const endSession = useCallback(() => {
    setFinished(true);
    const durationSeconds = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);

    // Use refs for current values to avoid stale closure
    if (onSessionEndRef.current) {
      onSessionEndRef.current({
        score: sessionScoreRef.current,
        answers: sessionAnswersRef.current,
        durationSeconds,
      });
    }
  }, []); // Now stable - uses refs

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
        const totalTimeSeconds = Math.floor(
          (Date.now() - sessionStartTimeRef.current) / 1000
        );
        const currentScore = sessionScoreRef.current;
        const currentAnswers = sessionAnswersRef.current;

        if (!isOnline) {
          // Queue for sync when back online
          if (options?.userId) {
            await queueGameSession({
              userId: options.userId,
              gameMode,
              correctCount: currentScore.correct,
              incorrectCount: currentScore.incorrect,
              totalTimeSeconds,
              answers: currentAnswers,
              targetLanguage: languageParams.targetLanguage || '',
              nativeLanguage: languageParams.nativeLanguage || '',
            });
          }
          return;
        }

        const token = (await supabase.auth.getSession()).data.session?.access_token;
        if (!token) {
          console.error('No auth token available for saving session');
          return;
        }

        const response = await apiFetch('/api/submit-game-session/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gameMode,
            correctCount: currentScore.correct,
            incorrectCount: currentScore.incorrect,
            totalTimeSeconds,
            answers: currentAnswers,
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
    [languageParams, isOnline, queueGameSession, options?.userId]
  );

  /**
   * Get current duration in seconds (call when needed, not on every render).
   */
  const getDurationSeconds = useCallback(() => {
    return Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
  }, []);

  const totalAnswered = sessionScore.correct + sessionScore.incorrect;
  const accuracy = totalAnswered > 0 ? Math.round((sessionScore.correct / totalAnswered) * 100) : 0;

  return {
    sessionScore,
    sessionAnswers,
    finished,
    recordAnswer,
    endSession,
    resetSession,
    saveSession,
    getDurationSeconds,
    totalAnswered,
    accuracy,
  };
}

export default useGameSession;
