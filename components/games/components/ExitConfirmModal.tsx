import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';

interface ExitConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Handler for cancel/keep playing */
  onCancel: () => void;
  /** Handler for confirm/exit */
  onConfirm: () => void;
}

/**
 * Confirmation modal shown when user tries to exit a game in progress.
 * Warns that progress will be lost.
 */
export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onCancel,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="glass-card-solid rounded-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-[var(--color-incorrect-bg)] rounded-full flex items-center justify-center mb-4">
            <ICONS.AlertTriangle className="w-8 h-8 text-[var(--color-incorrect)]" />
          </div>
          <h3 className="text-xl font-black font-header text-[var(--text-primary)] mb-2">
            {t('play.exitConfirm.title', 'Exit Game?')}
          </h3>
          <p className="text-[var(--text-secondary)] mb-6">
            {t(
              'play.exitConfirm.message',
              'Your progress in this session will be lost. Are you sure you want to exit?'
            )}
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-[var(--text-primary)] glass-card hover:bg-white/40 transition-colors"
            >
              {t('play.exitConfirm.cancel', 'Keep Playing')}
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              {t('play.exitConfirm.confirm', 'Exit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExitConfirmModal;
