import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry, WordScore, AIChallengeMode } from '../../../types';
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
  /** Available challenge modes with names/descriptions */
  challengeModes: ChallengeMode[];
  /** Word counts per mode */
  modeCounts: Record<AIChallengeMode, number>;
  /** Accent color */
  accentColor: string;
  /** Target language name */
  targetLanguageName: string;
  /** Native language name */
  nativeLanguageName: string;
  /** Whether currently loading phrases */
  loadingPhrases?: boolean;
  /** Called when challenge is ready to start */
  onStartChallenge: (mode: AIChallengeMode, sessionLength: SessionLength) => Promise<ChallengeQuestion[]>;
  /** Called when user answers */
  onAnswer: (result: AnswerResult & { explanation?: string }) => void;
  /** Called when challenge completes */
  onComplete: () => void;
  /** Called to exit back to game selection */
  onExit: () => void;
  /** Validate typed answer */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    question: ChallengeQuestion
  ) => Promise<{ accepted: boolean; explanation: string }>;
  /** Show incorrect shake animation */
  showIncorrectShake?: boolean;
  /** Trigger incorrect feedback (shake) */
  onIncorrectFeedback?: () => void;
}

type GamePhase = 'select' | 'playing' | 'finished';

/**
 * AI Challenge game mode - mixed question types with various challenge modes.
 * Supports weakest words, gauntlet, romantic phrases, least practiced, review mastered.
 */
export const AIChallenge: React.FC<AIChallengeProps> = ({
  challengeModes,
  modeCounts,
  accentColor,
  targetLanguageName,
  nativeLanguageName,
  loadingPhrases = false,
  onStartChallenge,
  onAnswer,
  onComplete,
  onExit,
  validateAnswer,
  showIncorrectShake = false,
  onIncorrectFeedback,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('select');
  const [selectedMode, setSelectedMode] = useState<AIChallengeMode | null>(null);
  const [sessionLength, setSessionLength] = useState<SessionLength | null>(null);
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Question state
  const [flipped, setFlipped] = useState(false);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcFeedback, setMcFeedback] = useState(false);
  const [typeAnswer, setTypeAnswer] = useState('');
  const [typeSubmitted, setTypeSubmitted] = useState(false);
  const [typeCorrect, setTypeCorrect] = useState(false);
  const [typeExplanation, setTypeExplanation] = useState('');
  const [isValidating, setIsValidating] = useState(false);

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
  }, []);

  const handleStart = useCallback(async () => {
    if (!selectedMode || !sessionLength) return;

    const generatedQuestions = await onStartChallenge(selectedMode, sessionLength);
    if (generatedQuestions.length === 0) {
      alert(t('play.aiChallenge.noQuestions'));
      return;
    }

    setQuestions(generatedQuestions);
    setCurrentIndex(0);
    resetQuestionState();
    setPhase('playing');
  }, [selectedMode, sessionLength, onStartChallenge, resetQuestionState, t]);

  const advanceOrFinish = useCallback(() => {
    if (isLastQuestion) {
      setPhase('finished');
      onComplete();
    } else {
      setCurrentIndex(i => i + 1);
      resetQuestionState();
    }
  }, [isLastQuestion, onComplete, resetQuestionState]);

  // Flashcard handlers
  const handleFlashcardResponse = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return;

    onAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      questionType: 'flashcard',
      isCorrect,
    });

    setFlipped(false);
    setTimeout(() => advanceOrFinish(), 300);
  }, [currentQuestion, onAnswer, advanceOrFinish]);

  // Multiple choice handlers
  const handleMcSelect = useCallback(async (option: string) => {
    if (!currentQuestion || mcFeedback) return;

    setMcSelected(option);
    setMcFeedback(true);

    const isCorrect = option === currentQuestion.translation;

    if (!isCorrect) {
      onIncorrectFeedback?.();
    }

    onAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect,
    });

    setTimeout(() => advanceOrFinish(), isCorrect ? 800 : 1500);
  }, [currentQuestion, mcFeedback, onAnswer, advanceOrFinish, onIncorrectFeedback]);

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
      const result = await validateAnswer(typeAnswer, currentQuestion.translation, currentQuestion);
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      isCorrect = typeAnswer.trim().toLowerCase() === currentQuestion.translation.toLowerCase();
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    setIsValidating(false);

    if (!isCorrect) {
      onIncorrectFeedback?.();
    }

    setTypeSubmitted(true);
    setTypeCorrect(isCorrect);
    setTypeExplanation(explanation);

    onAnswer({
      wordId: currentQuestion.wordId || currentQuestion.id,
      wordText: currentQuestion.word,
      correctAnswer: currentQuestion.translation,
      userAnswer: typeAnswer,
      questionType: 'type_it',
      isCorrect,
      explanation,
    });
  }, [currentQuestion, typeSubmitted, typeAnswer, isValidating, validateAnswer, onAnswer, advanceOrFinish, onIncorrectFeedback]);

  // Mode selection screen
  if (phase === 'select') {
    return (
      <div className="w-full">
        <h2 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-4">
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
              <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-2">
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
              <div className="absolute inset-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
                <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-8">
                  {targetLanguageName.toUpperCase()}
                </span>
                <h3 className="text-4xl font-black text-[var(--text-primary)]">{currentQuestion.word}</h3>
                <p className="mt-12 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">
                  Tap to reveal
                </p>
              </div>
              <div
                className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180"
                style={{ backgroundColor: accentColor }}
              >
                <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">
                  {nativeLanguageName.toUpperCase()}
                </span>
                <h3 className="text-4xl font-black">{currentQuestion.translation}</h3>
                <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(false); }}
                    className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-scale-caption font-black uppercase tracking-widest"
                  >
                    <ICONS.X className="w-4 h-4" /> Hard
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(true); }}
                    className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-scale-caption"
                    style={{ color: accentColor }}
                  >
                    <ICONS.Check className="w-4 h-4" /> Got it!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Multiple Choice question */}
        {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
          <div className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${showIncorrectShake ? 'animate-shake' : ''}`}>
            <span
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {targetLanguageName} → {nativeLanguageName}
            </span>
            <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
              {currentQuestion.word}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isCorrect = opt === currentQuestion.translation;
                const isSelected = mcSelected === opt;

                let style = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                if (mcFeedback) {
                  if (isCorrect) {
                    style = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                  } else if (isSelected) {
                    style = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
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
          <div className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${showIncorrectShake ? 'animate-shake' : ''}`}>
            <span
              className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {targetLanguageName} → {nativeLanguageName}
            </span>
            <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">
              {currentQuestion.word}
            </h3>

            {typeSubmitted && (
              <div className={`text-center mb-4 p-3 rounded-xl ${
                typeCorrect
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
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
