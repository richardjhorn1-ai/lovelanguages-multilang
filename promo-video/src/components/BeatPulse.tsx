import { useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';

interface BeatPulseProps {
  startFrame: number;
  color?: string;
  intensity?: number;
}

// Full screen flash/pulse for dramatic beat moments
export const BeatPulse: React.FC<BeatPulseProps> = ({
  startFrame,
  color = COLORS.accentPink,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > 20) return null;

  // Quick flash that fades
  const opacity = interpolate(localFrame, [0, 3, 20], [0.5 * intensity, 0.3 * intensity, 0], {
    extrapolateRight: 'clamp',
  });

  // Slight scale pulse
  const scale = interpolate(localFrame, [0, 5, 20], [1.02, 1.01, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 50% 50%, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
        transform: `scale(${scale})`,
        pointerEvents: 'none',
        zIndex: 500,
      }}
    />
  );
};
