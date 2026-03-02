import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'validation' | 'voice' | 'chat' | 'generic';
  onUpgrade?: () => void;
  onContinueBasic?: () => void; // only for validation type
}

const LimitReachedModal: React.FC<LimitReachedModalProps> = ({
  isOpen,
  onClose,
  limitType,
  onUpgrade,
  onContinueBasic
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);

  // Get the appropriate message based on limit type
  const getMessage = () => {
    switch (limitType) {
      case 'validation':
        return t('limits.outOfValidations');
      case 'voice':
        return t('limits.outOfVoice');
      case 'chat':
        return t('limits.outOfChat');
      default:
        return t('limits.outOfValidations');
    }
  };

  // Get the appropriate icon based on limit type
  const getIcon = () => {
    switch (limitType) {
      case 'validation':
        return <ICONS.Sparkles className="w-8 h-8" />;
      case 'voice':
        return <ICONS.Mic className="w-8 h-8" />;
      case 'chat':
        return <ICONS.MessageCircle className="w-8 h-8" />;
      default:
        return <ICONS.Zap className="w-8 h-8" />;
    }
  };

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
    onClose();
  };

  const handleContinueBasic = () => {
    if (onContinueBasic) {
      onContinueBasic();
    }
    onClose();
  };

  // Focus trap and ESC to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="glass-card-solid rounded-3xl max-w-md w-full max-h-[80vh] overflow-y-auto p-8 text-center focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="limit-modal-title"
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--accent-color)]" style={{ backgroundColor: 'var(--accent-light)' }}>
          {getIcon()}
        </div>

        <h2
          id="limit-modal-title"
          className="text-2xl font-black font-header text-[var(--text-primary)] mb-4"
        >
          {getMessage()}
        </h2>

        <p className="text-[var(--text-secondary)] mb-6">
          {limitType === 'validation'
            ? t('limits.upgradeDesc', 'Upgrade for unlimited smart validations, or continue with basic exact-match checking.')
            : t('limits.upgradeDescGeneric', 'Upgrade to continue using this feature without limits.')}
        </p>

        <div className="flex flex-col gap-3">
          {/* Upgrade button - always shown */}
          <button
            onClick={handleUpgrade}
            className="w-full py-4 px-6 rounded-2xl bg-[var(--accent-color)] text-white font-bold hover:opacity-90 transition-all shadow-lg"
          >
            {t('limits.upgrade')}
          </button>

          {/* Continue basic button - only for validation type */}
          {limitType === 'validation' && onContinueBasic && (
            <button
              onClick={handleContinueBasic}
              className="w-full py-3 px-6 rounded-xl border-2 border-[var(--border-color)] text-[var(--text-secondary)] font-bold hover:bg-[var(--bg-primary)] transition-colors"
            >
              {t('limits.continueBasic')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LimitReachedModal;
