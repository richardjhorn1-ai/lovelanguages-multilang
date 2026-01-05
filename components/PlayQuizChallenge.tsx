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
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{challenge.title}</h2>
          <p className="text-gray-500 mb-6">
            {partnerName} wants to quiz you on {challenge.words_data?.length || 0} words!
          </p>

          <div className="bg-rose-50 p-4 rounded-2xl mb-6">
            <p className="text-sm text-gray-600">
              Answer questions about Polish words you've learned.
              Get them right to build your streak!
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleStart}
              className="flex-1 px-6 py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
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
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="text-6xl mb-4">{isPerfect ? '🏆' : result.score >= 70 ? '🎉' : '💪'}</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isPerfect ? 'Perfect!' : result.score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <p className="text-gray-500 mb-6">
            You got {result.correct_answers} out of {result.total_questions} correct
          </p>

          <div className="text-5xl font-black text-rose-500 mb-2">{result.score}%</div>

          <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-4 rounded-2xl mb-6">
            <p className="text-sm font-bold text-gray-800">
              +{result.xp_earned} XP earned!
            </p>
          </div>

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-6 py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors"
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
        <div className="bg-white rounded-[2rem] w-full max-w-md p-8 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-rose-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-gray-500">Calculating your score...</p>
        </div>
      </div>
    );
  }

  // Game Screen
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <ICONS.X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="p-6">
          {currentQuestion?.type === 'flashcard' ? (
            // Flashcard Mode
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">What does this mean?</p>
              <div className="bg-rose-50 p-8 rounded-2xl mb-6">
                <p className="text-3xl font-black text-rose-600">{currentQuestion.word}</p>
              </div>

              {!showAnswer ? (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Show Answer
                </button>
              ) : (
                <>
                  <div className="bg-green-50 p-4 rounded-2xl mb-4">
                    <p className="text-xl font-bold text-green-600">{currentQuestion.translation}</p>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Did you get it right?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, false)}
                      className="flex-1 py-4 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors"
                    >
                      No
                    </button>
                    <button
                      onClick={() => handleAnswer(currentQuestion.translation, true)}
                      className="flex-1 py-4 bg-green-100 text-green-600 font-bold rounded-xl hover:bg-green-200 transition-colors"
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
              <p className="text-sm text-gray-500 mb-4 text-center">Translate this word:</p>
              <div className="bg-rose-50 p-6 rounded-2xl mb-6 text-center">
                <p className="text-3xl font-black text-rose-600">{currentQuestion.word}</p>
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
                    className={`w-full p-4 rounded-xl text-left font-bold transition-all ${
                      selectedOption === option
                        ? option === currentQuestion.translation
                          ? 'bg-green-100 text-green-600 border-2 border-green-300'
                          : 'bg-red-100 text-red-600 border-2 border-red-300'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-2 border-transparent'
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
              <p className="text-sm text-gray-500 mb-4 text-center">Type the translation:</p>
              <div className="bg-rose-50 p-6 rounded-2xl mb-6 text-center">
                <p className="text-3xl font-black text-rose-600">{currentQuestion?.word}</p>
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
                className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:outline-none focus:border-rose-300 mb-4"
              />

              <button
                onClick={() => handleAnswer(userInput)}
                disabled={!userInput.trim()}
                className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 disabled:opacity-50 transition-colors"
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
