import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { WordRequest, WordSuggestion } from '../types';
import { ICONS } from '../constants';

interface WordGiftLearningProps {
  wordRequest: WordRequest;
  partnerName: string;
  onClose: () => void;
  onComplete: () => void;
}

const WordGiftLearning: React.FC<WordGiftLearningProps> = ({
  wordRequest,
  partnerName,
  onClose,
  onComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const words = wordRequest.selected_words || [];

  const handleComplete = async () => {
    setCompleting(true);
    setError(null);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/complete-word-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId: wordRequest.id })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data);
        // Dispatch event so Love Log refreshes with new words
        window.dispatchEvent(new CustomEvent('dictionary-updated', {
          detail: { count: data.wordsAdded, source: 'word-gift' }
        }));
      } else {
        setError(data.error || 'Failed to complete. Please try again.');
      }
    } catch (err) {
      console.error('Error completing word request:', err);
      setError('Network error. Please check your connection and try again.');
    }
    setCompleting(false);
  };

  const handleNext = () => {
    setFlipped(false);
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const currentWord = words[currentIndex];
  const progress = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  // Intro Screen
  if (showIntro) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-[var(--accent-light)] to-amber-100/50 rounded-full flex items-center justify-center text-3xl md:text-4xl mx-auto mb-3 md:mb-4 animate-bounce">
            🎁
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">Gift from {partnerName}!</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            They want you to learn {words.length} special word{words.length > 1 ? 's' : ''}
          </p>

          {wordRequest.request_type === 'ai_topic' && (
            <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-3 md:mb-4">
              <p className="text-xs md:text-sm text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--text-primary)]">Topic:</span> {wordRequest.input_text}
              </p>
            </div>
          )}

          <div className="bg-[var(--accent-light)] p-3 md:p-4 rounded-xl md:rounded-2xl mb-4 md:mb-6 border border-[var(--accent-border)]">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl md:text-2xl">✨</span>
              <p className="text-xs md:text-sm font-bold text-[var(--text-primary)]">
                Earn <span className="text-[var(--accent-color)]">{wordRequest.xp_multiplier}x XP</span> for these words!
              </p>
              <span className="text-xl md:text-2xl">✨</span>
            </div>
          </div>

          <div className="flex gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors text-sm md:text-base"
            >
              Later
            </button>
            <button
              onClick={() => setShowIntro(false)}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
            >
              Open Gift
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (result) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[var(--accent-light)] to-amber-100/50 rounded-full flex items-center justify-center text-4xl md:text-5xl mx-auto mb-3 md:mb-4">
              🎉
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-[var(--accent-color)] rounded-full flex items-center justify-center text-white animate-pulse">
              <ICONS.Heart className="w-4 h-4 md:w-6 md:h-6 fill-white" />
            </div>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">Words Learned!</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            {result.wordsAdded} new word{result.wordsAdded > 1 ? 's' : ''} added to your Love Log
          </p>

          <div className="bg-[var(--accent-light)] p-4 md:p-6 rounded-xl md:rounded-2xl mb-4 md:mb-6 border border-[var(--accent-border)]">
            <p className="text-3xl md:text-4xl font-black text-[var(--accent-color)] mb-2">
              +{result.xpEarned} XP
            </p>
            <div className="text-[10px] md:text-xs text-[var(--text-secondary)] space-y-1">
              <p>Words: {result.breakdown?.wordsXp || 0} XP ({wordRequest.xp_multiplier}x bonus)</p>
              <p>Completion: +{result.breakdown?.completionBonus || 5} XP</p>
            </div>
          </div>

          <p className="text-xs md:text-sm text-[var(--text-secondary)] mb-4 md:mb-6 flex items-center justify-center gap-2">
            <ICONS.Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--accent-color)] fill-[var(--accent-color)]" />
            Gift from {result.giftedBy || partnerName}
          </p>

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Loading
  if (completing) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md p-8 text-center">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-3 h-3 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-[var(--text-secondary)]">Adding words to your Love Log...</p>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md overflow-hidden text-center p-6 md:p-8">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-3xl md:text-4xl mx-auto mb-3 md:mb-4">
            😔
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-2">Oops!</h2>
          <p className="text-[var(--text-secondary)] text-sm md:text-base mb-4 md:mb-6">
            {error}
          </p>
          <div className="flex gap-2 md:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors text-sm md:text-base"
            >
              Close
            </button>
            <button
              onClick={() => {
                setError(null);
                handleComplete();
              }}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors text-sm md:text-base"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Learning Card
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base md:text-lg">🎁</span>
              <span className="text-xs md:text-sm font-bold text-[var(--text-secondary)]">
                Word {currentIndex + 1} of {words.length}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 md:p-2 hover:bg-[var(--bg-primary)] rounded-lg md:rounded-xl">
              <ICONS.X className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          </div>
          <div className="h-1.5 md:h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--accent-color)] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="p-4 md:p-6">
          <div
            onClick={() => setFlipped(!flipped)}
            className="relative cursor-pointer perspective-1000 aspect-[4/3]"
          >
            <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}>
              {/* Front - Polish Word */}
              <div className="absolute inset-0 bg-[var(--accent-light)] p-6 md:p-8 rounded-xl md:rounded-2xl border border-[var(--accent-border)] text-center flex flex-col items-center justify-center backface-hidden">
                <p className="text-[10px] md:text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider mb-1.5 md:mb-2">Polish</p>
                <p className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-1.5 md:mb-2">{currentWord?.word}</p>
                {currentWord?.pronunciation && (
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] italic">[{currentWord.pronunciation}]</p>
                )}
                <p className="text-[10px] md:text-xs text-[var(--text-secondary)] mt-3 md:mt-4 animate-pulse">Tap to flip</p>
              </div>

              {/* Back - Translation */}
              <div className="absolute inset-0 bg-[var(--bg-primary)] p-6 md:p-8 rounded-xl md:rounded-2xl border border-[var(--border-color)] text-center flex flex-col items-center justify-center backface-hidden rotate-y-180">
                <p className="text-[10px] md:text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider mb-1.5 md:mb-2">English</p>
                <p className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-1.5 md:mb-2">{currentWord?.translation}</p>
                {currentWord?.context && (
                  <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-2">{currentWord.context}</p>
                )}
              </div>
            </div>
          </div>

          {/* Word Type Badge */}
          <div className="flex justify-center mt-3 md:mt-4">
            <span className="px-2.5 md:px-3 py-1 bg-[var(--bg-primary)] rounded-full text-[10px] md:text-xs font-bold text-[var(--text-secondary)] uppercase">
              {currentWord?.word_type || 'phrase'}
            </span>
          </div>

          {/* Navigation */}
          <div className="mt-4 md:mt-6 flex gap-2 md:gap-3">
            {currentIndex > 0 && (
              <button
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex(prev => prev - 1);
                }}
                className="flex-1 px-4 md:px-6 py-3 md:py-4 text-[var(--text-secondary)] font-bold rounded-xl hover:bg-[var(--bg-primary)] transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base"
              >
                <ICONS.ChevronLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-4 md:px-6 py-3 md:py-4 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:opacity-90 transition-colors flex items-center justify-center gap-1.5 md:gap-2 text-sm md:text-base"
            >
              {currentIndex < words.length - 1 ? (
                <>Next <ICONS.ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" /></>
              ) : (
                <>Add to Love Log <ICONS.Heart className="w-3.5 h-3.5 md:w-4 md:h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
};

export default WordGiftLearning;
