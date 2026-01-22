import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';

interface AnimatedGradientProps {
  style?: 'aurora' | 'pulse' | 'wave';
}

export const AnimatedGradient: React.FC<AnimatedGradientProps> = ({ style = 'aurora' }) => {
  const frame = useCurrentFrame();

  // Slow rotation for aurora effect
  const rotation = interpolate(frame, [0, 600], [0, 360], {
    extrapolateRight: 'extend',
  });

  // Subtle position shift
  const xShift = Math.sin(frame * 0.02) * 10;
  const yShift = Math.cos(frame * 0.015) * 10;

  // Scale breathing
  const scale = 1 + Math.sin(frame * 0.01) * 0.1;

  if (style === 'aurora') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: -200,
          background: `
            radial-gradient(ellipse 80% 50% at ${30 + xShift}% ${20 + yShift}%, ${COLORS.accentPink}30 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at ${70 - xShift}% ${60 - yShift}%, ${COLORS.softPink}50 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at ${50 + xShift * 0.5}% ${80 + yShift * 0.5}%, ${COLORS.teal}20 0%, transparent 50%),
            radial-gradient(ellipse 90% 70% at 50% 50%, ${COLORS.accentLight}40 0%, transparent 60%)
          `,
          transform: `rotate(${rotation * 0.1}deg) scale(${scale})`,
          pointerEvents: 'none',
        }}
      />
    );
  }

  if (style === 'pulse') {
    const pulseScale = 1 + Math.sin(frame * 0.05) * 0.15;
    const pulseOpacity = 0.3 + Math.sin(frame * 0.03) * 0.1;

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '150%',
            height: '150%',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${COLORS.accentPink}${Math.round(pulseOpacity * 100).toString(16).padStart(2, '0')} 0%, transparent 60%)`,
            transform: `scale(${pulseScale})`,
          }}
        />
      </div>
    );
  }

  // Wave style
  const wave1 = Math.sin(frame * 0.03) * 20;
  const wave2 = Math.cos(frame * 0.025) * 15;

  return (
    <div
      style={{
        position: 'absolute',
        inset: -100,
        background: `
          linear-gradient(${45 + wave1}deg, ${COLORS.softPink}60 0%, transparent 50%),
          linear-gradient(${135 + wave2}deg, ${COLORS.accentLight}40 0%, transparent 50%),
          linear-gradient(${225 - wave1}deg, ${COLORS.tealLight}30 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }}
    />
  );
};
