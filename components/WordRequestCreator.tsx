import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Profile, WordSuggestion, DictionaryEntry } from '../types';
import { ICONS } from '../constants';

interface WordRequestCreatorProps {
  profile: Profile;
  partnerName: string;
  partnerVocab: DictionaryEntry[];
  onClose: () => void;
  onCreated: () => void;
}

type InputMode = 'topic' | 'custom';

const WordRequestCreator: React.FC<WordRequestCreatorProps> = ({
  profile,
  partnerName,
  partnerVocab,
  onClose,
  onCreated
}) => {
  const [inputMode, setInputMode] = useState<InputMode>('topic');
  const [inputText, setInputText] = useState('');
  const [suggestions, setSuggestions] = useState<WordSuggestion[]>([]);
  const [selectedWords, setSelectedWords] = useState<WordSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<string | null>(null);

  // Custom word entry
  const [customPolish, setCustomPolish] = useState('');
  const [customEnglish, setCustomEnglish] = useState('');
  const [generatedCustom, setGeneratedCustom] = useState<{ polish: string; english: string; pronunciation?: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  const quickTopics = [
    { label: 'Love words', emoji: '💕' },
    { label: 'Kitchen', emoji: '🍳' },
    { label: 'Family', emoji: '👨‍👩‍👧' },
    { label: 'Emotions', emoji: '😊' },
    { label: 'Travel', emoji: '✈️' },
    { label: 'Home', emoji: '🏠' }
  ];

  // Get words to exclude (Love Log + already selected)
  const getExcludeWords = (): string[] => {
    const loveLogWords = partnerVocab.map(w => w.word.toLowerCase());
    const selectedWordsLower = selectedWords.map(w => w.word.toLowerCase());
    return [...new Set([...loveLogWords, ...selectedWordsLower])];
  };

  // Generate words on button click
  const generateWords = async () => {
    if (!inputText.trim() || inputText.length < 2) return;

    setLoading(true);
    setHasGenerated(true);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const excludeWords = getExcludeWords();

      const response = await fetch('/api/create-word-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: 'ai_topic',
          inputText: inputText,
          dryRun: true,
          excludeWords: excludeWords,
          count: 10
        })
      });

      const data = await response.json();
      if (data.suggestions) {
        // Filter out any words that somehow match excluded words
        const filtered = data.suggestions.filter(
          (s: WordSuggestion) => !excludeWords.includes(s.word.toLowerCase())
        );
        setSuggestions(filtered);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
    setLoading(false);
  };

  // Handle quick topic selection
  const handleQuickTopic = (topic: string) => {
    setInputText(topic);
  };

  const addWord = (word: WordSuggestion) => {
    setSelectedWords(prev => [...prev, word]);
    setSuggestions(prev => prev.filter(s => s.word !== word.word));
  };

  const generateCustomTranslation = async () => {
    if (!customPolish.trim()) return;

    // Check if already added or in Love Log first
    const lowerWord = customPolish.trim().toLowerCase();
    if (selectedWords.some(w => w.word.toLowerCase() === lowerWord)) {
      alert('This word is already in your package!');
      return;
    }
    if (partnerVocab.some(w => w.word.toLowerCase() === lowerWord)) {
      alert(`"${customPolish}" is already in ${partnerName}'s Love Log!`);
      return;
    }

    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ polish: customPolish.trim() })
      });

      const data = await response.json();
      if (data.success && data.validated) {
        // Check if the corrected word is in Love Log
        if (partnerVocab.some(w => w.word.toLowerCase() === data.validated.word.toLowerCase())) {
          alert(`"${data.validated.word}" is already in ${partnerName}'s Love Log!`);
          setGenerating(false);
          return;
        }

        setGeneratedCustom({
          polish: data.validated.word,
          english: data.validated.translation,
          pronunciation: data.validated.pronunciation
        });
        setCustomEnglish(data.validated.translation);

        // Show correction if word was corrected
        if (data.validated.was_corrected && data.validated.correction_note) {
          setLastCorrection(data.validated.correction_note);
          setTimeout(() => setLastCorrection(null), 4000);
        }
      } else {
        alert(data.error || 'Failed to generate translation');
      }
    } catch (error) {
      console.error('Error generating translation:', error);
      alert('Failed to generate translation');
    }
    setGenerating(false);
  };

  const addCustomWord = async () => {
    if (!customPolish.trim() || !customEnglish.trim()) return;

    // Check if already added or in Love Log
    const lowerWord = customPolish.trim().toLowerCase();
    if (selectedWords.some(w => w.word.toLowerCase() === lowerWord)) {
      return;
    }
    if (partnerVocab.some(w => w.word.toLowerCase() === lowerWord)) {
      alert(`"${customPolish}" is already in ${partnerName}'s Love Log!`);
      return;
    }

    setValidating(true);
    setLastCorrection(null);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // If we already have a generated result, validate with both Polish and English
      const response = await fetch('/api/validate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          polish: customPolish.trim(),
          english: customEnglish.trim()
        })
      });

      const data = await response.json();

      if (data.success && data.validated) {
        const validated = data.validated;

        // Check if the corrected word is already in Love Log
        if (partnerVocab.some(w => w.word.toLowerCase() === validated.word.toLowerCase())) {
          alert(`"${validated.word}" is already in ${partnerName}'s Love Log!`);
          setValidating(false);
          return;
        }

        const newWord: WordSuggestion = {
          word: validated.word,
          translation: validated.translation,
          word_type: validated.word_type || 'phrase',
          pronunciation: validated.pronunciation,
          context: validated.context
        };

        setSelectedWords(prev => [...prev, newWord]);
      } else {
        // Fallback: add without validation
        const newWord: WordSuggestion = {
          word: customPolish.trim(),
          translation: customEnglish.trim(),
          word_type: 'phrase'
        };
        setSelectedWords(prev => [...prev, newWord]);
      }
    } catch (error) {
      console.error('Error validating word:', error);
      // Fallback: add without validation
      const newWord: WordSuggestion = {
        word: customPolish.trim(),
        translation: customEnglish.trim(),
        word_type: 'phrase'
      };
      setSelectedWords(prev => [...prev, newWord]);
    }

    setCustomPolish('');
    setCustomEnglish('');
    setGeneratedCustom(null);
    setValidating(false);
  };

  const removeWord = (word: WordSuggestion) => {
    setSelectedWords(prev => prev.filter(w => w.word !== word.word));
  };

  const handleSend = async () => {
    if (selectedWords.length === 0) return;

    setSending(true);
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
          inputText: inputText || 'Love Package',
          selectedWords: selectedWords.map(w => ({ ...w, selected: true })),
          xpMultiplier: 2 // Fixed 2x bonus
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || 'Failed to send gift');
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert('Failed to send gift');
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-[2rem] w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-light)] rounded-xl flex items-center justify-center text-xl">
              🎁
            </div>
            <div>
              <h2 className="font-black text-[var(--text-primary)]">Love Package</h2>
              <p className="text-xs text-[var(--text-secondary)]">Send words to {partnerName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors"
          >
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Mode Toggle */}
          <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl">
            <button
              onClick={() => setInputMode('topic')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                inputMode === 'topic'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Generate by Topic
            </button>
            <button
              onClick={() => setInputMode('custom')}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                inputMode === 'custom'
                  ? 'bg-[var(--bg-card)] text-[var(--accent-color)] shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Add Words
            </button>
          </div>

          {/* Topic Generation Mode */}
          {inputMode === 'topic' && (
            <>
              {/* Topic Input */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Enter a topic (love, food, family...)"
                    className="flex-1 p-4 border-2 border-[var(--border-color)] rounded-2xl text-sm font-medium focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                    onKeyDown={e => e.key === 'Enter' && !loading && inputText.trim() && generateWords()}
                    autoFocus
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateWords}
                  disabled={loading || !inputText.trim()}
                  className="w-full py-3 bg-[var(--accent-color)] text-white rounded-xl font-bold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : hasGenerated ? (
                    <>
                      <ICONS.RefreshCw className="w-4 h-4" />
                      Generate Again
                    </>
                  ) : (
                    <>
                      <ICONS.Sparkles className="w-4 h-4" />
                      Generate 10 Words
                    </>
                  )}
                </button>
              </div>

              {/* Quick Topics (only show before first generation) */}
              {!hasGenerated && !inputText && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                    Quick Topics
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quickTopics.map(topic => (
                      <button
                        key={topic.label}
                        onClick={() => handleQuickTopic(topic.label)}
                        className="px-3 py-2 bg-[var(--bg-primary)] rounded-xl text-sm text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent-color)] transition-colors flex items-center gap-1.5"
                      >
                        <span>{topic.emoji}</span>
                        {topic.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated Suggestions */}
              {!loading && suggestions.length > 0 && (
                <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)]">
                  <p className="text-xs font-bold text-[var(--accent-color)] uppercase tracking-wider mb-3">
                    Tap to add ({suggestions.length} available)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((word, index) => (
                      <button
                        key={index}
                        onClick={() => addWord(word)}
                        className="px-3 py-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl text-sm font-medium text-[var(--text-primary)] hover:border-[var(--accent-color)] hover:text-[var(--accent-color)] transition-colors flex items-center gap-1.5 group"
                      >
                        <ICONS.Plus className="w-3 h-3 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)]" />
                        <span className="font-bold">{word.word}</span>
                        <span className="text-[var(--text-secondary)]">({word.translation})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results After Generation */}
              {!loading && hasGenerated && suggestions.length === 0 && selectedWords.length === 0 && (
                <div className="text-center py-4 bg-[var(--bg-primary)] rounded-2xl">
                  <p className="text-sm text-[var(--text-secondary)]">
                    No new words found for this topic. Try a different topic or use "Add Words" to enter custom words.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Custom Word Entry Mode */}
          {inputMode === 'custom' && (
            <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)]">
              <p className="text-xs text-[var(--text-secondary)] mb-3">
                Enter a Polish word and AI will generate the translation.
              </p>

              {/* Step 1: Polish input with Generate button */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customPolish}
                  onChange={e => {
                    setCustomPolish(e.target.value);
                    if (generatedCustom) {
                      setGeneratedCustom(null);
                      setCustomEnglish('');
                    }
                  }}
                  placeholder="Enter Polish word or phrase..."
                  className="flex-1 p-3 border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                  onKeyDown={e => e.key === 'Enter' && customPolish.trim() && !generatedCustom && generateCustomTranslation()}
                  disabled={generating || validating}
                  autoFocus
                />
                {!generatedCustom ? (
                  <button
                    onClick={generateCustomTranslation}
                    disabled={!customPolish.trim() || generating}
                    className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl font-bold text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {generating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span className="hidden sm:inline">Generate</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setGeneratedCustom(null);
                      setCustomEnglish('');
                    }}
                    className="px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-card)] rounded-xl font-bold text-sm transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Step 2: Show generated result with edit option */}
              {generatedCustom && (
                <div className="mb-3 p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[var(--text-primary)]">{generatedCustom.polish}</span>
                        {generatedCustom.pronunciation && (
                          <span className="text-xs text-[var(--text-secondary)]">[{generatedCustom.pronunciation}]</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-secondary)]">→</span>
                        <input
                          type="text"
                          value={customEnglish}
                          onChange={e => setCustomEnglish(e.target.value)}
                          placeholder="Edit translation..."
                          className="flex-1 p-1.5 border border-[var(--border-color)] rounded-lg text-sm focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                          onKeyDown={e => e.key === 'Enter' && customEnglish && addCustomWord()}
                          disabled={validating}
                        />
                      </div>
                    </div>
                    <button
                      onClick={addCustomWord}
                      disabled={!customEnglish.trim() || validating}
                      className="px-3 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      {validating ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <ICONS.Check className="w-4 h-4" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Correction notification */}
              {lastCorrection && (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <ICONS.Sparkles className="w-3 h-3" />
                    <span>Corrected: {lastCorrection}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Selected Words */}
          {selectedWords.length > 0 && (
            <div className="bg-[var(--bg-primary)] rounded-2xl p-4">
              <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                Love Package ({selectedWords.length} word{selectedWords.length !== 1 ? 's' : ''})
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedWords.map((word, index) => {
                  const hasContext = word.context && word.context !== '{}';
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[var(--text-primary)] truncate">{word.word}</p>
                          {word.word_type && word.word_type !== 'phrase' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-light)] text-[var(--accent-color)] rounded font-medium shrink-0">
                              {word.word_type}
                            </span>
                          )}
                          {hasContext && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium shrink-0" title="Has conjugations/forms">
                              +data
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate">{word.translation}</p>
                      </div>
                      <button
                        onClick={() => removeWord(word)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors shrink-0 ml-2"
                      >
                        <ICONS.X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* XP Bonus Info */}
          {selectedWords.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-[var(--accent-light)] rounded-xl border border-[var(--accent-border)]">
              <span className="text-lg">✨</span>
              <p className="text-sm text-[var(--accent-color)]">
                {partnerName} earns <span className="font-bold">2x XP</span> for learning these words!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[var(--border-color)] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedWords.length === 0}
            className="flex-1 py-3 bg-[var(--accent-color)] text-white font-bold rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <ICONS.Heart className="w-4 h-4" />
                Send Love Package
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordRequestCreator;
