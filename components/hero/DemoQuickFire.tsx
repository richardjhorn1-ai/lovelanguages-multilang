import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { DemoWord } from './demoData';

interface DemoQuickFireProps {
  accentColor: string;
  onComplete: (correct: boolean) => void;
  targetName: string;
  nativeName: string;
  words: DemoWord[];
}

export const DemoQuickFire: React.FC<DemoQuickFireProps> = ({
  accentColor,
  onComplete,
  targetName,
  nativeName,
  words: allWords,
}) => {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<'ready' | 'countdown' | 'playing' | 'feedback'>('ready');
  const [countdown, setCountdown] = useState(3);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Use a subset of words for quick fire
  const words = allWords.slice(0, 4);
  const currentWord = words[currentWordIndex];

  // Countdown effect
  useEffect(() => {
    if (gameState === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'countdown' && countdown === 0) {
      setGameState('playing');
      inputRef.current?.focus();
    }
  }, [gameState, countdown]);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (gameState === 'playing' && timeLeft === 0) {
      // Time's up - show results briefly then complete
      setGameState('feedback');
      setTimeout(() => {
        onComplete(score > totalAnswered / 2);
        // Reset for next round
        setGameState('ready');
        setCountdown(3);
        setCurrentWordIndex(0);
        setAnswer('');
        setTimeLeft(15);
        setScore(0);
        setTotalAnswered(0);
      }, 2000);
    }
  }, [gameState, timeLeft, score, totalAnswered, onComplete]);

  const handleStart = () => {
    setGameState('countdown');
  };

  const handleSubmit = () => {
    if (!answer.trim() || gameState !== 'playing') return;

    const isCorrect = answer.trim().toLowerCase() === currentWord.translation.toLowerCase();
    setLastCorrect(isCorrect);
    if (isCorrect) setScore(score + 1);
    setTotalAnswered(totalAnswered + 1);
    setAnswer('');

    // Brief feedback then next word
    setTimeout(() => {
      setLastCorrect(null);
      setCurrentWordIndex((prev) => (prev + 1) % words.length);
      inputRef.current?.focus();
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Calculate timer progress
  const timerProgress = (timeLeft / 15) * 100;

  return (
    <div
      className="rounded-[2rem] p-6 shadow-lg border flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', width: '300px', height: '380px' }}
    >
      {/* Timer bar at top */}
      {gameState === 'playing' && (
        <div className="absolute top-0 left-0 right-0 h-2 bg-gray-100">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${timerProgress}%`,
              backgroundColor: timeLeft <= 5 ? '#ef4444' : accentColor,
            }}
          />
        </div>
      )}

      {/* Ready state */}
      {gameState === 'ready' && (
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <span className="text-3xl">⚡</span>
          </div>
          <h3 className="text-xl font-black text-[#1a1a2e] mb-2">{t('demoQuickFire.title')}</h3>
          <p className="text-sm text-gray-500 mb-6">
            {t('demoQuickFire.instructions')}
          </p>
          <button
            onClick={handleStart}
            className="px-8 py-3 rounded-xl font-black text-white text-sm uppercase tracking-widest transition-all active:scale-95"
            style={{ backgroundColor: accentColor }}
          >
            {t('demoQuickFire.start')}
          </button>
        </div>
      )}

      {/* Countdown state */}
      {gameState === 'countdown' && (
        <div className="text-center">
          <div
            className="text-8xl font-black animate-pulse"
            style={{ color: accentColor }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </div>
        </div>
      )}

      {/* Playing state */}
      {gameState === 'playing' && (
        <div className="flex flex-col items-center w-full">
          {/* Score and time */}
          <div className="flex justify-between w-full mb-4 text-sm">
            <span className="font-bold" style={{ color: accentColor }}>
              {score}/{totalAnswered}
            </span>
            <span className={`font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Word */}
          <div
            className={`w-full p-4 rounded-xl mb-4 text-center transition-all ${
              lastCorrect === true ? 'bg-green-100' : lastCorrect === false ? 'bg-red-100' : 'bg-gray-50'
            }`}
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">
              {targetName}
            </span>
            <h3 className="text-2xl font-black text-[#1a1a2e]">{currentWord.word}</h3>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('demoQuickFire.typeIn', { language: nativeName })}
            className="w-full p-3 rounded-xl border-2 focus:outline-none text-base font-medium text-center"
            style={{
              borderColor: lastCorrect === true ? '#4ade80' : lastCorrect === false ? '#f87171' : accentColor,
              backgroundColor: '#f9fafb',
              color: '#1a1a2e',
            }}
            autoComplete="off"
          />

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!answer.trim()}
            className="w-full mt-4 py-3 rounded-xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50 transition-all active:scale-[0.98]"
            style={{ backgroundColor: accentColor }}
          >
            {t('demoQuickFire.submit')}
          </button>
        </div>
      )}

      {/* Feedback state (time's up) */}
      {gameState === 'feedback' && (
        <div className="text-center">
          <div
            className="text-5xl font-black mb-2"
            style={{ color: accentColor }}
          >
            {score}/{totalAnswered}
          </div>
          <p className="text-lg font-bold text-[#1a1a2e]">
            {score === totalAnswered ? t('demoQuickFire.perfect') : score > totalAnswered / 2 ? t('demoQuickFire.greatJob') : t('demoQuickFire.keepPracticing')}
          </p>
          <p className="text-sm text-gray-400 mt-2">{t('demoQuickFire.timesUp')}</p>
        </div>
      )}
    </div>
  );
};
