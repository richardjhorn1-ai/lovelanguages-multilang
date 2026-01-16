import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExtractedWord } from '../services/gemini';
import { ICONS } from '../constants';

interface NewWordsNotificationProps {
  words: ExtractedWord[];
  onClose: () => void;
}

const NewWordsNotification: React.FC<NewWordsNotificationProps> = ({ words, onClose }) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();

  if (words.length === 0) return null;

  const handleWordClick = (word: string) => {
    navigate(`/log?search=${encodeURIComponent(word)}`);
    onClose();
  };

  return (
    <div
      className="fixed top-20 right-4 z-50 animate-in slide-in-from-right fade-in duration-300"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className={`bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--accent-border)] overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-auto'}`}>
        {/* Header - always visible */}
        <div className="px-4 py-3 bg-[var(--accent-light)] flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="relative">
            <ICONS.Sparkles className="w-5 h-5 text-[var(--accent-color)] animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <ICONS.Sparkles className="w-5 h-5 text-[var(--accent-color)] opacity-50" />
            </div>
          </div>
          <span className="text-scale-label font-bold text-[var(--text-primary)]">
            {t('newWords.added', { count: words.length })}
          </span>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-auto text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <ICONS.X className="w-4 h-4" />
          </button>
        </div>

        {/* Expanded word list */}
        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-3 space-y-2 max-h-56 overflow-y-auto">
            {words.map((word, idx) => (
              <button
                key={idx}
                onClick={() => handleWordClick(word.word)}
                className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-light)] to-transparent hover:from-[var(--accent-light)] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-scale-label font-bold text-[var(--accent-color)] sparkle-text">
                    {word.translation}
                  </span>
                  <ICONS.ChevronRight className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors" />
                </div>
                <span className="text-scale-micro text-[var(--text-secondary)] uppercase tracking-wider">
                  {word.type}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 pb-3">
            <button
              onClick={() => { navigate('/log'); onClose(); }}
              className="w-full py-2 text-scale-micro font-bold uppercase tracking-wider text-[var(--accent-color)] hover:opacity-80 transition-colors"
            >
              {t('newWords.viewAll')} →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sparkle-glow {
          0%, 100% {
            text-shadow: 0 0 4px rgba(255, 191, 0, 0.4), 0 0 8px rgba(255, 191, 0, 0.2);
          }
          50% {
            text-shadow: 0 0 8px rgba(255, 191, 0, 0.6), 0 0 16px rgba(255, 191, 0, 0.4), 0 0 24px rgba(255, 191, 0, 0.2);
          }
        }
        .sparkle-text {
          animation: sparkle-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NewWordsNotification;
