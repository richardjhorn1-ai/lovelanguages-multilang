import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';

interface PromoExpiredBannerProps {
  promoExpiresAt: string | null;
  accentHex?: string;
}

const DISMISSED_KEY = 'promo_expired_dismissed';

const PromoExpiredBanner: React.FC<PromoExpiredBannerProps> = ({
  promoExpiresAt,
  accentHex = '#e11d48'
}) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    // Check if banner was previously dismissed
    if (!promoExpiresAt) {
      setIsDismissed(true);
      return;
    }

    const expiryDate = new Date(promoExpiresAt);
    const now = new Date();

    // Only show if promo has expired
    if (expiryDate >= now) {
      setIsDismissed(true);
      return;
    }

    // Check localStorage for dismissal
    const dismissedExpiry = localStorage.getItem(DISMISSED_KEY);
    if (dismissedExpiry === promoExpiresAt) {
      setIsDismissed(true);
      return;
    }

    setIsDismissed(false);
  }, [promoExpiresAt]);

  const handleDismiss = () => {
    if (promoExpiresAt) {
      localStorage.setItem(DISMISSED_KEY, promoExpiresAt);
    }
    setIsDismissed(true);
  };

  if (isDismissed || !promoExpiresAt) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 p-4 animate-slide-down"
      style={{ backgroundColor: '#fef3c7' }}
    >
      <div className="max-w-xl mx-auto flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">💔</span>
        <div className="flex-1">
          <p className="text-amber-800 font-semibold text-sm">
            {t('promo.expired')}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-full hover:bg-amber-200 transition-colors"
          aria-label="Dismiss"
        >
          <ICONS.X className="w-5 h-5 text-amber-700" />
        </button>
      </div>
    </div>
  );
};

export default PromoExpiredBanner;
