import { AbsoluteFill, useCurrentFrame, interpolate, Img, staticFile, spring } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { KineticText } from '../components/KineticText';

export const Scene1Hero: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo scale animation with bounce overshoot
  const logoScale = spring({
    frame,
    fps: FPS,
    config: { damping: 10, stiffness: 100, mass: 0.5 }, // Low damping = more bounce
  });

  const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });

  // "Together." with bounce entrance
  const togetherOpacity = interpolate(
    frame,
    [4 * FPS, 4 * FPS + 10],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const togetherScale = spring({
    frame: frame - 4 * FPS,
    fps: FPS,
    config: { damping: 8, stiffness: 100, mass: 0.5 }, // Bouncy entrance
  });

  // Tagline with bounce - appears earlier for better visibility (3s visible)
  const taglineOpacity = interpolate(
    frame,
    [4 * FPS + 15, 4 * FPS + 25],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const taglineScale = spring({
    frame: frame - (4 * FPS + 15),
    fps: FPS,
    config: { damping: 10, stiffness: 100, mass: 0.4 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* Camera zoom wrapper - cinematic zoom on logo/text */}
      <CameraZoom style="cinematic" startZoom={1} endZoom={2} duration={210} zoomOutDuration={45} focusX={50} focusY={40} zoomInDelay={30}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 180,
            paddingLeft: 40,
            paddingRight: 40,
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={10} startFrame={20} />

      {/* Actual Love Languages Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          width: 160,
          height: 160,
        }}
      >
        <Img
          src={staticFile('logo.svg')}
          style={{
            width: '100%',
            height: '100%',
            color: COLORS.accentPink,
          }}
        />
      </div>

          {/* Main headline - vertically stacked for vertical video format */}
          <div style={{ marginTop: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
            <KineticText
              text="Learn Your"
              startFrame={30}
              style="word-by-word"
              fontSize={56}
              fontFamily={FONTS.header}
              fontWeight={700}
              color={COLORS.textPrimary}
              lineHeight={1.1}
            />
            <KineticText
              text="Partner's"
              startFrame={60}
              style="word-by-word"
              fontSize={56}
              fontFamily={FONTS.header}
              fontWeight={700}
              color={COLORS.accentPink}
              lineHeight={1.1}
            />
            <KineticText
              text="Language"
              startFrame={90}
              style="word-by-word"
              fontSize={56}
              fontFamily={FONTS.header}
              fontWeight={700}
              color={COLORS.textPrimary}
              lineHeight={1.1}
            />
          </div>

          {/* "Together." with dramatic reveal and sparkles */}
          <div
            style={{
              marginTop: 20,
              opacity: togetherOpacity,
              transform: `scale(${Math.max(0, togetherScale)})`,
              position: 'relative',
            }}
          >
            <span
              style={{
                fontFamily: FONTS.header,
                fontSize: 56,
                fontWeight: 600,
                color: COLORS.accentPink,
                position: 'relative',
                zIndex: 10,
              }}
            >
              Together.
            </span>
            {/* Sparkle bursts around the text */}
            <SparkleBurst startFrame={4 * FPS} x={10} y={20} count={6} color="#FFD700" />
            <SparkleBurst startFrame={4 * FPS + 5} x={90} y={30} count={6} color={COLORS.accentPink} />
            <SparkleBurst startFrame={4 * FPS + 10} x={50} y={80} count={5} color="#FFD700" />
          </div>

          {/* Tagline with slide-up entrance */}
          <div
            style={{
              marginTop: 24,
              opacity: taglineOpacity,
              transform: `scale(${Math.max(0, taglineScale)})`,
              padding: '10px 24px',
              backgroundColor: COLORS.accentLight,
              borderRadius: 24,
              border: `2px solid ${COLORS.accentBorder}`,
            }}
          >
            <span
              style={{
                fontFamily: FONTS.body,
                fontSize: 20,
                fontWeight: 600,
                color: COLORS.accentPink,
              }}
            >
              💕 Language Learning for Couples
            </span>
          </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on "Together" reveal */}
      <BeatPulse startFrame={4 * FPS} color={COLORS.accentPink} intensity={0.6} />
    </AbsoluteFill>
  );
};
