import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { sounds } from '../../services/sounds';
import { haptics } from '../../services/haptics';
import { ICONS } from '../../constants';
import { DictionaryEntry, ChallengeRequestType } from '../../types';

interface ChallengeRequestFormProps {
  tutorName: string;
  onClose: () => void;
  onSent?: () => void;
}

const ChallengeRequestForm: React.FC<ChallengeRequestFormProps> = ({
  tutorName,
  onClose,
  onSent,
}) => {
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<ChallengeRequestType>('general');
  const [topic, setTopic] = useState('');
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weakWords, setWeakWords] = useState<DictionaryEntry[]>([]);
  const [loadingWords, setLoadingWords] = useState(false);

  useEffect(() => {
    if (requestType === 'specific_words') {
      fetchWeakWords();
    }
  }, [requestType]);

  const fetchWeakWords = async () => {
    setLoadingWords(true);
    try {
      const session = await supabase.auth.getSession();
      const userId = session.data.session?.user.id;

      if (!userId) return;

      // Get word scores with high fail rate
      const { data: scores } = await supabase
        .from('word_scores')
        .select(`
          word_id,
          total_attempts,
          correct_attempts,
          dictionary:word_id (id, word, translation, word_type)
        `)
        .eq('user_id', userId)
        .gt('total_attempts', 1)
        .order('total_attempts', { ascending: false })
        .limit(20);

      // Filter to weak words (fail rate > 30%)
      const weak = (scores || [])
        .filter(s => {
          const failRate = (s.total_attempts - s.correct_attempts) / s.total_attempts;
          return failRate > 0.3;
        })
        .map(s => s.dictionary as unknown as DictionaryEntry)
        .filter(Boolean);

      setWeakWords(weak);
    } catch (err) {
      console.error('Failed to fetch weak words:', err);
    } finally {
      setLoadingWords(false);
    }
  };

  const handleSend = async () => {
    if (requestType === 'topic' && !topic.trim()) {
      setError(t('challengeRequest.errors.topicRequired', 'Please enter a topic'));
      return;
    }

    if (requestType === 'specific_words' && selectedWordIds.length === 0) {
      setError(t('challengeRequest.errors.wordsRequired', 'Please select at least one word'));
      return;
    }

    setSending(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const response = await fetch('/api/create-challenge-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          requestType,
          topic: topic.trim() || null,
          wordIds: selectedWordIds.length > 0 ? selectedWordIds : null,
          message: message.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send request');
      }

      // Success!
      sounds.play('notification');
      haptics.trigger('correct');

      if (onSent) onSent();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleWord = (wordId: string) => {
    setSelectedWordIds(prev =>
      prev.includes(wordId)
        ? prev.filter(id => id !== wordId)
        : [...prev, wordId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-[var(--bg-card)] rounded-[2rem] max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              <h2 className="text-scale-label font-black">
                {t('challengeRequest.title', 'Ask for Help')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-blue-100 text-scale-caption mt-1">
            {t('challengeRequest.subtitle', 'Ask {{name}} to create a challenge for you', { name: tutorName })}
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Request Type Selection */}
          <div>
            <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('challengeRequest.whatHelp', 'What do you need help with?')}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setRequestType('general')}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  requestType === 'general'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-[var(--bg-primary)] border-2 border-transparent'
                }`}
              >
                <span className="text-xl">🎲</span>
                <div>
                  <p className="font-bold text-scale-label text-[var(--text-primary)]">
                    {t('challengeRequest.types.general', 'General Practice')}
                  </p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    {t('challengeRequest.types.generalDesc', 'I want to practice!')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setRequestType('topic')}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  requestType === 'topic'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-[var(--bg-primary)] border-2 border-transparent'
                }`}
              >
                <span className="text-xl">📚</span>
                <div>
                  <p className="font-bold text-scale-label text-[var(--text-primary)]">
                    {t('challengeRequest.types.topic', 'Specific Topic')}
                  </p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    {t('challengeRequest.types.topicDesc', 'Help me with food vocabulary, verbs, etc.')}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setRequestType('specific_words')}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                  requestType === 'specific_words'
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-[var(--bg-primary)] border-2 border-transparent'
                }`}
              >
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-bold text-scale-label text-[var(--text-primary)]">
                    {t('challengeRequest.types.words', 'Specific Words')}
                  </p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    {t('challengeRequest.types.wordsDesc', 'Practice words I struggle with')}
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Topic Input */}
          {requestType === 'topic' && (
            <div>
              <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {t('challengeRequest.topic', 'What topic?')}
              </p>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={t('challengeRequest.topicPlaceholder', 'e.g., food, travel, family...')}
                className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-scale-label focus:outline-none focus:border-blue-500"
                maxLength={100}
              />
            </div>
          )}

          {/* Word Selection */}
          {requestType === 'specific_words' && (
            <div>
              <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {t('challengeRequest.selectWords', 'Select words to practice')}
              </p>
              {loadingWords ? (
                <div className="flex items-center justify-center py-6">
                  <ICONS.RefreshCw className="w-5 h-5 animate-spin text-[var(--text-secondary)]" />
                </div>
              ) : weakWords.length === 0 ? (
                <p className="text-center text-[var(--text-secondary)] text-scale-caption py-4">
                  {t('challengeRequest.noWeakWords', 'No struggling words found. Keep practicing!')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {weakWords.map((word) => (
                    <button
                      key={word.id}
                      onClick={() => toggleWord(word.id)}
                      className={`px-3 py-1.5 rounded-full text-scale-caption font-bold transition-all ${
                        selectedWordIds.includes(word.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]'
                      }`}
                    >
                      {word.word}
                    </button>
                  ))}
                </div>
              )}
              {selectedWordIds.length > 0 && (
                <p className="text-scale-micro text-blue-500 mt-2">
                  {selectedWordIds.length} {t('challengeRequest.wordsSelected', 'words selected')}
                </p>
              )}
            </div>
          )}

          {/* Optional Message */}
          <div>
            <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('challengeRequest.addMessage', 'Add a message')}
              <span className="text-[var(--text-secondary)]/50 font-normal ml-1">
                ({t('common.optional', 'optional')})
              </span>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('challengeRequest.messagePlaceholder', 'Any specific requests?')}
              className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-scale-label resize-none focus:outline-none focus:border-blue-500"
              rows={2}
              maxLength={200}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400 text-scale-caption">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-bold text-scale-label disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <ICONS.RefreshCw className="w-4 h-4 animate-spin" />
                {t('challengeRequest.sending', 'Sending...')}
              </>
            ) : (
              <>
                <ICONS.Send className="w-4 h-4" />
                {t('challengeRequest.send', 'Send Request')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeRequestForm;
