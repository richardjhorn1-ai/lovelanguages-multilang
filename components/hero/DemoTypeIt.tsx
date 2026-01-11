import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DemoWord } from './demoData';

interface DemoTypeItProps {
  word: DemoWord;
  accentColor: string;
  onComplete: (correct: boolean) => void;
  targetName: string;
  nativeName: string;
}

export const DemoTypeIt: React.FC<DemoTypeItProps> = ({
  word,
  accentColor,
  onComplete,
  targetName,
  nativeName,
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    setAnswer('');
    setSubmitted(false);
    setIsCorrect(false);
  }, [word]);

  const handleSubmit = () => {
    if (!answer.trim() && !submitted) return;

    if (submitted) {
      onComplete(isCorrect);
      return;
    }

    const correct = answer.trim().toLowerCase() === word.translation.toLowerCase();
    setIsCorrect(correct);
    setSubmitted(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div
      className="rounded-[2rem] p-6 shadow-lg border flex flex-col justify-between"
      style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', width: '300px', height: '380px' }}
    >
      <span
        className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-4"
        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
      >
        {targetName} → {nativeName}
      </span>

      <h3 className="text-2xl font-black text-[#1a1a2e] mb-2 text-center">
        {word.word}
      </h3>

      {submitted && (
        <div
          className="text-center mb-4 p-3 rounded-xl text-sm"
          style={{
            backgroundColor: isCorrect ? '#dcfce7' : '#fee2e2',
            color: isCorrect ? '#166534' : '#991b1b',
          }}
        >
          {isCorrect ? (
            <div className="flex items-center justify-center gap-2">
              <span>✓</span>
              <span className="font-bold">{t('demoTypeIt.correct')}</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <span>✗</span>
                <span className="font-bold">{t('demoTypeIt.notQuite')}</span>
              </div>
              <p className="text-xs">
                {t('demoTypeIt.answer')} <span className="font-black">{word.translation}</span>
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('demoTypeIt.typeIn', { language: nativeName })}
          disabled={submitted}
          className="w-full p-3 rounded-xl border-2 focus:outline-none text-base font-medium text-center"
          style={{
            borderColor: submitted
              ? isCorrect
                ? '#4ade80'
                : '#f87171'
              : '#e5e7eb',
            backgroundColor: '#f9fafb',
            color: '#1a1a2e',
          }}
          autoFocus
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!answer.trim() && !submitted}
        className="w-full mt-4 py-3 rounded-xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50 transition-all active:scale-[0.98]"
        style={{ backgroundColor: accentColor }}
      >
        {submitted ? t('demoTypeIt.next') : t('demoTypeIt.check')}
      </button>
    </div>
  );
};
