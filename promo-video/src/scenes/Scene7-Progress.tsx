import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { PhoneWithRole } from '../components/PhoneWithRole';
import { TapRipple } from '../components/TapRipple';
import { ProgressScreen } from '../components/screens/ProgressScreen';

// Camera path - no vertical panning (10s = 300 frames)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 300, zoom: 1, focusX: 50, focusY: 50 },
];

// Scene phases (10s = 300 frames)
const TAP_NAV_PROGRESS = 20;
const XP_ANIMATION_START = 30;
const XP_ANIMATION_END = 80;

export const Scene7Progress: React.FC = () => {
  const frame = useCurrentFrame();

  // Animated XP (count up)
  const animatedXP = Math.floor(
    interpolate(frame, [XP_ANIMATION_START, XP_ANIMATION_END], [0, 1250], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Animated progress bar
  const animatedProgress = interpolate(
    frame,
    [XP_ANIMATION_START + 5, XP_ANIMATION_END + 5],
    [0, 65],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      <AnimatedGradient style="aurora" />

      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 340,
          }}
        >
          <FloatingHearts count={8} />

          {/* Caption */}
          <Caption
            text="Watch Your Love Grow"
            subtext="Every word, every gift, every milestone"
            startFrame={10}
            position="top"
          />

          {/* Phone with Progress */}
          <PhoneWithRole
            role="student"
            partnerName="Student"
            targetLanguage="Spanish"
            scale={2.25}
            startFrame={0}
            glowIntensity={0.5}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              <ProgressScreen
                xp={animatedXP}
                level="Conversational 2"
                progressPercent={animatedProgress}
                wordCount={42}
                startFrame={0}
              />

              {/* Tap on Progress nav */}
              <TapRipple x={87} y={95} startFrame={TAP_NAV_PROGRESS} color={COLORS.accentPink} />

              {/* Sparkles when XP reaches target */}
              <SparkleBurst startFrame={XP_ANIMATION_END - 5} x={85} y={15} count={5} color="#FFD700" />
              <SparkleBurst startFrame={XP_ANIMATION_END} x={90} y={20} count={4} color="#10b981" />
            </div>
          </PhoneWithRole>
        </AbsoluteFill>
      </CameraZoom>

      <BeatPulse startFrame={XP_ANIMATION_END - 5} color="#10b981" intensity={0.4} />
    </AbsoluteFill>
  );
};
