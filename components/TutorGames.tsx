import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, TutorChallenge, WordRequest, DictionaryEntry, WordScore } from '../types';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import CreateQuizChallenge from './CreateQuizChallenge';
import CreateQuickFireChallenge from './CreateQuickFireChallenge';
import WordRequestCreator from './WordRequestCreator';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { normalizeAnswer, validateAnswerSmart } from '../utils/answer-helpers';

// Save Progress Dialog Component
interface SaveProgressDialogProps {
  partnerName: string;
  isFirstTime: boolean;
  onSave: (remember: boolean) => void;
  onCancel: () => void;
  saving: boolean;
}

const SaveProgressDialog: React.FC<SaveProgressDialogProps> = ({
  partnerName,
  isFirstTime,
  onSave,
  onCancel,
  saving
}) => {
  const { t } = useTranslation();
  const [rememberChoice, setRememberChoice] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
          </div>

          <h3 className="text-scale-heading font-bold text-[var(--text-primary)] mb-2">
            {t('tutorGames.saveDialog.title', { name: partnerName })}
          </h3>

          {isFirstTime ? (
            <div className="text-left bg-[var(--bg-primary)] rounded-xl p-4 mb-4 text-scale-label text-[var(--text-secondary)]">
              <p className="mb-2">
                <strong className="text-[var(--text-primary)]">{t('tutorGames.saveDialog.howItWorks')}</strong>
              </p>
              <ul className="space-y-1 text-scale-caption">
                <li>• {t('tutorGames.saveDialog.detail1', { name: partnerName })}</li>
                <li>• {t('tutorGames.saveDialog.detail2')}</li>
                <li>• {t('tutorGames.saveDialog.detail3')}</li>
              </ul>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-scale-label mb-4">
              {t('tutorGames.saveDialog.willUpdate', { name: partnerName })}
            </p>
          )}

          {/* Remember checkbox */}
          <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={e => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--accent-color)]"
            />
            <span className="text-scale-caption text-[var(--text-secondary)]">
              {t('tutorGames.saveDialog.remember', { name: partnerName })}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold hover:bg-[var(--bg-primary)] transition-all disabled:opacity-50"
            >
              {t('tutorGames.saveDialog.notNow')}
            </button>
            <button
              onClick={() => onSave(rememberChoice)}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? t('tutorGames.gameOver.saving') : t('tutorGames.saveDialog.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TutorGamesProps {
  profile: Profile;
}

interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it';
  isCorrect: boolean;
  explanation?: string;
}

type PlayMode = 'send' | 'local';

const SAVE_PREF_KEY = 'tutor_save_to_student_progress';

const TutorGames: React.FC<TutorGamesProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { targetLanguage, nativeLanguage, languageParams, targetName, nativeName } = useLanguage();
  const [challenges, setChallenges] = useState<TutorChallenge[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
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

  // Local game states
  const [localGameActive, setLocalGameActive] = useState<'quiz' | 'quickfire' | 'multiple_choice' | 'type_it' | null>(null);
  const [localGameWords, setLocalGameWords] = useState<DictionaryEntry[]>([]);
  const [localGameIndex, setLocalGameIndex] = useState(0);
  const [localGameScore, setLocalGameScore] = useState({ correct: 0, incorrect: 0 });
  const [localGameFlipped, setLocalGameFlipped] = useState(false);
  const [localQuickFireTimeLeft, setLocalQuickFireTimeLeft] = useState(60);
  const [localQuickFireInput, setLocalQuickFireInput] = useState('');
  const [localQuickFireStarted, setLocalQuickFireStarted] = useState(false);

  // Multiple Choice state
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcShowFeedback, setMcShowFeedback] = useState(false);

  // Type It state
  const [typeItAnswer, setTypeItAnswer] = useState('');
  const [typeItSubmitted, setTypeItSubmitted] = useState(false);
  const [typeItCorrect, setTypeItCorrect] = useState(false);
  const [typeItExplanation, setTypeItExplanation] = useState('');

  // Session tracking for save to student progress
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [savingProgress, setSavingProgress] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

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
  const getSavePreference = (): 'always' | 'never' | 'ask' | null => {
    return localStorage.getItem(SAVE_PREF_KEY) as 'always' | 'never' | 'ask' | null;
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

    setShowSaveDialog(false);
  };

  const startLocalQuiz = () => {
    // Pick 10 random words, prioritizing weak ones
    const weakWords = partnerVocab.filter(w => {
      const score = partnerScores.get(w.id);
      return score && (score.fail_count > 0 || (score.correct_streak || 0) < 3);
    });
    const otherWords = partnerVocab.filter(w => !weakWords.includes(w));
    const selectedWords = [...shuffleArray(weakWords).slice(0, 5), ...shuffleArray(otherWords).slice(0, 5)];
    setLocalGameWords(shuffleArray(selectedWords).slice(0, 10));
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalGameFlipped(false);
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
    setLocalQuickFireInput('');
    setLocalQuickFireStarted(false);
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
    generateMcOptionsFor(shuffled, 0);
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
    setTypeItAnswer('');
    setTypeItSubmitted(false);
    setTypeItCorrect(false);
    setTypeItExplanation('');
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('type_it');
  };

  const generateMcOptionsFor = (words: DictionaryEntry[], index: number) => {
    const currentWord = words[index];
    const wrongOptions = partnerVocab
      .filter(w => w.id !== currentWord.id)
      .map(w => w.translation);
    const shuffledWrong = shuffleArray(wrongOptions).slice(0, 3);
    const allOptions = shuffleArray([currentWord.translation, ...shuffledWrong]);
    setMcOptions(allOptions);
    setMcSelected(null);
    setMcShowFeedback(false);
  };

  const handleMcSelect = (option: string) => {
    if (mcShowFeedback) return;
    setMcSelected(option);
    setMcShowFeedback(true);
    const currentWord = localGameWords[localGameIndex];
    const isCorrect = option === currentWord.translation;
    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    // Track answer
    setSessionAnswers(prev => [...prev, {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect
    }]);
    setTimeout(() => {
      if (localGameIndex < localGameWords.length - 1) {
        const nextIndex = localGameIndex + 1;
        setLocalGameIndex(nextIndex);
        generateMcOptionsFor(localGameWords, nextIndex);
      }
    }, isCorrect ? 800 : 1500);
  };

  const handleTypeItSubmit = async () => {
    if (typeItSubmitted) {
      // Move to next question
      if (localGameIndex < localGameWords.length - 1) {
        setLocalGameIndex(prev => prev + 1);
        setTypeItAnswer('');
        setTypeItSubmitted(false);
        setTypeItCorrect(false);
        setTypeItExplanation('');
      } else {
        // Last question - clear submitted state to trigger re-render
        // isGameOver will be true and game over screen will show
        setTypeItSubmitted(false);
      }
      return;
    }
    const currentWord = localGameWords[localGameIndex];

    // Use smart validation if enabled, otherwise local matching
    let isCorrect: boolean;
    let explanation = '';
    if (profile.smart_validation) {
      const result = await validateAnswerSmart(typeItAnswer, currentWord.translation, { targetWord: currentWord.word, languageParams: { targetLanguage, nativeLanguage } });
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      // Use diacritics-normalized comparison for consistency
      isCorrect = normalizeAnswer(typeItAnswer) === normalizeAnswer(currentWord.translation);
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    setTypeItSubmitted(true);
    setTypeItCorrect(isCorrect);
    setTypeItExplanation(explanation);
    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    // Track answer
    setSessionAnswers(prev => [...prev, {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: typeItAnswer,
      questionType: 'type_it',
      isCorrect,
      explanation
    }]);
  };

  const handleLocalQuizResponse = (correct: boolean) => {
    const currentWord = localGameWords[localGameIndex];
    setLocalGameScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1)
    }));
    // Track answer
    setSessionAnswers(prev => [...prev, {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      questionType: 'flashcard',
      isCorrect: correct
    }]);
    setLocalGameFlipped(false);
    if (localGameIndex < localGameWords.length - 1) {
      setTimeout(() => setLocalGameIndex(prev => prev + 1), 300);
    } else {
      // Game over - keep showing results
    }
  };

  const handleLocalQuickFireAnswer = async () => {
    if (!localQuickFireInput.trim()) return;
    const currentWord = localGameWords[localGameIndex];

    // Use smart validation if enabled, otherwise local matching
    let isCorrect: boolean;
    let explanation = '';
    if (profile.smart_validation) {
      const result = await validateAnswerSmart(localQuickFireInput, currentWord.translation, { targetWord: currentWord.word, languageParams: { targetLanguage, nativeLanguage } });
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      // Use diacritics-normalized comparison for consistency
      isCorrect = normalizeAnswer(localQuickFireInput) === normalizeAnswer(currentWord.translation);
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    // Track answer
    setSessionAnswers(prev => [...prev, {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: localQuickFireInput,
      questionType: 'type_it',
      isCorrect,
      explanation
    }]);
    setLocalQuickFireInput('');

    if (localGameIndex < localGameWords.length - 1) {
      setLocalGameIndex(prev => prev + 1);
    }
  };

  const resetLocalGame = () => {
    setLocalGameActive(null);
    setLocalGameWords([]);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalGameFlipped(false);
    setLocalQuickFireStarted(false);
    setMcOptions([]);
    setMcSelected(null);
    setMcShowFeedback(false);
    setTypeItAnswer('');
    setTypeItSubmitted(false);
    setTypeItCorrect(false);
    setTypeItExplanation('');
  };

  const restartCurrentGame = () => {
    if (localGameActive === 'quiz') startLocalQuiz();
    else if (localGameActive === 'quickfire') startLocalQuickFire();
    else if (localGameActive === 'multiple_choice') startLocalMultipleChoice();
    else if (localGameActive === 'type_it') startLocalTypeIt();
  };

  // QuickFire timer effect
  React.useEffect(() => {
    if (localGameActive === 'quickfire' && localQuickFireStarted && localQuickFireTimeLeft > 0) {
      const timer = setTimeout(() => setLocalQuickFireTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [localGameActive, localQuickFireStarted, localQuickFireTimeLeft]);

  // Auto-save effect when preference is 'always'
  React.useEffect(() => {
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length
      && localGameWords.length > 0;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0 && localQuickFireStarted;
    const quickFireComplete = localGameActive === 'quickfire' && localGameIndex >= localGameWords.length - 1 && totalAnswered === localGameWords.length && localGameWords.length > 0;

    if ((isGameOver || quickFireTimeUp || quickFireComplete) && getSavePreference() === 'always' && !savedSuccess && !savingProgress && sessionAnswers.length > 0) {
      const gameMode = localGameActive === 'quiz' ? 'flashcards' :
                       localGameActive === 'quickfire' ? 'quick_fire' :
                       localGameActive || 'flashcards';
      saveGameSessionToStudent(gameMode, sessionAnswers, localGameScore.correct, localGameScore.incorrect);
    }
  }, [localGameActive, localGameIndex, localGameScore, localQuickFireTimeLeft, localQuickFireStarted, localGameWords.length, sessionAnswers.length]);

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

  // Local game is active - render game UI
  if (localGameActive) {
    const currentWord = localGameWords[localGameIndex];
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;
    const quickFireComplete = localGameActive === 'quickfire' && localGameIndex >= localGameWords.length - 1 && totalAnswered === localGameWords.length;

    // Game Over Screen
    if (isGameOver || quickFireTimeUp || quickFireComplete) {
      const total = localGameScore.correct + localGameScore.incorrect;
      const percentage = total > 0 ? Math.round((localGameScore.correct / total) * 100) : 0;
      const pref = getSavePreference();
      const isFirstTime = isFirstTimeSave();

      return (
        <div className="h-full flex items-center justify-center p-4 bg-[var(--bg-primary)]">
          <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full">
            <div className="text-6xl mb-4">{percentage >= 70 ? '🎉' : '💪'}</div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
              {percentage >= 70 ? t('tutorGames.gameOver.greatJob') : t('tutorGames.gameOver.keepPracticing')}
            </h2>
            <div className="text-5xl font-black text-[var(--accent-color)] mb-4">{percentage}%</div>
            <p className="text-[var(--text-secondary)] mb-4">
              {t('tutorGames.gameOver.correct', { correct: localGameScore.correct, total })}
            </p>

            {/* Save to Student Progress Section */}
            {profile.linked_user_id && !savedSuccess && pref !== 'always' && (
              <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                <p className="text-scale-caption text-[var(--text-secondary)] mb-3">
                  {isFirstTime ? (
                    <>
                      <span className="font-bold text-[var(--text-primary)]">{t('tutorGames.gameOver.practicedTogether')}</span>
                      <br />
                      {t('tutorGames.gameOver.saveDescription', { name: partnerName })}
                    </>
                  ) : (
                    <>{t('tutorGames.gameOver.saveToProgress', { name: partnerName })}?</>
                  )}
                </p>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={savingProgress}
                  className="w-full py-2 px-4 bg-[var(--accent-color)] text-white rounded-lg font-bold text-scale-label hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingProgress ? (
                    <>{t('tutorGames.gameOver.saving')}</>
                  ) : (
                    <>
                      <ICONS.Heart className="w-4 h-4" />
                      {t('tutorGames.gameOver.saveToProgress', { name: partnerName })}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success message */}
            {savedSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-scale-label text-green-700 dark:text-green-400 font-bold flex items-center justify-center gap-2">
                  <ICONS.Check className="w-4 h-4" />
                  {t('tutorGames.gameOver.savedSuccess', { name: partnerName })}
                </p>
              </div>
            )}

            {/* Auto-saved message for 'always' preference */}
            {pref === 'always' && !savedSuccess && !savingProgress && (
              <div className="mb-4 p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--accent-border)]">
                <p className="text-scale-caption text-[var(--accent-color)]">
                  {t('tutorGames.gameOver.autoSaving', { name: partnerName })}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={resetLocalGame}
                className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
              >
                {t('tutorGames.gameOver.done')}
              </button>
              <button
                onClick={restartCurrentGame}
                className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)]"
              >
                {t('tutorGames.gameOver.playAgain')}
              </button>
            </div>
          </div>

          {/* Save Preference Dialog */}
          {showSaveDialog && (
            <SaveProgressDialog
              partnerName={partnerName}
              isFirstTime={isFirstTime}
              onSave={(remember) => handleSavePreference(true, remember)}
              onCancel={() => setShowSaveDialog(false)}
              saving={savingProgress}
            />
          )}
        </div>
      );
    }

    // Local Quiz Game
    if (localGameActive === 'quiz') {
      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={resetLocalGame} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
                <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <div className="flex gap-2">
                <span className="text-green-500 font-bold">{localGameScore.correct}</span>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-red-400 font-bold">{localGameScore.incorrect}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-color)] transition-all"
                style={{ width: `${((localGameIndex + 1) / localGameWords.length) * 100}%` }}
              />
            </div>

            {/* Flashcard */}
            <div
              onClick={() => setLocalGameFlipped(!localGameFlipped)}
              className="relative aspect-[4/5] cursor-pointer perspective-1000"
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${localGameFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 bg-[var(--bg-card)] rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-lg backface-hidden border border-[var(--border-color)]">
                  <span className="text-scale-micro uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-4">{targetName}</span>
                  <h2 className="text-4xl font-black text-[var(--accent-color)] text-center">{currentWord?.word}</h2>
                  <p className="text-[var(--text-secondary)] text-scale-label mt-8">{t('tutorGames.flashcard.tapToReveal')}</p>
                </div>
                {/* Back */}
                <div className="absolute inset-0 bg-[var(--accent-color)] text-white rounded-[2rem] p-8 flex flex-col items-center justify-center shadow-lg backface-hidden rotate-y-180">
                  <span className="text-scale-micro uppercase tracking-widest text-white/60 font-bold mb-4">{nativeName}</span>
                  <h2 className="text-4xl font-black text-center">{currentWord?.translation}</h2>
                  <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLocalQuizResponse(false); }}
                      className="py-3 bg-[var(--bg-card)]/20 rounded-xl font-bold text-scale-label hover:bg-[var(--bg-card)]/30"
                    >
                      ❌ {t('tutorGames.flashcard.hard')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLocalQuizResponse(true); }}
                      className="py-3 bg-[var(--bg-card)] rounded-xl font-bold text-scale-label text-[var(--accent-color)]"
                    >
                      ✓ {t('tutorGames.flashcard.gotIt')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <style>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
          `}</style>
        </div>
      );
    }

    // Local Quick Fire Game
    if (localGameActive === 'quickfire') {
      if (!localQuickFireStarted) {
        return (
          <div className="h-full flex items-center justify-center p-4 bg-[var(--bg-primary)]">
            <div className="bg-[var(--bg-card)] p-8 rounded-[2rem] shadow-xl text-center max-w-sm w-full">
              <div className="text-6xl mb-4">⚡</div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">{t('tutorGames.quickFireGame.title')}</h2>
              <p className="text-[var(--text-secondary)] text-scale-body mb-6">
                {t('tutorGames.quickFireGame.description')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetLocalGame}
                  className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
                >
                  {t('tutorGames.quickFireGame.cancel')}
                </button>
                <button
                  onClick={() => setLocalQuickFireStarted(true)}
                  className="flex-1 py-3 px-4 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600"
                >
                  {t('tutorGames.quickFireGame.start')}
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Timer Bar */}
            <div className="h-3 bg-[var(--bg-primary)] rounded-full mb-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${
                  localQuickFireTimeLeft > 20 ? 'bg-amber-500' :
                  localQuickFireTimeLeft > 10 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${(localQuickFireTimeLeft / 60) * 100}%` }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={resetLocalGame} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
                <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <span className={`text-3xl font-black ${localQuickFireTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-amber-500'}`}>
                {localQuickFireTimeLeft}s
              </span>
            </div>

            {/* Word */}
            <div className="bg-amber-50 p-8 rounded-2xl mb-6 text-center">
              <p className="text-4xl font-black text-amber-600">{currentWord?.word}</p>
            </div>

            {/* Input */}
            <input
              type="text"
              value={localQuickFireInput}
              onChange={e => setLocalQuickFireInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLocalQuickFireAnswer()}
              placeholder={t('tutorGames.quickFireGame.typeTranslation')}
              autoFocus
              className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />

            {/* Score */}
            <div className="mt-4 flex justify-center gap-6">
              <span className="text-green-500 font-bold">✓ {localGameScore.correct}</span>
              <span className="text-red-400 font-bold">✗ {localGameScore.incorrect}</span>
            </div>
          </div>
        </div>
      );
    }

    // Local Multiple Choice Game
    if (localGameActive === 'multiple_choice') {
      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={resetLocalGame} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
                <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <div className="flex gap-2">
                <span className="text-green-500 font-bold">{localGameScore.correct}</span>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-red-400 font-bold">{localGameScore.incorrect}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-color)] transition-all"
                style={{ width: `${((localGameIndex + 1) / localGameWords.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-lg border border-[var(--border-color)]">
              <span className="text-scale-micro font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6 bg-[var(--accent-light)] text-[var(--accent-color)]">
                {t('tutorGames.direction.label', { target: targetName, native: nativeName })}
              </span>

              <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
                {currentWord?.word}
              </h3>

              <div className="space-y-3">
                {mcOptions.map((option, idx) => {
                  const isCorrect = option === currentWord?.translation;
                  const isSelected = mcSelected === option;

                  let buttonStyle = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                  if (mcShowFeedback) {
                    if (isCorrect) {
                      buttonStyle = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                    } else {
                      buttonStyle = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMcSelect(option)}
                      disabled={mcShowFeedback}
                      className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${buttonStyle}`}
                    >
                      <span className="text-scale-caption font-bold text-[var(--text-secondary)] mr-3">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                      {mcShowFeedback && isCorrect && (
                        <ICONS.Check className="w-5 h-5 float-right text-green-500" />
                      )}
                      {mcShowFeedback && isSelected && !isCorrect && (
                        <ICONS.X className="w-5 h-5 float-right text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Local Type It Game
    if (localGameActive === 'type_it') {
      return (
        <div className="h-full flex flex-col p-4 bg-[var(--bg-primary)]">
          <div className="max-w-md mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={resetLocalGame} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl">
                <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
              <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                {localGameIndex + 1} / {localGameWords.length}
              </span>
              <div className="flex gap-2">
                <span className="text-green-500 font-bold">{localGameScore.correct}</span>
                <span className="text-[var(--text-secondary)]">/</span>
                <span className="text-red-400 font-bold">{localGameScore.incorrect}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 bg-[var(--bg-primary)] rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-[var(--accent-color)] transition-all"
                style={{ width: `${((localGameIndex + 1) / localGameWords.length) * 100}%` }}
              />
            </div>

            {/* Question Card */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-lg border border-[var(--border-color)]">
              <span className="text-scale-micro font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6 bg-[var(--accent-light)] text-[var(--accent-color)]">
                {t('tutorGames.direction.label', { target: targetName, native: nativeName })}
              </span>

              <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">
                {currentWord?.word}
              </h3>

              {typeItSubmitted && (
                <div className={`text-center mb-4 p-3 rounded-xl ${
                  typeItCorrect ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}>
                  {typeItCorrect ? (
                    <div>
                      <div className="flex items-center justify-center gap-2">
                        <ICONS.Check className="w-5 h-5" />
                        <span className="font-bold">{t('tutorGames.typeItGame.correct')}</span>
                      </div>
                      {typeItExplanation && typeItExplanation !== 'Exact match' && (
                        <p className="text-scale-label mt-1 opacity-80">{typeItExplanation}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <ICONS.X className="w-5 h-5" />
                        <span className="font-bold">{t('tutorGames.typeItGame.notQuite')}</span>
                      </div>
                      <p className="text-scale-label">
                        {t('tutorGames.typeItGame.correctAnswer', { answer: currentWord?.translation })}
                      </p>
                      {typeItExplanation && typeItExplanation !== 'No match' && (
                        <p className="text-scale-label mt-1 opacity-80">{typeItExplanation}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6">
                <input
                  type="text"
                  value={typeItAnswer}
                  onChange={(e) => setTypeItAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTypeItSubmit()}
                  placeholder={t('tutorGames.typeItGame.typeIn', { language: nativeName })}
                  disabled={typeItSubmitted}
                  className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  autoFocus
                />
              </div>

              <button
                onClick={handleTypeItSubmit}
                disabled={!typeItAnswer.trim() && !typeItSubmitted}
                className="w-full mt-6 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50 transition-all bg-[var(--accent-color)] hover:bg-[var(--accent-hover)]"
              >
                {typeItSubmitted ? t('tutorGames.typeItGame.next') : t('tutorGames.typeItGame.check')}
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header with Mode Toggle */}
        <div className="text-center">
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
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left"
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
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left"
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
            className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-teal-500/30 transition-all text-left"
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
    </div>
  );
};

export default TutorGames;
