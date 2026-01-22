import React from 'react';
import { useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FPS } from '../constants/timing';

type HeartLogoProps = {
  size?: number;
  delay?: number;
};

export const HeartLogo: React.FC<HeartLogoProps> = ({ size = 200, delay = 0 }) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - delay;

  // Main scale animation
  const scale = spring({
    frame: adjustedFrame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Subtle pulse
  const pulse = interpolate(
    (adjustedFrame % 60),
    [0, 30, 60],
    [1, 1.05, 1],
  );

  const finalScale = Math.max(0, scale) * pulse;

  // Rotation for intertwined effect
  const rotation = spring({
    frame: adjustedFrame - 10,
    fps: FPS,
    config: { damping: 200 },
  });

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        transform: `scale(${finalScale})`,
      }}
    >
      {/* Left heart */}
      <svg
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          width: size * 0.7,
          height: size * 0.7,
          left: 0,
          top: size * 0.15,
          transform: `rotate(${-15 * Math.max(0, rotation)}deg)`,
        }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={COLORS.accentPink}
        />
      </svg>

      {/* Right heart */}
      <svg
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          width: size * 0.7,
          height: size * 0.7,
          right: 0,
          top: size * 0.15,
          transform: `rotate(${15 * Math.max(0, rotation)}deg)`,
        }}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          fill={COLORS.teal}
        />
      </svg>
    </div>
  );
};
