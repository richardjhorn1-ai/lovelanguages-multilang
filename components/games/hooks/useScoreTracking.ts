import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import { Profile, DictionaryEntry, WordScore } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { sounds } from '../../../services/sounds';
import { haptics } from '../../../services/haptics';

/** Number of consecutive correct answers needed to mark a word as "learned" */
export const STREAK_TO_LEARN = 5;

interface UseScoreTrackingOptions {
  profile: Profile;
  deck: DictionaryEntry[];
}

interface ScoreUpdateResult {
  justLearned: boolean;
  newStreak: number;
}

interface UseScoreTrackingReturn {
  scores: WordScore[];
  scoresMap: Map<string, WordScore>;
  loading: boolean;
  updateWordScore: (wordId: string, isCorrect: boolean) => Promise<ScoreUpdateResult>;
  getWordStreak: (wordId: string) => number;
  isWordLearned: (wordId: string) => boolean;
  masteredWords: DictionaryEntry[];
  unlearnedWords: DictionaryEntry[];
  weakestWords: DictionaryEntry[];
  refreshScores: () => Promise<void>;
  // Celebration state
  showStreakCelebration: boolean;
  celebrationWord: string | null;
}

/**
 * Hook for tracking word scores, streaks, and mastery status.
 * Handles score updates, streak celebrations, and provides computed word lists.
 */
export function useScoreTracking({
  profile,
  deck,
}: UseScoreTrackingOptions): UseScoreTrackingReturn {
  const [scores, setScores] = useState<WordScore[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationWord, setCelebrationWord] = useState<string | null>(null);

  const { targetLanguage } = useLanguage();

  // Determine which user's scores to load
  const targetUserId =
    profile.role === 'tutor' && profile.linked_user_id
      ? profile.linked_user_id
      : profile.id;

  const fetchScores = useCallback(async () => {
    setLoading(true);

    try {
      const { data: scoreData, error } = await supabase
        .from('word_scores')
        .select('*, dictionary:word_id(word, translation)')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage);

      if (error) {
        console.error('Error fetching scores:', error);
      } else if (scoreData) {
        setScores(scoreData as WordScore[]);
        // Create a map for quick lookup
        const map = new Map<string, WordScore>();
        scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
        setScoresMap(map);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    }

    setLoading(false);
  }, [targetUserId, targetLanguage]);

  // Fetch scores on mount and when dependencies change
  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // Listen for language switch events
  useEffect(() => {
    const handleLanguageSwitch = () => {
      fetchScores();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, [fetchScores]);

  /**
   * Update a word's score after an answer.
   * Handles streak tracking and triggers celebration when a word is mastered.
   */
  const updateWordScore = useCallback(
    async (wordId: string, isCorrect: boolean): Promise<ScoreUpdateResult> => {
      const existingScore = scoresMap.get(wordId);

      // Calculate new values
      const newSuccessCount =
        (existingScore?.success_count || 0) + (isCorrect ? 1 : 0);
      const newFailCount =
        (existingScore?.fail_count || 0) + (isCorrect ? 0 : 1);

      // Streak logic: increment if correct, reset to 0 if incorrect
      const currentStreak = existingScore?.correct_streak || 0;
      const newStreak = isCorrect ? currentStreak + 1 : 0;

      // Check if word just became learned (hit streak threshold)
      const wasLearned = existingScore?.learned_at != null;
      const justLearned = !wasLearned && newStreak >= STREAK_TO_LEARN;
      const learnedAt = wasLearned
        ? existingScore.learned_at
        : justLearned
        ? new Date().toISOString()
        : null;

      const scoreUpdate = {
        user_id: profile.id,
        word_id: wordId,
        language_code: targetLanguage,
        success_count: newSuccessCount,
        fail_count: newFailCount,
        correct_streak: newStreak,
        learned_at: learnedAt,
        last_practiced: new Date().toISOString(),
      };

      // Update in database
      await supabase.from('word_scores').upsert(scoreUpdate, {
        onConflict: 'user_id,word_id',
      });

      // Update local state
      setScoresMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(wordId, scoreUpdate as WordScore);
        return newMap;
      });

      // Trigger celebration when word is mastered (5 correct in a row)
      if (justLearned) {
        const word = deck.find((w) => w.id === wordId);
        setCelebrationWord(word?.word || null);
        setShowStreakCelebration(true);
        sounds.play('perfect');
        haptics.trigger('tier-up');
        setTimeout(() => {
          setShowStreakCelebration(false);
          setCelebrationWord(null);
        }, 3000);
      }

      return { justLearned, newStreak };
    },
    [scoresMap, profile.id, targetLanguage, deck]
  );

  const getWordStreak = useCallback(
    (wordId: string): number => {
      const score = scoresMap.get(wordId);
      return score?.correct_streak || 0;
    },
    [scoresMap]
  );

  const isWordLearned = useCallback(
    (wordId: string): boolean => {
      const score = scoresMap.get(wordId);
      return score?.learned_at != null;
    },
    [scoresMap]
  );

  // Computed word lists
  const masteredWords = useMemo(
    () => deck.filter((w) => scoresMap.get(w.id)?.learned_at != null),
    [deck, scoresMap]
  );

  const unlearnedWords = useMemo(
    () => deck.filter((w) => !scoresMap.get(w.id)?.learned_at),
    [deck, scoresMap]
  );

  const weakestWords = useMemo(
    () =>
      unlearnedWords.filter((w) => {
        const score = scoresMap.get(w.id);
        return score && (score.fail_count > 0 || (score.correct_streak || 0) < 3);
      }),
    [unlearnedWords, scoresMap]
  );

  return {
    scores,
    scoresMap,
    loading,
    updateWordScore,
    getWordStreak,
    isWordLearned,
    masteredWords,
    unlearnedWords,
    weakestWords,
    refreshScores: fetchScores,
    showStreakCelebration,
    celebrationWord,
  };
}

export default useScoreTracking;
