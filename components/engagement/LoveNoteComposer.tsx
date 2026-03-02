import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../services/supabase';
import { sounds } from '../../services/sounds';
import { haptics } from '../../services/haptics';
import { ICONS } from '../../constants';
import { LOVE_NOTE_TEMPLATES } from '../../constants/levels';
import { LoveNoteCategory } from '../../types';
import { apiFetch } from '../../services/api-config';

interface LoveNoteComposerProps {
  partnerName: string;
  onClose: () => void;
  onSent?: () => void;
  suggestedCategory?: LoveNoteCategory;
}

const LoveNoteComposer: React.FC<LoveNoteComposerProps> = ({
  partnerName,
  onClose,
  onSent,
  suggestedCategory,
}) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<LoveNoteCategory | null>(suggestedCategory || null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  // Handle escape key and prevent background scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    // Prevent background scrolling while modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose, sending]);

  const categories: { key: LoveNoteCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'encouragement', label: t('loveNote.categories.encouragement', 'Encourage'), icon: <ICONS.TrendingUp className="w-4 h-4" /> },
    { key: 'check_in', label: t('loveNote.categories.checkIn', 'Check In'), icon: <ICONS.Heart className="w-4 h-4" /> },
    { key: 'celebration', label: t('loveNote.categories.celebration', 'Celebrate'), icon: <ICONS.Trophy className="w-4 h-4" /> },
  ];

  const handleSend = async () => {
    if (!selectedTemplate && !customMessage.trim()) {
      setError(t('loveNote.errors.empty', 'Please select a template or write a message'));
      return;
    }

    setSending(true);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const response = await apiFetch('/api/send-love-note/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({
          templateCategory: category,
          templateText: selectedTemplate,
          customMessage: customMessage.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send');
      }

      // Success!
      sounds.play('notification');
      haptics.trigger('correct');
      setRemaining(data.remaining);

      if (onSent) onSent();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="love-note-title"
        className="glass-card-solid rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ICONS.Heart className="w-6 h-6" />
              <h2 id="love-note-title" className="text-scale-label font-black font-header">
                {t('loveNote.title', 'Send a Love Note')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-white/70 text-scale-caption mt-1">
            {t('loveNote.subtitle', 'Send {{name}} some love', { name: partnerName })}
          </p>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">
          {/* Category Selection */}
          <div>
            <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('loveNote.chooseCategory', 'Choose a vibe')}
            </p>
            <div className="flex gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setCategory(cat.key);
                    setSelectedTemplate(null);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-scale-caption font-bold transition-all ${
                    category === cat.key
                      ? 'bg-[var(--secondary-color)] text-white'
                      : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]/80'
                  }`}
                >
                  <span className="mr-1">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Template Selection */}
          {category && (
            <div>
              <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                {t('loveNote.pickMessage', 'Pick a message')}
              </p>
              <div className="space-y-2">
                {LOVE_NOTE_TEMPLATES[category].map((template) => (
                  <button
                    key={template}
                    onClick={() => setSelectedTemplate(template)}
                    className={`w-full text-left p-3 rounded-xl transition-all ${
                      selectedTemplate === template
                        ? 'bg-[var(--secondary-light)] border-2 border-[var(--secondary-color)]'
                        : 'bg-[var(--bg-primary)] border-2 border-transparent hover:border-[var(--border-color)]'
                    }`}
                  >
                    <span className="text-scale-label text-[var(--text-primary)]">{template}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Message */}
          <div>
            <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('loveNote.addPersonal', 'Add something personal')}
              <span className="text-[var(--text-secondary)]/50 font-normal ml-1">
                ({t('common.optional', 'optional')})
              </span>
            </p>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t('loveNote.placeholder', 'Write your own message...')}
              className="w-full p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] text-scale-label resize-none focus:outline-none focus:border-[var(--accent-color)]"
              rows={3}
              maxLength={200}
            />
            <p className="text-right text-scale-micro text-[var(--text-secondary)] mt-1">
              {customMessage.length}/200
            </p>
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
            disabled={sending || (!selectedTemplate && !customMessage.trim())}
            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-xl font-bold text-scale-label disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <ICONS.RefreshCw className="w-4 h-4 animate-spin" />
                {t('loveNote.sending', 'Sending...')}
              </>
            ) : (
              <>
                <ICONS.Heart className="w-4 h-4" />
                {t('loveNote.send', 'Send Love Note')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoveNoteComposer;
