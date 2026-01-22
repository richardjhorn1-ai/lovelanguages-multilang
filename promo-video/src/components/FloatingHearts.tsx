import { useCurrentFrame, interpolate } from 'remotion';
import { FPS } from '../constants/timing';

interface Heart {
  id: number;
  x: number; // percentage from left
  size: number;
  speed: number; // pixels per frame
  delay: number; // start delay in frames
  opacity: number;
  emoji: string;
}

// Generate a set of floating hearts
const generateHearts = (count: number): Heart[] => {
  const emojis = ['💕', '💗', '💖', '💝', '❤️', '🩷'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (i * 17 + 7) % 100, // Spread across screen
    size: 16 + (i % 4) * 8, // 16-40px
    speed: 1.5 + (i % 3) * 0.5, // Varying speeds
    delay: (i * 23) % 60, // Staggered starts
    opacity: 0.15 + (i % 3) * 0.1, // 0.15-0.35 opacity (subtle)
    emoji: emojis[i % emojis.length],
  }));
};

interface FloatingHeartsProps {
  count?: number;
  startFrame?: number;
}

export const FloatingHearts: React.FC<FloatingHeartsProps> = ({
  count = 12,
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = Math.max(0, frame - startFrame);
  const hearts = generateHearts(count);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {hearts.map((heart) => {
        const heartFrame = adjustedFrame - heart.delay;
        if (heartFrame < 0) return null;

        // Calculate Y position (starts from bottom, floats up)
        const cycleLength = 300; // frames for full cycle
        const progress = (heartFrame % cycleLength) / cycleLength;
        const yPosition = interpolate(progress, [0, 1], [110, -10]); // % from top

        // Gentle horizontal sway
        const sway = Math.sin(heartFrame * 0.05 + heart.id) * 3;

        // Fade in at start, fade out at top
        const fadeOpacity = interpolate(
          progress,
          [0, 0.1, 0.85, 1],
          [0, 1, 1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        );

        return (
          <div
            key={heart.id}
            style={{
              position: 'absolute',
              left: `${heart.x + sway}%`,
              top: `${yPosition}%`,
              fontSize: heart.size,
              opacity: heart.opacity * fadeOpacity,
              transform: `rotate(${Math.sin(heartFrame * 0.03) * 15}deg)`,
              transition: 'none',
            }}
          >
            {heart.emoji}
          </div>
        );
      })}
    </div>
  );
};
