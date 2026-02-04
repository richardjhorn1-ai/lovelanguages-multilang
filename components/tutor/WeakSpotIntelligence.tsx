import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

interface StuckWord {
  word_id: string;
  word: string;
  translation: string;
  fail_count: number;
  last_attempt: string;
}

interface ImprovingWord {
  word_id: string;
  word: string;
  translation: string;
  streak: number;
}

interface WeakSpotIntelligenceProps {
  stuckWords: StuckWord[];
  improvingWords: ImprovingWord[];
  onCreateChallenge: () => void;
  tierColor: string;
}

const WeakSpotIntelligence: React.FC<WeakSpotIntelligenceProps> = ({
  stuckWords,
  improvingWords,
  onCreateChallenge,
  tierColor,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-[var(--bg-card)] p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-[var(--border-color)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-scale-micro font-black uppercase text-[var(--text-secondary)] tracking-widest flex items-center gap-2">
          <ICONS.Target className="w-4 h-4" style={{ color: tierColor }} />
          {t('tutor.weakSpots.title', 'Focus Areas')}
        </h3>
        {stuckWords.length >= 3 && (
          <button
            onClick={onCreateChallenge}
            className="px-3 py-1.5 rounded-lg text-scale-micro font-bold text-white"
            style={{ backgroundColor: tierColor }}
          >
            {t('tutor.weakSpots.practiceThese', 'Practice These')}
          </button>
        )}
      </div>

      {/* Stuck Words */}
      {stuckWords.length > 0 && (
        <div className="mb-4">
          <p className="text-scale-caption text-[var(--text-secondary)] mb-2">
            {t('tutor.weakSpots.needsPractice', 'Needs more practice together')}
          </p>
          <div className="space-y-2">
            {stuckWords.slice(0, 5).map((word) => (
              <div
                key={word.word_id}
                className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]"
              >
                <div>
                  <span className="font-bold text-scale-label text-[var(--text-primary)]">
                    {word.word}
                  </span>
                  <span className="mx-2 text-[var(--text-secondary)]">·</span>
                  <span className="text-scale-caption text-[var(--text-secondary)] italic">
                    {word.translation}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-scale-caption font-bold" style={{ color: tierColor }}>
                    {word.fail_count} {t('tutor.weakSpots.misses', 'misses')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Improving Words */}
      {improvingWords.length > 0 && (
        <div>
          <p className="text-scale-caption text-[var(--text-secondary)] mb-2 flex items-center gap-1">
            <ICONS.TrendingUp className="w-3.5 h-3.5" style={{ color: tierColor }} />
            {t('tutor.weakSpots.improving', 'Getting better!')}
          </p>
          <div className="flex flex-wrap gap-2">
            {improvingWords.slice(0, 10).map((word) => (
              <div
                key={word.word_id}
                className="px-3 py-1.5 rounded-full border flex items-center gap-2"
                style={{ backgroundColor: `${tierColor}10`, borderColor: `${tierColor}30` }}
              >
                <span className="font-bold text-scale-caption" style={{ color: tierColor }}>
                  {word.word}
                </span>
                <span className="text-scale-micro" style={{ color: tierColor, opacity: 0.8 }}>
                  {word.streak}/5 🔥
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stuckWords.length === 0 && improvingWords.length === 0 && (
        <p className="text-center text-[var(--text-secondary)] text-scale-label py-4 italic">
          {t('tutor.weakSpots.noWeakSpots', 'No struggling words right now!')}
        </p>
      )}
    </div>
  );
};

export default WeakSpotIntelligence;
