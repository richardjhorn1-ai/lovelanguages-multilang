import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, TutorChallenge, WordRequest, DictionaryEntry, WordScore, TutorStats } from '../types';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import CreateQuizChallenge from './CreateQuizChallenge';
import CreateQuickFireChallenge from './CreateQuickFireChallenge';
import WordRequestCreator from './WordRequestCreator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeAnswer, validateAnswerSmart } from '../utils/answer-helpers';
import LimitReachedModal from './LimitReachedModal';
import {
  TutorFlashcards,
  TutorMultipleChoice,
  TutorTypeIt,
  TutorQuickFire,
  TutorGameResults,
  type TutorAnswerResult,
} from './games/tutor-modes';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';

interface TutorGamesProps {
  profile: Profile;
}

interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it' | 'quick_fire';
  isCorrect: boolean;
  explanation?: string;
}

type PlayMode = 'send' | 'local';

const SAVE_PREF_KEY = 'tutor_save_to_student_progress';

const TutorGames: React.FC<TutorGamesProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const { targetLanguage, nativeLanguage, languageParams, targetName, nativeName } = useLanguage();
  const { isOnline, cachedWordCount, lastSyncTime, pendingCount, isSyncing: offlineSyncing } = useOffline(profile.id, targetLanguage);
  const [challenges, setChallenges] = useState<TutorChallenge[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
  const [tutorStats, setTutorStats] = useState<TutorStats | null>(null);
  const [partnerVocab, setPartnerVocab] = useState<DictionaryEntry[]>([]);
  const [partnerScores, setPartnerScores] = useState<Map<string, WordScore>>(new Map());
  const [partnerName, setPartnerName] = useState<string>('Your Partner');
  const [loading, setLoading] = useState(true);

  // Play mode
  const [playMode, setPlayMode] = useState<PlayMode>('send');

  // Modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuickFireModal, setShowQuickFireModal] = useState(false);
  const [showWordRequestModal, setShowWordRequestModal] = useState(false);

  // Local game states (components manage most state internally)
  const [localGameActive, setLocalGameActive] = useState<'quiz' | 'quickfire' | 'multiple_choice' | 'type_it' | null>(null);
  const [localGameWords, setLocalGameWords] = useState<DictionaryEntry[]>([]);
  const [localGameIndex, setLocalGameIndex] = useState(0);
  const [localGameScore, setLocalGameScore] = useState({ correct: 0, incorrect: 0 });
  const [localQuickFireTimeLeft, setLocalQuickFireTimeLeft] = useState(60);

  // Session tracking for save to student progress
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [savingProgress, setSavingProgress] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Rate limit / free tier state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useBasicValidation, setUseBasicValidation] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Track if a game is in progress (for exit confirmation)
  const isGameInProgress = localGameActive !== null && (
    localGameIndex > 0 || localGameScore.correct > 0 || localGameScore.incorrect > 0
  );

  // Browser back/close protection when game is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameInProgress) {
        e.preventDefault();
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
  }, [isGameInProgress]);

  useEffect(() => {
    fetchData();
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get partner's name
      if (profile.linked_user_id) {
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.linked_user_id)
          .single();
        if (partnerProfile) setPartnerName(partnerProfile.full_name);

        // Get partner's vocabulary for game creation (filtered by current language)
        const { data: vocab } = await supabase
          .from('dictionary')
          .select('*')
          .eq('user_id', profile.linked_user_id)
          .eq('language_code', targetLanguage)
          .order('created_at', { ascending: false });
        if (vocab) setPartnerVocab(vocab);

        // Get partner's scores for smart word selection (filtered by current language)
        const { data: scores } = await supabase
          .from('word_scores')
          .select('*')
          .eq('user_id', profile.linked_user_id)
          .eq('language_code', targetLanguage);
        if (scores) {
          const map = new Map<string, WordScore>();
          scores.forEach((s: any) => map.set(s.word_id, s));
          setPartnerScores(map);
        }
      }

      // Fetch challenges
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const challengeRes = await fetch('/api/get-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor', ...languageParams })
      });
      const challengeData = await challengeRes.json();
      if (challengeData.challenges) setChallenges(challengeData.challenges);

      // Fetch word requests
      const requestRes = await fetch('/api/get-word-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor', ...languageParams })
      });
      const requestData = await requestRes.json();
      if (requestData.wordRequests) setWordRequests(requestData.wordRequests);

      // Fetch tutor stats (for streak display)
      const statsRes = await fetch('/api/tutor-stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.tutor?.stats) setTutorStats(statsData.tutor.stats);
      }

    } catch (error) {
      console.error('Error fetching tutor game data:', error);
    }
    setLoading(false);
  };

  const handleChallengeCreated = () => {
    fetchData();
    setShowQuizModal(false);
    setShowQuickFireModal(false);
  };

  const handleWordRequestCreated = () => {
    fetchData();
    setShowWordRequestModal(false);
  };

  // Check if this is the first time tutor is completing a local game
  const isFirstTimeSave = () => {
    return localStorage.getItem(SAVE_PREF_KEY) === null;
  };

  // Get save preference
  const getSavePreference = (): 'always' | 'never' | 'ask' => {
    const stored = localStorage.getItem(SAVE_PREF_KEY);
    if (stored === 'always' || stored === 'never') return stored;
    return 'ask';  // Default to 'ask' instead of null
  };

  // Save game session to student's progress
  const saveGameSessionToStudent = async (gameMode: string, answers: GameSessionAnswer[], correct: number, incorrect: number) => {
    if (!profile.linked_user_id) return;

    setSavingProgress(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      await fetch('/api/submit-game-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameMode: `tutor_${gameMode}`,
          correctCount: correct,
          incorrectCount: incorrect,
          totalTimeSeconds,
          answers,
          // Tell the API to save to the linked student, not the tutor
          targetUserId: profile.linked_user_id,
          ...languageParams
        })
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving game session:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  // Handle save preference selection
  const handleSavePreference = async (save: boolean, remember: boolean) => {
    if (remember) {
      localStorage.setItem(SAVE_PREF_KEY, save ? 'always' : 'never');
    } else if (isFirstTimeSave()) {
      // First time but didn't check "remember" - set to "ask"
      localStorage.setItem(SAVE_PREF_KEY, 'ask');
    }

    if (save) {
      const gameMode = localGameActive === 'quiz' ? 'flashcards' :
                       localGameActive === 'quickfire' ? 'quick_fire' :
                       localGameActive || 'flashcards';
      await saveGameSessionToStudent(gameMode, sessionAnswers, localGameScore.correct, localGameScore.incorrect);
    }
  };

  const startLocalQuiz = () => {
    // Pick 10 random words, prioritizing weak ones (incorrect attempts or low streak)
    const weakWords = partnerVocab.filter(w => {
      const score = partnerScores.get(w.id);
      const incorrectAttempts = score ? (score.total_attempts || 0) - (score.correct_attempts || 0) : 0;
      return score && (incorrectAttempts > 0 || (score.correct_streak || 0) < 3);
    });
    const otherWords = partnerVocab.filter(w => !weakWords.includes(w));
    const selectedWords = [...shuffleArray(weakWords).slice(0, 5), ...shuffleArray(otherWords).slice(0, 5)];
    setLocalGameWords(shuffleArray(selectedWords).slice(0, 10));
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('quiz');
  };

  const startLocalQuickFire = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 20);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalQuickFireTimeLeft(60);
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('quickfire');
  };

  const startLocalMultipleChoice = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 10);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('multiple_choice');
  };

  const startLocalTypeIt = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 10);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('type_it');
  };

  // Old handlers removed - now using extracted components

  const resetLocalGame = useCallback(() => {
    setLocalGameActive(null);
    setLocalGameWords([]);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalQuickFireTimeLeft(60);
    setSessionAnswers([]);
    setSavedSuccess(false);
    setShowExitConfirm(false);
  }, []);

  // Exit game with confirmation if in progress
  const handleExitGame = useCallback(() => {
    if (isGameInProgress) {
      setShowExitConfirm(true);
    } else {
      resetLocalGame();
    }
  }, [isGameInProgress, resetLocalGame]);

  const restartCurrentGame = () => {
    if (localGameActive === 'quiz') startLocalQuiz();
    else if (localGameActive === 'quickfire') startLocalQuickFire();
    else if (localGameActive === 'multiple_choice') startLocalMultipleChoice();
    else if (localGameActive === 'type_it') startLocalTypeIt();
  };

  // Unified handler for extracted components
  const handleTutorGameAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    setSessionAnswers(prev => [...prev, {
      wordId: result.wordId,
      wordText: result.wordText,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      questionType: result.questionType,
      isCorrect: result.isCorrect,
      explanation: result.explanation
    }]);
  }, []);

  const handleFlashcardAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    handleTutorGameAnswer(result, isCorrect);
    if (localGameIndex < localGameWords.length - 1) {
      setTimeout(() => setLocalGameIndex(prev => prev + 1), 300);
    }
  }, [handleTutorGameAnswer, localGameIndex, localGameWords.length]);

  const handleMcAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    handleTutorGameAnswer(result, isCorrect);
    setTimeout(() => {
      if (localGameIndex < localGameWords.length - 1) {
        setLocalGameIndex(prev => prev + 1);
      }
    }, isCorrect ? 800 : 1500);
  }, [handleTutorGameAnswer, localGameIndex, localGameWords.length]);

  const handleTypeItNext = useCallback(() => {
    if (localGameIndex < localGameWords.length - 1) {
      setLocalGameIndex(prev => prev + 1);
    } else {
      // Last question - force re-render to trigger game over detection
      // by touching a state variable (score is already correct, this just re-renders)
      setLocalGameScore(prev => ({ ...prev }));
    }
  }, [localGameIndex, localGameWords.length]);

  const handleQuickFireComplete = useCallback((results: {
    answers: TutorAnswerResult[];
    score: { correct: number; incorrect: number };
    timeRemaining: number;
  }) => {
    setLocalGameScore(results.score);
    setSessionAnswers(results.answers.map(r => ({
      wordId: r.wordId,
      wordText: r.wordText,
      correctAnswer: r.correctAnswer,
      userAnswer: r.userAnswer,
      questionType: r.questionType,
      isCorrect: r.isCorrect,
      explanation: r.explanation
    })));
    setLocalQuickFireTimeLeft(results.timeRemaining);
    // Set index to end so game-over detection works for auto-save
    setLocalGameIndex(localGameWords.length - 1);
  }, [localGameWords.length]);

  // Auto-save effect when preference is 'always'
  React.useEffect(() => {
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length
      && localGameWords.length > 0;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;
    const quickFireComplete = localGameActive === 'quickfire' && localGameIndex >= localGameWords.length - 1 && totalAnswered === localGameWords.length && localGameWords.length > 0;

    if ((isGameOver || quickFireTimeUp || quickFireComplete) && getSavePreference() === 'always' && !savedSuccess && !savingProgress && sessionAnswers.length > 0) {
      const gameMode = localGameActive === 'quiz' ? 'flashcards' :
                       localGameActive === 'quickfire' ? 'quick_fire' :
                       localGameActive || 'flashcards';
      saveGameSessionToStudent(gameMode, sessionAnswers, localGameScore.correct, localGameScore.incorrect);
    }
  }, [localGameActive, localGameIndex, localGameScore, localQuickFireTimeLeft, localGameWords.length, sessionAnswers.length, savedSuccess, savingProgress]);

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const pendingRequests = wordRequests.filter(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  // Local game is active - render game UI using extracted components
  if (localGameActive) {
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameWords.length > 0
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;
    const quickFireComplete = localGameActive === 'quickfire'
      && localGameWords.length > 0
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length;

    // Game Over Screen - Using TutorGameResults component
    if (isGameOver || quickFireTimeUp || quickFireComplete) {
      return (
        <TutorGameResults
          score={localGameScore}
          partnerName={partnerName}
          hasLinkedPartner={!!profile.linked_user_id}
          savePreference={getSavePreference()}
          isFirstTime={isFirstTimeSave()}
          savingProgress={savingProgress}
          savedSuccess={savedSuccess}
          onSave={(remember) => handleSavePreference(true, remember)}
          onDone={resetLocalGame}
          onPlayAgain={restartCurrentGame}
        />
      );
    }

    // Quiz/Flashcards - Using TutorFlashcards component
    if (localGameActive === 'quiz') {
      return (
        <TutorFlashcards
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleFlashcardAnswer}
          onExit={handleExitGame}
        />
      );
    }

    // Quick Fire - Using TutorQuickFire component
    if (localGameActive === 'quickfire') {
      return (
        <TutorQuickFire
          words={localGameWords}
          timeLimit={60}
          onAnswer={(result) => handleTutorGameAnswer(result, result.isCorrect)}
          onComplete={handleQuickFireComplete}
          onExit={handleExitGame}
          validateAnswer={profile.smart_validation && !useBasicValidation ? async (userAnswer, correctAnswer, word) => {
            const result = await validateAnswerSmart(userAnswer, correctAnswer, {
              targetWord: word.word,
              languageParams: { targetLanguage, nativeLanguage }
            });
            if (result.rateLimitHit) setShowLimitModal(true);
            return { accepted: result.accepted, explanation: result.explanation };
          } : undefined}
        />
      );
    }

    // Multiple Choice - Using TutorMultipleChoice component
    if (localGameActive === 'multiple_choice') {
      return (
        <TutorMultipleChoice
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleMcAnswer}
          onExit={handleExitGame}
        />
      );
    }

    // Type It - Using TutorTypeIt component
    if (localGameActive === 'type_it') {
      return (
        <TutorTypeIt
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleTutorGameAnswer}
          onNext={handleTypeItNext}
          onExit={handleExitGame}
          validateAnswer={profile.smart_validation && !useBasicValidation ? async (userAnswer, correctAnswer, word) => {
            const result = await validateAnswerSmart(userAnswer, correctAnswer, {
              targetWord: word.word,
              languageParams: { targetLanguage, nativeLanguage }
            });
            if (result.rateLimitHit) setShowLimitModal(true);
            return { accepted: result.accepted, explanation: result.explanation };
          } : undefined}
        />
      );
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {!isOnline && (
          <OfflineIndicator
            isOnline={isOnline}
            cachedWordCount={cachedWordCount}
            lastSyncTime={lastSyncTime}
            pendingCount={pendingCount}
            isSyncing={offlineSyncing}
          />
        )}

        {/* Header with Mode Toggle and Streak */}
        <div className="text-center">
          {/* Teaching Streak Badge */}
          {tutorStats && tutorStats.teachingStreak > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4" style={{ backgroundColor: `${accentHex}15` }}>
              <span className="text-xl">🔥</span>
              <span className="font-bold" style={{ color: accentHex }}>
                {t('tutorGames.teachingStreak', { count: tutorStats.teachingStreak, defaultValue: `${tutorStats.teachingStreak} day teaching streak!` })}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3">{t('tutorGames.playTogether')}</h1>

          {/* Mode Tabs */}
          <div className="inline-flex bg-[var(--bg-primary)] p-1 rounded-xl">
            <button
              onClick={() => setPlayMode('send')}
              className={`px-4 py-2 rounded-lg text-scale-caption font-bold transition-all ${
                playMode === 'send'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('tutorGames.sendChallenge')}
            </button>
            <button
              onClick={() => setPlayMode('local')}
              className={`px-4 py-2 rounded-lg text-scale-caption font-bold transition-all ${
                playMode === 'local'
                  ? 'bg-[var(--bg-card)] text-teal-600 shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t('tutorGames.playNow')}
            </button>
          </div>

          <p className="text-[var(--text-secondary)] text-scale-caption mt-2">
            {playMode === 'send'
              ? t('tutorGames.sendDescription', { name: partnerName })
              : t('tutorGames.playDescription')}
          </p>
        </div>

        {/* LOCAL PLAY MODE */}
        {playMode === 'local' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={startLocalQuiz}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🎯
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.local.quiz', { name: partnerName })}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.local.quizDesc')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[var(--accent-color)] text-scale-caption font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>{t('tutorGames.startNow')}</span>
              </div>
            </button>

            <button
              onClick={startLocalQuickFire}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  ⚡
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.local.quickFire')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.local.quickFireDesc')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-amber-500 text-scale-caption font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>{t('tutorGames.startNow')}</span>
              </div>
            </button>

            <button
              onClick={startLocalMultipleChoice}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🔘
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.local.multipleChoice')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.local.multipleChoiceDesc')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-purple-500 text-scale-caption font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>{t('tutorGames.startNow')}</span>
              </div>
            </button>

            <button
              onClick={startLocalTypeIt}
              disabled={partnerVocab.length < 4}
              className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  ⌨️
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.local.typeIt')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.local.typeItDesc')}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-blue-500 text-scale-caption font-bold">
                <ICONS.Play className="w-3 h-3" />
                <span>{t('tutorGames.startNow')}</span>
              </div>
            </button>

            {partnerVocab.length < 4 && (
              <p className="text-scale-caption text-[var(--text-secondary)] text-center col-span-2">
                {t('tutorGames.local.needWords', { name: partnerName })}
              </p>
            )}
          </div>
        )}

        {/* SEND MODE - Game Cards */}
        {playMode === 'send' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Do You Remember Quiz */}
          <button
            onClick={() => setShowQuizModal(true)}
            disabled={!isOnline}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎯
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.send.doYouRemember')}</h3>
                <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.send.quizPartner', { name: partnerName })}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[var(--accent-color)] text-scale-caption font-bold">
              <span>{t('tutorGames.send.createQuiz')}</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Quick Fire */}
          <button
            onClick={() => setShowQuickFireModal(true)}
            disabled={!isOnline}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.send.quickFire')}</h3>
                <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.send.timedChallenge')}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-amber-500 text-scale-caption font-bold">
              <span>{t('tutorGames.send.createChallenge')}</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Word Gift */}
          <button
            onClick={() => setShowWordRequestModal(true)}
            disabled={!isOnline}
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-teal-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                🎁
              </div>
              <div className="flex-1">
                <h3 className="font-black text-[var(--text-primary)] mb-1">{t('tutorGames.send.giftWords')}</h3>
                <p className="text-scale-label text-[var(--text-secondary)]">{t('tutorGames.send.sendWords', { name: partnerName })}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-teal-500 text-scale-caption font-bold">
              <span>{t('tutorGames.send.sendGift')}</span>
              <ICONS.ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
        )}

        {/* Pending Challenges Section - Only in send mode */}
        {playMode === 'send' && pendingChallenges.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-scale-label font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Clock className="w-4 h-4" />
              {t('tutorGames.pending.waitingFor', { name: partnerName })}
            </h3>
            <div className="space-y-3">
              {pendingChallenges.slice(0, 3).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-scale-label">{challenge.title}</p>
                    <p className="text-scale-caption text-[var(--text-secondary)]">
                      {t('tutorGames.pending.words', { count: challenge.words_data?.length || 0 })} • {t('tutorGames.pending.sent', { date: new Date(challenge.created_at).toLocaleDateString() })}
                    </p>
                  </div>
                  <span className="text-scale-caption font-bold text-amber-500 bg-amber-500/20 px-2 py-1 rounded-full">
                    {t('tutorGames.pending.pending')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Word Gifts - Only in send mode */}
        {playMode === 'send' && pendingRequests.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-scale-label font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Heart className="w-4 h-4 text-[var(--accent-color)]" />
              {t('tutorGames.gifts.title')}
            </h3>
            <div className="space-y-3">
              {pendingRequests.slice(0, 3).map(request => (
                <div key={request.id} className="flex items-center gap-3 p-3 bg-teal-500/10 rounded-xl border border-teal-500/20">
                  <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                    🎁
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-scale-label">
                      {t('tutorGames.gifts.word', { count: request.selected_words?.length || 0 })}
                    </p>
                    <p className="text-scale-caption text-[var(--text-secondary)]">
                      {request.request_type === 'ai_topic' ? t('tutorGames.gifts.topic', { topic: request.input_text }) : t('tutorGames.gifts.custom')}
                    </p>
                  </div>
                  <span className="text-scale-caption font-bold text-teal-500 bg-teal-500/20 px-2 py-1 rounded-full">
                    {t('tutorGames.gifts.xpMultiplier', { multiplier: request.xp_multiplier })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Results - Only in send mode */}
        {playMode === 'send' && completedChallenges.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm p-6">
            <h3 className="text-scale-label font-black text-[var(--text-secondary)] uppercase tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Check className="w-4 h-4 text-green-500" />
              {t('tutorGames.results.title')}
            </h3>
            <div className="space-y-3">
              {completedChallenges.slice(0, 5).map(challenge => (
                <div key={challenge.id} className="flex items-center gap-3 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                    {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[var(--text-primary)] text-scale-label">{challenge.title}</p>
                    <p className="text-scale-caption text-[var(--text-secondary)]">
                      {t('tutorGames.results.completed', { date: new Date(challenge.completed_at || '').toLocaleDateString() })}
                    </p>
                  </div>
                  {(challenge as any).result && (
                    <span className="text-scale-caption font-bold text-green-500 bg-green-500/20 px-2 py-1 rounded-full">
                      {(challenge as any).result.score}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State - Only in send mode */}
        {playMode === 'send' && challenges.length === 0 && wordRequests.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <div className="text-6xl mb-4">🎮</div>
            <p className="font-bold">{t('tutorGames.empty.noChallenges')}</p>
            <p className="text-scale-label">{t('tutorGames.empty.createFirst', { name: partnerName })}</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showQuizModal && (
        <CreateQuizChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerName={partnerName}
          onClose={() => setShowQuizModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showQuickFireModal && (
        <CreateQuickFireChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerScores={partnerScores}
          partnerName={partnerName}
          onClose={() => setShowQuickFireModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showWordRequestModal && (
        <WordRequestCreator
          profile={profile}
          partnerName={partnerName}
          partnerVocab={partnerVocab}
          onClose={() => setShowWordRequestModal(false)}
          onCreated={handleWordRequestCreated}
        />
      )}

      {/* Rate Limit Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="validation"
        onContinueBasic={() => setUseBasicValidation(true)}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
              {t('play.exitConfirm.title', 'Exit Game?')}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {t('play.exitConfirm.message', 'Your progress in this session will be lost. Are you sure you want to exit?')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-[var(--bg-secondary)] text-[var(--text-primary)]"
              >
                {t('play.exitConfirm.cancel', 'Keep Playing')}
              </button>
              <button
                onClick={resetLocalGame}
                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white"
              >
                {t('play.exitConfirm.confirm', 'Exit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorGames;
