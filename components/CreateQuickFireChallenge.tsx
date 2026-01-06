import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry, WordScore } from '../types';
import { ICONS } from '../constants';

interface NewWord {
  polish: string;
  english: string;
}

interface CreateQuickFireChallengeProps {
  profile: Profile;
  partnerVocab: DictionaryEntry[];
  partnerScores?: Map<string, WordScore>;
  partnerName: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateQuickFireChallenge: React.FC<CreateQuickFireChallengeProps> = ({
  profile,
  partnerVocab,
  partnerScores = new Map(),
  partnerName,
  onClose,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [wordCount, setWordCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(60);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [creating, setCreating] = useState(false);

  // Word selection
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // New words feature
  const [newWords, setNewWords] = useState<NewWord[]>([]);
  const [newPolish, setNewPolish] = useState('');
  const [newEnglish, setNewEnglish] = useState('');

  const difficultySettings = {
    easy: { time: 90, desc: 'Relaxed pace, plenty of time' },
    medium: { time: 60, desc: 'Balanced challenge' },
    hard: { time: 30, desc: 'Race against the clock!' }
  };

  // Sort vocab by priority (weak words first)
  const sortedVocab = useMemo(() => {
    return [...partnerVocab].sort((a, b) => {
      const scoreA = partnerScores.get(a.id);
      const scoreB = partnerScores.get(b.id);

      // Priority: weak words first (high fail count, low streak)
      const priorityA = (scoreA?.fail_count || 0) * 2 - (scoreA?.correct_streak || 0);
      const priorityB = (scoreB?.fail_count || 0) * 2 - (scoreB?.correct_streak || 0);

      return priorityB - priorityA; // Higher priority first
    });
  }, [partnerVocab, partnerScores]);

  const filteredVocab = sortedVocab.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDifficultyChange = (diff: 'easy' | 'medium' | 'hard') => {
    setDifficulty(diff);
    setTimeLimit(difficultySettings[diff].time);
  };

  const toggleWord = (id: string) => {
    const newSet = new Set(selectedWordIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedWordIds(newSet);
  };

  const addNewWord = () => {
    if (!newPolish.trim() || !newEnglish.trim()) return;
    setNewWords(prev => [...prev, { polish: newPolish.trim(), english: newEnglish.trim() }]);
    setNewPolish('');
    setNewEnglish('');
  };

  const removeNewWord = (index: number) => {
    setNewWords(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate how many words we have vs need
  const manuallySelectedCount = selectedWordIds.size + newWords.length;
  const autoFillCount = Math.max(0, wordCount - manuallySelectedCount);
  const totalWordsAvailable = partnerVocab.length + newWords.length;

  // Get auto-fill words (priority order, excluding manually selected)
  const getAutoFillWordIds = () => {
    const available = sortedVocab.filter(w => !selectedWordIds.has(w.id));
    return available.slice(0, autoFillCount).map(w => w.id);
  };

  const handleCreate = async () => {
    const totalSelected = manuallySelectedCount + autoFillCount;
    if (totalSelected < 5 && newWords.length === 0) {
      alert(`Need at least 5 words for the challenge!`);
      return;
    }

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Combine manually selected + auto-filled words
      const manualIds = Array.from(selectedWordIds);
      const autoIds = getAutoFillWordIds();
      const allWordIds = [...manualIds, ...autoIds];

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
            wordCount: allWordIds.length + newWords.length,
            timeLimitSeconds: timeLimit,
            difficulty
          },
          wordIds: allWordIds,
          newWords: newWords.length > 0 ? newWords : undefined
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

  const canCreate = (manuallySelectedCount + autoFillCount >= 5) || newWords.length >= 5;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)] flex items-center gap-2">
              <span>⚡</span> Quick Fire
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">Timed challenge for {partnerName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors">
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Challenge Title
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Quick Fire Challenge"
              className="w-full p-3 border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
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
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700'
                        : diff === 'medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700'
                        : 'bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700'
                      : 'bg-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {diff === 'easy' ? '🌿' : diff === 'medium' ? '🔥' : '💥'}
                  </div>
                  <p className="font-bold text-[var(--text-primary)] text-sm capitalize">{diff}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{difficultySettings[diff].time}s</p>
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              Target Words: {wordCount}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              value={wordCount}
              onChange={e => setWordCount(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
              <span>5 words</span>
              <span>20 words</span>
            </div>
          </div>

          {/* Add New Words Section */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <ICONS.Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">Add New Words</p>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
              Teach {partnerName} new words! They'll be added to their Love Log after completing the challenge.
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPolish}
                onChange={e => setNewPolish(e.target.value)}
                placeholder="Polish word"
                className="flex-1 p-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newEnglish && addNewWord()}
              />
              <input
                type="text"
                value={newEnglish}
                onChange={e => setNewEnglish(e.target.value)}
                placeholder="English"
                className="flex-1 p-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-amber-500 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newPolish && addNewWord()}
              />
              <button
                onClick={addNewWord}
                disabled={!newPolish.trim() || !newEnglish.trim()}
                className="px-3 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
            </div>
            {newWords.length > 0 && (
              <div className="space-y-2">
                {newWords.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border-color)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] text-sm">{word.polish}</span>
                      <span className="text-[var(--text-secondary)]">→</span>
                      <span className="text-[var(--text-secondary)] text-sm">{word.english}</span>
                    </div>
                    <button
                      onClick={() => removeNewWord(index)}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      <ICONS.X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Word Selection from Love Log */}
          {partnerVocab.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  Pick Specific Words ({selectedWordIds.size} selected)
                </label>
                <button
                  onClick={() => setSelectedWordIds(new Set())}
                  className="text-xs text-[var(--text-secondary)] font-bold hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search words..."
                  className="w-full p-3 border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                />
              </div>

              {/* Word Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredVocab.slice(0, 40).map(word => {
                  const score = partnerScores.get(word.id);
                  const isWeak = score && (score.fail_count > 0 || (score.correct_streak || 0) < 3);
                  return (
                    <button
                      key={word.id}
                      onClick={() => toggleWord(word.id)}
                      className={`p-3 rounded-xl text-left transition-all ${
                        selectedWordIds.has(word.id)
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700'
                          : 'bg-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-[var(--text-primary)] text-sm truncate">{word.word}</p>
                        {isWeak && <span className="text-xs">🔴</span>}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate">{word.translation}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-2">
                🔴 = weak word (struggles with this)
              </p>
            </div>
          )}

          {/* Auto-fill Info */}
          <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">Word Selection:</span>
            </p>
            <ul className="text-xs text-[var(--text-secondary)] mt-2 space-y-1">
              <li>• New words: <span className="font-bold text-amber-600">{newWords.length}</span></li>
              <li>• Manually picked: <span className="font-bold text-amber-600">{selectedWordIds.size}</span></li>
              {autoFillCount > 0 && (
                <li>• Auto-fill (weak words first): <span className="font-bold text-amber-600">{Math.min(autoFillCount, partnerVocab.length - selectedWordIds.size)}</span></li>
              )}
              <li className="pt-1 border-t border-[var(--border-color)]">
                Total: <span className="font-bold text-[var(--text-primary)]">{Math.min(wordCount, manuallySelectedCount + Math.min(autoFillCount, partnerVocab.length - selectedWordIds.size))}</span> / {wordCount} target
              </li>
            </ul>
          </div>

          {/* Preview Stats */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <span className="font-bold">{partnerName}</span> will have <span className="font-bold text-amber-600 dark:text-amber-400">{timeLimit} seconds</span> to translate the words.
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Average: {(timeLimit / Math.max(1, manuallySelectedCount + autoFillCount)).toFixed(1)}s per word
            </p>
          </div>

          {!canCreate && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400 font-bold">
                Need at least 5 words total to create a challenge!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-card)] rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !canCreate}
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
