import { useCurrentFrame, interpolate, spring } from 'remotion';
import { FPS } from '../constants/timing';

interface PhoneFramePremiumProps {
  children: React.ReactNode;
  scale?: number;
  rotateX?: number;
  rotateY?: number;
  floating?: boolean;
  glare?: boolean;
  frameColor?: 'titanium' | 'black' | 'white' | 'blue';
}

// iPhone 15 Pro Max dimensions at 1x (we'll scale up)
const BASE_WIDTH = 280;
const BASE_HEIGHT = 572;
const CORNER_RADIUS = 44;
const BEZEL_WIDTH = 4;
const SAFE_AREA_TOP = 0; // No top padding
const SAFE_AREA_BOTTOM = 0; // No bottom padding

const FRAME_COLORS = {
  titanium: {
    frame: 'linear-gradient(145deg, #8a8a8f 0%, #6e6e73 25%, #48484a 50%, #3a3a3c 75%, #2c2c2e 100%)',
    edge: 'rgba(255, 255, 255, 0.25)',
    innerEdge: 'rgba(0, 0, 0, 0.3)',
  },
  black: {
    frame: 'linear-gradient(145deg, #2c2c2e 0%, #1c1c1e 50%, #0a0a0a 100%)',
    edge: 'rgba(255, 255, 255, 0.12)',
    innerEdge: 'rgba(0, 0, 0, 0.4)',
  },
  white: {
    frame: 'linear-gradient(145deg, #f5f5f7 0%, #e8e8ed 50%, #d2d2d7 100%)',
    edge: 'rgba(255, 255, 255, 0.8)',
    innerEdge: 'rgba(0, 0, 0, 0.1)',
  },
  blue: {
    frame: 'linear-gradient(145deg, #5e7ce2 0%, #4a6cd4 50%, #3d5fc9 100%)',
    edge: 'rgba(255, 255, 255, 0.3)',
    innerEdge: 'rgba(0, 0, 0, 0.2)',
  },
};

export const PhoneFramePremium: React.FC<PhoneFramePremiumProps> = ({
  children,
  scale = 1,
  rotateX = 0,
  rotateY = 0,
  floating = true,
  glare = true,
  frameColor = 'titanium',
}) => {
  const frame = useCurrentFrame();

  // Entrance animation
  const entranceProgress = spring({
    frame,
    fps: FPS,
    config: { damping: 18, stiffness: 90 },
  });

  // Floating animation - subtle and elegant
  const floatY = floating ? Math.sin(frame * 0.04) * 6 : 0;
  const floatRotateY = floating ? Math.sin(frame * 0.03) * 1 : 0;

  // Glare animation - slower, more premium feel
  const glarePosition = interpolate(
    frame % 300,
    [0, 300],
    [-50, 150],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Scaled dimensions
  const width = BASE_WIDTH * scale;
  const height = BASE_HEIGHT * scale;
  const cornerRadius = CORNER_RADIUS * scale;
  const bezelWidth = BEZEL_WIDTH * scale;
  const screenWidth = width - (bezelWidth * 2);
  const screenHeight = height - (bezelWidth * 2);
  const screenCornerRadius = (CORNER_RADIUS - BEZEL_WIDTH) * scale;
  const safeAreaTop = SAFE_AREA_TOP * scale;
  const safeAreaBottom = SAFE_AREA_BOTTOM * scale;

  const colors = FRAME_COLORS[frameColor];

  return (
    <div
      style={{
        perspective: 1500,
        perspectiveOrigin: '50% 40%',
      }}
    >
      <div
        style={{
          transform: `
            scale(${entranceProgress})
            translateY(${floatY}px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY + floatRotateY}deg)
          `,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Outer shadow for depth */}
        <div
          style={{
            position: 'absolute',
            width: width,
            height: height,
            borderRadius: cornerRadius,
            background: 'transparent',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.4),
              0 12px 24px -8px rgba(0, 0, 0, 0.3),
              0 4px 8px -2px rgba(0, 0, 0, 0.2)
            `,
          }}
        />

        {/* Phone frame body */}
        <div
          style={{
            width: width,
            height: height,
            borderRadius: cornerRadius,
            background: colors.frame,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: `
              inset 0 1px 1px ${colors.edge},
              inset 0 -1px 1px ${colors.innerEdge}
            `,
          }}
        >
          {/* Chamfered edge highlight - top */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: cornerRadius,
              right: cornerRadius,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${colors.edge}, transparent)`,
            }}
          />

          {/* Side buttons - Power (right) */}
          <div
            style={{
              position: 'absolute',
              right: -2 * scale,
              top: height * 0.22,
              width: 3 * scale,
              height: 65 * scale,
              borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
              background: colors.frame,
              boxShadow: `1px 0 2px rgba(0,0,0,0.3), inset -1px 0 1px ${colors.edge}`,
            }}
          />

          {/* Side buttons - Volume Up (left) */}
          <div
            style={{
              position: 'absolute',
              left: -2 * scale,
              top: height * 0.18,
              width: 3 * scale,
              height: 28 * scale,
              borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
              background: colors.frame,
              boxShadow: `-1px 0 2px rgba(0,0,0,0.3), inset 1px 0 1px ${colors.edge}`,
            }}
          />

          {/* Side buttons - Volume Down (left) */}
          <div
            style={{
              position: 'absolute',
              left: -2 * scale,
              top: height * 0.18 + 36 * scale,
              width: 3 * scale,
              height: 28 * scale,
              borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
              background: colors.frame,
              boxShadow: `-1px 0 2px rgba(0,0,0,0.3), inset 1px 0 1px ${colors.edge}`,
            }}
          />

          {/* Action button (left, above volume) */}
          <div
            style={{
              position: 'absolute',
              left: -2 * scale,
              top: height * 0.12,
              width: 3 * scale,
              height: 18 * scale,
              borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
              background: colors.frame,
              boxShadow: `-1px 0 2px rgba(0,0,0,0.3), inset 1px 0 1px ${colors.edge}`,
            }}
          />

          {/* Screen bezel area */}
          <div
            style={{
              position: 'absolute',
              top: bezelWidth,
              left: bezelWidth,
              width: screenWidth,
              height: screenHeight,
              borderRadius: screenCornerRadius,
              backgroundColor: '#f8f8fa',
              overflow: 'hidden',
            }}
          >
            {/* Screen content - scaled proportionally */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: screenWidth,
                height: screenHeight,
                overflow: 'hidden',
              }}
            >
              {/* Content rendered at 1x base size, then scaled up */}
              <div
                style={{
                  width: BASE_WIDTH - BEZEL_WIDTH * 2,
                  height: BASE_HEIGHT - BEZEL_WIDTH * 2,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  overflow: 'hidden',
                }}
              >
                {children}
              </div>
            </div>

            {/* Home indicator */}
            <div
              style={{
                position: 'absolute',
                bottom: 8 * scale,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 120 * scale,
                height: 4 * scale,
                borderRadius: 2 * scale,
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            />

            {/* Screen glare effect */}
            {glare && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: `linear-gradient(
                    115deg,
                    transparent ${glarePosition - 20}%,
                    rgba(255, 255, 255, 0.02) ${glarePosition}%,
                    transparent ${glarePosition + 20}%
                  )`,
                  pointerEvents: 'none',
                  borderRadius: screenCornerRadius,
                }}
              />
            )}
          </div>
        </div>

        {/* Reflection underneath */}
        <div
          style={{
            width: width * 0.9,
            height: height * 0.15,
            marginTop: 16 * scale,
            marginLeft: width * 0.05,
            borderRadius: cornerRadius * 0.5,
            background: `linear-gradient(
              to bottom,
              rgba(100, 100, 100, 0.15) 0%,
              transparent 100%
            )`,
            transform: 'scaleY(-1)',
            filter: `blur(${8 * scale}px)`,
            opacity: 0.5,
          }}
        />
      </div>
    </div>
  );
};
