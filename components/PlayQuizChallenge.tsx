import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { TutorChallenge, QuizConfig } from '../types';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../services/sounds';

interface PlayQuizChallengeProps {
  challenge: TutorChallenge;
  partnerName: string;
  onClose: () => void;
  onComplete: () => void;
  smartValidation?: boolean;
}

// Normalize answer for local matching (handles diacritics)
function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

// Smart validation API call
async function validateAnswerSmart(
  userAnswer: string,
  correctAnswer: string,
  targetWord?: string
): Promise<{ accepted: boolean; explanation: string }> {
  // Fast local match first
  if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
    return { accepted: true, explanation: 'Exact match' };
  }

  try {
    const response = await fetch('/api/validate-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userAnswer,
        correctAnswer,
        targetWord,
        direction: 'target_to_native'
      })
    });

    if (!response.ok) return { accepted: false, explanation: 'Validation error' };
    const result = await response.json();
    return { accepted: result.accepted, explanation: result.explanation || 'Validated' };
  } catch {
    return { accepted: false, explanation: 'Validation error' };
  }
}

interface Question {
  wordId: string;
  word: string;
  translation: string;
  type: 'multiple_choice' | 'type_it' | 'flashcard';
  options?: string[];
}

const PlayQuizChallenge: React.FC<PlayQuizChallengeProps> = ({
  challenge,
  partnerName,
  onClose,
  onComplete,
  smartValidation = true
}) => {
  const [started, setStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const { t } = useTranslation();
  const { targetName } = useLanguage();

  useEffect(() => {
    if (started) {
      generateQuestions();
    }
  }, [started]);

  const generateQuestions = () => {
    const config = challenge.config as QuizConfig;
    const words = challenge.words_data || [];
    const types = config.questionTypes || ['multiple_choice'];

    const qs: Question[] = words.map((word, index) => {
      const type = types[index % types.length];

      const question: Question = {
        wordId: word.id || (challenge.word_ids?.[index] as string) || '',
        word: word.word,
        translation: word.translation,
        type
      };

      if (type === 'multiple_choice') {
        // Generate wrong options
        const otherTranslations = words
          .filter(w => w.word !== word.word)
          .map(w => w.translation);
        const shuffled = shuffleArray(otherTranslations).slice(0, 3);
        question.options = shuffleArray([...shuffled, word.translation]);
      }

      return question;
    });

    setQuestions(shuffleArray(qs));
  };

  const handleStart = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      await fetch('/api/start-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ challengeId: challenge.id })
      });
    } catch (error) {
      console.error('Error starting challenge:', error);
    }
    setStarted(true);
  };

  const handleAnswer = async (answer: string, isCorrect?: boolean) => {
    const question = questions[currentIndex];

    // Determine if correct: use provided value, or validate the answer
    let correct: boolean;
    let explanation = '';
    if (isCorrect !== undefined) {
      // Flashcard self-assessment
      correct = isCorrect;
      explanation = correct ? 'Self-assessed correct' : 'Self-assessed incorrect';
    } else if (smartValidation && question.type === 'type_it') {
      // Smart validation for type_it questions
      const result = await validateAnswerSmart(answer, question.translation, question.word);
      correct = result.accepted;
      explanation = result.explanation;
    } else {
      // Local matching for multiple choice or when smart validation is off
      // Use diacritics-normalized comparison for consistency
      correct = normalizeAnswer(answer) === normalizeAnswer(question.translation);
      explanation = correct ? 'Exact match' : 'No match';
    }

    // Play feedback sound
    sounds.play('correct');

    const newAnswer = {
      wordId: question.wordId,
      word: question.word,
      correctAnswer: question.translation,
      userAnswer: answer,
      isCorrect: correct,
      explanation
    };

    setAnswers(prev => [...prev, newAnswer]);

    if (question.type === 'flashcard') {
      setShowAnswer(false);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setSelectedOption(null);
    } else {
      submitChallenge([...answers, newAnswer]);
    }
  };

  const submitChallenge = async (finalAnswers: any[]) => {
    setSubmitting(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/submit-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          answers: finalAnswers
        })
      });

      const data = await response.json();
      if (data.success) {
        // Play perfect sound if all correct
        if (data.result.correct_answers === data.result.total_questions) {
          sounds.play('perfect');
        }
        setResult(data.result);
        setFinished(true);
      }
    } catch (error) {
      console.error('Error submitting challenge:', error);
    }
    setSubmitting(false);
  };

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Start Screen
  if (!started) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="text-5xl md:text-6xl mb-3 md:mb-4">🎯</div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">{challenge.title}</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            {t('challengePlayer.quiz.startDescription', { name: partnerName, count: challenge.words_data?.length || 0 })}
          </p>

          <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6">
            <p className="text-xs md:text-scale-label text-[var(--text-secondary)]">
              {t('challengePlayer.quiz.startInstructions', { language: targetName })}
            </p>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors text-sm md:text-base"
            >
              {t('challengePlayer.common.later')}
            </button>
            <button
              onClick={handleStart}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
            >
              {t('challengePlayer.quiz.startButton')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (finished && result) {
    const isPerfect = result.correct_answers === result.total_questions;

    // Filter to answers with interesting explanations
    const answersWithExplanations = answers.filter(a =>
      a.explanation && a.explanation !== 'Exact match' && a.explanation !== 'No match' &&
      a.explanation !== 'Self-assessed correct' && a.explanation !== 'Self-assessed incorrect'
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="text-5xl md:text-6xl mb-3 md:mb-4">{isPerfect ? '🏆' : result.score >= 70 ? '🎉' : '💪'}</div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">
            {isPerfect
              ? t('challengePlayer.results.perfect')
              : result.score >= 70
                ? t('challengePlayer.results.greatJob')
                : t('challengePlayer.results.keepPracticing')}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            {t('challengePlayer.quiz.resultScore', { correct: result.correct_answers, total: result.total_questions })}
          </p>

          <div className="text-4xl md:text-5xl font-black text-[var(--accent-color)] mb-2">{result.score}%</div>

          <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6 border border-[var(--accent-border)]">
            <p className="text-xs md:text-sm font-bold text-[var(--text-primary)]">
              {t('challengePlayer.common.xpEarned', { xp: result.xp_earned })}
            </p>
          </div>

          {/* Answer Details */}
          {answersWithExplanations.length > 0 && (
            <div className="mb-4 md:mb-6">
              <details className="text-left">
                <summary className="cursor-pointer text-scale-label text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-center">
                  {t('challengePlayer.common.showDetails', { count: answersWithExplanations.length })}
                </summary>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {answersWithExplanations.map((answer, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-lg text-xs ${
                        answer.isCorrect
                          ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-bold">
                        {answer.isCorrect ? <ICONS.Check className="w-3 h-3" /> : <ICONS.X className="w-3 h-3" />}
                        <span>{answer.word}</span>
                      </div>
                      <div className="mt-0.5 opacity-80">
                        {answer.userAnswer} → {answer.correctAnswer}
                      </div>
                      <div className="mt-0.5 italic opacity-70">{answer.explanation}</div>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          )}

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
          >
            {t('challengePlayer.common.done')}
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (submitting) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md p-6 md:p-8 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-[var(--text-secondary)]">{t('challengePlayer.common.calculatingScore')}</p>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm font-bold text-[var(--text-secondary)]">
              {t('challengePlayer.quiz.questionProgress', { current: currentIndex + 1, total: questions.length })}
            </span>
            <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-[var(--bg-primary)] rounded-lg md:rounded-xl">
              <ICONS.X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
          <div className="h-1.5 md:h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-color)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-4 md:p-6">
          {currentQuestion?.type === 'flashcard' ? (
            // Flashcard Mode
            <div className="text-center">
              <p className="text-xs md:text-scale-label text-[var(--text-secondary)] mb-3 md:mb-4">{t('challengePlayer.quiz.flashcard.prompt')}</p>
              <div className="bg-[var(--accent-light)] p-6 md:p-8 rounded-xl md:rounded-2xl mb-4 md:mb-6">
                <p className="text-2xl md:text-3xl font-black text-[var(--accent-color)]">{currentQuestion.word}</p>
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3 md:py-4 bg-[var(--bg-primary)] text-[var(--text-secondary)] font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                >
                  {t('challengePlayer.quiz.flashcard.showAnswer')}
                </button>
              ) : (
                <>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 md:p-4 rounded-xl md:rounded-2xl mb-3 md:mb-4">
                    <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{currentQuestion.translation}</p>
                  </div>
                  <p className="text-xs md:text-scale-label text-[var(--text-secondary)] mb-3 md:mb-4">{t('challengePlayer.quiz.flashcard.didYouGetIt')}</p>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, false)}
                      className="flex-1 py-3 md:py-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                    >
                      {t('challengePlayer.quiz.flashcard.no')}
                    </button>
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, true)}
                      className="flex-1 py-3 md:py-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                    >
                      {t('challengePlayer.quiz.flashcard.yes')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : currentQuestion?.type === 'multiple_choice' ? (
            // Multiple Choice Mode
            <div>
              <p className="text-xs md:text-scale-label text-[var(--text-secondary)] mb-3 md:mb-4 text-center">{t('challengePlayer.quiz.multipleChoice.prompt')}</p>
              <div className="bg-[var(--accent-light)] p-4 md:p-6 rounded-xl md:rounded-2xl mb-4 md:mb-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-[var(--accent-color)]">{currentQuestion.word}</p>
              </div>

              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedOption(option);
                      setTimeout(() => handleAnswer(option), 300);
                    }}
                    disabled={selectedOption !== null}
                    className={`w-full p-3 md:p-4 rounded-xl text-left font-bold transition-all text-sm md:text-base ${
                      selectedOption === option
                        ? option === currentQuestion.translation
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-300 dark:border-green-700'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-700'
                        : 'bg-[var(--bg-primary)] text-[var(--text-primary)] hover:bg-[var(--accent-light)] border-2 border-transparent'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Type It Mode
            <div>
              <p className="text-xs md:text-scale-label text-[var(--text-secondary)] mb-3 md:mb-4 text-center">{t('challengePlayer.quiz.typeIt.prompt')}</p>
              <div className="bg-[var(--accent-light)] p-4 md:p-6 rounded-xl md:rounded-2xl mb-4 md:mb-6 text-center">
                <p className="text-2xl md:text-3xl font-black text-[var(--accent-color)]">{currentQuestion?.word}</p>
              </div>

              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && userInput.trim()) {
                    handleAnswer(userInput);
                  }
                }}
                placeholder={t('challengePlayer.quiz.typeIt.placeholder')}
                autoFocus
                className="w-full p-3 md:p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-base md:text-lg font-bold focus:outline-none focus:border-[var(--accent-color)] mb-3 md:mb-4 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />

              <button
                onClick={() => handleAnswer(userInput)}
                disabled={!userInput.trim()}
                className="w-full py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors text-sm md:text-base"
              >
                {t('challengePlayer.quiz.typeIt.submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayQuizChallenge;
