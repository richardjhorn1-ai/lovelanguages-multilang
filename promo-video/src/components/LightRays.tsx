import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS } from '../constants/colors';
import { FPS } from '../constants/timing';

interface LightRaysProps {
  startFrame?: number;
  x?: number; // percentage
  y?: number; // percentage
  color?: string;
  intensity?: number;
  style?: 'burst' | 'glow' | 'rays';
}

export const LightRays: React.FC<LightRaysProps> = ({
  startFrame = 0,
  x = 50,
  y = 50,
  color = COLORS.accentPink,
  intensity = 1,
  style = 'burst',
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  // BURST - dramatic light burst that expands and fades
  if (style === 'burst') {
    const burstScale = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 15, stiffness: 80, mass: 1 },
    });

    const opacity = interpolate(localFrame, [0, 10, 40, 60], [0, 0.8 * intensity, 0.4 * intensity, 0], {
      extrapolateRight: 'clamp',
    });

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
        {/* Central glow */}
        <div
          style={{
            position: 'absolute',
            width: 200 * burstScale,
            height: 200 * burstScale,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(20px)',
          }}
        />
        {/* Light rays */}
        {[0, 45, 90, 135].map((angle) => (
          <div
            key={angle}
            style={{
              position: 'absolute',
              width: 300 * burstScale,
              height: 4,
              background: `linear-gradient(90deg, transparent 0%, ${color}${Math.round(opacity * 200).toString(16).padStart(2, '0')} 50%, transparent 100%)`,
              transform: `translate(-50%, -50%) rotate(${angle}deg)`,
              filter: 'blur(2px)',
            }}
          />
        ))}
      </div>
    );
  }

  // GLOW - pulsing glow effect
  if (style === 'glow') {
    const pulse = 0.7 + Math.sin(localFrame * 0.1) * 0.3;
    const size = 150 + Math.sin(localFrame * 0.05) * 30;

    const opacity = interpolate(localFrame, [0, 15], [0, intensity * 0.6], {
      extrapolateRight: 'clamp',
    });

    return (
      <div
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}${Math.round(opacity * pulse * 255).toString(16).padStart(2, '0')} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      />
    );
  }

  // RAYS - rotating light rays
  const rotation = localFrame * 0.5;
  const rayOpacity = interpolate(localFrame, [0, 20], [0, 0.4 * intensity], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {[0, 30, 60, 90, 120, 150].map((angle) => (
        <div
          key={angle}
          style={{
            position: 'absolute',
            width: 400,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${color}${Math.round(rayOpacity * 255).toString(16).padStart(2, '0')} 30%, ${color}${Math.round(rayOpacity * 255).toString(16).padStart(2, '0')} 70%, transparent 100%)`,
            transform: `rotate(${angle}deg)`,
            transformOrigin: 'center',
            filter: 'blur(1px)',
          }}
        />
      ))}
    </div>
  );
};
