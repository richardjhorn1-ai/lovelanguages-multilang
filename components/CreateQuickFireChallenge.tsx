import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry, WordScore } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface NewWord {
  word: string;        // Target language word
  translation: string; // Native language translation
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
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [generatedWord, setGeneratedWord] = useState<{ word: string; translation: string; pronunciation?: string } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Language & i18n
  const { t } = useTranslation();
  const { languageParams, targetName } = useLanguage();

  const difficultySettings = {
    easy: { time: 90, desc: t('challengeCreator.quickFire.difficultyDesc.easy') },
    medium: { time: 60, desc: t('challengeCreator.quickFire.difficultyDesc.medium') },
    hard: { time: 30, desc: t('challengeCreator.quickFire.difficultyDesc.hard') }
  };

  // Sort vocab by priority (weak words first)
  const sortedVocab = useMemo(() => {
    return [...partnerVocab].sort((a, b) => {
      const scoreA = partnerScores.get(a.id);
      const scoreB = partnerScores.get(b.id);

      // Priority: weak words first (high incorrect count, low streak)
      const incorrectA = (scoreA?.total_attempts || 0) - (scoreA?.correct_attempts || 0);
      const incorrectB = (scoreB?.total_attempts || 0) - (scoreB?.correct_attempts || 0);
      const priorityA = incorrectA * 2 - (scoreA?.correct_streak || 0);
      const priorityB = incorrectB * 2 - (scoreB?.correct_streak || 0);

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

  const generateTranslation = async () => {
    if (!newWord.trim()) return;

    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch('/api/validate-word/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ word: newWord.trim(), ...languageParams })
      });

      const data = await response.json();
      if (data.success && data.validated) {
        setGeneratedWord({
          word: data.validated.word,
          translation: data.validated.translation,
          pronunciation: data.validated.pronunciation
        });
        setNewTranslation(data.validated.translation);
      } else {
        alert(data.error || t('challengeCreator.common.failedGenerateTranslation'));
      }
    } catch (error) {
      console.error('Error generating translation:', error);
      alert(t('challengeCreator.common.failedGenerateTranslation'));
    }
    setGenerating(false);
  };

  const addNewWord = () => {
    if (!newWord.trim() || !newTranslation.trim()) return;
    setNewWords(prev => [...prev, { word: newWord.trim(), translation: newTranslation.trim() }]);
    setNewWord('');
    setNewTranslation('');
    setGeneratedWord(null);
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
      alert(t('challengeCreator.common.needMinWords'));
      return;
    }

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Combine manually selected + auto-filled words
      const manualIds = Array.from(selectedWordIds);
      const autoIds = getAutoFillWordIds();
      const allWordIds = [...manualIds, ...autoIds];

      const response = await fetch('/api/create-challenge/', {
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
          newWords: newWords.length > 0 ? newWords : undefined,
          ...languageParams
        })
      });

      const data = await response.json();
      if (data.success) {
        onCreated();
      } else {
        alert(data.error || t('challengeCreator.common.failedCreateChallenge'));
      }
    } catch (error) {
      console.error('Error creating quick fire:', error);
      alert(t('challengeCreator.common.failedCreateChallenge'));
    }
    setCreating(false);
  };

  const canCreate = (manuallySelectedCount + autoFillCount >= 5) || newWords.length >= 5;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card-solid rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-scale-heading font-black font-header text-[var(--text-primary)] flex items-center gap-2">
              <ICONS.Zap className="w-5 h-5" /> {t('challengeCreator.quickFire.title')}
            </h2>
            <p className="text-scale-label text-[var(--text-secondary)]">{t('challengeCreator.quickFire.subtitle', { name: partnerName })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors">
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Title Input */}
          <div>
            <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('challengeCreator.quickFire.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('challengeCreator.quickFire.titlePlaceholder')}
              className="w-full p-3 border border-[var(--border-color)] rounded-xl text-scale-label focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Difficulty Selection */}
          <div>
            <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              {t('challengeCreator.quickFire.difficulty')}
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
                  <div className="mb-1">
                    {diff === 'easy' ? <ICONS.Leaf className="w-6 h-6 mx-auto text-green-500" /> : diff === 'medium' ? <ICONS.Fire className="w-6 h-6 mx-auto text-amber-500" /> : <ICONS.Zap className="w-6 h-6 mx-auto text-red-500" />}
                  </div>
                  <p className="font-bold text-[var(--text-primary)] text-scale-label capitalize">{t(`challengeCreator.quickFire.difficultyLevels.${diff}`)}</p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">{difficultySettings[diff].time}s</p>
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div>
            <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              {t('challengeCreator.quickFire.targetWords', { count: wordCount })}
            </label>
            <input
              type="range"
              min={5}
              max={20}
              value={wordCount}
              onChange={e => setWordCount(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--bg-primary)] rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-scale-caption text-[var(--text-secondary)] mt-1">
              <span>{t('challengeCreator.quickFire.minWords', { count: 5 })}</span>
              <span>{t('challengeCreator.quickFire.maxWords', { count: 20 })}</span>
            </div>
          </div>

          {/* Add New Words Section */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-3">
              <ICONS.Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <p className="font-bold text-amber-800 dark:text-amber-200 text-scale-label">{t('challengeCreator.common.addNewWords')}</p>
            </div>
            <p className="text-scale-caption text-amber-700 dark:text-amber-300 mb-3">
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
                className="flex-1 p-2 border border-[var(--border-color)] rounded-lg text-scale-label focus:outline-none focus:border-amber-500 bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newWord.trim() && !generatedWord && generateTranslation()}
                disabled={generating}
              />
              {!generatedWord ? (
                <button
                  onClick={generateTranslation}
                  disabled={!newWord.trim() || generating}
                  className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-scale-label hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
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
                  className="px-3 py-2 text-[var(--text-secondary)] hover:bg-white/40 rounded-lg font-bold text-scale-label transition-colors"
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
                        className="flex-1 p-1.5 border border-[var(--border-color)] rounded-lg text-scale-label focus:outline-none focus:border-amber-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        onKeyDown={e => e.key === 'Enter' && newTranslation && addNewWord()}
                      />
                    </div>
                  </div>
                  <button
                    onClick={addNewWord}
                    disabled={!newTranslation.trim()}
                    className="px-3 py-2 bg-green-500 text-white rounded-lg font-bold text-scale-label hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    <ICONS.Check className="w-4 h-4" />
                    {t('challengeCreator.common.add')}
                  </button>
                </div>
              </div>
            )}

            {newWords.length > 0 && (
              <div className="space-y-2">
                {newWords.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 glass-card rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-primary)] text-scale-label">{word.word}</span>
                      <span className="text-[var(--text-secondary)]">→</span>
                      <span className="text-[var(--text-secondary)] text-scale-label">{word.translation}</span>
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
                <label className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {t('challengeCreator.quickFire.pickSpecificWords', { count: selectedWordIds.size })}
                </label>
                <button
                  onClick={() => setSelectedWordIds(new Set())}
                  className="text-scale-caption text-[var(--text-secondary)] font-bold hover:underline"
                >
                  {t('challengeCreator.common.clear')}
                </button>
              </div>

              {/* Search */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('challengeCreator.common.searchWords')}
                  className="w-full p-3 border border-[var(--border-color)] rounded-xl text-scale-label focus:outline-none focus:border-[var(--accent-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                />
              </div>

              {/* Word Grid */}
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filteredVocab.slice(0, 40).map(word => {
                  const score = partnerScores.get(word.id);
                  const incorrectAttempts = score ? (score.total_attempts || 0) - (score.correct_attempts || 0) : 0;
                  const isWeak = score && (incorrectAttempts > 0 || (score.correct_streak || 0) < 3);
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
                        <p className="font-bold text-[var(--text-primary)] text-scale-label truncate">{word.word}</p>
                        {isWeak && <span className="text-scale-caption text-red-500"><ICONS.AlertTriangle className="w-3.5 h-3.5 inline" /></span>}
                      </div>
                      <p className="text-scale-caption text-[var(--text-secondary)] truncate">{word.translation}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-scale-caption text-[var(--text-secondary)] mt-2">
                {t('challengeCreator.quickFire.weakWordIndicator')}
              </p>
            </div>
          )}

          {/* Auto-fill Info */}
          <div className="bg-[var(--bg-primary)] p-4 rounded-2xl border border-[var(--border-color)]">
            <p className="text-scale-label text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">{t('challengeCreator.quickFire.wordSelectionLabel')}</span>
            </p>
            <ul className="text-scale-caption text-[var(--text-secondary)] mt-2 space-y-1">
              <li>• {t('challengeCreator.quickFire.newWordsCount')}: <span className="font-bold text-amber-600">{newWords.length}</span></li>
              <li>• {t('challengeCreator.quickFire.manuallyPicked')}: <span className="font-bold text-amber-600">{selectedWordIds.size}</span></li>
              {autoFillCount > 0 && (
                <li>• {t('challengeCreator.quickFire.autoFill')}: <span className="font-bold text-amber-600">{Math.min(autoFillCount, partnerVocab.length - selectedWordIds.size)}</span></li>
              )}
              <li className="pt-1 border-t border-[var(--border-color)]">
                {t('challengeCreator.quickFire.totalCount')}: <span className="font-bold text-[var(--text-primary)]">{Math.min(wordCount, manuallySelectedCount + Math.min(autoFillCount, partnerVocab.length - selectedWordIds.size))}</span> / {wordCount} {t('challengeCreator.quickFire.target')}
              </li>
            </ul>
          </div>

          {/* Preview Stats */}
          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800">
            <p className="text-scale-label text-amber-800 dark:text-amber-200">
              {t('challengeCreator.quickFire.previewStats', { name: partnerName, seconds: timeLimit })}
            </p>
            <p className="text-scale-caption text-amber-600 dark:text-amber-400 mt-1">
              {t('challengeCreator.quickFire.averageTime', { time: (timeLimit / Math.max(1, manuallySelectedCount + autoFillCount)).toFixed(1) })}
            </p>
          </div>

          {!canCreate && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800">
              <p className="text-scale-label text-red-600 dark:text-red-400 font-bold">
                {t('challengeCreator.quickFire.needMinWords', { count: 5 })}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
          <button
            onClick={onClose}
            className="px-6 py-3 text-[var(--text-secondary)] font-bold text-scale-label hover:bg-white/40 rounded-xl transition-colors"
          >
            {t('challengeCreator.common.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !canCreate}
            className="px-8 py-3 bg-amber-500 text-white font-bold text-scale-label rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('challengeCreator.common.creating')}
              </>
            ) : (
              <>
                <ICONS.Zap className="w-4 h-4" />
                {t('challengeCreator.common.sendChallenge')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuickFireChallenge;
