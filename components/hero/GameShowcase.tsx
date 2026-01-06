import React, { useState, useMemo } from 'react';
import { DEMO_WORDS, shuffleArray } from './demoData';
import { DemoFlashcard } from './DemoFlashcard';
import { DemoMultipleChoice } from './DemoMultipleChoice';
import { DemoTypeIt } from './DemoTypeIt';
import { DemoQuickFire } from './DemoQuickFire';

interface GameShowcaseProps {
  isStudent: boolean;
  accentColor: string;
}

const MODES = ['Flashcard', 'Multiple Choice', 'Type It', 'Quick Fire'] as const;
type GameMode = typeof MODES[number];

export const GameShowcase: React.FC<GameShowcaseProps> = ({
  isStudent,
  accentColor,
}) => {
  const [currentMode, setCurrentMode] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Shuffle words for variety
  const deck = useMemo(() => shuffleArray(DEMO_WORDS).slice(0, 6), []);

  const handleComplete = (_correct: boolean) => {
    if (questionIndex < 1) {
      // Next question in same mode
      setQuestionIndex((prev) => prev + 1);
    } else {
      // Move to next mode
      setCurrentMode((prev) => (prev + 1) % MODES.length);
      setQuestionIndex(0);
    }
  };

  const goToPrevMode = () => {
    setCurrentMode((prev) => (prev - 1 + MODES.length) % MODES.length);
    setQuestionIndex(0);
  };

  const goToNextMode = () => {
    setCurrentMode((prev) => (prev + 1) % MODES.length);
    setQuestionIndex(0);
  };

  // Get current word based on mode and question index
  const currentWord = deck[(currentMode * 2 + questionIndex) % deck.length];

  // Copy based on student/tutor
  const headline = isStudent
    ? "Oh, and if you want to learn the traditional way too..."
    : "Play together, or send them challenges to tackle solo...";
  const subtext = isStudent
    ? "We do that amazingly."
    : "You can play too—it's not just for teaching.";

  return (
    <section
      className="min-h-screen snap-start flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-16 relative z-10"
    >
      {/* Left side - Text */}
      <div className="w-full md:w-1/3 mb-8 md:mb-0 md:pr-8">
        <h3
          className="text-2xl md:text-3xl font-black leading-tight mb-4"
          style={{ color: '#1a1a2e' }}
        >
          {headline}
        </h3>
        <p
          className="text-lg md:text-xl font-semibold"
          style={{ color: accentColor }}
        >
          {subtext}
        </p>
      </div>

      {/* Right side - Game Demo */}
      <div className="w-full md:w-2/3 flex flex-col items-center">
        {/* Mode navigation */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={goToPrevMode}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            ‹
          </button>

          <div className="flex items-center gap-2">
            {MODES.map((mode, i) => (
              <button
                key={mode}
                onClick={() => { setCurrentMode(i); setQuestionIndex(0); }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  i === currentMode
                    ? 'text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={i === currentMode ? { backgroundColor: accentColor } : {}}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextMode}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all hover:scale-110"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            ›
          </button>
        </div>

        {/* Progress dots - hide for Quick Fire */}
        {currentMode !== 3 && (
          <div className="flex gap-2 mb-6">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  backgroundColor: i <= questionIndex ? accentColor : '#e5e7eb',
                }}
              />
            ))}
          </div>
        )}

        {/* Demo component based on current mode */}
        <div className="transition-all duration-300">
          {currentMode === 0 && (
            <DemoFlashcard
              word={currentWord}
              accentColor={accentColor}
              onComplete={handleComplete}
            />
          )}
          {currentMode === 1 && (
            <DemoMultipleChoice
              word={currentWord}
              accentColor={accentColor}
              onComplete={handleComplete}
            />
          )}
          {currentMode === 2 && (
            <DemoTypeIt
              word={currentWord}
              accentColor={accentColor}
              onComplete={handleComplete}
            />
          )}
          {currentMode === 3 && (
            <DemoQuickFire
              accentColor={accentColor}
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Hint text */}
        <p className="mt-6 text-xs text-gray-400 text-center">
          Try it out! No sign-up needed.
        </p>
      </div>
    </section>
  );
};
