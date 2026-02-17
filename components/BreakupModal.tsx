import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';

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
  const { t } = useTranslation();
  const [step, setStep] = useState<'warning' | 'confirm' | 'processing' | 'complete'>('warning');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const goodbyeWord = t('breakup.confirm.goodbyeWord').toLowerCase();

  const handleBreakup = async () => {
    setStep('processing');
    setError(null);
    try {
      await onConfirm();
      setStep('complete');
      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('confirm');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden">

        {step === 'warning' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💔</span>
              </div>
              <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-2">
                {t('breakup.warning.title')}
              </h2>
            </div>

            <div className="bg-amber-50/80 dark:bg-amber-900/20 rounded-2xl p-5 mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300 mb-3">
                {t('breakup.warning.whatHappens')}
              </p>
              <ul className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
                <li className="flex items-start gap-2">
                  <ICONS.X className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-60" />
                  <span>{t('breakup.warning.consequence1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ICONS.X className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-60" />
                  <span>{t('breakup.warning.consequence2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <ICONS.X className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-60" />
                  <span className="font-bold">
                    {isGranter
                      ? t('breakup.warning.consequence3Granter', { name: partnerName })
                      : t('breakup.warning.consequence3Grantee')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <ICONS.Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-green-600 dark:text-green-400" />
                  <span>{t('breakup.warning.consequence4')}</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 py-4 px-6 rounded-2xl bg-[var(--accent-color)] text-white font-black text-sm uppercase tracking-[0.15em] shadow-lg shadow-[var(--accent-shadow)] hover:opacity-90 transition-all active:scale-[0.98]"
              >
                {t('breakup.warning.stayTogether')}
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-4 px-6 rounded-2xl border-2 border-red-200 dark:border-red-800 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-[0.98]"
              >
                {t('breakup.warning.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🥀</span>
              </div>
              <h2 className="text-xl font-black font-header text-[var(--text-primary)] mb-2">
                {t('breakup.confirm.title')}
              </h2>
              <p className="text-[var(--text-secondary)] text-sm">
                {t('breakup.confirm.typeGoodbye')}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl p-4 mb-4 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toLowerCase())}
              placeholder={t('breakup.confirm.placeholder')}
              className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 text-[var(--text-primary)] border-2 border-transparent focus:bg-white dark:focus:bg-gray-700 focus:border-red-300 dark:focus:border-red-700 focus:outline-none transition-all text-center text-lg font-bold placeholder:text-[var(--text-secondary)] placeholder:font-normal mb-6"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep('warning');
                  setConfirmText('');
                  setError(null);
                }}
                className="flex-1 py-4 px-6 rounded-2xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold text-sm hover:bg-[var(--bg-primary)] transition-all active:scale-[0.98]"
              >
                {t('breakup.confirm.goBack')}
              </button>
              <button
                onClick={handleBreakup}
                disabled={confirmText !== goodbyeWord}
                className="flex-1 py-4 px-6 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-[0.1em] shadow-lg shadow-red-200 dark:shadow-red-900/30 disabled:opacity-30 disabled:shadow-none disabled:cursor-not-allowed hover:bg-red-600 transition-all active:scale-[0.98]"
              >
                {t('breakup.confirm.itsOver')}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl animate-pulse">💔</span>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              {t('breakup.processing')}
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🕊️</span>
            </div>
            <h2 className="text-xl font-black font-header text-[var(--text-primary)] mb-2">
              {t('breakup.complete.title')}
            </h2>
            <p className="text-[var(--text-secondary)] text-sm">
              {isGranter
                ? t('breakup.complete.messageGranter')
                : t('breakup.complete.messageGrantee')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BreakupModal;
