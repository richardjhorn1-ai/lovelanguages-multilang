import React, { Suspense, lazy, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordScore, TutorChallenge, WordRequest } from '../types';
import { getLevelFromXP, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS } from '../constants/language-config';
import { shuffleArray } from '../utils/array';
import { isCorrectAnswer, validateAnswerSmart } from '../utils/answer-helpers';
// Romantic phrases handled by AIChallenge component
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../services/sounds';
import { haptics } from '../services/haptics';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';
import TutorGames from './TutorGames';
import ErrorBoundary from './ErrorBoundary';
import { StreakCelebrationModal } from './games/components';
import type { DojoSessionResult } from './games/modes/VerbDojo/types';
import { analytics } from '../services/analytics';
import { apiFetch, readJsonResponse } from '../services/api-config';
import { fetchPartnerProfileView } from '../services/partner-profile';
import PlayHub, { PlayHubItem } from './play/PlayHub';

interface FlashcardGameProps {
  profile: Profile;
  isActive?: boolean;
}

type LocalGameType = 'flashcards' | 'multiple_choice' | 'type_it' | 'wordle' | 'speed_match' | 'quick_fire' | 'ai_challenge' | 'verb_mastery' | null;
type VerbTense = 'present' | 'past' | 'future';

// VerbDojo is now language-aware - handles conjugation persons internally

interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it';
  isCorrect: boolean;
  explanation?: string;
}

const STREAK_TO_LEARN = 5; // Number of consecutive correct answers to mark as learned
const DICTIONARY_FETCH_LIMIT = 1200;
const WORD_SCORE_FETCH_LIMIT = 2000;

const GameResults = lazy(() => import('./games/GameResults'));
const Flashcards = lazy(() => import('./games/modes/Flashcards').then(module => ({ default: module.Flashcards })));
const MultipleChoice = lazy(() => import('./games/modes/MultipleChoice').then(module => ({ default: module.MultipleChoice })));
const TypeIt = lazy(() => import('./games/modes/TypeIt').then(module => ({ default: module.TypeIt })));
const Wordle = lazy(() => import('./games/modes/Wordle').then(module => ({ default: module.Wordle })));
const SpeedMatch = lazy(() => import('./games/modes/SpeedMatch').then(module => ({ default: module.SpeedMatch })));
const QuickFire = lazy(() => import('./games/modes/QuickFire').then(module => ({ default: module.QuickFire })));
const AIChallenge = lazy(() => import('./games/modes/AIChallenge').then(module => ({ default: module.AIChallenge })));
const VerbDojo = lazy(() => import('./games/modes/VerbDojo').then(module => ({ default: module.VerbDojo })));
const PlayQuizChallenge = lazy(() => import('./PlayQuizChallenge'));
const PlayQuickFireChallenge = lazy(() => import('./PlayQuickFireChallenge'));
const WordGiftLearning = lazy(() => import('./WordGiftLearning'));
const ConversationPractice = lazy(() => import('./ConversationPractice'));
const LimitReachedModal = lazy(() => import('./LimitReachedModal'));

const InlinePlayLoader: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="glass-card rounded-[28px] min-h-[260px] flex items-center justify-center p-6 text-center text-[var(--text-secondary)] font-bold">
    {label}
  </div>
);

const ModalPlayLoader: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
    <div className="glass-card-solid rounded-3xl px-6 py-5 text-center text-[var(--text-secondary)] font-bold shadow-xl">
      {label}
    </div>
  </div>
);

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile, isActive = true }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [scores, setScores] = useState<WordScore[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Love Notes (partner challenges) state
  const [pendingChallenges, setPendingChallenges] = useState<TutorChallenge[]>([]);
  const [pendingWordRequests, setPendingWordRequests] = useState<WordRequest[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [activeChallenge, setActiveChallenge] = useState<TutorChallenge | null>(null);
  const [activeWordRequest, setActiveWordRequest] = useState<WordRequest | null>(null);

  const [localGameType, setLocalGameType] = useState<LocalGameType>(null);
  const [showConversationPractice, setShowConversationPractice] = useState(false);

  const [finished, setFinished] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, incorrect: 0 });

  // Game session tracking — refs alongside state to avoid stale closures in completion handlers
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const sessionAnswersRef = useRef<GameSessionAnswer[]>([]);
  const sessionScoreRef = useRef({ correct: 0, incorrect: 0 });
  const [sessionStartTime] = useState<number>(Date.now());

  // Streak tracking for current word
  const [currentWordStreak, setCurrentWordStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Note: Flashcard, Multiple Choice, Type It state now managed by extracted components

  // AI Challenge state (component manages most state internally)
  const [challengeStarted, setChallengeStarted] = useState(false); // Used for exit confirmation

  // Quick Fire state (most managed by extracted component)
  const [quickFireStarted, setQuickFireStarted] = useState(false); // Used for exit confirmation
  const [speedMatchStarted, setSpeedMatchStarted] = useState(false); // Used for exit confirmation
  const [speedMatchProgress, setSpeedMatchProgress] = useState({ completed: 0, total: 1 });
  const [wordleStarted, setWordleStarted] = useState(false); // Used for exit confirmation
  const [showIncorrectShake, setShowIncorrectShake] = useState(false);

  // Verb Mastery state (most managed by extracted component)
  const [verbMasteryStarted, setVerbMasteryStarted] = useState(false); // Used for exit confirmation

  // Rate limit / free tier state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useBasicValidation, setUseBasicValidation] = useState(false);

  // Deferred deck refresh — set when dictionary-updated fires during an active game
  const pendingDeckRefreshRef = useRef(false);
  const fetchDataInFlightRef = useRef<string | null>(null);

  // Level styling
  const levelInfo = useMemo(() => getLevelFromXP(profile.xp || 0), [profile.xp]);
  const tierColor = useMemo(() => getTierColor(levelInfo.tier), [levelInfo.tier]);

  // Theme
  const { accentHex } = useTheme();

  // Language
  const { targetLanguage, targetName, nativeLanguage, nativeName, languageParams } = useLanguage();

  // Normalize smart_validation (undefined defaults to true)
  const smartValidation = profile.smart_validation ?? true;

  // i18n
  const { t } = useTranslation();

  // Offline mode
  const {
    isOnline, isSyncing, cacheVocabulary, getCachedVocabulary, cachedWordCount, lastSyncTime,
    cacheWordScores, getCachedWordScores, updateCachedWordScore,
    queueScoreUpdate, queueGameSession, pendingCount: offlinePendingCount,
  } = useOffline(profile.id, targetLanguage);

  // Challenge modes with translations (moved from module level to use t())
  const challengeModes = useMemo(() => [
    { id: 'weakest' as const, name: t('play.aiChallenge.modes.weakest'), description: t('play.aiChallenge.modes.weakestDesc'), icon: 'Target' as const },
    { id: 'gauntlet' as const, name: t('play.aiChallenge.modes.gauntlet'), description: t('play.aiChallenge.modes.gauntletDesc'), icon: 'Shuffle' as const },
    { id: 'romantic' as const, name: t('play.aiChallenge.modes.romantic'), description: t('play.aiChallenge.modes.romanticDesc', { language: targetName }), icon: 'Heart' as const },
    { id: 'least_practiced' as const, name: t('play.aiChallenge.modes.leastPracticed'), description: t('play.aiChallenge.modes.leastPracticedDesc'), icon: 'Clock' as const },
    { id: 'review_mastered' as const, name: t('play.aiChallenge.modes.reviewMastered'), description: t('play.aiChallenge.modes.reviewMasteredDesc'), icon: 'Trophy' as const }
  ], [t, targetName]);

  // Tutor dashboard data (computed unconditionally to follow Rules of Hooks)
  const masteredWords = useMemo(() =>
    deck.filter(w => scoresMap.get(w.id)?.learned_at != null),
    [deck, scoresMap]
  );

  const recentWords = useMemo(() => {
    return [...deck]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [deck]);

  const encouragementPrompts = useMemo(() => {
    const prompts: Array<{ icon: React.ReactNode; message: string; color: string }> = [];
    const masteredCount = masteredWords.length;
    const weakCount = scores.filter(s => (s.total_attempts || 0) > (s.correct_attempts || 0)).length;

    if (masteredCount >= 10) {
      prompts.push({ icon: <ICONS.Trophy className="w-5 h-5" />, message: `${masteredCount} words mastered! Time for a celebration date!`, color: 'text-[var(--color-warning)]' });
    }
    if (weakCount > 0 && weakCount <= 3) {
      prompts.push({ icon: <ICONS.TrendingUp className="w-5 h-5" />, message: `Just ${weakCount} words need work - you can quiz them tonight!`, color: 'text-[var(--accent-color)]' });
    }
    if (deck.length >= 5 && deck.length % 5 === 0) {
      prompts.push({ icon: <ICONS.Trophy className="w-5 h-5" />, message: `${deck.length} words in their vocabulary - celebrate this milestone!`, color: 'text-[var(--accent-color)]' });
    }
    if (recentWords.length > 0) {
      prompts.push({ icon: <ICONS.Sparkles className="w-5 h-5" />, message: `They just learned "${recentWords[0].word}" - use it in conversation today!`, color: 'text-[var(--secondary-color)]' });
    }
    return prompts.slice(0, 2);
  }, [masteredWords, scores, deck, recentWords]);

  useEffect(() => {
    if (!isActive) return;
    fetchData();
  }, [profile, targetLanguage, isActive]);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    if (!isActive) return;
    const handleLanguageSwitch = () => {
      fetchData();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, [isActive]);

  // Listen for dictionary updates (words added via Chat, Word Gifts, etc.)
  // Defer refresh if a game is in progress to avoid breaking the active session
  useEffect(() => {
    const handler = () => {
      if (!isActive) {
        pendingDeckRefreshRef.current = true;
        return;
      }
      if (localGameType !== null) {
        pendingDeckRefreshRef.current = true;
        return;
      }
      fetchData();
    };
    window.addEventListener('dictionary-updated', handler as EventListener);
    return () => window.removeEventListener('dictionary-updated', handler as EventListener);
  }, [localGameType, isActive]);

  // Flush deferred refresh when returning to game selection
  useEffect(() => {
    if (!isActive) return;
    if (localGameType === null && pendingDeckRefreshRef.current) {
      pendingDeckRefreshRef.current = false;
      fetchData();
    }
  }, [localGameType, isActive]);

  // Note: MC options and TypeIt questions now generated by extracted components

  const fetchData = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id)
      ? profile.linked_user_id
      : profile.id;
    const fetchKey = `${targetUserId}:${targetLanguage}:${profile.role}:${isOnline ? 'online' : 'offline'}`;

    if (fetchDataInFlightRef.current === fetchKey) {
      return;
    }

    fetchDataInFlightRef.current = fetchKey;
    setLoading(true);
    try {
      // If offline, try to use cached data
      if (!isOnline) {
        const cachedData = await getCachedVocabulary();
        if (cachedData && cachedData.length > 0) {
          setDeck(shuffleArray(cachedData));
        }
        const cachedScores = await getCachedWordScores();
        if (cachedScores.length > 0) {
          setScores(cachedScores);
          const map = new Map<string, WordScore>();
          cachedScores.forEach(s => map.set(s.word_id, s));
          setScoresMap(map);
        }
        return;
      }

      const { data: dictData } = await supabase
        .from('dictionary')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage)
        .order('created_at', { ascending: false })
        .limit(DICTIONARY_FETCH_LIMIT);

      if (dictData) {
        setDeck(shuffleArray(dictData));
        await cacheVocabulary(dictData);
      }

      const { data: scoreData } = await supabase
        .from('word_scores')
        .select('*, dictionary:word_id(word, translation)')
        .eq('user_id', targetUserId)
        .eq('language_code', targetLanguage)
        .order('updated_at', { ascending: false })
        .limit(WORD_SCORE_FETCH_LIMIT);

      if (scoreData) {
        setScores(scoreData as WordScore[]);
        const map = new Map<string, WordScore>();
        scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
        setScoresMap(map);
        await cacheWordScores(scoreData as WordScore[]);
      }

      // Fetch pending challenges and word requests for students
      if (profile.role === 'student') {
        await fetchPendingItems();
      }
    } finally {
      fetchDataInFlightRef.current = null;
      setLoading(false);
    }
  };

  const fetchPendingItems = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Get partner name
      if (profile.linked_user_id) {
        try {
          const partner = await fetchPartnerProfileView();
          if (partner?.full_name) setPartnerName(partner.full_name);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Partner profile view unavailable, continuing without shared partner details.', error);
          }
        }
      }

      // Fetch pending challenges
      const challengeRes = await apiFetch('/api/get-challenges/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams }),
        __llErrorContext: {
          screen: 'play_hub',
          userAction: 'load_pending_challenges',
          suppressErrorTracking: true,
          treat4xxAsError: false,
        },
      });
      const challengeData = await readJsonResponse<{ challenges?: TutorChallenge[] }>(challengeRes);
      if (challengeData?.challenges) {
        setPendingChallenges(challengeData.challenges);
      } else {
        setPendingChallenges([]);
      }

      // Fetch pending word requests
      const requestRes = await apiFetch('/api/get-word-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams }),
        __llErrorContext: {
          screen: 'play_hub',
          userAction: 'load_pending_word_requests',
          suppressErrorTracking: true,
          treat4xxAsError: false,
        },
      });
      const requestData = await readJsonResponse<{ wordRequests?: WordRequest[] }>(requestRes);
      if (requestData?.wordRequests) {
        setPendingWordRequests(requestData.wordRequests);
      } else {
        setPendingWordRequests([]);
      }
    } catch (error) {
      setPendingChallenges([]);
      setPendingWordRequests([]);
      if (import.meta.env.DEV) {
        console.warn('Play hub pending items unavailable, falling back to empty shared state.', error);
      }
    }
  };

  const handleChallengeComplete = () => {
    setActiveChallenge(null);
    fetchPendingItems();
    fetchData();
  };

  const handleWordRequestComplete = () => {
    setActiveWordRequest(null);
    fetchPendingItems();
    fetchData();
  };

  // Helper to update score with proper streak tracking
  const updateWordScore = async (wordId: string, isCorrect: boolean) => {
    const existingScore = scoresMap.get(wordId);

    // Calculate new values - using correct DB column names
    const newTotalAttempts = (existingScore?.total_attempts || 0) + 1;
    const newCorrectAttempts = (existingScore?.correct_attempts || 0) + (isCorrect ? 1 : 0);

    // Streak logic: increment if correct, reset to 0 if incorrect
    const currentStreak = existingScore?.correct_streak || 0;
    const newStreak = isCorrect ? currentStreak + 1 : 0;

    // Check if word just became learned (hit streak threshold)
    const wasLearned = existingScore?.learned_at != null;
    const justLearned = !wasLearned && newStreak >= STREAK_TO_LEARN;
    const learnedAt = wasLearned
      ? existingScore.learned_at
      : (justLearned ? new Date().toISOString() : null);

    const scoreUpdate = {
      user_id: profile.id,
      word_id: wordId,
      language_code: targetLanguage,
      total_attempts: newTotalAttempts,
      correct_attempts: newCorrectAttempts,
      correct_streak: newStreak,
      learned_at: learnedAt
    };

    if (isOnline) {
      await supabase.from('word_scores').upsert(scoreUpdate, {
        onConflict: 'user_id,word_id'
      });
    } else {
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

    // Update local state
    setScoresMap(prev => {
      const newMap = new Map(prev);
      newMap.set(wordId, scoreUpdate as WordScore);
      return newMap;
    });

    // Update UI streak tracking
    setCurrentWordStreak(newStreak);

    // Trigger celebration when word is mastered (5 correct in a row)
    if (justLearned) {
      setShowStreakCelebration(true);
      sounds.play('perfect');
      sounds.play('xp-gain');
      haptics.trigger('tier-up');
      setTimeout(() => setShowStreakCelebration(false), 3000);
      // Award 1 XP for mastering a word
      geminiService.incrementXP(1);
    }

    return { justLearned, newStreak };
  };

  // Trigger shake animation for incorrect answers
  const triggerIncorrectFeedback = () => {
    setShowIncorrectShake(true);
    setTimeout(() => setShowIncorrectShake(false), 500);
  };

  // Get streak for current word from scores
  const getCurrentWordStreak = (wordId: string): number => {
    const score = scoresMap.get(wordId);
    return score?.correct_streak || 0;
  };

  // Update current word streak when word changes
  useEffect(() => {
    if (deck.length > 0 && currentIndex < deck.length) {
      const wordId = deck[currentIndex]?.id;
      if (wordId) {
        setCurrentWordStreak(getCurrentWordStreak(wordId));
      }
    }
  }, [currentIndex, deck, scoresMap]);

  // Save game session to database
  const saveGameSession = async (gameMode: string, answers: GameSessionAnswer[], correct: number, incorrect: number) => {
    try {
      const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      if (!isOnline) {
        await queueGameSession({
          userId: profile.id,
          gameMode,
          correctCount: correct,
          incorrectCount: incorrect,
          totalTimeSeconds,
          answers,
          targetLanguage,
          nativeLanguage,
        });
        return;
      }

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const response = await apiFetch('/api/submit-game-session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameMode,
          correctCount: correct,
          incorrectCount: incorrect,
          totalTimeSeconds,
          answers,
          ...languageParams
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.xpAwarded > 0) {
          sounds.play('xp-gain');
          haptics.trigger('xp-gain');
        }

        // Fire first_game_played milestone event (once per user lifetime)
        if ((window as any).__milestones?.needsFirstGame) {
          analytics.track('first_game_played', { game_type: gameMode });
          (window as any).__milestones.needsFirstGame = false;
        }
      }
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  };

  // Reset functions for extracted components
  const resetChallenge = useCallback(() => {
    setChallengeStarted(false);
  }, []);

  const resetSpeedMatch = useCallback(() => {
    setSpeedMatchStarted(false);
    setSpeedMatchProgress({ completed: 0, total: 1 });
  }, []);

  // Start a local game from the game selection grid
  const startLocalGame = (gameType: LocalGameType) => {
    setLocalGameType(gameType);
    if (gameType) {
      setCurrentIndex(0);
      setFinished(false);
      setSessionScore({ correct: 0, incorrect: 0 });
      setSessionAnswers([]);
      setDeck(shuffleArray([...deck]));
      // Track game start for completion rate analytics
      analytics.trackGameStarted({ game_type: gameType, word_count: deck.length });
      // Note: QuickFire and VerbMastery components manage their own internal state
    }
  };

  // Check if game is in progress (has started answering questions)
  const isGameInProgress = localGameType !== null && !finished && (
    challengeStarted || quickFireStarted || speedMatchStarted || wordleStarted || verbMasteryStarted ||
    currentIndex > 0 || sessionScore.correct > 0 || sessionScore.incorrect > 0
  );

  // Return to game selection grid (with confirmation if game in progress)
  const handleExitRequest = () => {
    if (isGameInProgress) {
      setShowExitConfirm(true);
    } else {
      exitLocalGame();
    }
  };

  const exitLocalGame = () => {
    setShowExitConfirm(false);
    setLocalGameType(null);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    resetChallenge();
    resetSpeedMatch();
    resetQuickFire();
    resetWordle();
    resetVerbMastery();
  };

  // Quick Fire reset (component manages its own internal state)
  const resetQuickFire = () => {
    setQuickFireStarted(false);
  };

  // Helper to get context data from entry columns (new schema)
  const getEntryContext = (entry: DictionaryEntry) => {
    return {
      conjugations: entry.conjugations || null,
      gender: entry.gender || null,
      plural: entry.plural || null,
      adjectiveForms: entry.adjective_forms || null,
      proTip: entry.pro_tip || null,
      example: entry.example_sentence || null
    };
  };

  // Verb Mastery functions
  const verbsWithConjugations = useMemo(() => {
    return deck.filter(w => {
      if (w.word_type !== 'verb') return false;
      return (w.conjugations as any)?.present;
    }).map(w => ({
      ...w,
      conjugations: w.conjugations
    }));
  }, [deck]);

  const wordleEligibleWords = useMemo(() => {
    const seen = new Set<string>();

    return deck.filter((entry) => {
      const normalizedWord = entry.word.trim().normalize('NFC');
      if (!/^\p{L}+$/u.test(normalizedWord)) return false;

      let letters: string[];
      let key: string;
      try {
        letters = Array.from(normalizedWord).map((char) => char.toLocaleLowerCase(targetLanguage));
        key = normalizedWord.toLocaleLowerCase(targetLanguage);
      } catch {
        letters = Array.from(normalizedWord).map((char) => char.toLocaleLowerCase());
        key = normalizedWord.toLocaleLowerCase();
      }

      if (letters.length < 4 || letters.length > 8 || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [deck, targetLanguage]);

  // Verb Mastery reset (component manages its own internal state)
  const resetVerbMastery = () => {
    setVerbMasteryStarted(false);
  };

  const resetWordle = () => {
    setWordleStarted(false);
  };

  // Exit confirmation when game is in progress
  useEffect(() => {
    const isGameInProgress = localGameType !== null && !finished && (
      challengeStarted || quickFireStarted || speedMatchStarted || wordleStarted || verbMasteryStarted ||
      currentIndex > 0 || sessionScore.correct > 0 || sessionScore.incorrect > 0
    );

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameInProgress) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but this triggers the dialog
        e.returnValue = '';
        return '';
      }
    };

    if (isGameInProgress) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [localGameType, finished, challengeStarted, quickFireStarted, speedMatchStarted, wordleStarted, verbMasteryStarted, currentIndex, sessionScore]);

  // Generic callbacks for extracted game mode components (memoized for performance)
  const handleGameAnswer = useCallback(async (result: { wordId?: string; wordText: string; correctAnswer: string; userAnswer?: string; questionType: 'flashcard' | 'multiple_choice' | 'type_it'; isCorrect: boolean }) => {
    // Play feedback - only play sound for correct answers (no negative sounds)
    if (result.isCorrect) {
      sounds.play('correct');
      haptics.trigger('correct');
    }

    // Visual shake for incorrect
    if (!result.isCorrect) {
      triggerIncorrectFeedback();
    }

    // Record answer — update both state (for UI) and refs (for stale-closure-safe access)
    const answer: GameSessionAnswer = {
      wordId: result.wordId,
      wordText: result.wordText,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      questionType: result.questionType,
      isCorrect: result.isCorrect
    };
    const newAnswers = [...sessionAnswersRef.current, answer];
    const newScore = {
      correct: sessionScoreRef.current.correct + (result.isCorrect ? 1 : 0),
      incorrect: sessionScoreRef.current.incorrect + (result.isCorrect ? 0 : 1)
    };
    sessionAnswersRef.current = newAnswers;
    sessionScoreRef.current = newScore;
    setSessionAnswers(newAnswers);
    setSessionScore(newScore);

    // Update word score with streak tracking
    if (result.wordId) {
      await updateWordScore(result.wordId, result.isCorrect);
    }
  }, [triggerIncorrectFeedback, updateWordScore]);

  const handleGameNext = useCallback(() => {
    setCurrentIndex(c => c + 1);
  }, []);

  // Pre-computed game complete handlers — read from refs to avoid stale closures
  const gameCompleteHandlers = useMemo(() => ({
    flashcards: () => {
      const score = sessionScoreRef.current;
      const answers = sessionAnswersRef.current;
      if (score.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('flashcards', answers, score.correct, score.incorrect);
      analytics.trackGameCompleted({ game_type: 'flashcards', word_count: deck.length, score: score.correct, correct: score.incorrect === 0, accuracy: Math.round((score.correct / Math.max(score.correct + score.incorrect, 1)) * 100) });
    },
    multiple_choice: () => {
      const score = sessionScoreRef.current;
      const answers = sessionAnswersRef.current;
      if (score.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('multiple_choice', answers, score.correct, score.incorrect);
      analytics.trackGameCompleted({ game_type: 'multiple_choice', word_count: deck.length, score: score.correct, correct: score.incorrect === 0, accuracy: Math.round((score.correct / Math.max(score.correct + score.incorrect, 1)) * 100) });
    },
    type_it: () => {
      const score = sessionScoreRef.current;
      const answers = sessionAnswersRef.current;
      if (score.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('type_it', answers, score.correct, score.incorrect);
      analytics.trackGameCompleted({ game_type: 'type_it', word_count: deck.length, score: score.correct, correct: score.incorrect === 0, accuracy: Math.round((score.correct / Math.max(score.correct + score.incorrect, 1)) * 100) });
    },
    wordle: () => {
      const score = sessionScoreRef.current;
      const answers = sessionAnswersRef.current;
      if (score.incorrect === 0 && score.correct > 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('wordle', answers, score.correct, score.incorrect);
      analytics.trackGameCompleted({ game_type: 'wordle', word_count: answers.length, score: score.correct, correct: score.incorrect === 0, accuracy: Math.round((score.correct / Math.max(score.correct + score.incorrect, 1)) * 100) });
    },
  }), [saveGameSession, deck.length]);

  // TypeIt validation wrapper (memoized)
  const handleTypeItValidation = useCallback(async (
    userAnswer: string,
    correctAnswer: string,
    context: { word: DictionaryEntry; direction: 'target_to_native' | 'native_to_target' }
  ): Promise<{ accepted: boolean; explanation: string }> => {
    if (smartValidation && !useBasicValidation) {
      const result = await validateAnswerSmart(userAnswer, correctAnswer, {
        targetWord: context.word.word,
        wordType: context.word.word_type,
        direction: context.direction,
        languageParams
      });
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
      return { accepted: result.accepted, explanation: result.explanation };
    }
    const accepted = isCorrectAnswer(userAnswer, correctAnswer);
    return { accepted, explanation: '' };
  }, [smartValidation, useBasicValidation, languageParams]);

  // QuickFire handlers (memoized)
  const handleQuickFireStart = useCallback(() => {
    setQuickFireStarted(true);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
  }, []);

  const handleSpeedMatchStart = useCallback((totalWords: number) => {
    setSpeedMatchStarted(true);
    setSpeedMatchProgress({ completed: 0, total: Math.max(totalWords, 1) });
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
  }, []);

  const handleSpeedMatchProgress = useCallback((completed: number, total: number) => {
    setSpeedMatchProgress({ completed, total: Math.max(total, 1) });
  }, []);

  const handleSpeedMatchComplete = useCallback((results: {
    answers: GameSessionAnswer[];
    score: { correct: number; incorrect: number };
    totalWords: number;
    elapsedMs: number;
  }) => {
    if (results.score.incorrect === 0 && results.score.correct > 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setSpeedMatchProgress({ completed: results.totalWords, total: Math.max(results.totalWords, 1) });
    setSessionScore(results.score);
    setSessionAnswers(results.answers);
    setFinished(true);
    saveGameSession('speed_match', results.answers, results.score.correct, results.score.incorrect);
    analytics.trackGameCompleted({
      game_type: 'speed_match',
      word_count: results.totalWords,
      score: results.score.correct,
      correct: results.score.incorrect === 0,
      accuracy: Math.round((results.score.correct / Math.max(results.score.correct + results.score.incorrect, 1)) * 100),
    });
  }, [saveGameSession]);

  const handleQuickFireComplete = useCallback((results: {
    answers: (GameSessionAnswer & { explanation?: string })[];
    score: { correct: number; incorrect: number };
    timeRemaining: number;
  }) => {
    if (results.score.incorrect === 0 && results.score.correct > 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setSessionScore(results.score);
    setSessionAnswers(results.answers);
    setFinished(true);
    saveGameSession('quick_fire', results.answers, results.score.correct, results.score.incorrect);
    analytics.trackGameCompleted({ game_type: 'quick_fire', word_count: results.answers.length, score: results.score.correct, correct: results.score.incorrect === 0, accuracy: Math.round((results.score.correct / Math.max(results.score.correct + results.score.incorrect, 1)) * 100) });
  }, [saveGameSession]);

  const handleWordleComplete = useCallback((results: {
    answers: GameSessionAnswer[];
    score: { correct: number; incorrect: number };
  }) => {
    if (results.score.incorrect === 0 && results.score.correct > 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setSessionScore(results.score);
    setSessionAnswers(results.answers);
    setFinished(true);
    saveGameSession('wordle', results.answers, results.score.correct, results.score.incorrect);
    analytics.trackGameCompleted({ game_type: 'wordle', word_count: results.answers.length, score: results.score.correct, correct: results.score.incorrect === 0, accuracy: Math.round((results.score.correct / Math.max(results.score.correct + results.score.incorrect, 1)) * 100) });
  }, [saveGameSession]);

  const handleQuickFireValidation = useCallback(async (
    userAnswer: string,
    correctAnswer: string,
    word: DictionaryEntry
  ): Promise<{ accepted: boolean; explanation: string }> => {
    if (smartValidation && !useBasicValidation) {
      const result = await validateAnswerSmart(userAnswer, correctAnswer, {
        targetWord: word.word,
        wordType: word.word_type,
        direction: 'target_to_native',
        languageParams
      });
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
      return { accepted: result.accepted, explanation: result.explanation };
    }
    const accepted = isCorrectAnswer(userAnswer, correctAnswer);
    return { accepted, explanation: '' };
  }, [smartValidation, useBasicValidation, languageParams]);

  // VerbMastery handlers (memoized)
  const handleVerbMasteryComplete = useCallback((result: DojoSessionResult) => {
    if (result.wrong === 0 && result.correct > 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setSessionScore({ correct: result.correct, incorrect: result.wrong });
    setSessionAnswers([]);
    setFinished(true);
    saveGameSession('verb_mastery', [], result.correct, result.wrong);
    analytics.trackGameCompleted({ game_type: 'verb_mastery', word_count: result.totalQuestions, score: result.correct, correct: result.wrong === 0, accuracy: Math.round((result.correct / Math.max(result.totalQuestions, 1)) * 100) });
  }, [saveGameSession]);

  const handleVerbMasteryValidation = useCallback(async (
    userAnswer: string,
    correctAnswer: string,
    context: { verb: DictionaryEntry; tense: 'present' | 'past' | 'future'; person: string }
  ): Promise<{ accepted: boolean; explanation: string }> => {
    if (smartValidation && !useBasicValidation) {
      const result = await validateAnswerSmart(userAnswer, correctAnswer, {
        targetWord: context.verb.word,
        wordType: 'verb',
        direction: 'native_to_target',
        languageParams
      });
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
      return { accepted: result.accepted, explanation: result.explanation };
    }
    const accepted = isCorrectAnswer(userAnswer, correctAnswer);
    return { accepted, explanation: '' };
  }, [smartValidation, useBasicValidation, languageParams]);

  // AIChallenge handlers (memoized)
  const handleAIChallengeComplete = useCallback((results: {
    answers: (GameSessionAnswer & { explanation?: string })[];
    score: { correct: number; incorrect: number };
  }) => {
    if (results.score.incorrect === 0 && results.score.correct > 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setSessionScore(results.score);
    setSessionAnswers(results.answers);
    setFinished(true);
    saveGameSession('ai_challenge', results.answers, results.score.correct, results.score.incorrect);
    analytics.trackGameCompleted({ game_type: 'ai_challenge', word_count: results.answers.length, score: results.score.correct, correct: results.score.incorrect === 0, accuracy: Math.round((results.score.correct / Math.max(results.score.correct + results.score.incorrect, 1)) * 100) });
  }, [saveGameSession]);

  const handleAIChallengeValidation = useCallback(async (
    userAnswer: string,
    correctAnswer: string,
    context: { word: string; translation: string }
  ): Promise<{ accepted: boolean; explanation: string }> => {
    if (smartValidation && !useBasicValidation) {
      const result = await validateAnswerSmart(userAnswer, correctAnswer, {
        targetWord: context.word,
        wordType: 'phrase',
        direction: 'target_to_native',
        languageParams
      });
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
      return { accepted: result.accepted, explanation: result.explanation };
    }
    const accepted = isCorrectAnswer(userAnswer, correctAnswer);
    return { accepted, explanation: '' };
  }, [smartValidation, useBasicValidation, languageParams]);

  const restartSession = () => {
    setDeck(shuffleArray([...deck]));
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    // Note: Extracted components reset their own internal state when words/index change
  };

  // Current items based on mode/game type
  const getCurrentStats = (): { index: number; length: number } => {
    // ai_challenge now uses extracted component with internal state
    if (localGameType === 'ai_challenge' && challengeStarted) {
      return { index: sessionAnswers.length, length: 20 }; // AIChallenge tracks via sessionAnswers
    }
    if (localGameType === 'speed_match' && speedMatchStarted) {
      return { index: speedMatchProgress.completed, length: speedMatchProgress.total };
    }
    if (localGameType === 'wordle' && wordleStarted) {
      return { index: sessionAnswers.length, length: Math.min(wordleEligibleWords.length, 5) || 1 };
    }
    // verb_mastery now uses extracted component with internal state
    if (localGameType === 'verb_mastery') {
      return { index: sessionAnswers.length, length: 20 }; // Max 20 questions
    }
    // quick_fire now uses extracted component with internal state
    // Progress tracked via sessionScore/sessionAnswers when game is active
    if (localGameType === 'quick_fire' && quickFireStarted) {
      return { index: sessionAnswers.length, length: Math.min(deck.length, 20) };
    }
    // type_it now uses deck directly via extracted component
    if (localGameType === 'type_it') {
      return { index: currentIndex, length: deck.length };
    }
    return { index: currentIndex, length: deck.length || 1 };
  };
  const { index: displayIndex, length: currentDeckLength } = getCurrentStats();
  const progress = ((displayIndex + 1) / currentDeckLength) * 100;
  const pendingCount = pendingChallenges.length + pendingWordRequests.length;
  const hubPartnerName = partnerName || t('play.session.yourPartner');
  const isHubView = !localGameType;
  const showSessionHeader = !!localGameType && !(
    (localGameType === 'verb_mastery' && !verbMasteryStarted) ||
    (localGameType === 'quick_fire' && !quickFireStarted) ||
    (localGameType === 'ai_challenge' && !challengeStarted) ||
    (localGameType === 'speed_match' && !speedMatchStarted)
  );

  const trackHubTileClick = useCallback((
    tileId: string,
    section: 'solo' | 'shared' | 'experimental',
    options?: { blocked?: boolean; sharedType?: 'challenge' | 'word_request' | 'empty'; featured?: boolean }
  ) => {
    const params = {
      tile_id: tileId,
      section,
      target_lang: targetLanguage,
      word_count: deck.length,
      shared_count: pendingCount,
      featured: Boolean(options?.featured),
    };

    if (options?.blocked) {
      analytics.trackPlayHubTileBlocked(params);
      return;
    }

    analytics.trackPlayHubTileClicked(params);
    if (section === 'shared') {
      analytics.trackPlayHubSharedOpened({
        ...params,
        shared_type: options?.sharedType || 'empty',
      });
    }
  }, [deck.length, pendingCount, targetLanguage]);

  const trackHeroCtaClick = useCallback((ctaId: string, destination: string) => {
    analytics.trackPlayHubCtaClicked({
      cta_id: ctaId,
      destination,
      target_lang: targetLanguage,
      word_count: deck.length,
      shared_count: pendingCount,
    });
  }, [deck.length, pendingCount, targetLanguage]);

  const openFirstSharedItem = useCallback(() => {
    if (pendingChallenges.length > 0) {
      setActiveChallenge(pendingChallenges[0]);
      return;
    }
    if (pendingWordRequests.length > 0) {
      setActiveWordRequest(pendingWordRequests[0]);
    }
  }, [pendingChallenges, pendingWordRequests]);

  const sharedItems = useMemo<PlayHubItem[]>(() => {
    const challengeItems: PlayHubItem[] = pendingChallenges.map((challenge, index) => ({
      id: challenge.id,
      title: challenge.title || (challenge.challenge_type === 'quiz'
        ? t('play.loveNotes.quizChallenge')
        : t('play.loveNotes.quickFire')),
      description: t('play.loveNotes.from', { partner: hubPartnerName }),
      meta: `${new Date(challenge.created_at).toLocaleDateString()} • ${t('play.loveNotes.words', { count: challenge.words_data?.length || 0 })}`,
      badge: challenge.challenge_type === 'quiz'
        ? t('play.loveNotes.challenges')
        : t('play.games.quickFire'),
      eyebrow: t('play.hub.sharedEyebrow'),
      artwork: challenge.challenge_type === 'quiz' ? 'love_notes' : 'quick_fire',
      colorRole: challenge.challenge_type === 'quiz' ? 'warm' : 'blend',
      featured: index === 0,
      onClick: () => {
        trackHubTileClick(challenge.id, 'shared', {
          featured: index === 0,
          sharedType: 'challenge',
        });
        setActiveChallenge(challenge);
      },
    }));

    const requestItems: PlayHubItem[] = pendingWordRequests.map((request) => ({
      id: request.id,
      title: request.request_type === 'ai_topic' ? request.input_text : t('play.loveNotes.wordGift'),
      description: t('play.loveNotes.subtitle'),
      meta: `${new Date(request.created_at).toLocaleDateString()} • ${request.xp_multiplier}x XP`,
      badge: t('play.loveNotes.wordGifts'),
      eyebrow: t('play.hub.sharedEyebrow'),
      artwork: 'word_gift',
      colorRole: 'bright',
      onClick: () => {
        trackHubTileClick(request.id, 'shared', { sharedType: 'word_request' });
        setActiveWordRequest(request);
      },
    }));

    if (challengeItems.length + requestItems.length > 0) {
      return [...challengeItems, ...requestItems];
    }

    return [
      {
        id: 'shared-empty-love-notes',
        title: t('play.loveNotes.empty'),
        description: t('play.loveNotes.emptyDesc', { partner: hubPartnerName }),
        meta: t('play.hub.sharedPlaceholderMeta'),
        eyebrow: t('play.hub.sharedEyebrow'),
        artwork: 'love_notes',
        colorRole: 'warm',
        featured: true,
        disabled: true,
        onDisabledClick: () => trackHubTileClick('shared-empty-love-notes', 'shared', { blocked: true, sharedType: 'empty', featured: true }),
        onClick: () => undefined,
      },
      {
        id: 'shared-empty-word-gifts',
        title: t('play.loveNotes.wordGifts'),
        description: t('play.hub.sharedPlaceholderCopy'),
        meta: t('play.hub.sharedPlaceholderMetaTwo'),
        eyebrow: t('play.hub.sharedEyebrow'),
        artwork: 'word_gift',
        colorRole: 'bright',
        disabled: true,
        onDisabledClick: () => trackHubTileClick('shared-empty-word-gifts', 'shared', { blocked: true, sharedType: 'empty' }),
        onClick: () => undefined,
      },
    ];
  }, [hubPartnerName, pendingChallenges, pendingWordRequests, t, trackHubTileClick]);

  const soloItems = useMemo<PlayHubItem[]>(() => [
    {
      id: 'flashcards',
      title: t('play.games.flashcards'),
      description: t('play.hub.flashcardsCopy'),
      meta: `${deck.length} ${t('progress.stats.words').toLowerCase()}`,
      eyebrow: t('play.hub.warmupEyebrow'),
      artwork: 'flashcards',
      colorRole: 'warm',
      featured: true,
      onClick: () => {
        trackHubTileClick('flashcards', 'solo', { featured: true });
        startLocalGame('flashcards');
      },
    },
    {
      id: 'multiple_choice',
      title: t('play.games.multiChoice'),
      description: t('play.games.multiChoiceDesc'),
      meta: t('play.hub.requiresWords', { count: 4 }),
      eyebrow: t('play.hub.pickEyebrow'),
      artwork: 'multiple_choice',
      colorRole: 'bright',
      disabled: deck.length < 4,
      onDisabledClick: () => trackHubTileClick('multiple_choice', 'solo', { blocked: true }),
      onClick: () => {
        trackHubTileClick('multiple_choice', 'solo');
        startLocalGame('multiple_choice');
      },
    },
    {
      id: 'type_it',
      title: t('play.games.typeIt'),
      description: t('play.games.typeItDesc'),
      meta: t('play.hub.spellMeta'),
      eyebrow: t('play.hub.spellEyebrow'),
      artwork: 'type_it',
      colorRole: 'ink',
      onClick: () => {
        trackHubTileClick('type_it', 'solo');
        startLocalGame('type_it');
      },
    },
    {
      id: 'wordle',
      title: t('play.games.wordle'),
      description: t('play.games.wordleDesc'),
      meta: wordleEligibleWords.length >= 3
        ? t('play.games.wordleWords', { count: wordleEligibleWords.length })
        : t('play.wordle.needEligibleWords'),
      eyebrow: t('play.hub.spellEyebrow'),
      artwork: 'wordle',
      colorRole: 'blend',
      disabled: wordleEligibleWords.length < 3,
      onDisabledClick: () => trackHubTileClick('wordle', 'solo', { blocked: true }),
      onClick: () => {
        trackHubTileClick('wordle', 'solo');
        startLocalGame('wordle');
      },
    },
    {
      id: 'speed_match',
      title: t('play.games.speedMatch'),
      description: t('play.games.speedMatchDesc'),
      meta: t('play.games.speedMatchMeta'),
      badge: t('play.hub.fastBadge'),
      eyebrow: t('play.hub.pickEyebrow'),
      artwork: 'speed_match',
      colorRole: 'bright',
      disabled: deck.length < 4,
      onDisabledClick: () => trackHubTileClick('speed_match', 'solo', { blocked: true }),
      onClick: () => {
        trackHubTileClick('speed_match', 'solo');
        startLocalGame('speed_match');
      },
    },
    {
      id: 'quick_fire',
      title: t('play.games.quickFire'),
      description: t('play.hub.quickFireCopy'),
      meta: t('play.games.quickFireDesc'),
      badge: t('play.hub.fastBadge'),
      eyebrow: t('play.hub.intensityEyebrow'),
      artwork: 'quick_fire',
      colorRole: 'blend',
      featured: true,
      disabled: deck.length < 5,
      onDisabledClick: () => trackHubTileClick('quick_fire', 'solo', { blocked: true, featured: true }),
      onClick: () => {
        trackHubTileClick('quick_fire', 'solo', { featured: true });
        startLocalGame('quick_fire');
      },
    },
    {
      id: 'verb_mastery',
      title: t('play.games.verbMastery'),
      description: verbsWithConjugations.length > 0
        ? t('play.hub.verbCopy', { count: verbsWithConjugations.length })
        : t('play.games.learnVerbsFirst'),
      meta: verbsWithConjugations.length > 0
        ? t('play.games.verbMasteryVerbs', { count: verbsWithConjugations.length })
        : t('play.hub.comingSoonMeta'),
      eyebrow: t('play.hub.grammarEyebrow'),
      artwork: 'verb_mastery',
      colorRole: 'ink',
      disabled: verbsWithConjugations.length === 0,
      onDisabledClick: () => trackHubTileClick('verb_mastery', 'solo', { blocked: true }),
      onClick: () => {
        trackHubTileClick('verb_mastery', 'solo');
        startLocalGame('verb_mastery');
      },
    },
  ], [deck.length, startLocalGame, t, trackHubTileClick, verbsWithConjugations.length, wordleEligibleWords.length]);

  const experimentalItems = useMemo<PlayHubItem[]>(() => [
    {
      id: 'ai_challenge',
      title: t('play.games.aiChallenge'),
      description: t('play.hub.aiCopy'),
      meta: t('play.games.aiChallengeDesc'),
      eyebrow: t('play.hub.adaptiveEyebrow'),
      artwork: 'ai_challenge',
      colorRole: 'warm',
      onClick: () => {
        trackHubTileClick('ai_challenge', 'experimental');
        startLocalGame('ai_challenge');
      },
    },
    {
      id: 'conversation',
      title: t('play.games.conversation'),
      description: t('play.games.conversationDesc', { language: targetName }),
      meta: t('play.hub.voiceMeta'),
      badge: t('play.beta'),
      eyebrow: t('play.hub.voiceEyebrow'),
      artwork: 'conversation',
      colorRole: 'ink',
      onClick: () => {
        trackHubTileClick('conversation', 'experimental');
        setShowConversationPractice(true);
      },
    },
  ], [startLocalGame, t, targetName, trackHubTileClick]);

  const heroData = useMemo(() => {
    if (pendingCount > 0) {
      const hasChallenge = pendingChallenges.length > 0;
      return {
        eyebrow: t('play.hub.heroSharedEyebrow'),
        headline: pendingCount === 1
          ? t('play.hub.heroSharedSingle')
          : t('play.hub.heroSharedPlural', { count: pendingCount }),
        description: t('play.hub.heroSharedCopy', { partner: hubPartnerName }),
        heroArtwork: hasChallenge ? 'love_notes' as const : 'word_gift' as const,
        primaryAction: {
          label: t('play.hub.openSharedAction'),
          onClick: () => {
            trackHeroCtaClick('open_shared', 'shared');
            openFirstSharedItem();
          },
          colorRole: 'warm' as const,
          variant: 'solid' as const,
        },
        secondaryAction: {
          label: t('play.hub.warmupAction'),
          onClick: () => {
            trackHeroCtaClick('warmup_flashcards', 'flashcards');
            startLocalGame('flashcards');
          },
          colorRole: 'ink' as const,
          variant: 'soft' as const,
        },
      };
    }

    return {
      eyebrow: t('play.hub.heroSoloEyebrow'),
      headline: t('play.hub.heroSoloHeadline'),
      description: t('play.hub.heroSoloCopy', { language: targetName }),
      heroArtwork: deck.length >= 5 ? 'quick_fire' as const : 'flashcards' as const,
      primaryAction: {
        label: t('play.hub.startFlashcardsAction'),
        onClick: () => {
          trackHeroCtaClick('start_flashcards', 'flashcards');
          startLocalGame('flashcards');
        },
        colorRole: 'warm' as const,
        variant: 'solid' as const,
      },
      secondaryAction: deck.length >= 5
        ? {
          label: t('play.hub.quickFireAction'),
          onClick: () => {
            trackHeroCtaClick('jump_quick_fire', 'quick_fire');
            startLocalGame('quick_fire');
          },
          colorRole: 'blend' as const,
          variant: 'soft' as const,
        }
        : {
          label: t('play.hub.voiceAction'),
          onClick: () => {
            trackHeroCtaClick('open_conversation', 'conversation');
            setShowConversationPractice(true);
          },
          colorRole: 'ink' as const,
          variant: 'soft' as const,
        },
    };
  }, [deck.length, hubPartnerName, openFirstSharedItem, pendingChallenges.length, pendingCount, startLocalGame, t, targetName, trackHeroCtaClick]);

  const hubViewTrackedRef = useRef(false);

  useEffect(() => {
    if (!isHubView) {
      hubViewTrackedRef.current = false;
      return;
    }

    if (loading || profile.role !== 'student' || hubViewTrackedRef.current) return;

    hubViewTrackedRef.current = true;
    analytics.trackPlayHubViewed({
      target_lang: targetLanguage,
      word_count: deck.length,
      shared_count: pendingCount,
      solo_available: soloItems.filter(item => !item.disabled).length,
      shared_available: sharedItems.filter(item => !item.disabled).length,
      experimental_available: experimentalItems.filter(item => !item.disabled).length,
    });
  }, [deck.length, experimentalItems, isHubView, loading, pendingCount, profile.role, sharedItems, soloItems, targetLanguage]);

  const hubStats = useMemo(() => [
    {
      label: t('play.hub.statWords'),
      value: String(deck.length),
    },
    {
      label: t('play.hub.statMastered'),
      value: String(masteredWords.length),
    },
    {
      label: t('play.hub.statShared'),
      value: String(pendingCount),
    },
    {
      label: t('play.hub.statVerbs'),
      value: String(verbsWithConjugations.length),
    },
  ], [deck.length, masteredWords.length, pendingCount, t, verbsWithConjugations.length]);

  // Loading state
  if (loading) return (
    <div className="h-full flex items-center justify-center font-bold text-[var(--accent-color)] animate-pulse">
      {t('play.loading')}
    </div>
  );

  // Tutor games view - Use TutorGames component
  if (profile.role === 'tutor') {
    return (
      <ErrorBoundary>
        <TutorGames profile={profile} />
      </ErrorBoundary>
    );
  }

  // Empty state
  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-20 h-20 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent-color)] opacity-60 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-4">{t('play.empty.noWords')}</h2>
      <p className="text-[var(--text-secondary)] font-medium">{t('play.empty.noWordsDesc')}</p>
    </div>
  );

  // Not enough words for multiple choice
  if ((localGameType === 'multiple_choice' || localGameType === 'speed_match') && deck.length < 4) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-[var(--color-warning-bg)] rounded-full flex items-center justify-center text-[var(--color-warning)] mb-6">
          <ICONS.Star className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-4">{t('play.empty.needMore')}</h2>
        <p className="text-[var(--text-secondary)] font-medium mb-6">{t('play.empty.needFourWordsDesc', { count: deck.length })}</p>
        <button
          onClick={() => startLocalGame('flashcards')}
          className="px-6 py-3 rounded-xl font-bold text-white text-scale-label shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
          style={{ backgroundColor: tierColor }}
        >
          {t('play.empty.tryFlashcards')}
        </button>
      </div>
    );
  }

  // Finished state
  if (finished && localGameType) return (
    <Suspense fallback={<InlinePlayLoader label={t('play.loading')} />}>
      <GameResults
        correct={sessionScore.correct}
        incorrect={sessionScore.incorrect}
        tierColor={tierColor}
        onPlayAgain={restartSession}
        onExit={exitLocalGame}
        answers={sessionAnswers}
      />
    </Suspense>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        show={showStreakCelebration}
        word={deck[currentIndex]?.word}
      />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="shrink-0 px-4 pt-4">
          <OfflineIndicator
            isOnline={isOnline}
            cachedWordCount={cachedWordCount}
            lastSyncTime={lastSyncTime}
            pendingCount={offlinePendingCount}
            isSyncing={isSyncing}
          />
        </div>
      )}

      {/* Header - active session only */}
      {localGameType && (
        <div className="shrink-0 p-2 md:p-4 pb-1 md:pb-2">
          <div className="w-full max-w-lg mx-auto">
            {showSessionHeader && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={handleExitRequest}
                    className="p-2 hover:bg-white/40 rounded-xl transition-colors"
                  >
                    <ICONS.ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                  </button>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-correct)]" />
                      <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.correct}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-[var(--color-incorrect)]" />
                      <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.incorrect}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                    {displayIndex + 1} / {currentDeckLength}
                  </span>
                </div>

                <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ width: `${progress}%`, backgroundColor: tierColor }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content Area - Scrollable */}
      <div className={`flex-1 overflow-y-auto ${isHubView ? 'px-4 md:px-6 py-4 md:py-6' : 'p-4 pt-2'}`}>
        <div className={`w-full ${isHubView ? 'max-w-6xl' : 'max-w-lg'} mx-auto flex items-start justify-center min-h-full`}>
          <div className="w-full">

          {isHubView && (
            <PlayHub
              eyebrow={heroData.eyebrow}
              headline={heroData.headline}
              description={heroData.description}
              heroArtwork={heroData.heroArtwork}
              primaryAction={heroData.primaryAction}
              secondaryAction={heroData.secondaryAction}
              stats={hubStats}
              soloItems={soloItems}
              sharedItems={sharedItems}
              experimentalItems={experimentalItems}
            />
          )}

          <Suspense fallback={<InlinePlayLoader label={t('play.loading')} />}>
            {/* Flashcards Mode - Using extracted component */}
            {localGameType === 'flashcards' && deck[currentIndex] && (
              <Flashcards
                words={deck}
                scoresMap={scoresMap}
                currentIndex={currentIndex}
                accentColor={tierColor}
                targetLanguage={targetLanguage}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                currentWordStreak={currentWordStreak}
                onAnswer={handleGameAnswer}
                onNext={handleGameNext}
                onComplete={gameCompleteHandlers.flashcards}
              />
            )}

            {/* Multiple Choice Mode - Using extracted component */}
            {localGameType === 'multiple_choice' && deck[currentIndex] && (
              <MultipleChoice
                words={deck}
                scoresMap={scoresMap}
                currentIndex={currentIndex}
                accentColor={tierColor}
                targetLanguage={targetLanguage}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                currentWordStreak={currentWordStreak}
                showIncorrectShake={showIncorrectShake}
                onAnswer={handleGameAnswer}
                onNext={handleGameNext}
                onComplete={gameCompleteHandlers.multiple_choice}
              />
            )}

            {/* Type It Mode - Using extracted component */}
            {localGameType === 'type_it' && deck.length > 0 && (
              <TypeIt
                words={deck}
                scoresMap={scoresMap}
                currentIndex={currentIndex}
                accentColor={tierColor}
                targetLanguage={targetLanguage}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                currentWordStreak={currentWordStreak}
                showIncorrectShake={showIncorrectShake}
                onAnswer={handleGameAnswer}
                onNext={handleGameNext}
                onComplete={gameCompleteHandlers.type_it}
                validateAnswer={handleTypeItValidation}
              />
            )}

            {localGameType === 'speed_match' && !finished && (
              <SpeedMatch
                words={deck}
                targetLanguage={targetLanguage}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                accentColor={accentHex}
                onStart={handleSpeedMatchStart}
                onProgress={handleSpeedMatchProgress}
                onAnswer={handleGameAnswer}
                onComplete={handleSpeedMatchComplete}
              />
            )}

            {localGameType === 'wordle' && !finished && (
              <Wordle
                words={deck}
                targetLanguage={targetLanguage}
                accentColor={accentHex}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                onStart={() => setWordleStarted(true)}
                onAnswer={handleGameAnswer}
                onComplete={handleWordleComplete}
              />
            )}

            {/* AI Challenge Mode - Using extracted component */}
            {localGameType === 'ai_challenge' && !finished && (
              <AIChallenge
                words={deck}
                scoresMap={scoresMap}
                challengeModes={challengeModes}
                accentColor={tierColor}
                targetLanguage={targetLanguage}
                nativeLanguage={nativeLanguage}
                targetLanguageName={targetName}
                nativeLanguageName={nativeName}
                userTier={levelInfo.tier}
                onAnswer={handleGameAnswer}
                onComplete={handleAIChallengeComplete}
                onExit={exitLocalGame}
                onStart={() => setChallengeStarted(true)}
                validateAnswer={handleAIChallengeValidation}
                onUpdateWordScore={updateWordScore}
              />
            )}

            {/* Quick Fire Mode - Using extracted component */}
            {localGameType === 'quick_fire' && !finished && (
              <QuickFire
                words={deck}
                targetLanguage={targetLanguage}
                accentColor={accentHex}
                timeLimit={60}
                maxWords={20}
                onAnswer={handleGameAnswer}
                onComplete={handleQuickFireComplete}
                onStart={handleQuickFireStart}
                validateAnswer={handleQuickFireValidation}
              />
            )}

            {/* Verb Dojo Mode - Redesigned verb conjugation training */}
            {localGameType === 'verb_mastery' && !finished && (
              <VerbDojo
                verbs={verbsWithConjugations}
                targetLanguage={targetLanguage}
                accentColor={accentHex}
                onStart={() => setVerbMasteryStarted(true)}
                onAnswer={(correct, xpEarned) => {
                  handleGameAnswer({
                    wordId: undefined,
                    wordText: 'verb',
                    correctAnswer: '',
                    questionType: 'type_it',
                    isCorrect: correct,
                  });
                  // XP is tracked internally by VerbDojo streak system
                }}
                onComplete={handleVerbMasteryComplete}
                onExit={exitLocalGame}
                validateAnswer={handleVerbMasteryValidation}
              />
            )}
          </Suspense>

          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {activeChallenge && (
        <Suspense fallback={<ModalPlayLoader label={t('play.loading')} />}>
          {activeChallenge.challenge_type === 'quiz' ? (
            <PlayQuizChallenge
              challenge={activeChallenge}
              partnerName={partnerName}
              onComplete={handleChallengeComplete}
              onClose={() => setActiveChallenge(null)}
              smartValidation={smartValidation}
            />
          ) : (
            <PlayQuickFireChallenge
              challenge={activeChallenge}
              partnerName={partnerName}
              onComplete={handleChallengeComplete}
              onClose={() => setActiveChallenge(null)}
              smartValidation={smartValidation}
            />
          )}
        </Suspense>
      )}

      {/* Word Gift Modal */}
      {activeWordRequest && (
        <Suspense fallback={<ModalPlayLoader label={t('play.loading')} />}>
          <WordGiftLearning
            wordRequest={activeWordRequest}
            partnerName={partnerName}
            onComplete={handleWordRequestComplete}
            onClose={() => setActiveWordRequest(null)}
          />
        </Suspense>
      )}

      {/* Conversation Practice Modal */}
      {showConversationPractice && (
        <Suspense fallback={<ModalPlayLoader label={t('play.loading')} />}>
          <ConversationPractice
            userName={profile.full_name || 'Friend'}
            onClose={() => setShowConversationPractice(false)}
          />
        </Suspense>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div className="glass-card-solid rounded-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[var(--color-warning-bg)] rounded-full flex items-center justify-center mb-4 text-[var(--color-warning)]">
                <ICONS.AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black font-header text-[var(--text-primary)] mb-2">
                {t('play.exitConfirm.title', 'Exit Game?')}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {t('play.exitConfirm.message', 'Your progress in this session will be lost. Are you sure you want to exit?')}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-[var(--text-primary)] glass-card hover:bg-white/55 transition-colors"
                >
                  {t('play.exitConfirm.cancel', 'Keep Playing')}
                </button>
                <button
                  onClick={exitLocalGame}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  {t('play.exitConfirm.confirm', 'Exit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Modal */}
      <Suspense fallback={null}>
        <LimitReachedModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          limitType="validation"
          onContinueBasic={() => setUseBasicValidation(true)}
        />
      </Suspense>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-color) 40%, transparent); }
          50% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent-color) 20%, transparent); }
        }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FlashcardGame;
