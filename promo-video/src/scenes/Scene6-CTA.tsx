import { AbsoluteFill, useCurrentFrame, spring, interpolate, Sequence, Img, staticFile } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { Confetti } from '../components/Confetti';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { BeatPulse } from '../components/BeatPulse';
import { KineticText } from '../components/KineticText';

export const Scene6CTA: React.FC = () => {
  const frame = useCurrentFrame();

  // Logo scale animation
  const logoScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Logo glow pulse
  const glowIntensity = interpolate(
    frame % 60,
    [0, 30, 60],
    [0.3, 0.6, 0.3]
  );

  // CTA button pulse
  const buttonScale = interpolate(
    frame % 45,
    [0, 22, 45],
    [1, 1.05, 1]
  );

  // Button entrance
  const buttonEntrance = spring({
    frame: frame - 80,
    fps: FPS,
    config: { damping: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${COLORS.softPink} 0%, ${COLORS.bgPrimary} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* No camera zoom - show everything centered and clean */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          gap: 24,
        }}
      >
        {/* Floating hearts background */}
        <FloatingHearts count={16} />

        {/* Confetti celebration when CTA appears */}
        <Confetti startFrame={80} count={100} duration={120} />

        {/* Glowing logo */}
        <div
          style={{
            filter: `drop-shadow(0 0 ${30 + glowIntensity * 20}px ${COLORS.accentPink}${Math.round(glowIntensity * 100).toString(16).padStart(2, '0')})`,
            width: 160,
            height: 160,
            transform: `scale(${Math.max(0, logoScale)})`,
            position: 'relative',
          }}
        >
          <Img
            src={staticFile('logo.svg')}
            style={{
              width: '100%',
              height: '100%',
            }}
          />
          {/* Sparkles around logo */}
          <SparkleBurst startFrame={10} x={10} y={30} count={6} color="#FFD700" />
          <SparkleBurst startFrame={15} x={90} y={40} count={6} color={COLORS.accentPink} />
          <SparkleBurst startFrame={20} x={50} y={90} count={5} color="#FFD700" />
        </div>

        {/* Tagline */}
        <div style={{ textAlign: 'center', width: '100%' }}>
          <KineticText
            text="Teach Each Other."
            startFrame={15}
            style="word-by-word"
            fontSize={48}
            color={COLORS.textPrimary}
          />
          <Sequence from={50}>
            <KineticText
              text="Learn Together."
              startFrame={0}
              style="word-by-word"
              fontSize={48}
              color={COLORS.accentPink}
            />
          </Sequence>
        </div>

        {/* CTA Button */}
        <Sequence from={80}>
          <div style={{ position: 'relative' }}>
            <button
              style={{
                backgroundColor: COLORS.accentPink,
                color: 'white',
                padding: '20px 40px',
                borderRadius: 20,
                fontSize: 28,
                fontWeight: 600,
                fontFamily: FONTS.header,
                border: 'none',
                boxShadow: `0 8px 32px rgba(255, 71, 97, 0.4)`,
                transform: `scale(${Math.max(0, buttonEntrance) * buttonScale})`,
                cursor: 'pointer',
              }}
            >
              Start Learning Free
            </button>
            {/* Sparkles around button */}
            <SparkleBurst startFrame={0} x={10} y={50} count={5} color="#FFD700" />
            <SparkleBurst startFrame={5} x={90} y={50} count={5} color={COLORS.accentPink} />
          </div>
        </Sequence>

        {/* Availability */}
        <Sequence from={100}>
          <div
            style={{
              textAlign: 'center',
              opacity: spring({
                frame: frame - 100,
                fps: FPS,
                config: { damping: 200 },
              }),
            }}
          >
            <p
              style={{
                fontFamily: FONTS.header,
                fontSize: 24,
                color: COLORS.textPrimary,
                margin: 0,
              }}
            >
              Available at LoveLanguages.io
            </p>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 18,
                color: COLORS.textSecondary,
                marginTop: 8,
              }}
            >
              or on the App Store
            </p>
          </div>
        </Sequence>
      </AbsoluteFill>

      {/* Beat pulse when button appears */}
      <BeatPulse startFrame={80} color={COLORS.accentPink} intensity={0.6} />
    </AbsoluteFill>
  );
};
