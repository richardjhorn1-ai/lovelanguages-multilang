import React, { useState, useEffect } from 'react';
import type { ActivityFeedContent, DemoMeta } from './demoContent';

const CYCLE_MS = 11000;

interface Props { accentColor: string; content: ActivityFeedContent; meta: DemoMeta }

const DemoActivityFeed: React.FC<Props> = ({ accentColor, content, meta }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < content.activities.length) {
      const timer = setTimeout(() => setVisibleCount(v => v + 1), 900);
      return () => clearTimeout(timer);
    }
    const reset = setTimeout(() => setVisibleCount(0), CYCLE_MS - content.activities.length * 900);
    return () => clearTimeout(reset);
  }, [visibleCount, content.activities.length]);

  return (
    <div className="flex flex-col gap-2.5 p-4 h-full">
      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {content.filterTabs.map((tab, i) => (
          <span
            key={tab}
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
            style={i === 0
              ? { backgroundColor: accentColor, color: 'white' }
              : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }
            }
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Events with colored badges */}
      <div className="flex flex-col gap-1.5">
        {content.activities.slice(0, visibleCount).map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-2 px-2.5 py-1.5 rounded-xl"
            style={{
              backgroundColor: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(0,0,0,0.05)',
              animation: 'reveal-up 0.3s ease-out both',
            }}
          >
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
              style={{ backgroundColor: a.bgColor, border: `1px solid ${a.borderColor}30` }}
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text-primary)] leading-snug">{a.text}</p>
              <p className="text-[9px] text-[var(--text-secondary)]">{a.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemoActivityFeed;
