import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getDemoWords, shuffleArray } from './demoData';
import { DemoFlashcard } from './DemoFlashcard';
import { DemoMultipleChoice } from './DemoMultipleChoice';
import { DemoTypeIt } from './DemoTypeIt';
import { DemoQuickFire } from './DemoQuickFire';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';

interface GameShowcaseProps {
  isStudent: boolean;
  accentColor: string;
  sectionIndex?: number;
  isMobile?: boolean;
  // Optional language overrides (for Hero page where user isn't logged in)
  targetLanguage?: string | null;
  nativeLanguage?: string | null;
}

const MODES = ['Flashcard', 'Multiple Choice', 'Type It', 'Quick Fire'] as const;
type GameMode = typeof MODES[number];

export const GameShowcase: React.FC<GameShowcaseProps> = ({
  isStudent,
  accentColor,
  sectionIndex,
  isMobile = false,
  targetLanguage: propsTargetLanguage,
  nativeLanguage: propsNativeLanguage,
}) => {
  const { t } = useTranslation();
  const contextLanguage = useLanguage();

  // Use props if provided, otherwise fall back to context
  const targetLanguage = propsTargetLanguage || contextLanguage.targetLanguage;
  const nativeLanguage = propsNativeLanguage || contextLanguage.nativeLanguage;

  // Compute names from configs if using props, otherwise use context
  const targetName = propsTargetLanguage
    ? LANGUAGE_CONFIGS[propsTargetLanguage]?.nativeName || propsTargetLanguage
    : contextLanguage.targetName;
  const nativeName = propsNativeLanguage
    ? LANGUAGE_CONFIGS[propsNativeLanguage]?.nativeName || propsNativeLanguage
    : contextLanguage.nativeName;
  const [currentMode, setCurrentMode] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);

  // Generate demo words based on language and shuffle for variety
  const deck = useMemo(
    () => shuffleArray(getDemoWords(targetLanguage, nativeLanguage)).slice(0, 6),
    [targetLanguage, nativeLanguage]
  );

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

  // Copy based on student/tutor with highlights
  const studentHeadline = (
    <>
      {t('gameShowcase.studentHeadline.part1')}
      <span className="relative inline">
        <span style={{ color: accentColor }}>{t('gameShowcase.studentHeadline.highlight')}</span>
        <span
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.5 }}
        />
      </span>
      {t('gameShowcase.studentHeadline.part2')}
    </>
  );

  const tutorHeadline = (
    <>
      <span style={{ color: accentColor }}>{t('gameShowcase.tutorHeadline.playTogether')}</span>
      {t('gameShowcase.tutorHeadline.middle')}
      <span className="relative inline">
        <span style={{ color: accentColor }}>{t('gameShowcase.tutorHeadline.challenges')}</span>
        <span
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.5 }}
        />
      </span>
      {t('gameShowcase.tutorHeadline.end')}
    </>
  );

  const subtext = isStudent
    ? t('gameShowcase.studentSubtext')
    : t('gameShowcase.tutorSubtext');

  // Helper to get mode display name
  const getModeDisplayName = (mode: typeof MODES[number], short = false): string => {
    if (short) {
      if (mode === 'Multiple Choice') return t('gameShowcase.mobileShort.multi');
      if (mode === 'Quick Fire') return t('gameShowcase.mobileShort.quick');
    }
    switch (mode) {
      case 'Flashcard': return t('gameShowcase.modes.flashcard');
      case 'Multiple Choice': return t('gameShowcase.modes.multipleChoice');
      case 'Type It': return t('gameShowcase.modes.typeIt');
      case 'Quick Fire': return t('gameShowcase.modes.quickFire');
      default: return mode;
    }
  };

  // Mobile compact layout - mode selector absolutely positioned to left, centered with game
  if (isMobile) {
    return (
      <div className="relative w-full pl-16">
        {/* Left side: Mode selector - absolutely positioned, centered vertically with game */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
          <button
            onClick={goToPrevMode}
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all text-sm"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            ˄
          </button>

          <div className="flex flex-col items-center gap-1">
            {MODES.map((mode, i) => (
              <button
                key={mode}
                onClick={() => { setCurrentMode(i); setQuestionIndex(0); }}
                className={`px-2 py-1 rounded-full text-[9px] font-bold transition-all whitespace-nowrap ${
                  i === currentMode
                    ? 'text-white shadow-lg'
                    : 'text-[var(--text-secondary)]'
                }`}
                style={i === currentMode ? { backgroundColor: accentColor } : {}}
              >
                {getModeDisplayName(mode, true)}
              </button>
            ))}
          </div>

          <button
            onClick={goToNextMode}
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold transition-all text-sm"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            ˅
          </button>

          {/* Progress dots - hide for Quick Fire */}
          {currentMode !== 3 && (
            <div className="flex gap-1 mt-1">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{
                    backgroundColor: i <= questionIndex ? accentColor : 'var(--border-color)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right side: Game demo - centered */}
        <div className="flex flex-col items-center justify-center">
          {/* Demo component - scaled down to fit */}
          <div className="transition-all duration-300 transform scale-[0.75] origin-center">
            {currentMode === 0 && (
              <DemoFlashcard
                word={currentWord}
                accentColor={accentColor}
                onComplete={handleComplete}
                targetName={targetName}
                nativeName={nativeName}
              />
            )}
            {currentMode === 1 && (
              <DemoMultipleChoice
                word={currentWord}
                accentColor={accentColor}
                onComplete={handleComplete}
                targetName={targetName}
                nativeName={nativeName}
                allWords={deck}
              />
            )}
            {currentMode === 2 && (
              <DemoTypeIt
                word={currentWord}
                accentColor={accentColor}
                onComplete={handleComplete}
                targetName={targetName}
                nativeName={nativeName}
              />
            )}
            {currentMode === 3 && (
              <DemoQuickFire
                accentColor={accentColor}
                onComplete={handleComplete}
                targetName={targetName}
                nativeName={nativeName}
                words={deck}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <section
      data-section={sectionIndex}
      className="min-h-screen snap-start flex flex-col md:flex-row items-center justify-center px-6 md:px-12 py-16 relative z-10"
    >
      {/* Left side - Text */}
      <div className="w-full md:w-1/3 mb-8 md:mb-0 md:pr-8">
        <h3
          className="text-2xl md:text-3xl font-black font-header leading-tight mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {isStudent ? studentHeadline : tutorHeadline}
        </h3>
        <p
          className="text-lg md:text-xl font-semibold"
          style={{ color: accentColor }}
        >
          {subtext}
        </p>

        {/* Visual accent bar - matching other sections */}
        <div
          className="mt-6 h-1.5 w-24 rounded-full"
          style={{ backgroundColor: accentColor, opacity: 0.3 }}
        />
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
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
                style={i === currentMode ? { backgroundColor: accentColor } : {}}
              >
                {getModeDisplayName(mode)}
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
                  backgroundColor: i <= questionIndex ? accentColor : 'var(--border-color)',
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
              targetName={targetName}
              nativeName={nativeName}
            />
          )}
          {currentMode === 1 && (
            <DemoMultipleChoice
              word={currentWord}
              accentColor={accentColor}
              onComplete={handleComplete}
              targetName={targetName}
              nativeName={nativeName}
              allWords={deck}
            />
          )}
          {currentMode === 2 && (
            <DemoTypeIt
              word={currentWord}
              accentColor={accentColor}
              onComplete={handleComplete}
              targetName={targetName}
              nativeName={nativeName}
            />
          )}
          {currentMode === 3 && (
            <DemoQuickFire
              accentColor={accentColor}
              onComplete={handleComplete}
              targetName={targetName}
              nativeName={nativeName}
              words={deck}
            />
          )}
        </div>

      </div>
    </section>
  );
};
