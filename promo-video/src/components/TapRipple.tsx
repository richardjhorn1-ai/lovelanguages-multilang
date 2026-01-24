import { useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import { FPS } from '../constants/timing';
import { COLORS } from '../constants/colors';

interface TapRippleProps {
  x: number;          // % from left (0-100)
  y: number;          // % from top (0-100)
  startFrame: number;
  color?: string;     // Default: white for clean look
  size?: number;      // Finger size in pixels
  duration?: number;  // Duration in frames (default: 24)
}

export const TapRipple: React.FC<TapRippleProps> = ({
  x,
  y,
  startFrame,
  color = '#ffffff',
  size = 44,
  duration = 24,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // Don't render before start or after completion
  if (localFrame < 0 || localFrame > duration) {
    return null;
  }

  // Phase timing
  const pressPhase = 8;  // Finger presses down
  const holdPhase = 4;   // Brief hold
  const releasePhase = duration - pressPhase - holdPhase;

  // Finger press animation - appears and presses down
  const fingerOpacity = interpolate(
    localFrame,
    [0, 3, pressPhase + holdPhase, pressPhase + holdPhase + 6],
    [0, 0.9, 0.9, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scale: starts slightly large, presses down smaller, then releases
  const fingerScale = interpolate(
    localFrame,
    [0, 3, pressPhase, pressPhase + holdPhase, pressPhase + holdPhase + 4],
    [1.2, 1, 0.85, 0.85, 1.1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  // Ripple that expands on tap
  const rippleStart = pressPhase;
  const rippleLocalFrame = localFrame - rippleStart;
  const showRipple = rippleLocalFrame >= 0;

  const rippleScale = showRipple
    ? interpolate(
        rippleLocalFrame,
        [0, releasePhase],
        [0.3, 2.5],
        {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.out(Easing.cubic),
        }
      )
    : 0;

  const rippleOpacity = showRipple
    ? interpolate(
        rippleLocalFrame,
        [0, 4, releasePhase],
        [0.5, 0.3, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
      )
    : 0;

  // Press shadow/highlight effect
  const pressHighlight = interpolate(
    localFrame,
    [0, pressPhase, pressPhase + holdPhase, pressPhase + holdPhase + 4],
    [0, 0.4, 0.4, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Press highlight - subtle glow under finger */}
      <div
        style={{
          position: 'absolute',
          width: size * 1.8,
          height: size * 1.8,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          opacity: pressHighlight,
        }}
      />

      {/* Expanding ripple ring */}
      {showRipple && (
        <div
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: '50%',
            border: `2px solid ${color}`,
            backgroundColor: 'transparent',
            transform: `translate(-50%, -50%) scale(${rippleScale})`,
            opacity: rippleOpacity,
          }}
        />
      )}

      {/* Finger indicator - soft circle */}
      <div
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${color}ee, ${color}aa 50%, ${color}66 100%)`,
          transform: `translate(-50%, -50%) scale(${fingerScale})`,
          opacity: fingerOpacity,
          boxShadow: `
            0 4px 12px rgba(0,0,0,0.3),
            0 2px 4px rgba(0,0,0,0.2),
            inset 0 1px 2px rgba(255,255,255,0.3)
          `,
        }}
      />
    </div>
  );
};

// Helper component for multiple sequential taps
interface TapSequenceProps {
  taps: Array<{ x: number; y: number; delay: number; color?: string }>;
  startFrame: number;
  size?: number;
  duration?: number;
}

export const TapSequence: React.FC<TapSequenceProps> = ({
  taps,
  startFrame,
  size = 44,
  duration = 24,
}) => {
  return (
    <>
      {taps.map((tap, index) => (
        <TapRipple
          key={index}
          x={tap.x}
          y={tap.y}
          startFrame={startFrame + tap.delay}
          color={tap.color}
          size={size}
          duration={duration}
        />
      ))}
    </>
  );
};
