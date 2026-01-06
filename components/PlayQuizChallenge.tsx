import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { TutorChallenge, QuizConfig } from '../types';
import { ICONS } from '../constants';

interface PlayQuizChallengeProps {
  challenge: TutorChallenge;
  partnerName: string;
  onClose: () => void;
  onComplete: () => void;
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
  onComplete
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
        const shuffled = otherTranslations.sort(() => Math.random() - 0.5).slice(0, 3);
        question.options = [...shuffled, word.translation].sort(() => Math.random() - 0.5);
      }

      return question;
    });

    setQuestions(qs.sort(() => Math.random() - 0.5));
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

  const handleAnswer = (answer: string, isCorrect?: boolean) => {
    const question = questions[currentIndex];
    const correct = isCorrect ?? (
      answer.toLowerCase().trim() === question.translation.toLowerCase().trim()
    );

    setAnswers(prev => [...prev, {
      wordId: question.wordId,
      word: question.word,
      userAnswer: answer,
      isCorrect: correct
    }]);

    if (question.type === 'flashcard') {
      setShowAnswer(false);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserInput('');
      setSelectedOption(null);
    } else {
      submitChallenge([...answers, { wordId: question.wordId, word: question.word, userAnswer: answer, isCorrect: correct }]);
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
            {partnerName} wants to quiz you on {challenge.words_data?.length || 0} words!
          </p>

          <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6">
            <p className="text-xs md:text-sm text-[var(--text-secondary)]">
              Answer questions about Polish words you've learned.
              Get them right to build your streak!
            </p>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors text-sm md:text-base"
            >
              Later
            </button>
            <button
              onClick={handleStart}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (finished && result) {
    const isPerfect = result.correct_answers === result.total_questions;
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="text-5xl md:text-6xl mb-3 md:mb-4">{isPerfect ? '🏆' : result.score >= 70 ? '🎉' : '💪'}</div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">
            {isPerfect ? 'Perfect!' : result.score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            You got {result.correct_answers} out of {result.total_questions} correct
          </p>

          <div className="text-4xl md:text-5xl font-black text-[var(--accent-color)] mb-2">{result.score}%</div>

          <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6 border border-[var(--accent-border)]">
            <p className="text-xs md:text-sm font-bold text-[var(--text-primary)]">
              +{result.xp_earned} XP earned!
            </p>
          </div>

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
          >
            Done
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
          <p className="text-[var(--text-secondary)]">Calculating your score...</p>
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
              Question {currentIndex + 1} of {questions.length}
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
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-3 md:mb-4">What does this mean?</p>
              <div className="bg-[var(--accent-light)] p-6 md:p-8 rounded-xl md:rounded-2xl mb-4 md:mb-6">
                <p className="text-2xl md:text-3xl font-black text-[var(--accent-color)]">{currentQuestion.word}</p>
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-3 md:py-4 bg-[var(--bg-primary)] text-[var(--text-secondary)] font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                >
                  Show Answer
                </button>
              ) : (
                <>
                  <div className="bg-green-100 dark:bg-green-900/30 p-3 md:p-4 rounded-xl md:rounded-2xl mb-3 md:mb-4">
                    <p className="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{currentQuestion.translation}</p>
                  </div>
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-3 md:mb-4">Did you get it right?</p>
                  <div className="flex gap-2 md:gap-3">
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, false)}
                      className="flex-1 py-3 md:py-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, true)}
                      className="flex-1 py-3 md:py-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 font-bold rounded-xl hover:opacity-80 transition-colors text-sm md:text-base"
                    >
                      Yes
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : currentQuestion?.type === 'multiple_choice' ? (
            // Multiple Choice Mode
            <div>
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-3 md:mb-4 text-center">Translate this word:</p>
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
              <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-3 md:mb-4 text-center">Type the translation:</p>
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
                placeholder="Type your answer..."
                autoFocus
                className="w-full p-3 md:p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-base md:text-lg font-bold focus:outline-none focus:border-[var(--accent-color)] mb-3 md:mb-4 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />

              <button
                onClick={() => handleAnswer(userInput)}
                disabled={!userInput.trim()}
                className="w-full py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors text-sm md:text-base"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayQuizChallenge;
