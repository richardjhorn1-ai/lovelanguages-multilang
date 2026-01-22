import { useCurrentFrame, interpolate, spring } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';

interface CaptionProps {
  text: string;
  subtext?: string;
  startFrame: number;
  position?: 'top' | 'bottom';
  style?: 'default' | 'highlight' | 'subtle';
}

export const Caption: React.FC<CaptionProps> = ({
  text,
  subtext,
  startFrame,
  position = 'bottom',
  style = 'default',
}) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const opacity = interpolate(
    frame,
    [startFrame, startFrame + 10, startFrame + 200, startFrame + 215],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Kinetic slide up with blur
  const slideProgress = spring({
    frame: localFrame,
    fps: FPS,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  const slideY = interpolate(slideProgress, [0, 1], [30, 0]);
  const blur = interpolate(slideProgress, [0, 1], [6, 0]);

  // Subtext staggers in after main text
  const subtextProgress = spring({
    frame: localFrame - 8,
    fps: FPS,
    config: { damping: 15, stiffness: 100, mass: 0.8 },
  });

  const subtextSlideY = interpolate(subtextProgress, [0, 1], [20, 0]);
  const subtextOpacity = interpolate(localFrame, [8, 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgColor =
    style === 'highlight'
      ? COLORS.accentPink
      : style === 'subtle'
      ? 'rgba(0,0,0,0.6)'
      : COLORS.bgCard;

  const textColor =
    style === 'highlight' || style === 'subtle' ? 'white' : COLORS.textPrimary;

  // Positioned closer to the phone
  const topPosition = position === 'top' ? 280 : 70;

  return (
    <div
      style={{
        position: 'absolute',
        [position]: topPosition,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        opacity,
        zIndex: 100,
        padding: '0 20px',
      }}
    >
      <div
        style={{
          backgroundColor: bgColor,
          borderRadius: 24,
          padding: subtext ? '18px 32px' : '16px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          textAlign: 'center',
          maxWidth: '95%',
        }}
      >
        {/* Main text with kinetic slide-up */}
        <p
          style={{
            fontFamily: FONTS.header,
            fontSize: 28,
            fontWeight: 700,
            color: textColor,
            margin: 0,
            lineHeight: 1.3,
            transform: `translateY(${slideY}px)`,
            filter: `blur(${blur}px)`,
          }}
        >
          {text}
        </p>
        {/* Subtext with staggered entrance */}
        {subtext && (
          <p
            style={{
              fontFamily: FONTS.body,
              fontSize: 18,
              fontWeight: 500,
              color: style === 'highlight' || style === 'subtle' ? 'rgba(255,255,255,0.85)' : COLORS.textSecondary,
              margin: 0,
              marginTop: 8,
              lineHeight: 1.4,
              transform: `translateY(${subtextSlideY}px)`,
              opacity: subtextOpacity,
            }}
          >
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
};
