import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
// Caption removed - using inline phase labels instead
import { Confetti } from '../components/Confetti';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';

const LANGUAGES = [
  { flag: '🇬🇧', name: 'English' },
  { flag: '🇪🇸', name: 'Español' },
  { flag: '🇫🇷', name: 'Français' },
  { flag: '🇩🇪', name: 'Deutsch' },
  { flag: '🇮🇹', name: 'Italiano' },
  { flag: '🇵🇹', name: 'Português' },
  { flag: '🇵🇱', name: 'Polski' },
  { flag: '🇷🇺', name: 'Русский' },
  { flag: '🇺🇦', name: 'Українська' },
  { flag: '🇬🇷', name: 'Ελληνικά' },
  { flag: '🇭🇺', name: 'Magyar' },
  { flag: '🇹🇷', name: 'Türkçe' },
  { flag: '🇸🇪', name: 'Svenska' },
  { flag: '🇳🇴', name: 'Norsk' },
  { flag: '🇩🇰', name: 'Dansk' },
  { flag: '🇳🇱', name: 'Nederlands' },
  { flag: '🇨🇿', name: 'Čeština' },
  { flag: '🇷🇴', name: 'Română' },
];

// Animation phases (in frames at 30fps, 8s = 240 frames)
// Slower pacing for better readability
const PHASE = {
  flagsAppear: { start: 0, end: 60 },        // 0-2s: All flags appear with stagger
  nativeHighlight: { start: 60, end: 120 },  // 2-4s: "18 Native" + highlight pass
  targetHighlight: { start: 120, end: 175 }, // 4-5.8s: "18 Target" + highlight pass
  pairsReveal: { start: 175, end: 240 },     // 5.8-8s: "306 Pairs" counter
};

export const Scene2Languages: React.FC = () => {
  const frame = useCurrentFrame();

  // Simplified highlighting - all flags glow together during each phase
  // No individual flag cycling (too fast to perceive)
  const isNativePhase = frame >= PHASE.nativeHighlight.start && frame < PHASE.nativeHighlight.end;
  const isTargetPhase = frame >= PHASE.targetHighlight.start && frame < PHASE.pairsReveal.start;

  // Current phase label
  const showNativeLabel = frame >= PHASE.nativeHighlight.start && frame < PHASE.targetHighlight.start;
  const showTargetLabel = frame >= PHASE.targetHighlight.start && frame < PHASE.pairsReveal.start;
  const showPairsLabel = frame >= PHASE.pairsReveal.start;

  // Counter animation for 306 - counts up over 60 frames (~2s) for readability
  const counterValue = Math.floor(
    interpolate(frame, [PHASE.pairsReveal.start, PHASE.pairsReveal.start + 60], [0, 306], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Label opacity animations
  const nativeLabelOpacity = interpolate(
    frame,
    [PHASE.nativeHighlight.start, PHASE.nativeHighlight.start + 10, PHASE.targetHighlight.start - 10, PHASE.targetHighlight.start],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const targetLabelOpacity = interpolate(
    frame,
    [PHASE.targetHighlight.start, PHASE.targetHighlight.start + 10, PHASE.pairsReveal.start - 10, PHASE.pairsReveal.start],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const pairsLabelOpacity = interpolate(
    frame,
    [PHASE.pairsReveal.start, PHASE.pairsReveal.start + 15],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Bounce scale for 306 reveal
  const pairsScale = spring({
    frame: frame - PHASE.pairsReveal.start,
    fps: FPS,
    config: { damping: 8, stiffness: 100, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="wave" />

      {/* Camera zoom wrapper - cinematic zoom on flags and text */}
      <CameraZoom style="cinematic" startZoom={1} endZoom={1.8} duration={240} zoomOutDuration={45} focusX={50} focusY={48} zoomInDelay={20}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          {/* Confetti when 306 appears */}
          <Confetti startFrame={PHASE.pairsReveal.start} count={60} duration={80} />

      {/* Phase Label - positioned above flags */}
      <div style={{ height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
        {showNativeLabel && (
          <h2
            style={{
              fontFamily: FONTS.header,
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.textPrimary,
              opacity: nativeLabelOpacity,
            }}
          >
            18 Native Languages
          </h2>
        )}
        {showTargetLabel && (
          <h2
            style={{
              fontFamily: FONTS.header,
              fontSize: 42,
              fontWeight: 700,
              color: COLORS.textPrimary,
              opacity: targetLabelOpacity,
            }}
          >
            18 Target Languages
          </h2>
        )}
        {showPairsLabel && (
          <div
            style={{
              textAlign: 'center',
              opacity: pairsLabelOpacity,
              transform: `scale(${Math.max(0, pairsScale)})`,
              position: 'relative',
            }}
          >
            <span
              style={{
                fontFamily: FONTS.header,
                fontSize: 100,
                fontWeight: 700,
                color: COLORS.accentPink,
              }}
            >
              {counterValue}
            </span>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 32,
                color: COLORS.textPrimary,
                marginTop: 0,
              }}
            >
              Language Pairs
            </p>
            {/* Sparkle bursts around 306 */}
            <SparkleBurst startFrame={PHASE.pairsReveal.start} x={20} y={30} count={8} color="#FFD700" />
            <SparkleBurst startFrame={PHASE.pairsReveal.start + 5} x={80} y={20} count={8} color={COLORS.accentPink} />
            <SparkleBurst startFrame={PHASE.pairsReveal.start + 10} x={50} y={70} count={6} color="#FFD700" />
          </div>
        )}
      </div>

      {/* Flags grid - 3x6 grid for vertical video (3 across, 6 down) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginTop: 10,
          width: '80%',
          maxWidth: 400,
        }}
      >
        {LANGUAGES.map((lang, i) => {
          // Initial appearance - stagger for visible cascade effect
          const appearDelay = i * 2;
          const baseScale = spring({
            frame: frame - appearDelay,
            fps: FPS,
            config: { damping: 200 },
          });

          // All flags glow together during highlight phases
          const isHighlighted = isNativePhase || isTargetPhase;
          const glowColor = isNativePhase ? COLORS.teal : COLORS.accentPink;

          // Subtle pulse effect during highlight phases
          const highlightScale = isHighlighted ? 1.05 : 1;
          const highlightOpacity = frame > appearDelay ? 1 : 0;

          return (
            <div
              key={lang.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `scale(${Math.max(0, baseScale) * highlightScale})`,
                opacity: highlightOpacity,
                padding: 8,
                filter: isHighlighted ? `drop-shadow(0 0 12px ${glowColor})` : 'none',
                transition: 'filter 0.2s ease',
              }}
            >
              <span style={{ fontSize: 40 }}>{lang.flag}</span>
              <span
                style={{
                  fontSize: 11,
                  color: COLORS.textPrimary,
                  marginTop: 4,
                  fontFamily: FONTS.body,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {lang.name}
              </span>
            </div>
          );
        })}
      </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on 306 reveal */}
      <BeatPulse startFrame={PHASE.pairsReveal.start} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
