import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../../constants';

/**
 * GameDemoMockup — Compact auto-playing flashcard demo.
 *
 * Shrunk-down version: small card that cycles through words,
 * designed to fit as one element among many (not a centerpiece).
 * Comes to life on hover (speeds up + sparkle).
 */

interface DemoWordPair {
  word: string;
  translation: string;
}

const DEMO_WORDS: DemoWordPair[] = [
  { word: 'Kocham cię', translation: 'I love you' },
  { word: 'Serce', translation: 'Heart' },
  { word: 'Piękny', translation: 'Beautiful' },
  { word: 'Pocałunek', translation: 'Kiss' },
];

interface GameDemoMockupProps {
  accentColor: string;
  accentShadow: string;
  compact?: boolean;
  className?: string;
}

const GameDemoMockup: React.FC<GameDemoMockupProps> = ({
  accentColor,
  accentShadow,
  compact = false,
  className = '',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const word = DEMO_WORDS[currentIndex];
  const pauseTime = isHovered ? 800 : 1500;
  const flipDelay = isHovered ? 400 : 500;

  const advanceToNext = useCallback(() => {
    setShowCheck(false);
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % DEMO_WORDS.length);
    }, flipDelay);
  }, [flipDelay]);

  useEffect(() => {
    const flipTimer = setTimeout(() => setIsFlipped(true), pauseTime);
    return () => clearTimeout(flipTimer);
  }, [currentIndex, pauseTime]);

  useEffect(() => {
    if (!isFlipped) return;
    const checkTimer = setTimeout(() => setShowCheck(true), pauseTime * 0.6);
    const advanceTimer = setTimeout(() => advanceToNext(), pauseTime * 1.4);
    return () => { clearTimeout(checkTimer); clearTimeout(advanceTimer); };
  }, [isFlipped, pauseTime, advanceToNext]);

  // Compact mode: smaller card for embedding in feature grid
  const cardW = compact ? '160px' : '200px';
  const cardH = compact ? '90px' : '110px';
  const wordSize = compact ? 'text-base' : 'text-lg';
  const transSize = compact ? 'text-sm' : 'text-base';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dot indicators */}
      <div className="flex gap-1 justify-center mb-2">
        {DEMO_WORDS.map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i === currentIndex ? accentColor : 'rgba(0,0,0,0.1)',
              transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Flashcard */}
      <div
        className="relative mx-auto"
        style={{ perspective: '500px', maxWidth: cardW, height: cardH }}
      >
        <div
          className="absolute inset-0 transition-transform"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transitionDuration: `${flipDelay}ms`,
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center text-center p-2"
            style={{
              backfaceVisibility: 'hidden',
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.8)',
              boxShadow: '0 2px 12px -2px rgba(0,0,0,0.06)',
            }}
          >
            <span className={`${wordSize} font-black font-header`} style={{ color: accentColor }}>
              {word.word}
            </span>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center text-center p-2"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              backgroundColor: 'rgba(255,255,255,0.85)',
              border: `1px solid ${accentColor}25`,
              boxShadow: `0 2px 12px -2px ${accentShadow}`,
            }}
          >
            <span className={`${transSize} font-bold text-[var(--text-primary)] font-header`}>
              {word.translation}
            </span>
            <div
              className="mt-1 flex items-center gap-0.5 transition-all duration-200"
              style={{
                opacity: showCheck ? 1 : 0,
                transform: showCheck ? 'scale(1)' : 'scale(0.5)',
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <ICONS.Check className="w-3 h-3" style={{ color: '#10B981' }} />
              <span className="text-[10px] font-bold" style={{ color: '#10B981' }}>Got it!</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sparkle on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{
                backgroundColor: accentColor,
                opacity: 0.4,
                left: `${25 + i * 25}%`,
                top: `${35 + (i % 2) * 25}%`,
                animation: `sparkle-float 1.5s ease-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      <style>{`
        @keyframes sparkle-float {
          0% { opacity: 0; transform: translateY(0) scale(0); }
          30% { opacity: 0.6; transform: translateY(-8px) scale(1); }
          100% { opacity: 0; transform: translateY(-24px) scale(0.5); }
        }
      `}</style>
    </div>
  );
};

export default GameDemoMockup;
