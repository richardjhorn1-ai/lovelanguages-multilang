import React, { useState, useEffect } from 'react';
import type { ProgressTrackingContent, DemoMeta } from './demoContent';

const CYCLE_MS = 10000;

interface Props { accentColor: string; content: ProgressTrackingContent; meta: DemoMeta }

const DemoProgressTracking: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'level' | 'breakdown' | 'chart' | 'summary'>('level');
  const [xpWidth, setXpWidth] = useState(0);
  const [chartDraw, setChartDraw] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setXpWidth(content.xpPercent), 1400));
    timers.push(setTimeout(() => setPhase('breakdown'), 2800));
    timers.push(setTimeout(() => setPhase('chart'), 4000));
    timers.push(setTimeout(() => setChartDraw(true), 4500));
    timers.push(setTimeout(() => setPhase('summary'), 7000));
    timers.push(setTimeout(() => { setPhase('level'); setXpWidth(0); setChartDraw(false); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'level' && xpWidth === 0 ? Date.now() : 0]);

  return (
    <div className="flex flex-col gap-2.5 p-4 h-full">
      {/* Level badge + XP */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base" style={{ backgroundColor: `${accentColor}15` }}>
          🎓
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--text-primary)]">{content.level}</p>
          <p className="text-[10px] text-[var(--text-secondary)]">{meta.partnerName}&apos;s journey</p>
        </div>
      </div>

      {/* XP bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[11px] font-bold" style={{ color: accentColor }}>{content.xpDisplay}</span>
          <span className="text-[11px] text-[var(--text-secondary)]">{content.xpPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${xpWidth}%`, backgroundColor: accentColor }} />
        </div>
      </div>

      {/* Word type breakdown */}
      {(phase === 'breakdown' || phase === 'chart' || phase === 'summary') && (
        <div className="flex gap-2 flex-wrap" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          {content.wordBreakdown.map((t) => (
            <div key={t.label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-[10px] text-[var(--text-secondary)]"><span className="font-bold text-[var(--text-primary)]">{t.count}</span> {t.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats row */}
      {(phase === 'breakdown' || phase === 'chart' || phase === 'summary') && (
        <div className="flex gap-4" style={{ animation: 'reveal-up 0.3s ease-out 0.2s both' }}>
          <div>
            <p className="text-base font-black" style={{ color: accentColor }}>{content.stats.wordsThisWeek}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Words this week</p>
          </div>
          <div>
            <p className="text-base font-black" style={{ color: accentColor }}>{content.stats.dayStreak} 🔥</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Day streak</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {(phase === 'chart' || phase === 'summary') && (
        <div style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <svg width="100%" height="45" viewBox="0 0 200 45" className="overflow-visible">
            <path
              d="M0,40 L30,34 L60,36 L90,26 L120,22 L150,14 L180,10 L200,5"
              fill="none"
              stroke={accentColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{
                strokeDasharray: '300',
                strokeDashoffset: chartDraw ? '0' : '300',
                transition: 'stroke-dashoffset 1.5s ease-out',
              }}
            />
            <circle cx="200" cy="5" r="4" fill={accentColor} style={{ opacity: chartDraw ? 1 : 0, transition: 'opacity 0.3s 1.5s' }} />
          </svg>
        </div>
      )}

      {/* AI Summary + Motivation */}
      {phase === 'summary' && (
        <div className="flex flex-col gap-1.5" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-[11px] text-[var(--text-secondary)] italic">
            {content.aiSummary}
          </p>
          <p className="text-[10px] font-bold" style={{ color: accentColor }}>
            {content.motivation}
          </p>
        </div>
      )}
    </div>
  );
};

export default DemoProgressTracking;
