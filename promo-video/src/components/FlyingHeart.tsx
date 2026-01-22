import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS } from '../constants/colors';
import { FPS } from '../constants/timing';

interface FlyingHeartProps {
  startFrame: number;
  duration?: number;
}

export const FlyingHeart: React.FC<FlyingHeartProps> = ({
  startFrame,
  duration = 40,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > duration + 20) return null;

  // Position animation - starts from left, flies to right with arc
  const progress = interpolate(localFrame, [0, duration], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // X movement: left to right across screen
  const xPos = interpolate(progress, [0, 1], [-200, 200]);

  // Y movement: arc upward then down
  const yPos = Math.sin(progress * Math.PI) * -150;

  // Scale: grows then shrinks
  const scale = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100, mass: 0.5 },
  });

  const scaleDown = interpolate(progress, [0.7, 1], [1, 0.3], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Rotation wobble
  const rotation = Math.sin(localFrame * 0.3) * 15;

  // Opacity: fade in at start, fade out at end
  const opacity = interpolate(
    localFrame,
    [0, 5, duration - 10, duration],
    [0, 1, 1, 0],
    { extrapolateRight: 'clamp' }
  );

  // Trail of smaller hearts
  const trailOpacity = interpolate(localFrame, [5, 15], [0, 1], {
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        pointerEvents: 'none',
        zIndex: 300,
      }}
    >
      {/* Trail of mini hearts */}
      {[0, 1, 2, 3].map((i) => {
        const trailProgress = Math.max(0, progress - i * 0.08);
        const trailX = interpolate(trailProgress, [0, 1], [-200, 200]);
        const trailY = Math.sin(trailProgress * Math.PI) * -150;
        const trailScale = 0.3 - i * 0.05;
        const trailFade = interpolate(i, [0, 3], [0.6, 0.2]);

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              transform: `translate(${trailX}px, ${trailY}px) scale(${trailScale})`,
              opacity: trailOpacity * trailFade * opacity,
            }}
          >
            <span style={{ fontSize: 40 }}>💕</span>
          </div>
        );
      })}

      {/* Main flying heart envelope */}
      <div
        style={{
          transform: `translate(${xPos}px, ${yPos}px) scale(${Math.max(0, scale) * scaleDown}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        {/* Glowing background */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            background: `radial-gradient(circle, ${COLORS.accentPink}40 0%, transparent 70%)`,
            borderRadius: '50%',
            filter: 'blur(10px)',
          }}
        />
        {/* Heart envelope */}
        <div
          style={{
            position: 'relative',
            width: 80,
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 60, filter: 'drop-shadow(0 4px 8px rgba(255,71,97,0.4))' }}>
            💝
          </span>
        </div>
        {/* Sparkle trail */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const sparkleOpacity = interpolate(
              (localFrame + i * 5) % 20,
              [0, 10, 20],
              [0, 1, 0]
            );
            const sparkleX = Math.cos(i * 1.2) * 40;
            const sparkleY = Math.sin(i * 1.2) * 30;

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  transform: `translate(${sparkleX}px, ${sparkleY}px)`,
                  opacity: sparkleOpacity * 0.8,
                  fontSize: 12,
                }}
              >
                ✨
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
