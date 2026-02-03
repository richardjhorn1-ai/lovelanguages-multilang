import { useState, useEffect } from 'react';

interface ThinkingIndicatorProps {
  partnerName?: string;
}

const MESSAGES = [
  'Thinking...',
  'Checking progress...',
  'Planning your lesson...',
  'Crafting a response...',
];

export function ThinkingIndicator({ partnerName }: ThinkingIndicatorProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [dotCount, setDotCount] = useState(1);

  // Rotate through messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(i => (i + 1) % MESSAGES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Animate dots every 400ms
  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount(d => (d % 3) + 1);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-secondary)] animate-pulse">
      <div className="flex gap-1 text-[var(--accent-color)] font-mono text-sm">
        {[1, 2, 3].map((n) => (
          <span key={n} className={n <= dotCount ? 'opacity-100' : 'opacity-30'}>
            ●
          </span>
        ))}
      </div>
      <span className="text-[var(--text-secondary)] text-sm">
        {MESSAGES[messageIndex]}
      </span>
    </div>
  );
}
