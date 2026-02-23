import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../services/supabase';
import { Profile, BugReportSeverity } from '../types';
import { getLevelFromXP } from '../services/level-utils';
import { useLocation } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
}

export const BugReportModal: React.FC<Props> = ({ isOpen, onClose, profile }) => {
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BugReportSeverity>('medium');

  const SEVERITY_STEPS: { value: BugReportSeverity; label: string; description: string; color: string }[] = [
    { value: 'low', label: t('bugReport.severity.low'), description: t('bugReport.severity.lowDescription'), color: '#64748b' },
    { value: 'medium', label: t('bugReport.severity.medium'), description: t('bugReport.severity.mediumDescription'), color: '#f59e0b' },
    { value: 'high', label: t('bugReport.severity.high'), description: t('bugReport.severity.highDescription'), color: '#f97316' },
    { value: 'critical', label: t('bugReport.severity.critical'), description: t('bugReport.severity.criticalDescription'), color: '#ef4444' },
  ];
  const severityIndex = SEVERITY_STEPS.findIndex(s => s.value === severity);
  const currentSeverity = SEVERITY_STEPS[severityIndex];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError(t('bugReport.errors.fillRequired'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError(t('bugReport.errors.signIn'));
        return;
      }

      const levelInfo = getLevelFromXP(profile.xp || 0);

      const response = await fetch('/api/submit-bug-report/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          pageUrl: window.location.href,
          browserInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            platform: navigator.platform,
          },
          appState: {
            role: profile.role,
            level: levelInfo.displayName,
            xp: profile.xp || 0,
            currentPath: location.pathname,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit bug report');
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Bug report submission error:', err);
      setError(err.message || t('bugReport.errors.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form state
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setError(null);
    setSubmitted(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={handleClose}
    >
        <div
          className="glass-card-solid rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentHex}20` }}
              >
                <ICONS.Bug className="w-5 h-5" style={{ color: accentHex }} />
              </div>
              <div>
                <h2 className="font-header font-bold text-lg text-[var(--text-primary)]">{t('bugReport.title')}</h2>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('bugReport.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors"
            >
              <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 overflow-y-auto flex-1">
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${accentHex}20` }}
                >
                  <ICONS.Check className="w-8 h-8" style={{ color: accentHex }} />
                </div>
                <h3 className="font-bold font-header text-lg text-[var(--text-primary)] mb-2">{t('bugReport.success.title')}</h3>
                <p className="text-scale-label text-[var(--text-secondary)] mb-6">
                  {t('bugReport.success.message')}
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: accentHex }}
                >
                  {t('bugReport.success.close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-scale-label font-medium text-[var(--text-primary)] mb-1.5">
                    {t('bugReport.titleLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('bugReport.titlePlaceholder')}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    maxLength={255}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-scale-label font-medium text-[var(--text-primary)] mb-1.5">
                    {t('bugReport.detailsLabel')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('bugReport.detailsPlaceholder')}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Severity Slider */}
                <div>
                  <label className="block text-scale-label font-medium text-[var(--text-primary)] mb-3">
                    {t('bugReport.severity.label')}
                  </label>
                  <div className="px-1">
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={severityIndex}
                      onChange={(e) => setSeverity(SEVERITY_STEPS[parseInt(e.target.value)].value)}
                      disabled={isSubmitting}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${currentSeverity.color} 0%, ${currentSeverity.color} ${(severityIndex / 3) * 100}%, var(--border-color) ${(severityIndex / 3) * 100}%, var(--border-color) 100%)`
                      }}
                    />
                    {/* Step labels */}
                    <div className="flex justify-between mt-1.5">
                      {SEVERITY_STEPS.map((step, i) => (
                        <button
                          key={step.value}
                          type="button"
                          onClick={() => setSeverity(step.value)}
                          disabled={isSubmitting}
                          className="text-center group"
                          style={{ width: i === 0 || i === 3 ? 'auto' : undefined }}
                        >
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${
                              i === severityIndex ? 'opacity-100' : 'opacity-40'
                            }`}
                            style={{ color: i === severityIndex ? currentSeverity.color : 'var(--text-secondary)' }}
                          >
                            {step.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Active description */}
                  <p className="text-scale-caption text-[var(--text-secondary)] mt-2 text-center transition-all">
                    {currentSeverity.description}
                  </p>
                </div>

                {/* Auto-captured info note */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <ICONS.HelpCircle className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    {t('bugReport.autoCaptureNote')}
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-scale-label text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] glass-card hover:bg-white/40 transition-colors"
                  >
                    {t('bugReport.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !title.trim() || !description.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ backgroundColor: accentHex }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('bugReport.submitting')}
                      </>
                    ) : (
                      t('bugReport.submit')
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
    </div>
  );
};
