import React, { useState } from 'react';
import { ProposedAction } from '../types';
import { ICONS } from '../constants';

interface Props {
  isOpen: boolean;
  action: ProposedAction;
  partnerName: string;
  onConfirm: (modifiedAction: ProposedAction, createLinkedChallenge: boolean) => Promise<void>;
  onCancel: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  word_gift: <ICONS.Gift className="w-8 h-8" />,
  quiz: <ICONS.Book className="w-8 h-8" />,
  quickfire: <ICONS.Zap className="w-8 h-8" />,
  love_note: <ICONS.Mail className="w-8 h-8" />,
};

export function CoachActionConfirmModal({ isOpen, action, partnerName, onConfirm, onCancel }: Props) {
  const [step, setStep] = useState<'preview' | 'executing' | 'success' | 'error'>('preview');
  const [createLinked, setCreateLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasWords = action.type === 'word_gift' || action.type === 'quiz' || action.type === 'quickfire';
  const wordCount = action.words?.length || 0;

  const handleConfirm = async () => {
    setStep('executing');
    try {
      await onConfirm(action, createLinked);
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setStep('error');
    }
  };

  const handleClose = () => {
    setStep('preview');
    setCreateLinked(false);
    setError(null);
    onCancel();
  };

  const icon = ACTION_ICONS[action.type] || <ICONS.Sparkles className="w-8 h-8" />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="glass-card-solid rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {step === 'preview' && (
          <>
            <div className="text-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--accent-light)' }}>
                <span className="text-[var(--accent-color)]">{icon}</span>
              </div>
              <h3 className="text-xl font-black font-header mb-1">{action.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">{action.description}</p>
            </div>

            {/* Show words summary for word-based actions (read-only) */}
            {hasWords && wordCount > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-white/40 dark:bg-white/12">
                <p className="text-sm font-medium">{wordCount} words</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {action.words!.slice(0, 4).map(w => w.word).join(', ')}
                  {wordCount > 4 && ` +${wordCount - 4} more`}
                </p>
              </div>
            )}

            {/* Linked challenge checkbox */}
            {action.type === 'word_gift' && action.linkedChallenge && (
              <label className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-white/40 dark:bg-white/12 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLinked}
                  onChange={e => setCreateLinked(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium text-sm">Also create a {action.linkedChallenge.type}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Activates after {partnerName} learns the words
                  </p>
                </div>
              </label>
            )}

            <div className="flex gap-3 mt-auto">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border-color)] font-bold text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={hasWords && !wordCount}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold text-sm disabled:opacity-50"
              >
                Send It!
              </button>
            </div>
          </>
        )}

        {step === 'executing' && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 animate-bounce">{icon}</div>
            <p className="text-[var(--text-secondary)]">Creating...</p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <ICONS.Check className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-bold">Sent to {partnerName}!</p>
            <button
              onClick={handleClose}
              className="mt-4 py-2 px-6 rounded-xl bg-[var(--accent-color)] text-white font-bold"
            >
              Done
            </button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">❌</div>
            <p className="font-bold text-red-500">{error}</p>
            <button onClick={handleClose} className="mt-4 underline">Close</button>
          </div>
        )}
      </div>
    </div>
  );
}
