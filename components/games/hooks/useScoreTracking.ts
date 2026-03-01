import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { geminiService } from '../../../services/gemini';
import { Profile, DictionaryEntry, WordScore } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { sounds } from '../../../services/sounds';
import { haptics } from '../../../services/haptics';
import { analytics } from '../../../services/analytics';
import { useOffline } from '../../../hooks/useOffline';

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
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [celebrationWord, setCelebrationWord] = useState<string | null>(null);

  // Track mounted state to prevent setState after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Use ref for scoresMap to keep updateWordScore callback more stable
  const scoresMapRef = useRef(scoresMap);
  useEffect(() => {
    scoresMapRef.current = scoresMap;
  }, [scoresMap]);

  // Create deck map for O(1) word lookup
  const deckMap = useMemo(
    () => new Map(deck.map((w) => [w.id, w])),
    [deck]
  );

  const { targetLanguage } = useLanguage();
  const {
    isOnline,
    cacheWordScores,
    getCachedWordScores,
    updateCachedWordScore,
    queueScoreUpdate,
  } = useOffline(profile.id, targetLanguage);

  // Determine which user's scores to load
  const targetUserId =
    profile.role === 'tutor' && profile.linked_user_id
      ? profile.linked_user_id
      : profile.id;

  const fetchScores = useCallback(async () => {
    setLoading(true);

    try {
      // Offline: load from IndexedDB cache
      if (!isOnline) {
        const cachedScores = await getCachedWordScores();
        if (cachedScores.length > 0 && mountedRef.current) {
          const map = new Map<string, WordScore>();
          cachedScores.forEach(s => map.set(s.word_id, s));
          setScoresMap(map);
        }
        if (mountedRef.current) setLoading(false);
        return;
      }

      const { data: scoreData, error } = await supabase
        .from('word_scores')
        .select('*, dictionary:word_id(word, translation)')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage);

      if (error) {
        console.error('Error fetching scores:', error);
      } else if (scoreData && mountedRef.current) {
        const map = new Map<string, WordScore>();
        scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
        setScoresMap(map);
        // Cache for offline use
        await cacheWordScores(scoreData as WordScore[]);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    }

    if (mountedRef.current) {
      setLoading(false);
    }
  }, [targetUserId, targetLanguage, isOnline, getCachedWordScores, cacheWordScores]);

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
      // Use ref for lookup to avoid stale closure issues
      const existingScore = scoresMapRef.current.get(wordId);

      // Calculate new values - using correct DB column names
      const newTotalAttempts = (existingScore?.total_attempts || 0) + 1;
      const newCorrectAttempts =
        (existingScore?.correct_attempts || 0) + (isCorrect ? 1 : 0);

      // Streak logic: increment if correct, reset to 0 if incorrect
      const currentStreak = existingScore?.correct_streak || 0;
      const newStreak = isCorrect ? currentStreak + 1 : 0;

      // Track streak milestones (every 5 correct in a row) to avoid high-frequency spam
      if (isCorrect && newStreak >= STREAK_TO_LEARN && newStreak % STREAK_TO_LEARN === 0) {
        analytics.track('streak_maintained', { streak_count: newStreak, activity_type: 'word_practice' });
      } else if (!isCorrect && currentStreak >= STREAK_TO_LEARN) {
        analytics.track('streak_broken', { streak_count: currentStreak, previous_streak_count: currentStreak });
      }

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
        total_attempts: newTotalAttempts,
        correct_attempts: newCorrectAttempts,
        correct_streak: newStreak,
        learned_at: learnedAt,
      };

      if (isOnline) {
        // Update in database
        await supabase.from('word_scores').upsert(scoreUpdate, {
          onConflict: 'user_id,word_id',
        });
      } else {
        // Queue for sync when back online + update local cache
        await queueScoreUpdate({
          userId: profile.id,
          wordId,
          languageCode: targetLanguage,
          totalAttempts: newTotalAttempts,
          correctAttempts: newCorrectAttempts,
          correctStreak: newStreak,
          learnedAt: learnedAt,
        });
        await updateCachedWordScore(scoreUpdate as WordScore);
      }

      // Update local state (only if still mounted)
      if (mountedRef.current) {
        setScoresMap((prev) => {
          const newMap = new Map(prev);
          newMap.set(wordId, scoreUpdate as WordScore);
          return newMap;
        });
      }

      // Trigger celebration when word is mastered (5 correct in a row)
      if (justLearned && mountedRef.current) {
        const word = deckMap.get(wordId); // O(1) lookup instead of O(n)
        setCelebrationWord(word?.word || null);
        setShowStreakCelebration(true);
        sounds.play('perfect');
        haptics.trigger('tier-up');
        // Award XP for mastering a word
        geminiService.incrementXP(1);
        setTimeout(() => {
          // Check mounted before setState to prevent memory leak
          if (mountedRef.current) {
            setShowStreakCelebration(false);
            setCelebrationWord(null);
          }
        }, 3000);
      }

      return { justLearned, newStreak };
    },
    [profile.id, targetLanguage, deckMap, isOnline] // Removed scoresMap - using ref instead
  );

  const getWordStreak = useCallback(
    (wordId: string): number => {
      const score = scoresMapRef.current.get(wordId);
      return score?.correct_streak || 0;
    },
    [] // Stable - uses ref
  );

  const isWordLearned = useCallback(
    (wordId: string): boolean => {
      const score = scoresMapRef.current.get(wordId);
      return score?.learned_at != null;
    },
    [] // Stable - uses ref
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
        const incorrectAttempts = score ? (score.total_attempts || 0) - (score.correct_attempts || 0) : 0;
        return score && (incorrectAttempts > 0 || (score.correct_streak || 0) < 3);
      }),
    [unlearnedWords, scoresMap]
  );

  return {
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
