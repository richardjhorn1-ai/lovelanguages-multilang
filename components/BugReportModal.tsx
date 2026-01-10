import React, { useState } from 'react';
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

const SEVERITY_OPTIONS: { value: BugReportSeverity; label: string; description: string; color: string }[] = [
  { value: 'low', label: 'Low', description: 'Minor issue, cosmetic', color: 'text-slate-500' },
  { value: 'medium', label: 'Medium', description: 'Affects usability', color: 'text-amber-500' },
  { value: 'high', label: 'High', description: 'Major feature broken', color: 'text-orange-500' },
  { value: 'critical', label: 'Critical', description: 'App unusable', color: 'text-red-500' },
];

export const BugReportModal: React.FC<Props> = ({ isOpen, onClose, profile }) => {
  const { accentHex } = useTheme();
  const location = useLocation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<BugReportSeverity>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Please sign in to submit a bug report');
        return;
      }

      const levelInfo = getLevelFromXP(profile.xp || 0);

      const response = await fetch('/api/submit-bug-report', {
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
      setError(err.message || 'Failed to submit. Please try again.');
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${accentHex}20` }}
              >
                <ICONS.Bug className="w-5 h-5" style={{ color: accentHex }} />
              </div>
              <div>
                <h2 className="font-header font-bold text-lg text-[var(--text-primary)]">Report a Bug</h2>
                <p className="text-xs text-[var(--text-secondary)]">Help us improve Love Languages</p>
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
          <div className="p-5">
            {submitted ? (
              <div className="text-center py-8">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${accentHex}20` }}
                >
                  <ICONS.Check className="w-8 h-8" style={{ color: accentHex }} />
                </div>
                <h3 className="font-bold text-lg text-[var(--text-primary)] mb-2">Thank you!</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Your bug report has been submitted. We'll look into it and work on a fix.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: accentHex }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    What went wrong? <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief description of the issue"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors"
                    maxLength={255}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What were you doing when this happened? What did you expect to happen?"
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] transition-colors resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    How severe is this issue?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {SEVERITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setSeverity(option.value)}
                        disabled={isSubmitting}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          severity === option.value
                            ? 'border-[var(--accent-color)] bg-[var(--accent-light)]'
                            : 'border-[var(--border-color)] bg-[var(--bg-primary)] hover:border-[var(--accent-color)]'
                        }`}
                      >
                        <span className={`text-sm font-medium ${option.color}`}>{option.label}</span>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto-captured info note */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                  <ICONS.HelpCircle className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    We'll automatically include your current page, browser info, and app state to help us investigate.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 rounded-xl font-medium text-[var(--text-secondary)] bg-[var(--bg-primary)] hover:bg-[var(--border-color)] transition-colors"
                  >
                    Cancel
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
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
