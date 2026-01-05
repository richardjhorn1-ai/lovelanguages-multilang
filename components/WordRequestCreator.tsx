import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, WordSuggestion } from '../types';
import { ICONS } from '../constants';

interface WordRequestCreatorProps {
  profile: Profile;
  partnerName: string;
  onClose: () => void;
  onCreated: () => void;
}

const WordRequestCreator: React.FC<WordRequestCreatorProps> = ({
  profile,
  partnerName,
  onClose,
  onCreated
}) => {
  const [mode, setMode] = useState<'free_text' | 'ai_topic'>('ai_topic');
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const [xpMultiplier, setXpMultiplier] = useState(2);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const popularTopics = [
    { label: 'Romantic phrases', icon: '💕' },
    { label: 'Kitchen & food', icon: '🍳' },
    { label: 'Family words', icon: '👨‍👩‍👧' },
    { label: 'Daily routines', icon: '☀️' },
    { label: 'Emotions', icon: '😊' },
    { label: 'Travel', icon: '✈️' }
  ];

  const handleGetSuggestions = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setSuggestions([]);
    setSelectedWords(new Set());

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch('/api/create-word-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: 'ai_topic',
          inputText,
          // Don't create the request yet, just get suggestions
          dryRun: true
        })
      });

      const data = await response.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
        // Pre-select first 5
        setSelectedWords(new Set([0, 1, 2, 3, 4].filter(i => i < data.suggestions.length)));
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
    setLoading(false);
  };

  const toggleWord = (index: number) => {
    const newSet = new Set(selectedWords);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setSelectedWords(newSet);
  };

  const handleCreate = async () => {
    if (mode === 'ai_topic' && selectedWords.size === 0) {
      alert('Please select at least one word');
      return;
    }

    if (mode === 'free_text' && !inputText.trim()) {
      alert('Please enter a word or phrase');
      return;
    }

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      let finalWords: WordSuggestion[] = [];
      if (mode === 'ai_topic') {
        finalWords = suggestions
          .filter((_, i) => selectedWords.has(i))
          .map(w => ({ ...w, selected: true }));
      } else {
        // Parse free text input: "word = translation" format
        const parts = inputText.split('=').map(s => s.trim());
        finalWords = [{
          word: parts[0],
          translation: parts[1] || '',
          word_type: 'phrase',
          selected: true
        }];
      }

      const response = await fetch('/api/create-word-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: mode,
          inputText,
          selectedWords: finalWords,
          xpMultiplier
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || 'Failed to send gift');
      }
    } catch (error) {
      console.error('Error creating word request:', error);
      alert('Failed to send gift');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span>🎁</span> Gift Words
            </h2>
            <p className="text-sm text-gray-500">Send words for {partnerName} to learn</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ICONS.X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="px-6 pt-4">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('ai_topic')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'ai_topic'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              AI Topic
            </button>
            <button
              onClick={() => setMode('free_text')}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                mode === 'free_text'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              Custom Word
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {mode === 'ai_topic' ? (
            <>
              {/* Topic Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Topic or Theme
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="e.g., romantic phrases, kitchen words..."
                    className="flex-1 p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-300"
                    onKeyDown={e => e.key === 'Enter' && handleGetSuggestions()}
                  />
                  <button
                    onClick={handleGetSuggestions}
                    disabled={loading || !inputText.trim()}
                    className="px-4 py-3 bg-teal-500 text-white font-bold text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
                  >
                    {loading ? '...' : 'Go'}
                  </button>
                </div>
              </div>

              {/* Popular Topics */}
              {suggestions.length === 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Popular topics</p>
                  <div className="flex flex-wrap gap-2">
                    {popularTopics.map(topic => (
                      <button
                        key={topic.label}
                        onClick={() => {
                          setInputText(topic.label);
                        }}
                        className="px-3 py-2 bg-gray-50 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                      >
                        <span>{topic.icon}</span>
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-8">
                  <div className="flex justify-center gap-1 mb-2">
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <p className="text-sm text-gray-500">Finding words...</p>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Select words ({selectedWords.size} selected)
                    </p>
                    <button
                      onClick={() => setSelectedWords(new Set(suggestions.map((_, i) => i)))}
                      className="text-xs text-teal-500 font-bold hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {suggestions.map((word, index) => (
                      <button
                        key={index}
                        onClick={() => toggleWord(index)}
                        className={`w-full p-4 rounded-2xl text-left transition-all ${
                          selectedWords.has(index)
                            ? 'bg-teal-50 border-2 border-teal-300'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-bold text-gray-800">{word.word}</p>
                            <p className="text-sm text-gray-500">{word.translation}</p>
                            {word.pronunciation && (
                              <p className="text-xs text-gray-400 italic">[{word.pronunciation}]</p>
                            )}
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            selectedWords.has(index)
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-200'
                          }`}>
                            {selectedWords.has(index) && <ICONS.Check className="w-4 h-4" />}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Free Text Input */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Word or Phrase
                </label>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Polish word = English translation&#10;&#10;e.g., kocham cię = I love you"
                  rows={4}
                  className="w-full p-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-300 resize-none"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Format: Polish word = English translation
                </p>
              </div>
            </>
          )}

          {/* XP Multiplier */}
          <div className="bg-gradient-to-r from-amber-50 to-rose-50 p-4 rounded-2xl border border-amber-100">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              XP Bonus Multiplier: {xpMultiplier}x
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.5}
              value={xpMultiplier}
              onChange={e => setXpMultiplier(parseFloat(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-amber-200 to-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1x (Normal)</span>
              <span>2x</span>
              <span>3x (Maximum)</span>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              {partnerName} will earn <span className="font-bold text-rose-500">{xpMultiplier}x XP</span> for learning these words + a completion bonus!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || (mode === 'ai_topic' && selectedWords.size === 0) || (mode === 'free_text' && !inputText.trim())}
            className="px-8 py-3 bg-teal-500 text-white font-bold text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <ICONS.Heart className="w-4 h-4" />
                Send Gift
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordRequestCreator;
