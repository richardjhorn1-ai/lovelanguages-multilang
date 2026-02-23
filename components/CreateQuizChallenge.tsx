import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface NewWord {
  word: string;        // Target language word
  translation: string; // Native language translation
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
  const [newWord, setNewWord] = useState('');
  const [newTranslation, setNewTranslation] = useState('');
  const [generatedWord, setGeneratedWord] = useState<{ word: string; translation: string; pronunciation?: string; wasValidated?: boolean } | null>(null);
  const [generating, setGenerating] = useState(false);

  // Language & i18n
  const { t } = useTranslation();
  const { languageParams, targetName } = useLanguage();

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
          pronunciation: data.validated.pronunciation,
          wasValidated: true
        });
        // Pre-fill the translation field for editing
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

  const handleCreate = async () => {
    if (selectedWords.size === 0 && newWords.length === 0) return;

    setCreating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      const response = await fetch('/api/create-challenge/', {
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
      console.error('Error creating quiz:', error);
      alert(t('challengeCreator.common.failedCreateChallenge'));
    }
    setCreating(false);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black font-header text-[var(--text-primary)]">{t('challengeCreator.quiz.title')}</h2>
            <p className="text-scale-label text-[var(--text-secondary)]">{t('challengeCreator.quiz.subtitle', { name: partnerName })}</p>
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
              {t('challengeCreator.quiz.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('challengeCreator.quiz.titlePlaceholder', { name: partnerName })}
              className="w-full p-3 border border-[var(--border-color)] rounded-xl text-scale-label focus:outline-none focus:border-[var(--accent-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
            />
          </div>

          {/* Add New Words Section */}
          <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)]">
            <div className="flex items-center gap-2 mb-3">
              <ICONS.Plus className="w-4 h-4 text-[var(--accent-color)]" />
              <p className="font-bold text-[var(--text-primary)] text-scale-label">{t('challengeCreator.common.addNewWords')}</p>
            </div>
            <p className="text-scale-caption text-[var(--text-secondary)] mb-3">
              {t('challengeCreator.quiz.teachNewWords', { name: partnerName, instruction: t('challengeCreator.common.enterTargetLanguage', { language: targetName }) })}
            </p>

            {/* Step 1: Enter word in target language */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newWord}
                onChange={e => {
                  setNewWord(e.target.value);
                  // Clear generated result when target word changes
                  if (generatedWord) {
                    setGeneratedWord(null);
                    setNewTranslation('');
                  }
                }}
                placeholder={t('challengeCreator.common.enterWordPlaceholder', { language: targetName })}
                className="flex-1 p-2 border border-[var(--border-color)] rounded-lg text-scale-label focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-card)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                onKeyDown={e => e.key === 'Enter' && newWord.trim() && !generatedWord && generateTranslation()}
              />
              {!generatedWord ? (
                <button
                  onClick={generateTranslation}
                  disabled={!newWord.trim() || generating}
                  className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg font-bold text-scale-label hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('challengeCreator.common.generating')}
                    </>
                  ) : (
                    <>
                      <ICONS.Sparkles className="w-4 h-4" />
                      {t('challengeCreator.common.generate')}
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
                        className="flex-1 p-1.5 border border-[var(--border-color)] rounded-lg text-scale-label focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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

          {/* Question Types */}
          <div>
            <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
              {t('challengeCreator.quiz.questionTypes')}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'multiple_choice', label: t('challengeCreator.quiz.multipleChoice'), icon: <ICONS.CheckCircle className="w-4 h-4" /> },
                { id: 'type_it', label: t('challengeCreator.quiz.typeAnswer'), icon: <ICONS.Type className="w-4 h-4" /> },
                { id: 'flashcard', label: t('challengeCreator.quiz.flashcards'), icon: <ICONS.Cards className="w-4 h-4" /> }
              ].map(type => (
                <button
                  key={type.id}
                  onClick={() => toggleQuestionType(type.id)}
                  className={`px-4 py-2 rounded-xl text-scale-label font-bold flex items-center gap-2 transition-all ${
                    questionTypes.has(type.id)
                      ? 'bg-[var(--accent-light)] text-[var(--accent-color)] border-2 border-[var(--accent-border)]'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border-2 border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                  }`}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Word Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                {t('challengeCreator.quiz.selectExistingWords', { count: selectedWords.size, max: 20 })}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-scale-caption text-[var(--accent-color)] font-bold hover:underline"
                >
                  {t('challengeCreator.quiz.selectAll')}
                </button>
                <span className="text-[var(--text-secondary)]">|</span>
                <button
                  onClick={clearSelection}
                  className="text-scale-caption text-[var(--text-secondary)] font-bold hover:underline"
                >
                  {t('challengeCreator.common.clear')}
                </button>
              </div>
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
                  <p className="font-bold text-[var(--text-primary)] text-scale-label truncate">{word.word}</p>
                  <p className="text-scale-caption text-[var(--text-secondary)] truncate">{word.translation}</p>
                </button>
              ))}
            </div>

            {partnerVocab.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <p className="font-bold">{t('challengeCreator.quiz.noWordsYet', { name: partnerName })}</p>
                <p className="text-scale-label">{t('challengeCreator.quiz.addNewWordsHint')}</p>
              </div>
            )}
          </div>
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
            disabled={creating || (selectedWords.size === 0 && newWords.length === 0)}
            className="px-8 py-3 bg-[var(--accent-color)] text-white font-bold text-scale-label rounded-xl hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t('challengeCreator.common.creating')}
              </>
            ) : (
              <>
                <ICONS.Play className="w-4 h-4" />
                {t('challengeCreator.common.sendChallenge')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateQuizChallenge;
