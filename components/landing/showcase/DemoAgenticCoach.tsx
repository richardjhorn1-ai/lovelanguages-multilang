import React, { useState, useEffect } from 'react';
import type { AgenticCoachContent, DemoMeta } from './demoContent';

const CYCLE_MS = 8000;

interface Props { accentColor: string; content: AgenticCoachContent; meta: DemoMeta }

const DemoAgenticCoach: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'thinking' | 'suggest' | 'spinner' | 'accepted'>('thinking');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('suggest'), 1800));
    timers.push(setTimeout(() => setPhase('spinner'), 5200));
    timers.push(setTimeout(() => setPhase('accepted'), 6400));
    timers.push(setTimeout(() => setPhase('thinking'), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'thinking' ? Date.now() : 0]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 h-full">
      {/* Learner snapshot */}
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-secondary)]">
        <span className="font-bold text-[var(--text-primary)]">{meta.partnerName}</span>
        <span>·</span>
        <span>58 words</span>
        <span>·</span>
        <span>Week 3</span>
      </div>

      {phase === 'thinking' && (
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentColor}15` }}>
            <span className="text-xl">💡</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: accentColor, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>Analyzing progress...</span>
        </div>
      )}

      {(phase === 'suggest' || phase === 'spinner' || phase === 'accepted') && (
        <div
          className="w-full max-w-[280px] rounded-2xl p-4"
          style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}25`, animation: 'reveal-up 0.3s ease-out both' }}
        >
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Coach suggests</span>
          </div>
          <p className="text-sm font-bold text-[var(--text-primary)] mb-1">{content.suggestionTitle}</p>
          <p className="text-xs text-[var(--text-secondary)] mb-1.5">{content.context}</p>
          <p className="text-[11px] text-[var(--text-secondary)] mb-3 italic">
            💡 {content.tip}
          </p>

          {phase === 'suggest' ? (
            <div className="flex gap-2">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>Accept ✓</span>
              <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>Skip</span>
            </div>
          ) : phase === 'spinner' ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs" style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              <span className="text-xs text-[var(--text-secondary)]">Creating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5" style={{ animation: 'reveal-up 0.2s ease-out' }}>
              <span className="text-xs font-bold" style={{ color: '#10b981' }}>✓ Challenge created for {meta.partnerName}</span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default DemoAgenticCoach;
