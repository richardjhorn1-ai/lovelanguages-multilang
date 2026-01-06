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

  const words = wordRequest.selected_words || [];

  const handleComplete = async () => {
    setCompleting(true);
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
      }
    } catch (error) {
      console.error('Error completing word request:', error);
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
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[var(--accent-light)] to-amber-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce">
            🎁
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">Gift from {partnerName}!</h2>
          <p className="text-gray-500 mb-6">
            They want you to learn {words.length} special word{words.length > 1 ? 's' : ''}
          </p>

          {wordRequest.request_type === 'ai_topic' && (
            <div className="bg-[var(--accent-light)] p-4 rounded-2xl mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold">Topic:</span> {wordRequest.input_text}
              </p>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-50 to-[var(--accent-light)] p-4 rounded-2xl mb-6 border border-amber-100">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">✨</span>
              <p className="text-sm font-bold text-gray-800">
                Earn <span className="text-[var(--accent-color)]">{wordRequest.xp_multiplier}x XP</span> for these words!
              </p>
              <span className="text-2xl">✨</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-4 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              Later
            </button>
            <button
              onClick={() => setShowIntro(false)}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--accent-color)] to-amber-500 text-white font-bold rounded-xl hover:from-[var(--accent-hover)] hover:to-amber-600 transition-colors"
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
        <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden text-center p-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-[var(--accent-light)] to-amber-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
              🎉
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[var(--accent-light)]0 rounded-full flex items-center justify-center text-white animate-pulse">
              <ICONS.Heart className="w-6 h-6 fill-white" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-gray-800 mb-2">Words Learned!</h2>
          <p className="text-gray-500 mb-6">
            {result.wordsAdded} new word{result.wordsAdded > 1 ? 's' : ''} added to your Love Log
          </p>

          <div className="bg-gradient-to-r from-amber-50 to-[var(--accent-light)] p-6 rounded-2xl mb-6 border border-amber-100">
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-color)] to-amber-500 mb-2">
              +{result.xpEarned} XP
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Words: {result.breakdown?.wordsXp || 0} XP ({wordRequest.xp_multiplier}x bonus)</p>
              <p>Completion: +{result.breakdown?.completionBonus || 5} XP</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6 flex items-center justify-center gap-2">
            <ICONS.Heart className="w-4 h-4 text-[var(--accent-color)] fill-[var(--accent-color)]" />
            Gift from {result.giftedBy || partnerName}
          </p>

          <button
            onClick={() => { onComplete(); }}
            className="w-full px-6 py-4 bg-gradient-to-r from-[var(--accent-color)] to-amber-500 text-white font-bold rounded-xl hover:from-[var(--accent-hover)] hover:to-amber-600 transition-colors"
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

  // Learning Card
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎁</span>
              <span className="text-sm font-bold text-gray-500">
                Word {currentIndex + 1} of {words.length}
              </span>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl">
              <ICONS.X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-color)] to-amber-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="p-6">
          <div
            onClick={() => setFlipped(!flipped)}
            className="cursor-pointer perspective-1000"
          >
            <div className={`relative transition-transform duration-500 transform-style-preserve-3d ${
              flipped ? 'rotate-y-180' : ''
            }`}>
              {/* Front - Polish Word */}
              <div className={`bg-gradient-to-br from-[var(--accent-light)] to-amber-50 p-8 rounded-2xl border border-[var(--accent-border)] text-center min-h-[200px] flex flex-col items-center justify-center ${
                flipped ? 'hidden' : ''
              }`}>
                <p className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider mb-2">Polish</p>
                <p className="text-3xl font-black text-gray-800 mb-2">{currentWord?.word}</p>
                {currentWord?.pronunciation && (
                  <p className="text-sm text-gray-400 italic">[{currentWord.pronunciation}]</p>
                )}
                <p className="text-xs text-gray-400 mt-4">Tap to flip</p>
              </div>

              {/* Back - Translation */}
              <div className={`bg-gradient-to-br from-teal-50 to-green-50 p-8 rounded-2xl border border-teal-100 text-center min-h-[200px] flex flex-col items-center justify-center ${
                flipped ? '' : 'hidden'
              }`}>
                <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-2">English</p>
                <p className="text-3xl font-black text-gray-800 mb-2">{currentWord?.translation}</p>
                {currentWord?.context && (
                  <p className="text-sm text-gray-500 mt-2">{currentWord.context}</p>
                )}
              </div>
            </div>
          </div>

          {/* Word Type Badge */}
          <div className="flex justify-center mt-4">
            <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-500 uppercase">
              {currentWord?.word_type || 'phrase'}
            </span>
          </div>

          {/* Navigation */}
          <div className="mt-6 flex gap-3">
            {currentIndex > 0 && (
              <button
                onClick={() => {
                  setFlipped(false);
                  setCurrentIndex(prev => prev - 1);
                }}
                className="flex-1 px-6 py-4 text-gray-500 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              >
                <ICONS.ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-[var(--accent-color)] to-amber-500 text-white font-bold rounded-xl hover:from-[var(--accent-hover)] hover:to-amber-600 transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex < words.length - 1 ? (
                <>Next <ICONS.ChevronRight className="w-4 h-4" /></>
              ) : (
                <>Add to Love Log <ICONS.Heart className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordGiftLearning;
