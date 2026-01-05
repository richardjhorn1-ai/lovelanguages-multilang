import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface CreateQuickFireChallengeProps {
  profile: Profile;
  partnerVocab: DictionaryEntry[];
  partnerName: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateQuickFireChallenge: React.FC<CreateQuickFireChallengeProps> = ({
  profile,
  partnerVocab,
  partnerName,
  onClose,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(60);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [creating, setCreating] = useState(false);

  const difficultySettings = {
    easy: { time: 90, desc: 'Relaxed pace, plenty of time' },
    medium: { time: 60, desc: 'Balanced challenge' },
    hard: { time: 30, desc: 'Race against the clock!' }
  };

  const handleDifficultyChange = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setTimeLimit(difficultySettings[diff].time);
  };

  const handleCreate = async () => {
    if (partnerVocab.length < wordCount) {
      alert(`${partnerName} needs at least ${wordCount} words to play this challenge!`);
      return;
    }

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Randomly select words from partner's vocab
      const shuffled = [...partnerVocab].sort(() => Math.random() - 0.5);
      const selectedWords = shuffled.slice(0, wordCount);

      const response = await fetch('/api/create-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeType: 'quickfire',
          title: title || `Quick Fire Challenge`,
          config: {
            wordCount,
            timeLimitSeconds: timeLimit,
            difficulty
          },
          wordIds: selectedWords.map(w => w.id)
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating quick fire:', error);
      alert('Failed to create challenge');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span>⚡</span> Quick Fire
            </h2>
            <p className="text-sm text-gray-500">Timed challenge for {partnerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ICONS.X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Quick Fire Challenge"
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-amber-300"
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyChange(diff)}
                  className={`p-4 rounded-2xl text-center transition-all ${
                    difficulty === diff
                      ? diff === 'easy'
                        ? 'bg-green-100 border-2 border-green-300'
                        : diff === 'medium'
                        ? 'bg-amber-100 border-2 border-amber-300'
                        : 'bg-red-100 border-2 border-red-300'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {diff === 'easy' ? '🌿' : diff === 'medium' ? '🔥' : '💥'}
                  </div>
                  <p className="font-bold text-gray-800 text-sm capitalize">{diff}</p>
                  <p className="text-xs text-gray-500">{difficultySettings[diff].time}s</p>
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Number of Words: {wordCount}
            </label>
            <input
              type="range"
              min={5}
              max={Math.min(20, partnerVocab.length || 20)}
              value={wordCount}
              onChange={e => setWordCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>5 words</span>
              <span>{Math.min(20, partnerVocab.length || 20)} words</span>
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Time Limit: {timeLimit} seconds
            </label>
            <input
              type="range"
              min={15}
              max={120}
              step={15}
              value={timeLimit}
              onChange={e => setTimeLimit(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>15s</span>
              <span>2 min</span>
            </div>
          </div>

          {/* Preview Stats */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <p className="text-sm text-gray-700">
              <span className="font-bold">{partnerName}</span> will have <span className="font-bold text-amber-600">{timeLimit} seconds</span> to translate <span className="font-bold text-amber-600">{wordCount} words</span>.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Average: {(timeLimit / wordCount).toFixed(1)}s per word
            </p>
          </div>

          {partnerVocab.length < 5 && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
              <p className="text-sm text-red-600 font-bold">
                {partnerName} needs at least 5 words to play Quick Fire!
              </p>
            </div>
          )}
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
            disabled={creating || partnerVocab.length < 5}
            className="px-8 py-3 bg-amber-500 text-white font-bold text-sm rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <span>⚡</span>
                Send Challenge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuickFireChallenge;
