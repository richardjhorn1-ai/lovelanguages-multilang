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
  ariaLabel?: string;
}> = ({ data, color, height = 40, ariaLabel }) => {
  if (data.length === 0) return null;

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    // Fix division by zero: when data.length === 1, center the point at x=50
    const x = data.length > 1 ? (index / (data.length - 1)) * 100 : 50;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height: `${height}px` }}
      role="img"
      aria-label={ariaLabel || 'Trend chart'}
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
  const nonZeroAccuracy = accuracyValues.filter(v => v > 0);
  const avgAccuracy = nonZeroAccuracy.length > 0
    ? Math.round(nonZeroAccuracy.reduce((a, b) => a + b, 0) / nonZeroAccuracy.length)
    : 0;

  return (
    <div className="glass-card p-4 md:p-6 rounded-xl md:rounded-2xl">
      <h3 className="text-scale-micro font-black font-header uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
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
          <Sparkline data={xpValues} color={tierColor} height={35} ariaLabel={`XP trend: ${totalXp} total`} />
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
          <Sparkline data={wordsValues} color={tierColor} height={35} ariaLabel={`Words trend: ${totalWords} total`} />
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
          <Sparkline data={accuracyValues} color={tierColor} height={35} ariaLabel={`Accuracy trend: ${avgAccuracy}% average`} />
        </div>
      </div>
    </div>
  );
};

export default TrendCharts;
