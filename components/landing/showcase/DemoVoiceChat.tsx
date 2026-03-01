import React, { useState, useEffect } from 'react';
import type { VoiceChatContent, DemoMeta } from './demoContent';

const CYCLE_MS = 11000;

interface Props { accentColor: string; content: VoiceChatContent; meta: DemoMeta }

const DemoVoiceChat: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'transcribing' | 'response' | 'followup'>('idle');
  const [userText, setUserText] = useState('');

  const fullUserText = content.spokenPhrase;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('recording'), 1500));
    timers.push(setTimeout(() => setPhase('transcribing'), 3700));
    for (let i = 0; i <= fullUserText.length; i++) {
      timers.push(setTimeout(() => setUserText(fullUserText.slice(0, i)), 3900 + i * 60));
    }
    timers.push(setTimeout(() => setPhase('response'), 5900));
    timers.push(setTimeout(() => setPhase('followup'), 8200));
    timers.push(setTimeout(() => { setPhase('idle'); setUserText(''); }, CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'idle' && userText === '' ? Date.now() : 0]);

  return (
    <div className="flex flex-col items-center justify-center gap-2.5 p-4 h-full">
      {/* AI Coach badge */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          AI Coach
        </span>
        <span className="text-[9px] text-[var(--text-secondary)]">Level 2</span>
      </div>

      {/* Mic button */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
        style={{
          backgroundColor: phase === 'recording' ? accentColor : `${accentColor}15`,
          boxShadow: phase === 'recording' ? `0 0 0 8px ${accentColor}15, 0 0 0 16px ${accentColor}08` : 'none',
          animation: phase === 'recording' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={phase === 'recording' ? 'white' : accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      </div>

      {/* Waveform */}
      {phase === 'recording' && (
        <div className="flex items-center justify-center gap-[3px] h-4">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full"
              style={{
                backgroundColor: accentColor,
                opacity: 0.7,
                animation: `wave-bar-vc 0.5s ease-in-out ${i * 0.04}s infinite alternate`,
                height: '3px',
              }}
            />
          ))}
        </div>
      )}

      {/* Transcription */}
      {userText && (
        <div className="text-center" style={{ animation: 'reveal-up 0.2s ease-out' }}>
          <span className="text-sm font-bold text-[var(--text-primary)]">{userText}</span>
          {phase === 'transcribing' && <span className="animate-pulse text-[var(--text-secondary)]">|</span>}
        </div>
      )}

      {/* AI Response with bold accent words */}
      {(phase === 'response' || phase === 'followup') && (
        <div className="text-center px-3.5 py-2 rounded-xl w-full max-w-[260px]" style={{ backgroundColor: `${accentColor}08`, border: `1px solid ${accentColor}15`, animation: 'reveal-up 0.3s ease-out both' }}>
          <p className="text-sm text-[var(--text-primary)]">
            <span className="font-bold" style={{ color: accentColor }}>{content.feedback.praiseWord}</span> {content.feedback.comment}
          </p>
        </div>
      )}

      {/* Follow-up pills */}
      {phase === 'followup' && (
        <div className="flex gap-1.5 flex-wrap justify-center" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          {content.followUpPills.map((pill, i) => (
            <span
              key={i}
              className="text-[10px] font-bold px-2.5 py-1 rounded-full"
              style={pill.primary
                ? { backgroundColor: accentColor, color: 'white' }
                : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }
              }
            >
              {pill.label}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: phase === 'recording' ? accentColor : 'var(--text-secondary)' }}>
        {phase === 'idle' ? 'Tap to speak' : phase === 'recording' ? 'Listening...' : phase === 'transcribing' ? 'Processing' : 'AI Coach'}
      </span>

      <style>{`
        @keyframes wave-bar-vc {
          0% { height: 3px; }
          100% { height: 14px; }
        }
      `}</style>
    </div>
  );
};

export default DemoVoiceChat;
