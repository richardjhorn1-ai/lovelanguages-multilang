import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

interface TrendDataPoint {
  date: string;
  value: number;
}

interface TrendChartsProps {
  xpTrend: TrendDataPoint[];
  wordsTrend: TrendDataPoint[];
  accuracyTrend: TrendDataPoint[];
  tierColor: string;
}

// Simple sparkline component (no external library needed)
const Sparkline: React.FC<{
  data: number[];
  color: string;
  height?: number;
}> = ({ data, color, height = 40 }) => {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
    >
      {/* Fill area under the line */}
      <polygon
        points={`0,${height} ${points} 100,${height}`}
        fill={`${color}15`}
      />
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (
        <circle
          cx={100}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
};

const TrendCharts: React.FC<TrendChartsProps> = ({
  xpTrend,
  wordsTrend,
  accuracyTrend,
  tierColor,
}) => {
  const { t } = useTranslation();

  // Extract just the values for sparklines
  const xpValues = xpTrend.map(d => d.value);
  const wordsValues = wordsTrend.map(d => d.value);
  const accuracyValues = accuracyTrend.map(d => d.value);

  // Calculate totals/averages
  const totalXp = xpValues.reduce((a, b) => a + b, 0);
  const totalWords = wordsValues.reduce((a, b) => a + b, 0);
  const avgAccuracy = accuracyValues.length > 0
    ? Math.round(accuracyValues.filter(v => v > 0).reduce((a, b) => a + b, 0) / accuracyValues.filter(v => v > 0).length) || 0
    : 0;

  return (
    <div className="bg-[var(--bg-card)] p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-[var(--border-color)]">
      <h3 className="text-scale-micro font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
        <ICONS.TrendingUp className="w-4 h-4" style={{ color: tierColor }} />
        {t('tutor.trends.title', 'Progress Trends')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* XP Trend */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${tierColor}08` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-scale-caption font-bold text-[var(--text-secondary)]">
              {t('tutor.trends.xpEarned', 'XP Earned')}
            </span>
            <span className="text-scale-label font-black" style={{ color: tierColor }}>
              {totalXp}
            </span>
          </div>
          <Sparkline data={xpValues} color={tierColor} height={35} />
        </div>

        {/* Words Trend */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${tierColor}08` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-scale-caption font-bold text-[var(--text-secondary)]">
              {t('tutor.trends.wordsLearned', 'Words Learned')}
            </span>
            <span className="text-scale-label font-black" style={{ color: tierColor }}>
              {totalWords}
            </span>
          </div>
          <Sparkline data={wordsValues} color={tierColor} height={35} />
        </div>

        {/* Accuracy Trend */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: `${tierColor}08` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-scale-caption font-bold text-[var(--text-secondary)]">
              {t('tutor.trends.avgAccuracy', 'Avg Accuracy')}
            </span>
            <span className="text-scale-label font-black" style={{ color: tierColor }}>
              {avgAccuracy}%
            </span>
          </div>
          <Sparkline data={accuracyValues} color={tierColor} height={35} />
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;
