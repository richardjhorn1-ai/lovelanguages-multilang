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
const PHASE = {
  flagsAppear: { start: 0, end: 45 },       // 0-1.5s: All flags appear
  nativeHighlight: { start: 45, end: 100 }, // 1.5-3.3s: "18 Native" + quick pass
  targetHighlight: { start: 100, end: 160 }, // 3.3-5.3s: "18 Target" + quick pass
  pairsReveal: { start: 160, end: 240 },     // 5.3-8s: "306 Pairs" counter
};

export const Scene2Languages: React.FC = () => {
  const frame = useCurrentFrame();

  // Calculate highlight speed to cycle through all 18 flags exactly once per phase
  const nativePhaseDuration = PHASE.nativeHighlight.end - PHASE.nativeHighlight.start; // 55 frames
  const targetPhaseDuration = PHASE.targetHighlight.end - PHASE.targetHighlight.start; // 60 frames
  const nativeHighlightSpeed = nativePhaseDuration / 18; // ~3 frames per flag
  const targetHighlightSpeed = targetPhaseDuration / 18; // ~3.3 frames per flag

  // Native highlight phase - single pass through all flags
  const isNativePhase = frame >= PHASE.nativeHighlight.start && frame < PHASE.nativeHighlight.end;
  const nativeHighlightIndex = isNativePhase
    ? Math.min(17, Math.floor((frame - PHASE.nativeHighlight.start) / nativeHighlightSpeed))
    : -1;

  // Target highlight phase - single pass through all flags
  const isTargetPhase = frame >= PHASE.targetHighlight.start && frame < PHASE.targetHighlight.end;
  const targetHighlightIndex = isTargetPhase
    ? Math.min(17, Math.floor((frame - PHASE.targetHighlight.start) / targetHighlightSpeed))
    : -1;

  // Current phase label - show initial "18 Languages" at start, then transition to native/target/pairs
  const showInitialLabel = frame < PHASE.nativeHighlight.start;
  const showNativeLabel = frame >= PHASE.nativeHighlight.start && frame < PHASE.targetHighlight.start;
  const showTargetLabel = frame >= PHASE.targetHighlight.start && frame < PHASE.pairsReveal.start;
  const showPairsLabel = frame >= PHASE.pairsReveal.start;

  // Initial label opacity
  const initialLabelOpacity = interpolate(
    frame,
    [10, 20, PHASE.nativeHighlight.start - 10, PHASE.nativeHighlight.start],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Counter animation for 306 - counts up quickly, then holds
  const counterValue = Math.floor(
    interpolate(frame, [PHASE.pairsReveal.start, PHASE.pairsReveal.start + 35], [0, 306], {
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
        {/* Initial "18 Languages, Endless Combinations" */}
        {showInitialLabel && (
          <div style={{ textAlign: 'center', opacity: initialLabelOpacity }}>
            <h2
              style={{
                fontFamily: FONTS.header,
                fontSize: 36,
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: 0,
              }}
            >
              18 Languages, Endless Combinations
            </h2>
            <p
              style={{
                fontFamily: FONTS.body,
                fontSize: 18,
                color: COLORS.textSecondary,
                marginTop: 8,
              }}
            >
              Speak your partner's language
            </p>
          </div>
        )}
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
          // Initial appearance
          const appearDelay = i * 1;
          const baseScale = spring({
            frame: frame - appearDelay,
            fps: FPS,
            config: { damping: 200 },
          });

          // Highlight states
          const isNativeHighlighted = nativeHighlightIndex === i;
          const isTargetHighlighted = targetHighlightIndex === i;
          const isHighlighted = isNativeHighlighted || isTargetHighlighted;

          // Much more visible highlighting - scale up, full opacity, glow
          const highlightScale = isHighlighted ? 1.2 : 1;
          const highlightOpacity = isHighlighted ? 1 : 0.4;
          const glowColor = isNativeHighlighted ? COLORS.teal : COLORS.accentPink;

          return (
            <div
              key={lang.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transform: `scale(${Math.max(0, baseScale) * highlightScale})`,
                opacity: frame > appearDelay ? highlightOpacity : 0,
                padding: 8,
                filter: isHighlighted ? `drop-shadow(0 0 20px ${glowColor})` : 'none',
                zIndex: isHighlighted ? 10 : 1,
              }}
            >
              <span style={{ fontSize: 40 }}>{lang.flag}</span>
              <span
                style={{
                  fontSize: 11,
                  color: isHighlighted ? COLORS.textPrimary : COLORS.textSecondary,
                  marginTop: 4,
                  fontFamily: FONTS.body,
                  fontWeight: isHighlighted ? 700 : 400,
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
