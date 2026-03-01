import React, { useState, useEffect } from 'react';
import type { ListenModeContent, DemoMeta } from './demoContent';

const CYCLE_MS = 12000;

interface Props { accentColor: string; content: ListenModeContent; meta: DemoMeta }

const DemoListenMode: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'wave' | 'transcript' | 'extract' | 'culture'>('wave');
  const [lineCount, setLineCount] = useState(0);
  const [extractCount, setExtractCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('transcript'), 1500));
    timers.push(setTimeout(() => setLineCount(1), 2000));
    timers.push(setTimeout(() => setLineCount(2), 2800));
    timers.push(setTimeout(() => setLineCount(3), 3600));
    timers.push(setTimeout(() => setPhase('extract'), 4500));
    timers.push(setTimeout(() => setExtractCount(1), 5000));
    timers.push(setTimeout(() => setBookmarked(true), 5400));
    timers.push(setTimeout(() => setExtractCount(2), 5500));
    timers.push(setTimeout(() => setExtractCount(3), 6000));
    timers.push(setTimeout(() => setExtractCount(4), 6500));
    timers.push(setTimeout(() => setExtractCount(5), 7000));
    timers.push(setTimeout(() => setPhase('culture'), 8000));
    timers.push(setTimeout(() => { setPhase('wave'); setLineCount(0); setExtractCount(0); setBookmarked(false); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'wave' && lineCount === 0 ? Date.now() : 0]);

  return (
    <div className="flex flex-col gap-2.5 p-4 h-full">
      {/* Recording indicator */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: phase === 'wave' ? '#ef4444' : '#10b981', animation: phase === 'wave' ? 'pulse 1s infinite' : 'none' }} />
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: phase === 'wave' ? '#ef4444' : accentColor }}>
          {phase === 'wave' ? 'Recording...' : phase === 'transcript' ? 'Transcribing' : phase === 'extract' ? 'Words Found' : 'Culture Note'}
        </span>
      </div>

      {/* Waveform */}
      {phase === 'wave' && (
        <div className="flex items-center justify-center gap-[3px] h-10 my-1">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="w-[4px] rounded-full"
              style={{
                backgroundColor: accentColor,
                opacity: 0.6,
                animation: `wave-bar 0.8s ease-in-out ${i * 0.05}s infinite alternate`,
                height: '4px',
              }}
            />
          ))}
        </div>
      )}

      {/* Transcript — 3 lines: partner, partner, translation */}
      {(phase === 'transcript' || phase === 'extract' || phase === 'culture') && (
        <div className="flex flex-col gap-1.5">
          {content.lines.slice(0, lineCount).map((line, i) => (
            <div key={i} className="flex items-start gap-2" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
              <span
                className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded"
                style={line.style === 'partner'
                  ? { backgroundColor: `${accentColor}15`, color: accentColor }
                  : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }
                }
              >
                {line.label}
              </span>
              <span className={`text-[13px] leading-snug ${line.style === 'translation' ? 'text-[var(--text-secondary)] italic' : 'text-[var(--text-primary)]'}`}>
                {line.text}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Extracted words — 5 pills with bookmark */}
      {(phase === 'extract' || phase === 'culture') && extractCount > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {content.extractedWords.slice(0, extractCount).map((w, i) => (
            <div key={w.word} className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor, animation: 'reveal-up 0.2s ease-out both' }}>
              <span>+ {w.word}</span>
              {i === 0 && (
                <span style={{ opacity: bookmarked ? 1 : 0.3, transition: 'opacity 0.3s' }}>
                  {bookmarked ? '🔖' : '☆'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Culture note */}
      {phase === 'culture' && (
        <div className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}15`, animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-[11px] text-[var(--text-primary)]">
            <span className="font-bold" style={{ color: accentColor }}>💡</span> {content.cultureNote}
          </p>
        </div>
      )}

      <style>{`
        @keyframes wave-bar {
          0% { height: 4px; }
          100% { height: ${20 + Math.random() * 14}px; }
        }
      `}</style>
    </div>
  );
};

export default DemoListenMode;
