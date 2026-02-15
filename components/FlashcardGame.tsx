import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordScore, AIChallengeMode, TutorChallenge, WordRequest } from '../types';
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
import PlayQuizChallenge from './PlayQuizChallenge';
import GameResults from './games/GameResults';
import { StreakIndicator, StreakCelebrationModal } from './games/components';
import { Flashcards, MultipleChoice, TypeIt, QuickFire, AIChallenge } from './games/modes';
import { VerbDojo } from './games/modes/VerbDojo';
import type { DojoSessionResult } from './games/modes/VerbDojo/types';
import PlayQuickFireChallenge from './PlayQuickFireChallenge';
import { analytics } from '../services/analytics';
import WordGiftLearning from './WordGiftLearning';
import ConversationPractice from './ConversationPractice';
import LimitReachedModal from './LimitReachedModal';

interface FlashcardGameProps { profile: Profile; }

type PracticeMode = 'love_notes' | 'flashcards' | 'multiple_choice' | 'type_it' | 'ai_challenge' | 'quick_fire';
type MainTab = 'local_games' | 'love_notes';
type LocalGameType = 'flashcards' | 'multiple_choice' | 'type_it' | 'quick_fire' | 'ai_challenge' | 'verb_mastery' | null;
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

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
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

  // Main tab and local game state
  const [mainTab, setMainTab] = useState<MainTab>('local_games');
  const [localGameType, setLocalGameType] = useState<LocalGameType>(null);
  const [showConversationPractice, setShowConversationPractice] = useState(false);

  // Practice mode - default to love_notes if there are pending items
  const [mode, setMode] = useState<PracticeMode>('flashcards');
  const [finished, setFinished] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, incorrect: 0 });

  // Game session tracking
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
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
  const [showIncorrectShake, setShowIncorrectShake] = useState(false);

  // Verb Mastery state (most managed by extracted component)
  const [verbMasteryStarted, setVerbMasteryStarted] = useState(false); // Used for exit confirmation

  // Rate limit / free tier state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useBasicValidation, setUseBasicValidation] = useState(false);

  // Deferred deck refresh — set when dictionary-updated fires during an active game
  const pendingDeckRefreshRef = useRef(false);

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
    const prompts: Array<{ icon: string; message: string; color: string }> = [];
    const masteredCount = masteredWords.length;
    const weakCount = scores.filter(s => (s.total_attempts || 0) > (s.correct_attempts || 0)).length;

    if (masteredCount >= 10) {
      prompts.push({ icon: '🏆', message: `${masteredCount} words mastered! Time for a celebration date!`, color: 'text-amber-600' });
    }
    if (weakCount > 0 && weakCount <= 3) {
      prompts.push({ icon: '💪', message: `Just ${weakCount} words need work - you can quiz them tonight!`, color: 'text-teal-600' });
    }
    if (deck.length >= 5 && deck.length % 5 === 0) {
      prompts.push({ icon: '🎉', message: `${deck.length} words in their vocabulary - celebrate this milestone!`, color: 'text-[var(--accent-color)]' });
    }
    if (recentWords.length > 0) {
      prompts.push({ icon: '✨', message: `They just learned "${recentWords[0].word}" - use it in conversation today!`, color: 'text-purple-600' });
    }
    return prompts.slice(0, 2);
  }, [masteredWords, scores, deck, recentWords]);

  useEffect(() => {
    fetchData();
  }, [profile, targetLanguage]);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    const handleLanguageSwitch = () => {
      fetchData();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, []);

  // Listen for dictionary updates (words added via Chat, Word Gifts, etc.)
  // Defer refresh if a game is in progress to avoid breaking the active session
  useEffect(() => {
    const handler = () => {
      if (localGameType !== null) {
        pendingDeckRefreshRef.current = true;
        return;
      }
      fetchData();
    };
    window.addEventListener('dictionary-updated', handler as EventListener);
    return () => window.removeEventListener('dictionary-updated', handler as EventListener);
  }, [localGameType]);

  // Flush deferred refresh when returning to game selection
  useEffect(() => {
    if (localGameType === null && pendingDeckRefreshRef.current) {
      pendingDeckRefreshRef.current = false;
      fetchData();
    }
  }, [localGameType]);

  // Note: MC options and TypeIt questions now generated by extracted components

  const fetchData = async () => {
    setLoading(true);
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id)
      ? profile.linked_user_id
      : profile.id;

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
      setLoading(false);
      return;
    }

    const { data: dictData } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

    if (dictData) {
      setDeck(shuffleArray(dictData));
      await cacheVocabulary(dictData);
    }

    const { data: scoreData } = await supabase
      .from('word_scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

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

    setLoading(false);
  };

  const fetchPendingItems = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Get partner name
      if (profile.linked_user_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.linked_user_id)
          .single();
        if (partner) setPartnerName(partner.full_name);
      }

      // Fetch pending challenges
      const challengeRes = await fetch('/api/get-challenges/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams })
      });
      const challengeData = await challengeRes.json();
      if (challengeData.challenges) {
        setPendingChallenges(challengeData.challenges);
        // Auto-switch to Love Notes tab if there are pending items
        if (challengeData.challenges.length > 0) {
          setMainTab('love_notes');
        }
      }

      // Fetch pending word requests
      const requestRes = await fetch('/api/get-word-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams })
      });
      const requestData = await requestRes.json();
      if (requestData.wordRequests) {
        setPendingWordRequests(requestData.wordRequests);
        // Auto-switch to Love Notes tab if there are pending items
        if (requestData.wordRequests.length > 0 && pendingChallenges.length === 0) {
          setMainTab('love_notes');
        }
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
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

      const response = await fetch('/api/submit-game-session/', {
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

  const handleModeChange = (newMode: PracticeMode) => {
    setMode(newMode);
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    // Reset AI Challenge state when switching modes
    resetChallenge();
    // Reset Quick Fire state
    resetQuickFire();
    // Reset Verb Mastery state
    resetVerbMastery();

    // Reshuffle deck
    setDeck(shuffleArray([...deck]));
  };

  // Start a local game from the game selection grid
  const startLocalGame = (gameType: LocalGameType) => {
    setLocalGameType(gameType);
    if (gameType) {
      setMode(gameType as PracticeMode);
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
    challengeStarted || quickFireStarted || verbMasteryStarted ||
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
    resetQuickFire();
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

  // Verb Mastery reset (component manages its own internal state)
  const resetVerbMastery = () => {
    setVerbMasteryStarted(false);
  };

  // Exit confirmation when game is in progress
  useEffect(() => {
    const isGameInProgress = localGameType !== null && !finished && (
      challengeStarted || quickFireStarted || verbMasteryStarted ||
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
  }, [localGameType, finished, challengeStarted, quickFireStarted, verbMasteryStarted, currentIndex, sessionScore]);

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

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: result.wordId,
      wordText: result.wordText,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      questionType: result.questionType,
      isCorrect: result.isCorrect
    };
    setSessionAnswers(prev => [...prev, answer]);
    setSessionScore(prev => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (result.isCorrect ? 0 : 1)
    }));

    // Update word score with streak tracking
    if (result.wordId) {
      await updateWordScore(result.wordId, result.isCorrect);
    }
  }, [triggerIncorrectFeedback, updateWordScore]);

  const handleGameNext = useCallback(() => {
    setCurrentIndex(c => c + 1);
  }, []);

  // Pre-computed game complete handlers (memoized to avoid new refs each render)
  const gameCompleteHandlers = useMemo(() => ({
    flashcards: () => {
      if (sessionScore.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('flashcards', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
      analytics.trackGameCompleted({ game_type: 'flashcards', word_count: deck.length, score: sessionScore.correct, correct: sessionScore.incorrect === 0, accuracy: Math.round((sessionScore.correct / Math.max(sessionScore.correct + sessionScore.incorrect, 1)) * 100) });
    },
    multiple_choice: () => {
      if (sessionScore.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('multiple_choice', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
      analytics.trackGameCompleted({ game_type: 'multiple_choice', word_count: deck.length, score: sessionScore.correct, correct: sessionScore.incorrect === 0, accuracy: Math.round((sessionScore.correct / Math.max(sessionScore.correct + sessionScore.incorrect, 1)) * 100) });
    },
    type_it: () => {
      if (sessionScore.incorrect === 0) { sounds.play('perfect'); haptics.trigger('perfect'); }
      setFinished(true);
      saveGameSession('type_it', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
      analytics.trackGameCompleted({ game_type: 'type_it', word_count: deck.length, score: sessionScore.correct, correct: sessionScore.incorrect === 0, accuracy: Math.round((sessionScore.correct / Math.max(sessionScore.correct + sessionScore.incorrect, 1)) * 100) });
    },
  }), [sessionScore, sessionAnswers, saveGameSession, deck.length]);

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
    return { accepted, explanation: accepted ? 'Exact match' : 'No match' };
  }, [smartValidation, useBasicValidation, languageParams]);

  // QuickFire handlers (memoized)
  const handleQuickFireStart = useCallback(() => {
    setQuickFireStarted(true);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
  }, []);

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
    return { accepted, explanation: accepted ? 'Exact match' : 'No match' };
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
    return { accepted, explanation: accepted ? 'Exact match' : 'No match' };
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
    return { accepted, explanation: accepted ? 'Exact match' : 'No match' };
  }, [smartValidation, useBasicValidation, languageParams]);

  const restartSession = () => {
    setDeck(shuffleArray([...deck]));
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    // Note: Extracted components reset their own internal state when words/index change
  };

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
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
      <div className="w-20 h-20 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent-color)] opacity-60 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">{t('play.empty.noWords')}</h2>
      <p className="text-[var(--text-secondary)] font-medium">{t('play.empty.noWordsDesc')}</p>
    </div>
  );

  // Not enough words for multiple choice
  if (mode === 'multiple_choice' && deck.length < 4) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 mb-6">
          <ICONS.Star className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">{t('play.empty.needMore')}</h2>
        <p className="text-[var(--text-secondary)] font-medium mb-6">{t('play.empty.needMoreDesc', { count: deck.length })}</p>
        <button
          onClick={() => handleModeChange('flashcards')}
          className="px-6 py-3 rounded-xl font-bold text-white text-scale-label"
          style={{ backgroundColor: tierColor }}
        >
          {t('play.empty.tryFlashcards')}
        </button>
      </div>
    );
  }

  // Finished state
  if (finished && localGameType) return (
    <GameResults
      correct={sessionScore.correct}
      incorrect={sessionScore.incorrect}
      tierColor={tierColor}
      onPlayAgain={restartSession}
      onExit={exitLocalGame}
      answers={sessionAnswers}
    />
  );

  // Current items based on mode/game type
  const getCurrentStats = (): { index: number; length: number } => {
    // ai_challenge now uses extracted component with internal state
    if (localGameType === 'ai_challenge' && challengeStarted) {
      return { index: sessionAnswers.length, length: 20 }; // AIChallenge tracks via sessionAnswers
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
    if (mode === 'type_it') {
      return { index: currentIndex, length: deck.length };
    }
    return { index: currentIndex, length: deck.length || 1 };
  };
  const { index: displayIndex, length: currentDeckLength } = getCurrentStats();
  const progress = ((displayIndex + 1) / currentDeckLength) * 100;
  const pendingCount = pendingChallenges.length + pendingWordRequests.length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
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

      {/* Header: Two Tabs - Fixed at top */}
      <div className="shrink-0 p-2 md:p-4 pb-1 md:pb-2">
        <div className="w-full max-w-lg mx-auto">
          {/* Two-Tab Layout: Local Games | Love Notes */}
          {!localGameType && (
            <>
              <h1 className="text-scale-heading md:text-2xl font-black text-[var(--text-primary)] mb-2 md:mb-3 text-center">{t('play.title')}</h1>
              <div className="inline-flex w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-0.5 md:p-1 rounded-lg md:rounded-xl mb-2 md:mb-3">
                <button
                  onClick={() => setMainTab('local_games')}
                  className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-scale-label font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    mainTab === 'local_games'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent-color)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {t('play.tabs.games')}
                </button>
                <button
                  onClick={() => setMainTab('love_notes')}
                  className={`relative flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-scale-label font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    mainTab === 'love_notes'
                      ? 'bg-[var(--accent-color)] text-white shadow-sm'
                      : pendingCount > 0
                        ? 'text-[var(--accent-color)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${mainTab === 'love_notes' ? 'fill-white' : pendingCount > 0 ? 'fill-[var(--accent-color)]' : ''}`} />
                  {t('play.tabs.loveNotes')}
                  {pendingCount > 0 && mainTab !== 'love_notes' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-[var(--accent-color)] text-white text-[8px] md:text-[10px] flex items-center justify-center rounded-full font-bold animate-bounce">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-scale-micro md:text-scale-caption text-center hidden md:block">
                {mainTab === 'local_games'
                  ? t('play.tabs.gamesDesc')
                  : t('play.tabs.loveNotesDesc', { partner: partnerName || t('play.session.yourPartner') })}
              </p>
            </>
          )}

          {/* Session Stats - Show only when a game is active (hide for VerbDojo mode selection) */}
          {localGameType && !(localGameType === 'verb_mastery' && !verbMasteryStarted) && (
            <>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleExitRequest}
                  className="p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
                >
                  <ICONS.ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.correct}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.incorrect}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {displayIndex + 1} / {currentDeckLength}
                </span>
              </div>

              {/* Progress Bar */}
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

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="w-full max-w-lg mx-auto flex items-start justify-center min-h-full">
          <div className="w-full">

          {/* Game Card Grid - Show when in local_games tab and no game active */}
          {mainTab === 'local_games' && !localGameType && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 mt-3 md:mt-4">
              {/* Flashcards */}
              <button
                onClick={() => startLocalGame('flashcards')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--accent-light)] rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🎴
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.flashcards')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.flashcardsDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Multiple Choice */}
              <button
                onClick={() => startLocalGame('multiple_choice')}
                disabled={deck.length < 4}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🔘
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.multiChoice')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.multiChoiceDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Type It */}
              <button
                onClick={() => startLocalGame('type_it')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    ⌨️
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.typeIt')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.typeItDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Quick Fire */}
              <button
                onClick={() => startLocalGame('quick_fire')}
                disabled={deck.length < 5}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.quickFire')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.quickFireDesc')}</p>
                  </div>
                </div>
              </button>

              {/* AI Challenge */}
              <button
                onClick={() => startLocalGame('ai_challenge')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-green-500/30 transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-green-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.aiChallenge')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.aiChallengeDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Conversation Practice */}
              <button
                onClick={() => setShowConversationPractice(true)}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left relative"
              >
                <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 px-1.5 md:px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[7px] md:text-[9px] font-black uppercase tracking-wider rounded-full">
                  {t('play.beta')}
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🎙️
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.conversation')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.conversationDesc', { language: targetName })}</p>
                  </div>
                </div>
              </button>

              {/* Verb Mastery */}
              <button
                onClick={() => startLocalGame('verb_mastery')}
                disabled={verbsWithConjugations.length === 0}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all text-left relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🔄
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.verbMastery')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">
                      {verbsWithConjugations.length > 0
                        ? t('play.games.verbMasteryVerbs', { count: verbsWithConjugations.length })
                        : t('play.games.learnVerbsFirst')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

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
              accentColor="#f59e0b"
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

          {/* Love Notes Tab - Partner Challenges & Word Gifts */}
          {mainTab === 'love_notes' && !localGameType && (
            <div className="w-full space-y-4">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">
                  💌
                </div>
                <h2 className="text-scale-heading font-black text-[var(--text-primary)]">{t('play.loveNotes.title', { partner: partnerName })}</h2>
                <p className="text-scale-label text-[var(--text-secondary)]">{t('play.loveNotes.subtitle')}</p>
              </div>

              {/* Empty State */}
              {pendingChallenges.length === 0 && pendingWordRequests.length === 0 && (
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border border-[var(--border-color)] text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-scale-heading font-bold text-[var(--text-primary)] mb-2">{t('play.loveNotes.empty')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('play.loveNotes.emptyDesc', { partner: partnerName })}</p>
                </div>
              )}

              {/* Pending Challenges */}
              {pendingChallenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Zap className="w-3.5 h-3.5" /> {t('play.loveNotes.challenges')}
                  </h3>
                  {pendingChallenges.map(challenge => (
                    <button
                      key={challenge.id}
                      onClick={() => setActiveChallenge(challenge)}
                      className="w-full bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)] hover:border-[var(--accent-border)] dark:hover:border-[var(--accent-border)] hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                          {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {challenge.title || (challenge.challenge_type === 'quiz' ? t('play.loveNotes.quizChallenge') : t('play.loveNotes.quickFire'))}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {t('play.loveNotes.words', { count: challenge.words_data?.length || 0 })}
                            </span>
                          </div>
                          <p className="text-scale-caption text-[var(--text-secondary)]">
                            {t('play.loveNotes.from', { partner: partnerName })} · {new Date(challenge.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ICONS.ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pending Word Gifts */}
              {pendingWordRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Heart className="w-3.5 h-3.5 fill-[var(--text-secondary)]" /> {t('play.loveNotes.wordGifts')}
                  </h3>
                  {pendingWordRequests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => setActiveWordRequest(request)}
                      className="w-full bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)] hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                          🎁
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {request.request_type === 'ai_topic' ? request.input_text : t('play.loveNotes.wordGift')}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                              {t('play.loveNotes.words', { count: request.selected_words?.length || 0 })}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {request.xp_multiplier}x XP
                            </span>
                          </div>
                          <p className="text-scale-caption text-[var(--text-secondary)]">
                            {t('play.loveNotes.from', { partner: partnerName })} · {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ICONS.ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Practice Other Modes Prompt */}
              {pendingChallenges.length === 0 && pendingWordRequests.length === 0 && (
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => { setMainTab('local_games'); }}
                    className="flex-1 py-3 rounded-xl font-bold text-scale-label text-white transition-colors"
                    style={{ backgroundColor: tierColor }}
                  >
                    {t('play.loveNotes.goToGames')}
                  </button>
                </div>
              )}
            </div>
          )}

          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {activeChallenge && (
        activeChallenge.challenge_type === 'quiz' ? (
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
        )
      )}

      {/* Word Gift Modal */}
      {activeWordRequest && (
        <WordGiftLearning
          wordRequest={activeWordRequest}
          partnerName={partnerName}
          onComplete={handleWordRequestComplete}
          onClose={() => setActiveWordRequest(null)}
        />
      )}

      {/* Conversation Practice Modal */}
      {showConversationPractice && (
        <ConversationPractice
          userName={profile.full_name || 'Friend'}
          onClose={() => setShowConversationPractice(false)}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-4xl">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                {t('play.exitConfirm.title', 'Exit Game?')}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {t('play.exitConfirm.message', 'Your progress in this session will be lost. Are you sure you want to exit?')}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-colors"
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
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="validation"
        onContinueBasic={() => setUseBasicValidation(true)}
      />

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 71, 97, 0.4); }
          50% { box-shadow: 0 0 0 3px rgba(255, 71, 97, 0.2); }
        }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FlashcardGame;
