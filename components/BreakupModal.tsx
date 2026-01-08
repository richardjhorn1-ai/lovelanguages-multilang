import React, { useState } from 'react';

interface BreakupModalProps {
  partnerName: string;
  isGranter: boolean;  // Am I the one paying?
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

const BreakupModal: React.FC<BreakupModalProps> = ({
  partnerName,
  isGranter,
  onConfirm,
  onCancel
}) => {
  const [step, setStep] = useState<'warning' | 'confirm' | 'processing' | 'complete'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleBreakup = async () => {
    setStep('processing');
    setError(null);
    try {
      await onConfirm();
      setStep('complete');
      // Auto close after showing completion
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-3xl max-w-md w-full p-8 text-center shadow-xl">

        {step === 'warning' && (
          <>
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">
              End your learning journey together?
            </h2>

            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 mb-6 text-left">
              <p className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                What happens:
              </p>
              <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-1">
                <li>• Your accounts will be unlinked</li>
                <li>• You won't see each other's progress</li>
                {isGranter ? (
                  <li>• <strong>{partnerName}</strong> will lose their free access</li>
                ) : (
                  <li>• <strong>You</strong> will lose your free access</li>
                )}
                <li>• Your vocabulary and progress stay with you</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
              >
                Stay Together
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-3 px-6 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="text-5xl mb-4">🥀</div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">
              Are you sure?
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Type <strong>"goodbye"</strong> to confirm
            </p>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-3 mb-4 text-sm">
                {error}
              </div>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
              placeholder="Type goodbye..."
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] text-center text-lg mb-6 text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('warning');
                  setConfirmText('');
                  setError(null);
                }}
                className="flex-1 py-3 px-6 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleBreakup}
                disabled={confirmText !== 'goodbye'}
                className="flex-1 py-3 px-6 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
              >
                It's Over
              </button>
            </div>
          </>
        )}

        {step === 'processing' && (
          <>
            <div className="text-5xl mb-4 animate-pulse">💔</div>
            <p className="text-[var(--text-secondary)]">
              Parting ways...
            </p>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className="text-5xl mb-4">🕊️</div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">
              Accounts Unlinked
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isGranter
                ? 'Your subscription continues. You can invite someone new anytime.'
                : 'Take care. You\'ll need your own subscription to continue learning.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default BreakupModal;
