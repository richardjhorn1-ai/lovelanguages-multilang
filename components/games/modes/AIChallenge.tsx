'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry, WordScore, AIChallengeMode, RomanticPhrase } from '../../../types';
import { getRomanticPhrases } from '../../../services/romantic-phrases';
import { speak } from '../../../services/audio';
import type { AnswerResult } from './types';

type SessionLength = 10 | 20 | 'all';
type ChallengeQuestionType = 'flashcard' | 'multiple_choice' | 'type_it';

interface ChallengeQuestion {
  id: string;
  type: ChallengeQuestionType;
  word: string;
  translation: string;
  wordId?: string;
  phraseId?: string;
  options?: string[];
}

interface ChallengeMode {
  id: AIChallengeMode;
  name: string;
  description: string;
  icon: keyof typeof ICONS;
}

interface AIChallengeProps {
  /** All available words */
  words: DictionaryEntry[];
  /** Word scores map for sorting */
  scoresMap: Map<string, WordScore>;
  /** Available challenge modes with names/descriptions */
  challengeModes: ChallengeMode[];
  /** Accent color */
  accentColor: string;
  /** Target language code */
  targetLanguage: string;
  /** Native language code */
  nativeLanguage: string;
  /** Target language display name */
  targetLanguageName: string;
  /** Native language display name */
  nativeLanguageName: string;
  /** User's current tier for difficulty */
  userTier: string;
  /** Called when user answers */
  onAnswer: (result: AnswerResult) => void;
  /** Called when challenge completes */
  onComplete: (results: { answers: AnswerResult[]; score: { correct: number; incorrect: number } }) => void;
  /** Called to exit back to game selection */
  onExit: () => void;
  /** Called when game starts */
  onStart?: () => void;
  /** Validate typed answer */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    context: { word: string; translation: string }
  ) => Promise<{ accepted: boolean; explanation: string }>;
  /** Update word score after answer */
  onUpdateWordScore?: (wordId: string, isCorrect: boolean) => Promise<unknown>;
}

type GamePhase = 'select' | 'playing' | 'finished';

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * AI Challenge game mode - mixed question types with various challenge modes.
 * Self-contained: handles word sorting, phrase fetching, and question generation.
 */
export const AIChallenge: React.FC<AIChallengeProps> = ({
  words,
  scoresMap,
  challengeModes,
  accentColor,
  targetLanguage,
  nativeLanguage,
  targetLanguageName,
  nativeLanguageName,
  userTier,
  onAnswer,
  onComplete,
  onExit,
  onStart,
  validateAnswer,
  onUpdateWordScore,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('select');
  const [selectedMode, setSelectedMode] = useState<AIChallengeMode | null>(null);
  const [sessionLength, setSessionLength] = useState<SessionLength | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingPhrases, setLoadingPhrases] = useState(false);

  // Question state
  const [flipped, setFlipped] = useState(false);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcFeedback, setMcFeedback] = useState(false);
  const [typeAnswer, setTypeAnswer] = useState('');
  const [typeSubmitted, setTypeSubmitted] = useState(false);
  const [typeCorrect, setTypeCorrect] = useState(false);
  const [typeExplanation, setTypeExplanation] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showShake, setShowShake] = useState(false);

  // Session tracking
  const [sessionAnswers, setSessionAnswers] = useState<AnswerResult[]>([]);
  const [sessionScore, setSessionScore] = useState({ correct: 0, incorrect: 0 });

  // Compute word pools and counts
  const { modeCounts, wordPools } = useMemo(() => {
    const unlearnedWords = words.filter(w => !scoresMap.get(w.id)?.learned_at);
    const learnedWords = words.filter(w => scoresMap.get(w.id)?.learned_at != null);

    // Sort for weakest (most incorrect attempts)
    const weakest = [...unlearnedWords].sort((a, b) => {
      const scoreA = scoresMap.get(a.id);
      const scoreB = scoresMap.get(b.id);
      const incorrectA = (scoreA?.total_attempts || 0) - (scoreA?.correct_attempts || 0);
      const incorrectB = (scoreB?.total_attempts || 0) - (scoreB?.correct_attempts || 0);
      return incorrectB - incorrectA;
    });

    // Sort for least practiced
    const leastPracticed = [...unlearnedWords].sort((a, b) => {
      const scoreA = scoresMap.get(a.id);
      const scoreB = scoresMap.get(b.id);
      if (!scoreA?.last_practiced) return -1;
      if (!scoreB?.last_practiced) return 1;
      return new Date(scoreA.last_practiced).getTime() - new Date(scoreB.last_practiced).getTime();
    });

    return {
      modeCounts: {
        weakest: weakest.length,
        gauntlet: unlearnedWords.length,
        romantic: 20, // Always show 20 available for romantic
        least_practiced: leastPracticed.length,
        review_mastered: learnedWords.length,
      } as Record<AIChallengeMode, number>,
      wordPools: {
        weakest,
        gauntlet: shuffleArray(unlearnedWords),
        romantic: [] as DictionaryEntry[],
        least_practiced: leastPracticed,
        review_mastered: shuffleArray(learnedWords),
      } as Record<AIChallengeMode, DictionaryEntry[]>,
    };
  }, [words, scoresMap]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  const resetQuestionState = useCallback(() => {
    setFlipped(false);
    setMcSelected(null);
    setMcFeedback(false);
    setTypeAnswer('');
    setTypeSubmitted(false);
    setTypeCorrect(false);
    setTypeExplanation('');
    setShowShake(false);
  }, []);

  const triggerShake = useCallback(() => {
    setShowShake(true);
    setTimeout(() => setShowShake(false), 500);
  }, []);

  // Generate questions for selected mode
  const generateQuestions = useCallback(async (
    mode: AIChallengeMode,
    length: SessionLength
  ): Promise<ChallengeQuestion[]> => {
    let wordPool = wordPools[mode];
    let phrasePool: RomanticPhrase[] = [];

    // Handle romantic phrases
    if (mode === 'romantic') {
      setLoadingPhrases(true);
      try {
        const difficulty = userTier === 'Beginner' ? 'beginner' :
                          (userTier === 'Elementary' || userTier === 'Conversational') ? 'intermediate' : 'advanced';
        const count = length === 'all' ? 20 : length as number;
        phrasePool = await getRomanticPhrases(targetLanguage, nativeLanguage, count, difficulty);
      } catch (error) {
        console.error('Failed to load romantic phrases:', error);
        setLoadingPhrases(false);
        return [];
      }
      setLoadingPhrases(false);
    }

    const maxCount = mode === 'romantic' ? phrasePool.length : wordPool.length;
    const count = length === 'all' ? maxCount : Math.min(length as number, maxCount);
    const generated: ChallengeQuestion[] = [];

    if (mode === 'romantic') {
      phrasePool.slice(0, count).forEach((phrase, idx) => {
        generated.push({
          id: `q-${idx}`,
          type: 'type_it',
          word: phrase.word,
          translation: phrase.translation,
          phraseId: phrase.id,
        });
      });
    } else {
      wordPool.slice(0, count).forEach((word, idx) => {
        // Gauntlet uses random types, others favor type_it/multiple_choice
        let qType: ChallengeQuestionType = mode === 'gauntlet'
          ? (['flashcard', 'multiple_choice', 'type_it'] as const)[Math.floor(Math.random() * 3)]
          : Math.random() > 0.6 ? 'type_it' : 'multiple_choice';

        const q: ChallengeQuestion = {
          id: `q-${idx}`,
          type: qType,
          word: word.word,
          translation: word.translation,
          wordId: word.id,
        };

        // Generate options for multiple choice
        if (qType === 'multiple_choice' && words.length >= 4) {
          const otherTranslations = words
            .filter(w => w.id !== word.id)
            .map(w => w.translation);
          q.options = shuffleArray([
            word.translation,
            ...shuffleArray(otherTranslations).slice(0, 3)
          ]);
        } else if (qType === 'multiple_choice') {
          // Not enough words for MC, fall back to type_it
          q.type = 'type_it';
        }

        generated.push(q);
      });
    }

    return shuffleArray(generated);
  }, [wordPools, words, targetLanguage, nativeLanguage, userTier]);

  const handleStart = useCallback(async () => {
    if (!selectedMode || !sessionLength) return;

    const generatedQuestions = await generateQuestions(selectedMode, sessionLength);
    if (generatedQuestions.length === 0) {
      alert(t('play.aiChallenge.noQuestions', 'No questions available for this mode.'));
      return;
    }

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    setSessionAnswers([]);
    setSessionScore({ correct: 0, incorrect: 0 });
    resetQuestionState();
    setPhase('playing');
    onStart?.();
  }, [selectedMode, sessionLength, generateQuestions, resetQuestionState, onStart, t]);

  const recordAnswer = useCallback((result: AnswerResult) => {
    setSessionAnswers(prev => [...prev, result]);
    setSessionScore(prev => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (result.isCorrect ? 0 : 1),
    }));
    onAnswer(result);

    // Update word score if available
    if (result.wordId && onUpdateWordScore) {
      onUpdateWordScore(result.wordId, result.isCorrect);
    }
  }, [onAnswer, onUpdateWordScore]);

  const advanceOrFinish = useCallback(() => {
    if (isLastQuestion) {
      setPhase('finished');
      // Use timeout to ensure state updates are captured
      setTimeout(() => {
        onComplete({
          answers: sessionAnswers,
          score: sessionScore,
        });
      }, 100);
    } else {
      setCurrentIndex(i => i + 1);
      resetQuestionState();
    }
  }, [isLastQuestion, onComplete, sessionAnswers, sessionScore, resetQuestionState]);

  // Flashcard handlers
  const handleFlashcardResponse = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return;

    recordAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      questionType: 'flashcard',
      isCorrect,
    });

    setFlipped(false);
    setTimeout(() => advanceOrFinish(), 300);
  }, [currentQuestion, recordAnswer, advanceOrFinish]);

  // Multiple choice handlers
  const handleMcSelect = useCallback((option: string) => {
    if (!currentQuestion || mcFeedback) return;

    setMcSelected(option);
    setMcFeedback(true);

    const isCorrect = option === currentQuestion.translation;

    if (!isCorrect) {
      triggerShake();
    }

    recordAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect,
    });

    setTimeout(() => advanceOrFinish(), isCorrect ? 800 : 1500);
  }, [currentQuestion, mcFeedback, recordAnswer, advanceOrFinish, triggerShake]);

  // Type It handlers
  const handleTypeSubmit = useCallback(async () => {
    if (!currentQuestion) return;

    // If already submitted, advance
    if (typeSubmitted) {
      advanceOrFinish();
      return;
    }

    if (!typeAnswer.trim() || isValidating) return;

    setIsValidating(true);

    let isCorrect: boolean;
    let explanation = '';

    if (validateAnswer) {
      const result = await validateAnswer(
        typeAnswer,
        currentQuestion.translation,
        { word: currentQuestion.word, translation: currentQuestion.translation }
      );
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      isCorrect = typeAnswer.trim().toLowerCase() === currentQuestion.translation.toLowerCase();
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    setIsValidating(false);

    if (!isCorrect) {
      triggerShake();
    }

    setTypeSubmitted(true);
    setTypeCorrect(isCorrect);
    setTypeExplanation(explanation);

    recordAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      userAnswer: typeAnswer,
      questionType: 'type_it',
      isCorrect,
      explanation,
    });
  }, [currentQuestion, typeSubmitted, typeAnswer, isValidating, validateAnswer, recordAnswer, advanceOrFinish, triggerShake]);

  // Mode selection screen
  if (phase === 'select') {
    return (
      <div className="w-full">
        <h2 className="text-scale-caption font-black font-header uppercase tracking-widest text-[var(--text-secondary)] text-center mb-4">
          {t('play.aiChallenge.chooseMode')}
        </h2>

        <div className="flex gap-4">
          {/* Mode Selection */}
          <div className="flex-1 space-y-2">
            {challengeModes.map(cm => {
              const count = modeCounts[cm.id];
              const isDisabled = count === 0;
              const isSelected = selectedMode === cm.id;
              const IconComp = ICONS[cm.icon];

              return (
                <button
                  key={cm.id}
                  onClick={() => !isDisabled && setSelectedMode(cm.id)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-2xl text-left transition-all border-2 flex items-center gap-3 ${
                    isSelected
                      ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                      : isDisabled
                      ? 'border-[var(--border-color)] bg-[var(--bg-primary)] opacity-50 cursor-not-allowed'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-[var(--accent-light)]' : 'bg-[var(--bg-primary)]'
                  }`}>
                    <IconComp className={`w-5 h-5 ${isSelected ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-scale-label truncate ${
                        isSelected ? 'text-[var(--accent-color)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {cm.name}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent-light)] text-[var(--accent-color)] opacity-60'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                      }`}>
                        {count}
                      </span>
                    </div>
                    <p className="text-scale-caption text-[var(--text-secondary)] truncate">{cm.description}</p>
                  </div>
                  {isSelected && <ICONS.Check className="w-4 h-4 text-[var(--accent-color)] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Session Length */}
          {selectedMode && (
            <div className="w-32 shrink-0 flex flex-col">
              <h3 className="text-[9px] font-black font-header uppercase tracking-widest text-[var(--text-secondary)] text-center mb-2">
                {t('play.aiChallenge.length')}
              </h3>
              <div className="flex-1 flex flex-col gap-2">
                {([10, 20, 'all'] as SessionLength[]).map(len => {
                  const maxAvailable = modeCounts[selectedMode];
                  const actualCount = len === 'all' ? maxAvailable : Math.min(len as number, maxAvailable);

                  return (
                    <button
                      key={len}
                      onClick={() => setSessionLength(len)}
                      className={`flex-1 p-2 rounded-xl text-center transition-all border-2 ${
                        sessionLength === len
                          ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div className={`text-scale-heading font-black ${
                        sessionLength === len ? 'text-[var(--accent-color)]' : 'text-[var(--text-primary)]'
                      }`}>
                        {actualCount}
                      </div>
                      <div className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                        {len === 'all' ? t('play.aiChallenge.all') : t('play.aiChallenge.qs')}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {selectedMode && sessionLength && (
          loadingPhrases ? (
            <div className="text-center py-4 mt-4">
              <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-scale-label text-[var(--text-secondary)]">{t('play.aiChallenge.generatingPhrases')}</p>
            </div>
          ) : (
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-scale-label mt-4"
              style={{ backgroundColor: accentColor }}
            >
              {t('play.aiChallenge.startChallenge')}
            </button>
          )
        )}
      </div>
    );
  }

  // Playing screen
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="w-full">
        {/* Flashcard question */}
        {currentQuestion.type === 'flashcard' && (
          <div
            onClick={() => setFlipped(!flipped)}
            className="relative w-full aspect-[4/5] cursor-pointer perspective-1000"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 glass-card rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-8">
                  {targetLanguageName.toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  <h3 className="text-4xl font-black font-header text-[var(--text-primary)]">{currentQuestion.word}</h3>
                  <button
                    onClick={(e) => { e.stopPropagation(); speak(currentQuestion.word, targetLanguage); }}
                    className="p-2 rounded-full hover:bg-white/55 dark:hover:bg-white/12 transition-colors"
                    title={t('play.flashcard.listen')}
                  >
                    <ICONS.Volume2 className="w-6 h-6 text-[var(--text-secondary)]" />
                  </button>
                </div>
                <p className="mt-12 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">
                  {t('play.flashcards.tapToReveal', 'Tap to reveal')}
                </p>
              </div>
              <div
                className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180"
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">
                  {nativeLanguageName.toUpperCase()}
                </span>
                <h3 className="text-4xl font-black font-header">{currentQuestion.translation}</h3>
                <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(false); }}
                    className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-scale-caption font-black uppercase tracking-widest"
                  >
                    <ICONS.X className="w-4 h-4" /> {t('play.flashcards.hard', 'Hard')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(true); }}
                    className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-scale-caption"
                    style={{ color: accentColor }}
                  >
                    <ICONS.Check className="w-4 h-4" /> {t('play.flashcards.gotIt', 'Got it!')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Choice question */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <div className={`glass-card rounded-[2.5rem] p-8 ${showShake ? 'animate-shake' : ''}`}>
            <span
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {targetLanguageName} → {nativeLanguageName}
            </span>
            <div className="flex items-center justify-center gap-2 mb-8">
              <h3 className="text-3xl font-black font-header text-[var(--text-primary)] text-center">
                {currentQuestion.word}
              </h3>
              <button
                onClick={() => speak(currentQuestion.word, targetLanguage)}
                className="p-2 rounded-full hover:bg-white/55 dark:hover:bg-white/12 transition-colors"
                title={t('play.flashcard.listen')}
              >
                <ICONS.Volume2 className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isCorrect = opt === currentQuestion.translation;
                const isSelected = mcSelected === opt;

                let style = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                if (mcFeedback) {
                  if (isCorrect) {
                    style = 'border-green-400 bg-green-500/10 border-green-500/30 text-green-500';
                  } else if (isSelected) {
                    style = 'border-red-400 bg-red-500/10 border-red-500/30 text-red-500';
                  } else {
                    style = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleMcSelect(opt)}
                    disabled={mcFeedback}
                    className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${style}`}
                  >
                    <span className="text-scale-caption font-bold text-[var(--text-secondary)] mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {opt}
                    {mcFeedback && isCorrect && <ICONS.Check className="w-5 h-5 float-right text-green-500" />}
                    {mcFeedback && isSelected && !isCorrect && <ICONS.X className="w-5 h-5 float-right text-red-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Type It question */}
        {currentQuestion.type === 'type_it' && (
          <div className={`glass-card rounded-[2.5rem] p-8 ${showShake ? 'animate-shake' : ''}`}>
            <span
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {targetLanguageName} → {nativeLanguageName}
            </span>
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-3xl font-black font-header text-[var(--text-primary)] text-center">
                {currentQuestion.word}
              </h3>
              <button
                onClick={() => speak(currentQuestion.word, targetLanguage)}
                className="p-2 rounded-full hover:bg-white/55 dark:hover:bg-white/12 transition-colors"
                title={t('play.flashcard.listen')}
              >
                <ICONS.Volume2 className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {typeSubmitted && (
              <div className={`text-center mb-4 p-3 rounded-xl ${
                typeCorrect
                  ? 'bg-green-500/10 border-green-500/30 text-green-500'
                  : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}>
                {typeCorrect ? (
                  <div>
                    <div className="flex items-center justify-center gap-2">
                      <ICONS.Check className="w-5 h-5" />
                      <span className="font-bold">{t('play.typeIt.correct')}</span>
                    </div>
                    {typeExplanation && typeExplanation !== 'Exact match' && (
                      <p className="text-scale-label mt-1 opacity-80">{typeExplanation}</p>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ICONS.X className="w-5 h-5" />
                      <span className="font-bold">{t('play.typeIt.notQuite')}</span>
                    </div>
                    <p className="text-scale-label">
                      {t('play.typeIt.correctAnswer')} <span className="font-black">{currentQuestion.translation}</span>
                    </p>
                    {typeExplanation && typeExplanation !== 'No match' && (
                      <p className="text-scale-label mt-1 opacity-80">{typeExplanation}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              value={typeAnswer}
              onChange={(e) => setTypeAnswer(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTypeSubmit()}
              placeholder={t('play.typeIt.typeIn', { language: nativeLanguageName })}
              disabled={typeSubmitted || isValidating}
              className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center mt-4 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              autoFocus
            />
            <button
              onClick={handleTypeSubmit}
              disabled={(!typeAnswer.trim() && !typeSubmitted) || isValidating}
              className="w-full mt-4 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50"
              style={{ backgroundColor: accentColor }}
            >
              {isValidating
                ? t('play.typeIt.checking', 'Checking...')
                : typeSubmitted
                ? t('play.typeIt.next')
                : t('play.typeIt.check')}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Finished - parent handles results display
  return null;
};

export default AIChallenge;
