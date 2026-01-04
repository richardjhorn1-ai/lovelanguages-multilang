import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExtractedWord } from '../services/gemini';
import { ICONS } from '../constants';

interface NewWordsNotificationProps {
  words: ExtractedWord[];
  onClose: () => void;
}

const NewWordsNotification: React.FC<NewWordsNotificationProps> = ({ words, onClose }) => {
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
      <div className={`bg-white rounded-2xl shadow-xl border border-rose-100 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-64' : 'w-auto'}`}>
        {/* Header - always visible */}
        <div className="px-4 py-3 bg-gradient-to-r from-rose-50 to-amber-50 flex items-center gap-2 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="relative">
            <ICONS.Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <div className="absolute inset-0 animate-ping">
              <ICONS.Sparkles className="w-5 h-5 text-amber-300 opacity-50" />
            </div>
          </div>
          <span className="text-sm font-bold text-gray-700">
            {words.length} new word{words.length > 1 ? 's' : ''} added
          </span>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors">
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
                className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-rose-50 to-transparent hover:from-rose-100 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#FF4761] sparkle-text">
                    {word.translation}
                  </span>
                  <ICONS.ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-rose-400 transition-colors" />
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {word.type}
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 pb-3">
            <button
              onClick={() => { navigate('/log'); onClose(); }}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 hover:text-rose-600 transition-colors"
            >
              View all in Love Log →
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
