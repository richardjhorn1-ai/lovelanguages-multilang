import React, { useState, useEffect } from 'react';
import type { LoveLogContent, DemoMeta } from './demoContent';

const CYCLE_MS = 11000;

interface Props { accentColor: string; content: LoveLogContent; meta: DemoMeta }

const DemoLoveLog: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'grid' | 'filter' | 'detail'>('grid');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('filter'), 3000));
    timers.push(setTimeout(() => setActiveFilter('Verbs'), 4500));
    timers.push(setTimeout(() => setPhase('detail'), 6200));
    timers.push(setTimeout(() => { setPhase('grid'); setActiveFilter(null); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'grid' && !activeFilter ? Date.now() : 0]);

  const verbWords = content.words.filter(w => w.type === 'verb');
  const displayWords = activeFilter === 'Verbs' ? verbWords : content.words;

  return (
    <div className="flex flex-col gap-2 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: accentColor }}>
            <span className="text-[9px] text-white">📖</span>
          </div>
          <span className="text-[11px] font-black font-header text-[var(--text-primary)]">Love Log</span>
        </div>
        <span className="text-[9px] font-bold text-[var(--text-secondary)] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.04)' }}>47</span>
      </div>

      {/* Filter pills */}
      {(phase === 'filter') && (
        <div className="flex gap-1 overflow-hidden" style={{ animation: 'reveal-up 0.2s ease-out both' }}>
          {['Nouns', 'Verbs', 'Adj', '❤️ Gifts'].map((f) => (
            <span
              key={f}
              className="text-[7px] font-black uppercase tracking-[0.08em] px-2 py-0.5 rounded-full whitespace-nowrap"
              style={f === activeFilter
                ? { backgroundColor: accentColor, color: 'white' }
                : { backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }
              }
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Card grid */}
      {phase !== 'detail' && (
        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
          {displayWords.map((w) => (
            <div
              key={w.word}
              className="relative rounded-xl flex flex-col items-center justify-center text-center p-2 overflow-hidden"
              style={{
                backgroundColor: 'rgba(255,255,255,0.55)',
                border: w.badge === 'gift' ? `1.5px solid ${accentColor}40` : '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.06)',
                animation: 'reveal-up 0.2s ease-out both',
              }}
            >
              {/* Gift badge — top left */}
              {w.badge === 'gift' && (
                <div className="absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15` }}>
                  <span className="text-[7px]">❤️</span>
                  <span className="text-[6px] font-bold" style={{ color: accentColor }}>Gift</span>
                </div>
              )}

              {/* Mastery badge — top right */}
              {w.badge === 'mastery' && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                  <span className="text-[8px]" style={{ color: '#16a34a' }}>✓</span>
                </div>
              )}

              {/* Streak badge — top right */}
              {w.badge === 'streak' && (
                <div className="absolute top-1 right-1 flex items-center gap-0.5 px-1 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15` }}>
                  <span className="text-[7px] font-black" style={{ color: accentColor }}>{w.streak}/5</span>
                  <span className="text-[7px]">⚡</span>
                </div>
              )}

              {/* Word type pill */}
              <span className="text-[6px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-1" style={{ backgroundColor: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)' }}>
                {w.type}
              </span>

              {/* Word */}
              <span className="text-sm font-black font-header leading-tight" style={{ color: accentColor }}>{w.word}</span>

              {/* Play button */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center my-0.5" style={{ backgroundColor: `${accentColor}15` }}>
                <span className="text-[8px]" style={{ color: accentColor }}>▶</span>
              </div>

              {/* Translation */}
              <span className="text-[9px] text-[var(--text-secondary)] leading-tight">{w.translation}</span>
            </div>
          ))}
        </div>
      )}

      {/* Detail view */}
      {phase === 'detail' && (
        <div className="flex-1 flex flex-col gap-2 min-h-0" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          {/* Accent header bar */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: accentColor }}>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white font-header">{content.detail.word}</span>
              <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <span className="text-[8px] text-white">▶</span>
              </div>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/70">{content.detail.type}</span>
          </div>

          {/* Translation */}
          <div className="text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">{content.detail.translation}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">{content.detail.pronunciation}</p>
          </div>

          {/* Example */}
          <p className="text-[10px] italic text-[var(--text-secondary)] text-center px-2">
            &quot;{content.detail.example.text}&quot; — {content.detail.example.translation}
          </p>

          {/* Conjugation with tense tabs */}
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
            {/* Tense tabs */}
            <div className="flex border-b" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              {content.detail.tenses.map((t, i) => (
                <span
                  key={t}
                  className="flex-1 text-center text-[8px] font-bold py-1"
                  style={i === 0
                    ? { color: accentColor, borderBottom: `2px solid ${accentColor}` }
                    : { color: 'var(--text-secondary)' }
                  }
                >
                  {t}
                </span>
              ))}
            </div>
            {/* Conjugation rows */}
            <div className="px-2.5 py-1.5 flex flex-col gap-0.5">
              {content.detail.conjugations.map((c) => (
                <div key={c.person} className="flex items-center gap-2 text-[9px]">
                  <span className="text-[var(--text-secondary)] w-10">{c.person}</span>
                  <span className="font-bold text-[var(--text-primary)]">→ {c.form}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mastery status */}
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
              <span className="text-[7px]" style={{ color: '#16a34a' }}>✓</span>
            </div>
            <span className="text-[9px] font-bold" style={{ color: '#16a34a' }}>Mastered</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoLoveLog;
