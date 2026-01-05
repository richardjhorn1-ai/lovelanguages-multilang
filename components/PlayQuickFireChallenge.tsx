import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { TutorChallenge, QuickFireConfig } from '../types';
import { ICONS } from '../constants';

interface PlayQuickFireChallengeProps {
  challenge: TutorChallenge;
  partnerName: string;
  onClose: () => void;
  onComplete: () => void;
}

const PlayQuickFireChallenge: React.FC<PlayQuickFireChallengeProps> = ({
  challenge,
  partnerName,
  onClose,
  onComplete
}) => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const config = challenge.config as QuickFireConfig;
  const words = challenge.words_data || [];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (started && countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (started && countdown === 0 && !timerRef.current) {
      startTimer();
    }
  }, [started, countdown]);

  const startTimer = () => {
    setTimeLeft(config.timeLimitSeconds);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    inputRef.current?.focus();
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

  const handleAnswer = () => {
    if (!userInput.trim()) return;

    const word = words[currentIndex];
    const isCorrect = userInput.toLowerCase().trim() === word.translation.toLowerCase().trim();

    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => setShowFeedback(null), 200);

    const newAnswer = {
      wordId: word.id || (challenge.word_ids?.[currentIndex] as string) || '',
      word: word.word,
      userAnswer: userInput,
      isCorrect
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setUserInput('');

    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      inputRef.current?.focus();
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      submitChallenge(newAnswers);
    }
  };

  const handleTimeUp = () => {
    // Submit whatever answers we have
    submitChallenge(answers);
  };

  const submitChallenge = async (finalAnswers: any[]) => {
    setSubmitting(true);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);

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
          answers: finalAnswers,
          timeSpentSeconds: timeSpent
        })
      });

      const data = await response.json();
      if (data.success) {
        setResult({ ...data.result, timeSpent });
        setFinished(true);
      }
    } catch (error) {
      console.error('Error submitting challenge:', error);
    }
    setSubmitting(false);
  };

  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
  const timeProgress = config.timeLimitSeconds > 0 ? (timeLeft / config.timeLimitSeconds) * 100 : 100;

  // Start Screen
  if (!started) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Quick Fire!</h2>
          <p className="text-gray-500 mb-6">
            {partnerName} challenges you to translate {words.length} words in {config.timeLimitSeconds} seconds!
          </p>

          <div className={`p-4 rounded-2xl mb-6 ${
            config.difficulty === 'easy' ? 'bg-green-50' :
            config.difficulty === 'hard' ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            <p className={`text-lg font-bold ${
              config.difficulty === 'easy' ? 'text-green-600' :
              config.difficulty === 'hard' ? 'text-red-600' : 'text-amber-600'
            }`}>
              {config.difficulty === 'easy' ? '🌿 Easy Mode' :
               config.difficulty === 'hard' ? '💥 Hard Mode' : '🔥 Medium Mode'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {(config.timeLimitSeconds / words.length).toFixed(1)}s per word
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
              className="flex-1 px-6 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
            >
              Start!
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Countdown Screen
  if (countdown > 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md p-8 text-center">
          <p className="text-gray-500 mb-4">Get Ready!</p>
          <div className="text-8xl font-black text-amber-500 animate-pulse">{countdown}</div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (finished && result) {
    const isPerfect = result.correct_answers === result.total_questions;
    const wasQuick = result.timeSpent < config.timeLimitSeconds * 0.5;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="text-6xl mb-4">
            {isPerfect && wasQuick ? '🏆' : isPerfect ? '🎉' : result.score >= 70 ? '⚡' : '💪'}
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">
            {isPerfect && wasQuick ? 'Lightning Fast!' :
             isPerfect ? 'Perfect Score!' :
             result.score >= 70 ? 'Great Job!' : 'Keep Practicing!'}
          </h2>

          <div className="text-5xl font-black text-amber-500 mb-2">{result.score}%</div>

          <p className="text-gray-500 mb-4">
            {result.correct_answers}/{result.total_questions} correct in {result.timeSpent}s
          </p>

          <div className="bg-gradient-to-r from-amber-50 to-[var(--accent-light)] p-4 rounded-2xl mb-6">
            <p className="text-sm font-bold text-gray-800">
              +{result.xp_earned} XP earned!
              {wasQuick && <span className="text-amber-500"> (Time Bonus!)</span>}
            </p>
          </div>

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-6 py-4 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
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
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-gray-500">Calculating your score...</p>
        </div>
      </div>
    );
  }

  // Game Screen
  const currentWord = words[currentIndex];

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 p-4 transition-colors duration-200 ${
      showFeedback === 'correct' ? 'bg-green-500/50' :
      showFeedback === 'wrong' ? 'bg-red-500/50' : 'bg-black/50'
    }`}>
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Timer Bar */}
        <div className="h-3 bg-gray-100">
          <div
            className={`h-full transition-all duration-1000 ${
              timeProgress > 50 ? 'bg-amber-500' :
              timeProgress > 25 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${timeProgress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-500">
            {currentIndex + 1} / {words.length}
          </span>
          <span className={`text-2xl font-black ${
            timeLeft > 10 ? 'text-amber-500' : 'text-red-500 animate-pulse'
          }`}>
            {timeLeft}s
          </span>
        </div>

        {/* Word */}
        <div className="p-6">
          <div className="bg-amber-50 p-8 rounded-2xl mb-6 text-center">
            <p className="text-4xl font-black text-amber-600">{currentWord?.word}</p>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleAnswer();
              }
            }}
            placeholder="Type translation..."
            autoFocus
            className="w-full p-4 border-2 border-amber-200 rounded-xl text-center text-xl font-bold focus:outline-none focus:border-amber-400"
          />

          {/* Progress */}
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayQuickFireChallenge;
