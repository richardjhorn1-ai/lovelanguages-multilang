import React, { useState, useEffect } from 'react';
import type { PartnerChallengesContent, DemoMeta } from './demoContent';

const CYCLE_MS = 13000;

interface Props { accentColor: string; content: PartnerChallengesContent; meta: DemoMeta }

const DemoPartnerChallenges: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'header' | 'type' | 'config' | 'countdown' | 'live' | 'result'>('header');
  const [countdownNum, setCountdownNum] = useState(3);
  const [timerWidth, setTimerWidth] = useState(100);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('type'), 1500));
    timers.push(setTimeout(() => setPhase('config'), 3200));
    timers.push(setTimeout(() => setPhase('countdown'), 4800));
    timers.push(setTimeout(() => setCountdownNum(2), 5600));
    timers.push(setTimeout(() => setCountdownNum(1), 6400));
    timers.push(setTimeout(() => setPhase('live'), 7200));
    timers.push(setTimeout(() => setTimerWidth(60), 7600));
    timers.push(setTimeout(() => setTimerWidth(30), 9100));
    timers.push(setTimeout(() => setPhase('result'), 10600));
    timers.push(setTimeout(() => { setPhase('header'); setCountdownNum(3); setTimerWidth(100); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'header' ? Date.now() : 0]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4 h-full">
      {/* Header */}
      {phase === 'header' && (
        <div className="flex flex-col items-center gap-2.5 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-3xl">&#x26A1;</span>
          <p className="text-lg font-black font-header text-[var(--text-primary)]">Challenge {meta.partnerName}!</p>
          <p className="text-xs text-[var(--text-secondary)]">Send a fun quiz to your partner</p>
        </div>
      )}

      {/* Type selector */}
      {phase === 'type' && (
        <div className="w-full max-w-[260px] flex flex-col gap-2.5" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest text-center" style={{ color: accentColor }}>Choose type</p>
          <div className="flex gap-2">
            <div className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.08)' }}>
              <span className="text-lg">&#x1F4DD;</span>
              <p className="text-xs font-bold text-[var(--text-primary)] mt-1">Quiz</p>
            </div>
            <div className="flex-1 p-3 rounded-xl text-center" style={{ backgroundColor: `${accentColor}15`, border: `2px solid ${accentColor}` }}>
              <span className="text-lg">&#x26A1;</span>
              <p className="text-xs font-bold mt-1" style={{ color: accentColor }}>Quick Fire</p>
            </div>
          </div>
        </div>
      )}

      {/* Config */}
      {phase === 'config' && (
        <div className="flex flex-col items-center gap-3" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accentColor }}>&#x26A1; Quick Fire</p>
          <div className="flex gap-2">
            {['Easy', 'Medium', 'Hard'].map((d) => (
              <span
                key={d}
                className="text-[11px] font-bold px-3 py-1 rounded-full"
                style={d === 'Medium'
                  ? { backgroundColor: accentColor, color: 'white' }
                  : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }
                }
              >
                {d}
              </span>
            ))}
          </div>
          <p className="text-xs text-[var(--text-secondary)]">5 words  ·  Medium  ·  60 seconds</p>
          <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white" style={{ backgroundColor: accentColor }}>
            Send to {meta.partnerName} &rarr;
          </span>
        </div>
      )}

      {/* Countdown */}
      {phase === 'countdown' && (
        <div className="flex flex-col items-center gap-2">
          <span
            className="text-4xl font-black font-header"
            style={{ color: accentColor, animation: 'pulse 0.5s ease-in-out' }}
            key={countdownNum}
          >
            {countdownNum}
          </span>
          <p className="text-xs text-[var(--text-secondary)]">Get ready...</p>
        </div>
      )}

      {/* Live quiz */}
      {phase === 'live' && (
        <div className="w-full max-w-[250px] flex flex-col gap-2.5" style={{ animation: 'reveal-up 0.2s ease-out both' }}>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold" style={{ color: accentColor }}>&#x26A1; Quick Fire</span>
            <span className="text-[11px] font-bold text-[var(--text-secondary)]">3/5</span>
          </div>
          {/* Timer bar */}
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${timerWidth}%`,
                backgroundColor: timerWidth > 50 ? accentColor : timerWidth > 20 ? '#f59e0b' : '#ef4444',
                transition: 'width 1.5s linear, background-color 0.3s',
              }}
            />
          </div>
          <div className="p-3 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="text-lg font-black font-header" style={{ color: accentColor }}>{content.quizWord}</span>
          </div>
          <div className="flex gap-2">
            {content.quizOptions.map((opt) => (
              <span
                key={opt.label}
                className="flex-1 text-center text-xs font-medium px-2 py-1.5 rounded-lg"
                style={opt.correct
                  ? { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #10b981' }
                  : { backgroundColor: 'rgba(255,255,255,0.5)', color: 'var(--text-primary)', border: '1px solid rgba(0,0,0,0.08)' }
                }
              >
                {opt.label} {opt.correct && '\u2713'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {phase === 'result' && (
        <div className="flex flex-col items-center gap-2 text-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <span className="text-2xl">&#x1F389;</span>
          <p className="text-sm font-black font-header" style={{ color: accentColor }}>4/5 correct!</p>
          <p className="text-xs text-[var(--text-secondary)]">42s remaining</p>
          <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white" style={{ backgroundColor: '#10b981' }}>
            Sent to {meta.partnerName} &#x2713;
          </span>
        </div>
      )}
    </div>
  );
};

export default DemoPartnerChallenges;
