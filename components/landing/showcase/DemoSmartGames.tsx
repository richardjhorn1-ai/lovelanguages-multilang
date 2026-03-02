import React, { useState, useEffect } from 'react';
import type { SmartGamesContent, DemoMeta } from './demoContent';

const CYCLE_MS = 13000;

interface Props { accentColor: string; content: SmartGamesContent; meta: DemoMeta }

const DemoSmartGames: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'flip1' | 'flip1back' | 'flip2' | 'flip2back' | 'quiz' | 'wrong' | 'correct' | 'result'>('flip1');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('flip1back'), 2000));
    timers.push(setTimeout(() => setPhase('flip2'), 3800));
    timers.push(setTimeout(() => setPhase('flip2back'), 5400));
    timers.push(setTimeout(() => setPhase('quiz'), 6800));
    timers.push(setTimeout(() => setPhase('wrong'), 8600));
    timers.push(setTimeout(() => setPhase('correct'), 10100));
    timers.push(setTimeout(() => setPhase('result'), 11600));
    timers.push(setTimeout(() => setPhase('flip1'), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'flip1' ? Date.now() : 0]);

  const isFlipped = phase === 'flip1back' || phase === 'flip2back';
  const card = phase.startsWith('flip1') ? content.card1 : content.card2;
  const showFlashcard = phase.startsWith('flip1') || phase.startsWith('flip2');
  const showQuiz = phase === 'quiz' || phase === 'wrong' || phase === 'correct';

  return (
    <div className="flex flex-col items-center justify-center p-4 h-full gap-2">
      {/* Streak counter */}
      <div className="flex items-center gap-1.5 self-end">
        <span className="text-xs">🔥</span>
        <span className="text-[11px] font-bold" style={{ color: accentColor }}>3 streak</span>
      </div>

      {showFlashcard && (
        <>
          <div className="relative w-full max-w-[240px]" style={{ perspective: '1000px', height: '130px' }}>
            <div
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center p-4"
                style={{ backfaceVisibility: 'hidden', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)' }}
              >
                <span className="text-xl font-black font-header" style={{ color: accentColor }}>{card.word}</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-[var(--text-secondary)] animate-pulse">tap to flip</span>
                  <span className="text-[10px] opacity-40">🔊</span>
                </div>
              </div>
              {/* Back */}
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center text-center p-4"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: accentColor }}
              >
                <span className="text-2xl mb-1">{card.emoji}</span>
                <span className="text-lg font-bold text-white font-header">{card.translation}</span>
                <span className="text-[10px] text-white/60 mt-0.5">{card.pronunciation}</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">
            {phase.startsWith('flip1') ? '1' : '2'} of 2
          </span>
        </>
      )}

      {showQuiz && (
        <div className="w-full max-w-[240px] flex flex-col gap-2" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-xs text-center text-[var(--text-secondary)] mb-1">{content.quizPrompt}</p>
          {content.quizOptions.map((opt) => {
            const isWrongPick = phase === 'wrong' && opt.label === content.wrongPickLabel;
            const isCorrectPick = phase === 'correct' && opt.correct;
            return (
              <div
                key={opt.label}
                className="px-3 py-2 rounded-xl text-sm font-medium border transition-all"
                style={{
                  borderColor: isWrongPick ? '#ef4444' : isCorrectPick ? '#10b981' : 'rgba(0,0,0,0.08)',
                  backgroundColor: isWrongPick ? '#fee2e2' : isCorrectPick ? '#dcfce7' : 'rgba(255,255,255,0.5)',
                  color: isWrongPick ? '#991b1b' : isCorrectPick ? '#166534' : 'var(--text-primary)',
                  animation: isWrongPick ? 'shake 0.4s ease-in-out' : 'none',
                }}
              >
                {opt.label} {isCorrectPick && '✓'}
              </div>
            );
          })}
        </div>
      )}

      {phase === 'result' && (
        <div
          className="flex flex-col items-center gap-1.5 w-full max-w-[240px] p-3.5 rounded-2xl"
          style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}25`, animation: 'reveal-up 0.3s ease-out both' }}
        >
          <span className="text-2xl">🎉</span>
          <span className="text-sm font-black font-header" style={{ color: accentColor }}>2/2 correct</span>
          <span className="text-xs font-bold" style={{ color: '#10b981' }}>+40 XP</span>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
};

export default DemoSmartGames;
