import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface CreateQuizChallengeProps {
  profile: Profile;
  partnerVocab: DictionaryEntry[];
  partnerName: string;
  onClose: () => void;
  onCreated: () => void;
}

const CreateQuizChallenge: React.FC<CreateQuizChallengeProps> = ({
  profile,
  partnerVocab,
  partnerName,
  onClose,
  onCreated
}) => {
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [useWeakWords, setUseWeakWords] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<Set<string>>(new Set(['multiple_choice']));
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredVocab = partnerVocab.filter(word =>
    word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    word.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleWord = (id: string) => {
    const newSet = new Set(selectedWords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else if (newSet.size < 20) {
      newSet.add(id);
    }
    setSelectedWords(newSet);
  };

  const toggleQuestionType = (type: string) => {
    const newSet = new Set(questionTypes);
    if (newSet.has(type)) {
      if (newSet.size > 1) newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setQuestionTypes(newSet);
  };

  const selectAll = () => {
    const ids = filteredVocab.slice(0, 20).map(w => w.id);
    setSelectedWords(new Set(ids));
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  const handleCreate = async () => {
    if (selectedWords.size === 0 && !useWeakWords) return;

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch('/api/create-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challengeType: 'quiz',
          title: title || `Quiz for ${partnerName}`,
          config: {
            wordCount: selectedWords.size || 10,
            questionTypes: Array.from(questionTypes),
            aiSuggestedWeakWords: useWeakWords
          },
          wordIds: useWeakWords ? [] : Array.from(selectedWords)
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || 'Failed to create challenge');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('Failed to create challenge');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-gray-800">Create Quiz</h2>
            <p className="text-sm text-gray-500">Select words for {partnerName} to practice</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <ICONS.X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Quiz Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Quiz for ${partnerName}`}
              className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300"
            />
          </div>

          {/* AI Weak Words Option */}
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useWeakWords}
                onChange={e => setUseWeakWords(e.target.checked)}
                className="w-5 h-5 rounded border-amber-300 text-amber-500 focus:ring-amber-500"
              />
              <div>
                <p className="font-bold text-gray-800 text-sm">Use AI-suggested weak words</p>
                <p className="text-xs text-gray-500">Automatically select words {partnerName} struggles with</p>
              </div>
            </label>
          </div>

          {/* Question Types */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Question Types
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'multiple_choice', label: 'Multiple Choice', icon: '🔘' },
                { id: 'type_it', label: 'Type Answer', icon: '⌨️' },
                { id: 'flashcard', label: 'Flashcards', icon: '🃏' }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => toggleQuestionType(type.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                    questionTypes.has(type.id)
                      ? 'bg-rose-100 text-rose-600 border-2 border-rose-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Word Selection */}
          {!useWeakWords && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Select Words ({selectedWords.size}/20)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={clearSelection}
                    className="text-xs text-gray-500 font-bold hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search words..."
                  className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-300"
                />
              </div>

              {/* Word Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {filteredVocab.map(word => (
                  <button
                    key={word.id}
                    onClick={() => toggleWord(word.id)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedWords.has(word.id)
                        ? 'bg-rose-100 border-2 border-rose-300'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <p className="font-bold text-gray-800 text-sm truncate">{word.word}</p>
                    <p className="text-xs text-gray-500 truncate">{word.translation}</p>
                  </button>
                ))}
              </div>

              {partnerVocab.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="font-bold">{partnerName} hasn't learned any words yet!</p>
                  <p className="text-sm">Send them some words to learn first.</p>
                </div>
              )}
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
            disabled={creating || (selectedWords.size === 0 && !useWeakWords)}
            className="px-8 py-3 bg-rose-500 text-white font-bold text-sm rounded-xl hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <ICONS.Play className="w-4 h-4" />
                Send Challenge
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizChallenge;
