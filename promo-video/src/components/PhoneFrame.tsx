import React from 'react';
import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS } from '../constants/colors';
import { FPS } from '../constants/timing';

type PhoneFrameProps = {
  children: React.ReactNode;
  scale?: number;
  depth3D?: boolean;
  entranceStyle?: 'none' | 'zoom' | 'slide-up' | 'dramatic';
  startFrame?: number;
};

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  scale = 1,
  depth3D = true,
  entranceStyle = 'dramatic',
  startFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  // 3D depth - subtle rotation based on frame for floating effect
  const rotateX = depth3D ? Math.sin(frame * 0.015) * 2 : 0;
  const rotateY = depth3D ? Math.cos(frame * 0.012) * 1.5 : 0;

  // Dynamic shadow that moves with tilt
  const shadowX = rotateY * 3;
  const shadowY = 20 + rotateX * 2;
  const shadowBlur = 40 + Math.abs(rotateX) * 5;

  // Entrance animation
  let entranceScale = 1;
  let entranceY = 0;
  let entranceOpacity = 1;
  let entranceRotateX = 0;

  if (entranceStyle === 'zoom') {
    const progress = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 12, stiffness: 80, mass: 1 },
    });
    entranceScale = interpolate(progress, [0, 1], [0.5, 1]);
    entranceOpacity = interpolate(localFrame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
  } else if (entranceStyle === 'slide-up') {
    const progress = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 15, stiffness: 100, mass: 0.8 },
    });
    entranceY = interpolate(progress, [0, 1], [100, 0]);
    entranceOpacity = interpolate(localFrame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  } else if (entranceStyle === 'dramatic') {
    // Dramatic entrance: zoom from far with rotation settling
    const progress = spring({
      frame: localFrame,
      fps: FPS,
      config: { damping: 12, stiffness: 60, mass: 1.2 },
    });
    entranceScale = interpolate(progress, [0, 1], [0.3, 1]);
    entranceY = interpolate(progress, [0, 1], [200, 0]);
    entranceRotateX = interpolate(progress, [0, 1], [30, 0]);
    entranceOpacity = interpolate(localFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  }

  return (
    <div
      style={{
        perspective: 1200,
        perspectiveOrigin: '50% 50%',
      }}
    >
      <div
        style={{
          width: 320 * scale,
          height: 693 * scale,
          backgroundColor: COLORS.bgPrimary,
          borderRadius: 36 * scale,
          border: `${6 * scale}px solid ${COLORS.textPrimary}`,
          overflow: 'hidden',
          boxShadow: `${shadowX * scale}px ${shadowY * scale}px ${shadowBlur * scale}px rgba(0,0,0,0.2)`,
          position: 'relative',
          transform: `
            scale(${entranceScale})
            translateY(${entranceY}px)
            rotateX(${rotateX + entranceRotateX}deg)
            rotateY(${rotateY}deg)
          `,
          transformStyle: 'preserve-3d',
          opacity: entranceOpacity,
        }}
      >
        {/* Phone frame highlight/reflection */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 30 * scale,
            background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.05) 100%)`,
            pointerEvents: 'none',
            zIndex: 20,
          }}
        />

        {/* Notch */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120 * scale,
            height: 28 * scale,
            backgroundColor: COLORS.textPrimary,
            borderBottomLeftRadius: 16 * scale,
            borderBottomRightRadius: 16 * scale,
            zIndex: 10,
          }}
        />

        {/* Content area */}
        <div
          style={{
            padding: 16 * scale,
            paddingTop: 44 * scale,
            height: '100%',
            overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
