'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { haptics } from '../../../services/haptics';

interface SaveProgressDialogProps {
  partnerName: string;
  isFirstTime: boolean;
  onSave: (remember: boolean) => void;
  onCancel: () => void;
  saving: boolean;
}

const SaveProgressDialog: React.FC<SaveProgressDialogProps> = ({
  partnerName,
  isFirstTime,
  onSave,
  onCancel,
  saving
}) => {
  const { t } = useTranslation();
  const [rememberChoice, setRememberChoice] = useState(false);

  return (
    <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="glass-card-solid rounded-2xl p-6 max-w-sm w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center mx-auto mb-4">
            <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
          </div>

          <h3 className="text-scale-heading font-bold font-header text-[var(--text-primary)] mb-2">
            {t('tutorGames.saveDialog.title', { name: partnerName })}
          </h3>

          {isFirstTime ? (
            <div className="text-left bg-[var(--bg-primary)] rounded-xl p-4 mb-4 text-scale-label text-[var(--text-secondary)]">
              <p className="mb-2">
                <strong className="text-[var(--text-primary)]">{t('tutorGames.saveDialog.howItWorks')}</strong>
              </p>
              <ul className="space-y-1 text-scale-caption">
                <li>• {t('tutorGames.saveDialog.detail1', { name: partnerName })}</li>
                <li>• {t('tutorGames.saveDialog.detail2')}</li>
                <li>• {t('tutorGames.saveDialog.detail3')}</li>
              </ul>
            </div>
          ) : (
            <p className="text-[var(--text-secondary)] text-scale-label mb-4">
              {t('tutorGames.saveDialog.willUpdate', { name: partnerName })}
            </p>
          )}

          {/* Remember checkbox */}
          <label className="flex items-center justify-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={e => setRememberChoice(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--accent-color)]"
            />
            <span className="text-scale-caption text-[var(--text-secondary)]">
              {t('tutorGames.saveDialog.remember', { name: partnerName })}
            </span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] text-[var(--text-secondary)] rounded-xl font-bold hover:bg-[var(--bg-primary)] transition-all disabled:opacity-50"
            >
              {t('tutorGames.saveDialog.notNow')}
            </button>
            <button
              onClick={() => onSave(rememberChoice)}
              disabled={saving}
              className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? t('tutorGames.gameOver.saving') : t('tutorGames.saveDialog.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface TutorGameResultsProps {
  /** Score from the game */
  score: { correct: number; incorrect: number };
  /** Partner name for save feature */
  partnerName: string;
  /** Whether user has a linked partner */
  hasLinkedPartner: boolean;
  /** Save preference: 'ask' | 'always' | 'never' */
  savePreference: 'ask' | 'always' | 'never';
  /** Whether this is the first time saving */
  isFirstTime: boolean;
  /** Whether save is in progress */
  savingProgress: boolean;
  /** Whether save succeeded */
  savedSuccess: boolean;
  /** Called to save progress to partner */
  onSave: (remember: boolean) => void;
  /** Called when done button pressed */
  onDone: () => void;
  /** Called when play again pressed */
  onPlayAgain: () => void;
}

/**
 * TutorGameResults - Game over screen for tutor practice games.
 * Includes optional "Save to Partner" feature with preference dialog.
 */
export const TutorGameResults: React.FC<TutorGameResultsProps> = ({
  score,
  partnerName,
  hasLinkedPartner,
  savePreference,
  isFirstTime,
  savingProgress,
  savedSuccess,
  onSave,
  onDone,
  onPlayAgain,
}) => {
  const { t } = useTranslation();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const total = score.correct + score.incorrect;
  const percentage = total > 0 ? Math.round((score.correct / total) * 100) : 0;

  // Celebration haptic on mount
  useEffect(() => {
    haptics.trigger(percentage >= 80 ? 'perfect' : percentage >= 50 ? 'tier-up' : 'xp-gain');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="glass-card p-8 rounded-2xl text-center max-w-sm w-full">
        <div className="mb-4">{percentage >= 70 ? <ICONS.Trophy className="w-16 h-16 mx-auto text-[var(--color-correct)]" /> : <ICONS.TrendingUp className="w-16 h-16 mx-auto text-[var(--accent-color)]" />}</div>
        <h2 className="text-2xl font-black font-header text-[var(--text-primary)] mb-2">
          {percentage >= 70 ? t('tutorGames.gameOver.greatJob') : t('tutorGames.gameOver.keepPracticing')}
        </h2>
        <div className="text-5xl font-black text-[var(--accent-color)] mb-4">{percentage}%</div>
        <p className="text-[var(--text-secondary)] mb-4">
          {t('tutorGames.gameOver.correct', { correct: score.correct, total })}
        </p>

        {/* Save to Student Progress Section */}
        {hasLinkedPartner && !savedSuccess && savePreference !== 'always' && (
          <div className="mb-4 p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
            <p className="text-scale-caption text-[var(--text-secondary)] mb-3">
              {isFirstTime ? (
                <>
                  <span className="font-bold text-[var(--text-primary)]">
                    {t('tutorGames.gameOver.practicedTogether')}
                  </span>
                  <br />
                  {t('tutorGames.gameOver.saveDescription', { name: partnerName })}
                </>
              ) : (
                <>{t('tutorGames.gameOver.saveToProgress', { name: partnerName })}?</>
              )}
            </p>
            <button
              onClick={() => setShowSaveDialog(true)}
              disabled={savingProgress}
              className="w-full py-2 px-4 bg-[var(--accent-color)] text-white rounded-lg font-bold text-scale-label hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingProgress ? (
                <>{t('tutorGames.gameOver.saving')}</>
              ) : (
                <>
                  <ICONS.Heart className="w-4 h-4" />
                  {t('tutorGames.gameOver.saveToProgress', { name: partnerName })}
                </>
              )}
            </button>
          </div>
        )}

        {/* Success message */}
        {savedSuccess && (
          <div className="mb-4 p-3 bg-[var(--color-correct-bg)] rounded-xl border border-[var(--color-correct)]">
            <p className="text-scale-label text-[var(--color-correct)] font-bold flex items-center justify-center gap-2">
              <ICONS.Check className="w-4 h-4" />
              {t('tutorGames.gameOver.savedSuccess', { name: partnerName })}
            </p>
          </div>
        )}

        {/* Auto-saved message for 'always' preference */}
        {savePreference === 'always' && !savedSuccess && !savingProgress && (
          <div className="mb-4 p-3 bg-[var(--accent-light)] rounded-xl border border-[var(--accent-border)]">
            <p className="text-scale-caption text-[var(--accent-color)]">
              {t('tutorGames.gameOver.autoSaving', { name: partnerName })}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onDone}
            className="flex-1 py-3 px-4 border-2 border-[var(--border-color)] rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
          >
            {t('tutorGames.gameOver.done')}
          </button>
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3 px-4 bg-[var(--accent-color)] text-white rounded-xl font-bold hover:bg-[var(--accent-hover)]"
          >
            {t('tutorGames.gameOver.playAgain')}
          </button>
        </div>
      </div>

      {/* Save Preference Dialog */}
      {showSaveDialog && (
        <SaveProgressDialog
          partnerName={partnerName}
          isFirstTime={isFirstTime}
          onSave={(remember) => {
            setShowSaveDialog(false);
            onSave(remember);
          }}
          onCancel={() => setShowSaveDialog(false)}
          saving={savingProgress}
        />
      )}
    </div>
  );
};

export default TutorGameResults;
