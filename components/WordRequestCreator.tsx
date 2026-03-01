import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, WordSuggestion, DictionaryEntry } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api-config';

interface WordRequestCreatorProps {
  profile: Profile;
  partnerName: string;
  partnerVocab: DictionaryEntry[];
  onClose: () => void;
  onCreated: () => void;
}

const WordRequestCreator: React.FC<WordRequestCreatorProps> = ({
  profile,
  partnerName,
  partnerVocab,
  onClose,
  onCreated
}) => {
  const [selectedWords, setSelectedWords] = useState<WordSuggestion[]>([]);
  const [sending, setSending] = useState(false);
  const [validating, setValidating] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<string | null>(null);

  // Word entry
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [generatedWord, setGeneratedWord] = useState<{ word: string; translation: string; pronunciation?: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Language & i18n
  const { t } = useTranslation();
  const { languageParams, targetName } = useLanguage();

  const generateTranslation = async () => {
    if (!newWord.trim()) return;

    // Check if already added or in Love Log first
    const lowerWord = newWord.trim().toLowerCase();
    if (selectedWords.some(w => w.word.toLowerCase() === lowerWord)) {
      alert(t('challengeCreator.lovePackage.alreadyInPackage'));
      return;
    }
    if (partnerVocab.some(w => w.word.toLowerCase() === lowerWord)) {
      alert(t('challengeCreator.lovePackage.alreadyInLoveLog', { word: newWord, name: partnerName }));
      return;
    }

    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await apiFetch('/api/validate-word/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ word: newWord.trim(), ...languageParams })
      });

      const data = await response.json();
      if (data.success && data.validated) {
        // Check if the corrected word is in Love Log
        if (partnerVocab.some(w => w.word.toLowerCase() === data.validated.word.toLowerCase())) {
          alert(t('challengeCreator.lovePackage.alreadyInLoveLog', { word: data.validated.word, name: partnerName }));
          setGenerating(false);
          return;
        }

        setGeneratedWord({
          word: data.validated.word,
          translation: data.validated.translation,
          pronunciation: data.validated.pronunciation
        });
        setNewTranslation(data.validated.translation);

        // Show correction if word was corrected
        if (data.validated.was_corrected && data.validated.correction_note) {
          setLastCorrection(data.validated.correction_note);
          setTimeout(() => setLastCorrection(null), 4000);
        }
      } else {
        alert(data.error || t('challengeCreator.lovePackage.failedGenerate'));
      }
    } catch (error) {
      console.error('Error generating translation:', error);
      alert(t('challengeCreator.lovePackage.failedGenerate'));
    }
    setGenerating(false);
  };

  const addWord = async () => {
    if (!newWord.trim() || !newTranslation.trim()) return;

    // Check if already added or in Love Log
    const lowerWord = newWord.trim().toLowerCase();
    if (selectedWords.some(w => w.word.toLowerCase() === lowerWord)) {
      return;
    }
    if (partnerVocab.some(w => w.word.toLowerCase() === lowerWord)) {
      alert(t('challengeCreator.lovePackage.alreadyInLoveLog', { word: newWord, name: partnerName }));
      return;
    }

    setValidating(true);
    setLastCorrection(null);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await apiFetch('/api/validate-word/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          word: newWord.trim(),
          translation: newTranslation.trim(),
          ...languageParams
        })
      });

      const data = await response.json();

      if (data.success && data.validated) {
        const validated = data.validated;

        // Check if the corrected word is already in Love Log
        if (partnerVocab.some(w => w.word.toLowerCase() === validated.word.toLowerCase())) {
          alert(t('challengeCreator.lovePackage.alreadyInLoveLog', { word: validated.word, name: partnerName }));
          setValidating(false);
          return;
        }

        const wordEntry: WordSuggestion = {
          word: validated.word,
          translation: validated.translation,
          word_type: validated.word_type || 'phrase',
          pronunciation: validated.pronunciation,
          context: validated.context
        };

        setSelectedWords(prev => [...prev, wordEntry]);
      } else {
        // Fallback: add without validation
        const wordEntry: WordSuggestion = {
          word: newWord.trim(),
          translation: newTranslation.trim(),
          word_type: 'phrase'
        };
        setSelectedWords(prev => [...prev, wordEntry]);
      }
    } catch (error) {
      console.error('Error validating word:', error);
      // Fallback: add without validation
      const wordEntry: WordSuggestion = {
        word: newWord.trim(),
        translation: newTranslation.trim(),
        word_type: 'phrase'
      };
      setSelectedWords(prev => [...prev, wordEntry]);
    }

    setNewWord('');
    setNewTranslation('');
    setGeneratedWord(null);
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

      const response = await apiFetch('/api/create-word-request/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          requestType: 'ai_topic',
          inputText: 'Love Package',
          selectedWords: selectedWords.map(w => ({ ...w, selected: true })),
          xpMultiplier: 2, // Fixed 2x bonus
          ...languageParams
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || t('challengeCreator.lovePackage.failedSend'));
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert(t('challengeCreator.lovePackage.failedSend'));
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card-solid rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent-light)] rounded-xl flex items-center justify-center">
              <ICONS.Gift className="w-5 h-5 text-[var(--accent-color)]" />
            </div>
            <div>
              <h2 className="font-black font-header text-[var(--text-primary)]">{t('challengeCreator.lovePackage.title')}</h2>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('challengeCreator.lovePackage.subtitle', { name: partnerName })}</p>
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
          {/* Add New Words Section */}
          <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)]">
            <div className="flex items-center gap-2 mb-3">
              <ICONS.Plus className="w-4 h-4 text-[var(--accent-color)]" />
              <p className="font-bold text-[var(--text-primary)] text-scale-label">{t('challengeCreator.common.addNewWords')}</p>
            </div>
            <p className="text-scale-caption text-[var(--text-secondary)] mb-3">
              {t('challengeCreator.common.enterTargetLanguage', { language: targetName })}
            </p>

            {/* Step 1: Target language input with Generate button */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newWord}
                onChange={e => {
                  setNewWord(e.target.value);
                  if (generatedWord) {
                    setGeneratedWord(null);
                    setNewTranslation('');
                  }
                }}
                placeholder={t('challengeCreator.common.enterWordPlaceholder', { language: targetName })}
                className="flex-1 p-3 border border-[var(--border-color)] rounded-xl text-scale-label focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newWord.trim() && !generatedWord && generateTranslation()}
                disabled={generating || validating}
                autoFocus
              />
              {!generatedWord ? (
                <button
                  onClick={generateTranslation}
                  disabled={!newWord.trim() || generating}
                  className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-xl font-bold text-scale-label hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">{t('challengeCreator.common.generating')}</span>
                    </>
                  ) : (
                    <>
                      <ICONS.Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('challengeCreator.common.generate')}</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setGeneratedWord(null);
                    setNewTranslation('');
                  }}
                  className="px-3 py-2 text-[var(--text-secondary)] hover:bg-white/40 rounded-xl font-bold text-scale-label transition-colors"
                >
                  {t('challengeCreator.common.clear')}
                </button>
              )}
            </div>

            {/* Step 2: Show generated result with edit option */}
            {generatedWord && (
              <div className="mb-3 p-3 glass-card rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{generatedWord.word}</span>
                      {generatedWord.pronunciation && (
                        <span className="text-scale-caption text-[var(--text-secondary)]">[{generatedWord.pronunciation}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)]">→</span>
                      <input
                        type="text"
                        value={newTranslation}
                        onChange={e => setNewTranslation(e.target.value)}
                        placeholder={t('challengeCreator.common.editTranslation')}
                        className="flex-1 p-1.5 border border-[var(--border-color)] rounded-lg text-scale-label focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        onKeyDown={e => e.key === 'Enter' && newTranslation && addWord()}
                        disabled={validating}
                      />
                    </div>
                  </div>
                  <button
                    onClick={addWord}
                    disabled={!newTranslation.trim() || validating}
                    className="px-3 py-2 bg-green-500 text-white rounded-xl font-bold text-scale-label hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    {validating ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <ICONS.Check className="w-4 h-4" />
                        {t('challengeCreator.common.add')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Correction notification */}
            {lastCorrection && (
              <div className="p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg">
                <p className="text-scale-caption text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <ICONS.Sparkles className="w-3 h-3" />
                  <span>{t('challengeCreator.lovePackage.corrected', { note: lastCorrection })}</span>
                </p>
              </div>
            )}
          </div>

          {/* Selected Words */}
          {selectedWords.length > 0 && (
            <div className="bg-[var(--bg-primary)] rounded-2xl p-4">
              <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                {t('challengeCreator.lovePackage.packageCount', { count: selectedWords.length })}
              </p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedWords.map((word, index) => {
                  const hasContext = word.context && word.context !== '{}';
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 glass-card rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[var(--text-primary)] truncate">{word.word}</p>
                          {word.word_type && word.word_type !== 'phrase' && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[var(--secondary-light)] text-[var(--secondary-text)] rounded font-medium shrink-0">
                              {word.word_type}
                            </span>
                          )}
                          {hasContext && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded font-medium shrink-0" title={t('challengeCreator.lovePackage.hasFormsTitle')}>
                              {t('challengeCreator.lovePackage.plusData')}
                            </span>
                          )}
                        </div>
                        <p className="text-scale-caption text-[var(--text-secondary)] truncate">{word.translation}</p>
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
              <ICONS.Sparkles className="w-5 h-5 text-[var(--accent-color)]" />
              <p className="text-scale-label text-[var(--accent-color)]">
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
