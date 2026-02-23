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
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card-solid rounded-[2rem] max-w-md w-full max-h-[80vh] flex flex-col overflow-hidden">

        {step === 'warning' && (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 p-8 pb-0">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                  <ICONS.HeartCrack className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-2">
                  {t('breakup.warning.title')}
                </h2>
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-3 ml-1">
                {t('breakup.warning.whatHappens')}
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex items-start gap-3 bg-[var(--bg-primary)] rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ICONS.X className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{t('breakup.warning.consequence1')}</span>
                </div>
                <div className="flex items-start gap-3 bg-[var(--bg-primary)] rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ICONS.X className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{t('breakup.warning.consequence2')}</span>
                </div>
                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ICONS.X className="w-3 h-3 text-red-400" />
                  </div>
                  <span className="text-sm text-red-600 dark:text-red-400 font-bold">
                    {isGranter
                      ? t('breakup.warning.consequence3Granter', { name: partnerName })
                      : t('breakup.warning.consequence3Grantee')}
                  </span>
                </div>
                <div className="flex items-start gap-3 bg-[var(--bg-primary)] rounded-xl px-4 py-3">
                  <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ICONS.Check className="w-3 h-3 text-green-500" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)]">{t('breakup.warning.consequence4')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-8 pt-4 flex-shrink-0">
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
          <div className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto flex-1 p-8 pb-0">
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
                className="w-full px-6 py-4 rounded-2xl bg-[var(--bg-primary)] dark:bg-[var(--bg-card)] text-[var(--text-primary)] border-2 border-transparent focus:bg-white dark:focus:bg-[var(--bg-primary)] focus:border-red-300 dark:focus:border-red-700 focus:outline-none transition-all text-center text-lg font-bold placeholder:text-[var(--text-secondary)] placeholder:font-normal mb-4"
                autoFocus
              />
            </div>

            <div className="flex gap-3 p-8 pt-4 flex-shrink-0">
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
              <ICONS.HeartCrack className="w-8 h-8 text-red-400 animate-pulse" />
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              {t('breakup.processing')}
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-primary)] dark:bg-[var(--bg-card)] flex items-center justify-center mx-auto mb-4">
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
