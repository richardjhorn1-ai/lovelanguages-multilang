import React, { useState, useEffect } from 'react';
import type { AITeachingContent, DemoMeta } from './demoContent';

const CYCLE_MS = 10000;

interface Props { accentColor: string; content: AITeachingContent; meta: DemoMeta }

const DemoAITeaching: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'question' | 'thinking' | 'table' | 'highlight' | 'culture'>('question');
  const [visibleRows, setVisibleRows] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('thinking'), 1500));
    timers.push(setTimeout(() => setPhase('table'), 3000));
    // Stagger rows
    timers.push(setTimeout(() => setVisibleRows(1), 3200));
    timers.push(setTimeout(() => setVisibleRows(2), 3400));
    timers.push(setTimeout(() => setVisibleRows(3), 3600));
    timers.push(setTimeout(() => setVisibleRows(4), 3800));
    timers.push(setTimeout(() => setPhase('highlight'), 4800));
    timers.push(setTimeout(() => setPhase('culture'), 7300));
    timers.push(setTimeout(() => { setPhase('question'); setVisibleRows(0); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'question' ? Date.now() : 0]);

  const showTable = phase === 'table' || phase === 'highlight' || phase === 'culture';

  return (
    <div className="flex flex-col gap-2 p-4 h-full">
      {/* Jamie's question */}
      <div className="flex justify-end">
        <div
          className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-br-sm text-sm font-medium"
          style={{ backgroundColor: `${accentColor}15`, border: `1px solid ${accentColor}25`, color: 'var(--text-primary)' }}
        >
          {content.question}
        </div>
      </div>

      {/* Thinking indicator */}
      {phase === 'thinking' && (
        <div className="flex items-center gap-2 ml-1" style={{ animation: 'reveal-up 0.2s ease-out both' }}>
          <span className="text-xs text-[var(--text-secondary)] italic">{content.thinkingContext}</span>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--text-secondary)', opacity: 0.4, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* AI conjugation table */}
      {showTable && (
        <div style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <div className="flex items-center gap-1 mb-1 ml-1">
            <span className="text-[9px]">&#x1F916;</span>
            <span className="text-[9px] font-bold" style={{ color: accentColor }}>Cupid</span>
          </div>
          <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm text-sm text-[var(--text-primary)]" style={{ backgroundColor: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <p className="mb-2 text-xs">{content.explanation}</p>

            <div className="flex flex-col gap-1 mb-2">
              {content.conjugations.slice(0, visibleRows).map((c) => (
                <div
                  key={c.person}
                  className="flex items-center gap-2.5 px-2.5 py-1 rounded-lg transition-all duration-300"
                  style={{
                    backgroundColor: (phase === 'highlight' || phase === 'culture') && c.highlight ? `${accentColor}15` : 'transparent',
                    border: (phase === 'highlight' || phase === 'culture') && c.highlight ? `1px solid ${accentColor}25` : '1px solid transparent',
                    animation: 'reveal-up 0.2s ease-out both',
                  }}
                >
                  <span className="text-xs text-[var(--text-secondary)] w-12">{c.person}</span>
                  <span className="text-xs font-bold" style={{ color: (phase === 'highlight' || phase === 'culture') && c.highlight ? accentColor : 'var(--text-primary)' }}>
                    &rarr; {c.form}
                  </span>
                  {(phase === 'highlight' || phase === 'culture') && c.highlight && (
                    <span className="text-[10px] font-bold ml-auto" style={{ color: accentColor }}>&larr; vows</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Culture note */}
      {phase === 'culture' && (
        <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}15`, animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-[11px] text-[var(--text-primary)]">
            <span className="font-bold" style={{ color: accentColor }}>&#x1F4A1;</span> {content.cultureNote}
          </p>
        </div>
      )}

      {/* Follow-up pills */}
      {phase === 'culture' && (
        <div className="flex gap-1.5" style={{ animation: 'reveal-up 0.3s ease-out 0.2s both' }}>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: accentColor, color: 'white' }}>
            {content.pills[0].label}
          </span>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}>
            {content.pills[1].label}
          </span>
        </div>
      )}
    </div>
  );
};

export default DemoAITeaching;
