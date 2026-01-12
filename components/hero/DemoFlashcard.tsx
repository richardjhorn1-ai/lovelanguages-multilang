import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DemoWord } from './demoData';
import { sounds } from '../../services/sounds';

interface DemoFlashcardProps {
  word: DemoWord;
  accentColor: string;
  onComplete: (correct: boolean) => void;
  targetName: string;
  nativeName: string;
}

export const DemoFlashcard: React.FC<DemoFlashcardProps> = ({
  word,
  accentColor,
  onComplete,
  targetName,
  nativeName,
}) => {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset flip state when word changes
  useEffect(() => {
    setIsFlipped(false);
  }, [word]);

  const handleResponse = (gotIt: boolean) => {
    // Play feedback sound
    sounds.play('correct');
    // First flip back to front, then after animation completes, advance to next
    setIsFlipped(false);
    setTimeout(() => {
      onComplete(gotIt);
    }, 500); // Match the flip animation duration
  };

  return (
    <div
      onClick={() => !isFlipped && setIsFlipped(true)}
      className="relative cursor-pointer"
      style={{ perspective: '1000px', width: '300px', height: '380px' }}
    >
      <div
        className="relative w-full h-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg border"
          style={{
            backfaceVisibility: 'hidden',
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
          }}
        >
          <span
            className="text-[9px] uppercase tracking-widest font-black mb-6"
            style={{ color: accentColor }}
          >
            {targetName.toUpperCase()}
          </span>
          <h3 className="text-3xl font-black text-[#1a1a2e]">{word.word}</h3>
          <p className="mt-8 text-gray-400 text-[9px] uppercase font-black tracking-widest animate-pulse">
            {t('demoFlashcard.tapToReveal')}
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center shadow-lg text-white"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: accentColor,
          }}
        >
          <span className="text-[9px] uppercase tracking-widest text-white/60 font-black mb-6">
            {nativeName.toUpperCase()}
          </span>
          <h3 className="text-2xl font-black">{word.translation}</h3>
          <div className="mt-8 grid grid-cols-2 gap-2 w-full">
            <button
              onClick={(e) => { e.stopPropagation(); handleResponse(false); }}
              className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center justify-center gap-1 border border-white/20 text-[10px] font-black uppercase tracking-widest transition-colors"
            >
              <span>✗</span> {t('demoFlashcard.hard')}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleResponse(true); }}
              className="bg-white p-3 rounded-xl flex items-center justify-center gap-1 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95"
              style={{ color: accentColor }}
            >
              <span>✓</span> {t('demoFlashcard.gotIt')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
