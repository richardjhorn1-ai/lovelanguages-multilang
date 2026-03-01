import React, { useState, useEffect } from 'react';
import type { ConversationContent, DemoMeta } from './demoContent';

const CYCLE_MS = 12000;

interface Props { accentColor: string; content: ConversationContent; meta: DemoMeta }

const DemoConversation: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [phase, setPhase] = useState<'scenario' | 'ai-speaking' | 'ai-msg' | 'user-typing' | 'user-msg' | 'feedback'>('scenario');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setPhase('ai-speaking'), 2000));
    timers.push(setTimeout(() => setPhase('ai-msg'), 3500));
    timers.push(setTimeout(() => setPhase('user-typing'), 5500));
    timers.push(setTimeout(() => setPhase('user-msg'), 7000));
    timers.push(setTimeout(() => setPhase('feedback'), 8500));
    timers.push(setTimeout(() => setPhase('scenario'), CYCLE_MS));
    return () => timers.forEach(clearTimeout);
  }, [phase === 'scenario' ? Date.now() : 0]);

  const showAiMsg = phase === 'ai-msg' || phase === 'user-typing' || phase === 'user-msg' || phase === 'feedback';
  const showUserMsg = phase === 'user-msg' || phase === 'feedback';

  return (
    <div className="flex flex-col gap-2 p-4 h-full">
      {/* Scenario badge */}
      <div className="text-center mb-1" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
          {content.scenario.emoji} {content.scenario.label}
        </span>
      </div>

      {/* State badge */}
      <div className="flex items-center gap-2 mb-0.5">
        <div className="w-2 h-2 rounded-full" style={{
          backgroundColor: phase === 'ai-speaking' ? accentColor : '#10b981',
          animation: phase === 'ai-speaking' ? 'pulse 1s infinite' : 'none',
        }} />
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{
          color: phase === 'ai-speaking' ? accentColor : '#10b981',
        }}>
          {phase === 'ai-speaking' ? '✨ AI Speaking' : '🟢 Your turn'}
        </span>
        {/* Equalizer */}
        {phase === 'ai-speaking' && (
          <div className="flex items-end gap-[2px] h-3 ml-1">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="w-[3px] rounded-full"
                style={{
                  backgroundColor: accentColor,
                  animation: `eq-bar 0.4s ease-in-out ${i * 0.1}s infinite alternate`,
                  height: '3px',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI message */}
      {showAiMsg && (
        <div className="flex justify-start" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <div className="max-w-[85%] px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm text-[var(--text-primary)]" style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
            {content.aiMessage.prefix} <span className="font-bold" style={{ color: accentColor }}>{content.aiMessage.targetPhrase}</span> <span className="text-[10px] text-[var(--text-secondary)]">{content.aiMessage.pronunciation}</span>
          </div>
        </div>
      )}

      {/* User typing indicator */}
      {phase === 'user-typing' && (
        <div className="flex justify-end" style={{ animation: 'reveal-up 0.2s ease-out both' }}>
          <div className="px-4 py-2.5 rounded-2xl rounded-br-sm flex gap-1.5" style={{ backgroundColor: `${accentColor}15` }}>
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor, opacity: 0.5, animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }} />
            ))}
          </div>
        </div>
      )}

      {/* User message */}
      {showUserMsg && (
        <div className="flex justify-end" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <div className="max-w-[80%] px-3.5 py-2 rounded-2xl rounded-br-sm text-sm text-white font-medium" style={{ backgroundColor: accentColor }}>
            {content.userResponse}
          </div>
        </div>
      )}

      {/* AI Feedback with bold */}
      {phase === 'feedback' && (
        <div className="flex justify-start" style={{ animation: 'reveal-up 0.3s ease-out both' }}>
          <div className="max-w-[90%] px-3.5 py-2 rounded-2xl rounded-bl-sm text-sm text-[var(--text-primary)]" style={{ backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <span className="font-bold" style={{ color: accentColor }}>{content.feedback.praiseWord}</span> <span className="text-[10px] text-[var(--text-secondary)]">{content.feedback.pronunciation}</span> {content.feedback.comment}
          </div>
        </div>
      )}

      <style>{`
        @keyframes eq-bar {
          0% { height: 3px; }
          100% { height: 12px; }
        }
      `}</style>
    </div>
  );
};

export default DemoConversation;
