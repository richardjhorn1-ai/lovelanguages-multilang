import React, { useState, useEffect } from 'react';
import type { WeakestWordsContent, DemoMeta } from './demoContent';

const CYCLE_MS = 12000;

interface Props { accentColor: string; content: WeakestWordsContent; meta: DemoMeta }

const DemoWeakestWords: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'header' | 'drill1' | 'correct1' | 'drill2' | 'correct2' | 'drill3' | 'correct3' | 'result'>('header');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('drill1'), 1800));
    timers.push(setTimeout(() => setPhase('correct1'), 3200));
    timers.push(setTimeout(() => setPhase('drill2'), 4700));
    timers.push(setTimeout(() => setPhase('correct2'), 6100));
    timers.push(setTimeout(() => setPhase('drill3'), 7600));
    timers.push(setTimeout(() => setPhase('correct3'), 9000));
    timers.push(setTimeout(() => setPhase('result'), 10500));
    timers.push(setTimeout(() => setPhase('header'), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'header' ? Date.now() : 0]);

  const drillIndex = phase.includes('1') ? 0 : phase.includes('2') ? 1 : 2;
  const isCorrect = phase.startsWith('correct');
  const completedCount = phase === 'result' ? content.words.length : phase.startsWith('drill') ? drillIndex : phase.startsWith('correct') ? drillIndex + 1 : 0;
  const showDrill = phase.startsWith('drill') || phase.startsWith('correct');

  return (
    <div className="flex flex-col gap-2.5 p-4 h-full">
      {/* AI Challenge header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: `${accentColor}15` }}>
          <span className="text-xs">🎯</span>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>AI Challenge</span>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] ml-auto">Made for you</span>
      </div>

      {phase === 'header' && (
        <div className="flex flex-col gap-2 mt-1" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-sm font-bold text-[var(--text-primary)]">{content.header}</p>
          <p className="text-xs text-[var(--text-secondary)]">{content.subtext}</p>
          {content.words.map((w) => (
            <div key={w.word} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
              <span className="text-sm text-[var(--text-primary)]">{w.word}</span>
              <span className="text-[10px] text-[var(--text-secondary)] ml-auto">{w.accuracy}%</span>
            </div>
          ))}
        </div>
      )}

      {showDrill && (
        <div className="flex flex-col gap-3 mt-1" style={{ animation: isCorrect ? 'none' : 'reveal-up 0.3s ease-out both' }}>
          {/* Progress */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(completedCount / content.words.length) * 100}%`, backgroundColor: accentColor }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>{completedCount}/{content.words.length}</span>
          </div>

          {/* Current word */}
          <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="text-lg font-black font-header" style={{ color: accentColor }}>{content.words[drillIndex].word}</span>
          </div>

          {/* Accuracy bar */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[var(--text-secondary)]">Your accuracy</span>
              <span className="text-[10px] font-bold" style={{ color: content.words[drillIndex].accuracy < 50 ? '#ef4444' : '#f59e0b' }}>{content.words[drillIndex].accuracy}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${content.words[drillIndex].accuracy}%`, backgroundColor: content.words[drillIndex].accuracy < 50 ? '#ef4444' : '#f59e0b' }} />
            </div>
          </div>

          {/* Correct indicator */}
          {isCorrect && (
            <div className="text-center" style={{ animation: 'reveal-up 0.2s ease-out both' }}>
              <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                ✓ Correct! — {content.words[drillIndex].translation}
              </span>
            </div>
          )}
        </div>
      )}

      {phase === 'result' && (
        <div className="flex flex-col items-center gap-2 mt-2 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-2xl">💪</span>
          <p className="text-sm font-black font-header" style={{ color: accentColor }}>All {content.words.length} strengthened!</p>
          <p className="text-xs font-bold" style={{ color: '#10b981' }}>+25 XP</p>
        </div>
      )}
    </div>
  );
};

export default DemoWeakestWords;
