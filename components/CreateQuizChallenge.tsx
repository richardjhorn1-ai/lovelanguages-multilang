import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface NewWord {
  polish: string;
  english: string;
}

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
  const [questionTypes, setQuestionTypes] = useState<Set<string>>(new Set(['multiple_choice']));
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New words feature
  const [newWords, setNewWords] = useState<NewWord[]>([]);
  const [newPolish, setNewPolish] = useState('');
  const [newEnglish, setNewEnglish] = useState('');
  const [generatedWord, setGeneratedWord] = useState<{ polish: string; english: string; pronunciation?: string; wasValidated?: boolean } | null>(null);
  const [generating, setGenerating] = useState(false);

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

  const generateTranslation = async () => {
    if (!newPolish.trim()) return;

    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ polish: newPolish.trim() })
      });

      const data = await response.json();
      if (data.success && data.validated) {
        setGeneratedWord({
          polish: data.validated.word,
          english: data.validated.translation,
          pronunciation: data.validated.pronunciation,
          wasValidated: true
        });
        // Pre-fill the english field for editing
        setNewEnglish(data.validated.translation);
      } else {
        alert(data.error || 'Failed to generate translation');
      }
    } catch (error) {
      console.error('Error generating translation:', error);
      alert('Failed to generate translation');
    }
    setGenerating(false);
  };

  const addNewWord = () => {
    if (!newPolish.trim() || !newEnglish.trim()) return;
    setNewWords(prev => [...prev, { polish: newPolish.trim(), english: newEnglish.trim() }]);
    setNewPolish('');
    setNewEnglish('');
    setGeneratedWord(null);
  };

  const removeNewWord = (index: number) => {
    setNewWords(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (selectedWords.size === 0 && newWords.length === 0) return;

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
            wordCount: selectedWords.size + newWords.length,
            questionTypes: Array.from(questionTypes)
          },
          wordIds: Array.from(selectedWords),
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
      console.error('Error creating quiz:', error);
      alert('Failed to create challenge');
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">Create Quiz</h2>
            <p className="text-sm text-[var(--text-secondary)]">Select words for {partnerName} to practice</p>
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
              Quiz Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Quiz for ${partnerName}`}
              className="w-full p-3 border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Add New Words Section */}
          <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)]">
            <div className="flex items-center gap-2 mb-3">
              <ICONS.Plus className="w-4 h-4 text-[var(--accent-color)]" />
              <p className="font-bold text-[var(--text-primary)] text-sm">Add New Words</p>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Teach {partnerName} new words! Enter Polish and AI will generate the translation.
            </p>

            {/* Step 1: Enter Polish word */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newPolish}
                onChange={e => {
                  setNewPolish(e.target.value);
                  // Clear generated result when Polish changes
                  if (generatedWord) {
                    setGeneratedWord(null);
                    setNewEnglish('');
                  }
                }}
                placeholder="Enter Polish word or phrase..."
                className="flex-1 p-2 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newPolish.trim() && !generatedWord && generateTranslation()}
              />
              {!generatedWord ? (
                <button
                  onClick={generateTranslation}
                  disabled={!newPolish.trim() || generating}
                  className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg font-bold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      Generate
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setGeneratedWord(null);
                    setNewEnglish('');
                  }}
                  className="px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] rounded-lg font-bold text-sm transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Step 2: Show generated result with edit option */}
            {generatedWord && (
              <div className="mb-3 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{generatedWord.polish}</span>
                      {generatedWord.pronunciation && (
                        <span className="text-xs text-[var(--text-secondary)]">[{generatedWord.pronunciation}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)]">→</span>
                      <input
                        type="text"
                        value={newEnglish}
                        onChange={e => setNewEnglish(e.target.value)}
                        placeholder="Edit translation..."
                        className="flex-1 p-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        onKeyDown={e => e.key === 'Enter' && newEnglish && addNewWord()}
                      />
                    </div>
                  </div>
                  <button
                    onClick={addNewWord}
                    disabled={!newEnglish.trim()}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg font-bold text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ICONS.Check className="w-4 h-4" />
                    Add
                  </button>
                </div>
              </div>
            )}
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

          {/* Question Types */}
          <div>
            <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
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
                      ? 'bg-[var(--accent-light)] text-[var(--accent-color)] border-2 border-[var(--accent-border)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-2 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  <span>{type.icon}</span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Word Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Select Existing Words ({selectedWords.size}/20)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-[var(--accent-color)] font-bold hover:underline"
                >
                  Select All
                </button>
                <span className="text-[var(--text-secondary)]">|</span>
                <button
                  onClick={clearSelection}
                  className="text-xs text-[var(--text-secondary)] font-bold hover:underline"
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
                className="w-full p-3 border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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
                      ? 'bg-[var(--accent-light)] border-2 border-[var(--accent-border)]'
                      : 'bg-[var(--bg-primary)] border-2 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  <p className="font-bold text-[var(--text-primary)] text-sm truncate">{word.word}</p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">{word.translation}</p>
                </button>
              ))}
            </div>

            {partnerVocab.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <p className="font-bold">{partnerName} hasn't learned any words yet!</p>
                <p className="text-sm">Add new words above to get started.</p>
              </div>
            )}
          </div>
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
            disabled={creating || (selectedWords.size === 0 && newWords.length === 0)}
            className="px-8 py-3 bg-[var(--accent-color)] text-white font-bold text-sm rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
