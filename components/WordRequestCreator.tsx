import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, WordSuggestion, DictionaryEntry } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../services/api-config';
import { playRoleVar } from './play/playColorRoles';

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
        alert(data.error || t('challengeCreator.common.failedGenerateTranslation'));
      }
    } catch (error) {
      console.error('Error generating translation:', error);
      alert(t('challengeCreator.common.failedGenerateTranslation'));
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
        alert(data.error || t('challengeCreator.lovePackage.sendFailed'));
      }
    } catch (error) {
      console.error('Error sending gift:', error);
      alert(t('challengeCreator.lovePackage.sendFailed'));
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div
        className="glass-card rounded-[32px] w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col relative"
        style={{ border: `1px solid ${playRoleVar('bright', 'border')}` }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 72%, transparent), transparent 42%),
              radial-gradient(circle at bottom right, color-mix(in srgb, ${playRoleVar('warm', 'soft')} 64%, transparent), transparent 38%)
            `,
          }}
        />
        {/* Header */}
        <div className="relative z-10 p-5 border-b border-[var(--border-color)]/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[18px] flex items-center justify-center"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 82%, var(--bg-card)), color-mix(in srgb, ${playRoleVar('warm', 'mist')} 42%, var(--bg-card)))`,
                border: `1px solid ${playRoleVar('bright', 'border')}`,
                color: playRoleVar('bright', 'deep'),
              }}
            >
              <ICONS.Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] mb-1" style={{ color: playRoleVar('bright', 'deep') }}>
                {t('tutorGames.hub.sendNowEyebrow')}
              </p>
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
        <div className="relative z-10 p-5 space-y-4 flex-1 overflow-y-auto">
          {/* Add New Words Section */}
          <div
            className="p-4 rounded-[26px] border"
            style={{
              background: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 84%, var(--bg-card)), color-mix(in srgb, ${playRoleVar('warm', 'soft')} 30%, var(--bg-card)))`,
              borderColor: playRoleVar('bright', 'border'),
            }}
          >
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
                  className="px-4 py-2 text-white rounded-xl font-bold text-scale-label disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  style={{
                    background: `linear-gradient(145deg, ${playRoleVar('bright', 'color')}, ${playRoleVar('bright', 'deep')})`,
                  }}
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
              <div className="mb-3 p-3 glass-card rounded-2xl">
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
                    className="px-3 py-2 text-white rounded-xl font-bold text-scale-label disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    style={{
                      background: `linear-gradient(145deg, ${playRoleVar('warm', 'color')}, ${playRoleVar('warm', 'deep')})`,
                    }}
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
              <div
                className="p-2.5 rounded-xl border"
                style={{
                  background: `color-mix(in srgb, ${playRoleVar('warm', 'soft')} 72%, var(--bg-card))`,
                  borderColor: playRoleVar('warm', 'border'),
                }}
              >
                <p className="text-scale-caption flex items-center gap-1.5" style={{ color: playRoleVar('warm', 'text') }}>
                  <ICONS.Sparkles className="w-3 h-3" />
                  <span>{t('challengeCreator.lovePackage.corrected', { note: lastCorrection })}</span>
                </p>
              </div>
            )}
          </div>

          {/* Selected Words */}
          {selectedWords.length > 0 && (
            <div className="glass-card rounded-[26px] p-4">
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
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                              style={{
                                background: `color-mix(in srgb, ${playRoleVar('bright', 'soft')} 82%, var(--bg-card))`,
                                color: playRoleVar('bright', 'text'),
                              }}
                            >
                              {word.word_type}
                            </span>
                          )}
                          {hasContext && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0"
                              style={{
                                background: `color-mix(in srgb, ${playRoleVar('warm', 'soft')} 82%, var(--bg-card))`,
                                color: playRoleVar('warm', 'deep'),
                              }}
                              title={t('challengeCreator.lovePackage.hasData')}
                            >
                              {t('challengeCreator.lovePackage.hasData')}
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
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border"
              style={{
                background: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 82%, var(--bg-card)), color-mix(in srgb, ${playRoleVar('warm', 'soft')} 34%, var(--bg-card)))`,
                borderColor: playRoleVar('bright', 'border'),
              }}
            >
              <ICONS.Sparkles className="w-5 h-5" style={{ color: playRoleVar('bright', 'deep') }} />
              <p className="text-scale-label" style={{ color: playRoleVar('bright', 'text') }}>
                {t('challengeCreator.lovePackage.xpBonus', { name: partnerName })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-10 p-5 border-t border-[var(--border-color)]/70 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] transition-colors"
          >
            {t('challengeCreator.common.cancel')}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || selectedWords.length === 0}
            className="flex-1 py-3 text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(145deg, ${playRoleVar('bright', 'color')}, ${playRoleVar('bright', 'deep')})`,
              boxShadow: `0 18px 38px -24px color-mix(in srgb, ${playRoleVar('bright', 'deep')} 34%, transparent)`,
            }}
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('challengeCreator.common.sending')}
              </>
            ) : (
              <>
                <ICONS.Heart className="w-4 h-4" />
                {t('challengeCreator.lovePackage.sendLovePackage')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordRequestCreator;
