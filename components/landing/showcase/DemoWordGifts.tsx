import React, { useState, useEffect } from 'react';
import type { WordGiftsContent, DemoMeta } from './demoContent';

const CYCLE_MS = 12000;

interface Props { accentColor: string; content: WordGiftsContent; meta: DemoMeta }

const DemoWordGifts: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'context' | 'picking' | 'sent' | 'receive' | 'flip' | 'progress'>('context');
  const [checkedCount, setCheckedCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('picking'), 1800));
    timers.push(setTimeout(() => setCheckedCount(1), 3000));
    timers.push(setTimeout(() => setCheckedCount(2), 3700));
    timers.push(setTimeout(() => setCheckedCount(3), 4400));
    timers.push(setTimeout(() => setPhase('sent'), 5300));
    timers.push(setTimeout(() => setPhase('receive'), 6700));
    timers.push(setTimeout(() => setPhase('flip'), 8300));
    timers.push(setTimeout(() => setPhase('progress'), 10300));
    timers.push(setTimeout(() => { setPhase('context'); setCheckedCount(0); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'context' && checkedCount === 0 ? Date.now() : 0]);

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 p-4 h-full">
      {/* Event context */}
      {phase === 'context' && (
        <div className="flex flex-col items-center gap-2.5 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-3xl">{content.event.emoji}</span>
          <p className="text-sm font-bold text-[var(--text-primary)]">{content.event.title}</p>
          <p className="text-xs text-[var(--text-secondary)]">{content.event.subtitle}</p>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
            {content.event.badgeText}
          </span>
        </div>
      )}

      {/* Picking words */}
      {(phase === 'picking' || phase === 'sent') && (
        <div className="w-full max-w-[260px] flex flex-col gap-2" style={{ animation: phase === 'picking' ? 'reveal-up 0.3s ease-out both' : 'none' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-center" style={{ color: accentColor }}>
            🎁 {checkedCount} of {content.words.length} words
          </p>
          {content.words.map((w, i) => (
            <div
              key={w.word}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
              style={{
                backgroundColor: i < checkedCount ? `${accentColor}08` : 'rgba(255,255,255,0.5)',
                border: `1px solid ${i < checkedCount ? `${accentColor}25` : 'rgba(0,0,0,0.06)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-[9px]"
                style={{
                  backgroundColor: i < checkedCount ? accentColor : 'transparent',
                  border: `1.5px solid ${i < checkedCount ? accentColor : 'rgba(0,0,0,0.15)'}`,
                  color: 'white',
                  transition: 'all 0.2s',
                }}
              >
                {i < checkedCount ? '✓' : ''}
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">{w.word}</span>
              <span className="text-xs text-[var(--text-secondary)] ml-auto">{w.translation}</span>
            </div>
          ))}
          {phase === 'sent' && (
            <div className="text-center mt-1" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white" style={{ backgroundColor: '#10b981' }}>
                Sent to {meta.partnerName} ✓
              </span>
            </div>
          )}
        </div>
      )}

      {/* Receiver perspective */}
      {phase === 'receive' && (
        <div className="flex flex-col items-center gap-3 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-3xl">🎁</span>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{content.receiverMessage.title}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{content.receiverMessage.subtitle}</p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>
            Start Learning →
          </span>
        </div>
      )}

      {/* 3D Flip card */}
      {phase === 'flip' && (
        <div className="flex flex-col items-center gap-2" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <div className="relative w-[220px]" style={{ perspective: '1000px', height: '110px' }}>
            <div
              className="absolute inset-0"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateY(180deg)',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center"
                style={{ backfaceVisibility: 'hidden', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.08)' }}
              >
                <span className="text-lg font-black" style={{ color: accentColor }}>{content.flipCard.word}</span>
              </div>
              <div
                className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-1"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', backgroundColor: accentColor }}
              >
                <span className="text-base font-bold text-white">{content.flipCard.translation}</span>
                <span className="text-[11px] text-white/70">{content.flipCard.pronunciation}</span>
                <span className="text-[10px] text-white/50">🔊</span>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[var(--text-secondary)]">From {meta.petName} 💕</span>
        </div>
      )}

      {/* Progress/results */}
      {phase === 'progress' && (
        <div className="flex flex-col items-center gap-2.5 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-2xl">✨</span>
          <p className="text-sm font-bold" style={{ color: accentColor }}>3 words learned!</p>
          <p className="text-xs font-bold" style={{ color: '#10b981' }}>+60 XP</p>
          <p className="text-[10px] text-[var(--text-secondary)]">From {meta.petName} 💕</p>
        </div>
      )}
    </div>
  );
};

export default DemoWordGifts;
