import { useState } from 'react';
import { ProposedAction } from '../types';

interface Props {
  isOpen: boolean;
  action: ProposedAction;
  partnerName: string;
  onConfirm: (createLinkedChallenge: boolean) => Promise<void>;
  onCancel: () => void;
  onModify: () => void;
}

const ICONS: Record<string, string> = {
  word_gift: '🎁',
  quiz: '📝',
  quickfire: '⚡',
  love_note: '💌',
};

export function CoachActionConfirmModal({ isOpen, action, partnerName, onConfirm, onCancel, onModify }: Props) {
  const [step, setStep] = useState<'preview' | 'executing' | 'success' | 'error'>('preview');
  const [createLinked, setCreateLinked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setStep('executing');
    try {
      await onConfirm(createLinked);
      setStep('success');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
      setStep('error');
    }
  };

  const handleClose = () => {
    // Reset state for next time
    setStep('preview');
    setCreateLinked(false);
    setError(null);
    onCancel();
  };

  const icon = ICONS[action.type] || '✨';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-[var(--bg-card)] rounded-2xl p-6 max-w-md w-full shadow-xl">
        {step === 'preview' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">{icon}</div>
              <h3 className="text-xl font-black mb-2">{action.title}</h3>
              <p className="text-[var(--text-secondary)]">{action.description}</p>
            </div>

            {/* Show word count for word gifts */}
            {action.type === 'word_gift' && action.words && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-sm font-medium">{action.words.length} words</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {action.words.slice(0, 3).map(w => w.word).join(', ')}
                  {action.words.length > 3 && '...'}
                </p>
              </div>
            )}

            {/* Linked challenge checkbox */}
            {action.type === 'word_gift' && action.linkedChallenge && (
              <label className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-[var(--bg-secondary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={createLinked}
                  onChange={e => setCreateLinked(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-medium">Also create a {action.linkedChallenge.type}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Activates after {partnerName} learns the words
                  </p>
                </div>
              </label>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-xl border-2 border-[var(--border-color)] font-bold"
              >
                Cancel
              </button>
              <button
                onClick={onModify}
                className="py-3 px-4 rounded-xl border-2 border-[var(--border-color)] font-bold"
              >
                Modify
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-[var(--accent-color)] text-white font-bold"
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
            <div className="text-5xl mb-4">✅</div>
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
