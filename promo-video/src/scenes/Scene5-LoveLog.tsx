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
import { ScreenTransition } from '../components/ScreenTransition';
import { LoveLogScreen } from '../components/screens/LoveLogScreen';
import { WordDetailScreen } from '../components/screens/WordDetailScreen';

// Camera path - no vertical panning (8s = 240 frames)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 240, zoom: 1, focusX: 50, focusY: 50 },
];

// Scene phases (8s = 240 frames)
const TAP_NAV_LOG = 30;
const LIST_APPEARS = 40;
const TAP_WORD = 110;
const DETAIL_VIEW_START = 120;

export const Scene5LoveLog: React.FC = () => {
  const frame = useCurrentFrame();

  // Cards visible in list
  const cardsVisible = Math.floor(
    interpolate(frame, [LIST_APPEARS, 100], [0, 4], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Detail view
  const showDetailView = frame >= DETAIL_VIEW_START;

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

          {/* Captions */}
          <Caption
            text="Your Love Log"
            subtext="Every word you've learned together"
            startFrame={10}
            position="top"
          />
          <Caption
            text="Deep dive into any word"
            subtext="Definitions, conjugations & more"
            startFrame={DETAIL_VIEW_START + 5}
            position="top"
          />

          {/* Phone with Love Log */}
          <PhoneWithRole
            role="student"
            partnerName="Student"
            targetLanguage="Spanish"
            scale={2.25}
            startFrame={0}
            glowIntensity={0.5}
          >
            <div style={{ position: 'relative', height: '100%' }}>
              {/* Love Log Screen */}
              {!showDetailView && (
                <>
                  <LoveLogScreen
                    wordsVisible={cardsVisible}
                    startFrame={LIST_APPEARS}
                  />

                  {/* Tap on bottom nav */}
                  <TapRipple x={37} y={95} startFrame={TAP_NAV_LOG} color={COLORS.accentPink} />

                  {/* Tap on a word */}
                  <TapRipple x={50} y={40} startFrame={TAP_WORD} color={COLORS.accentPink} />
                </>
              )}

              {/* Word Detail View */}
              {showDetailView && (
                <>
                  <ScreenTransition type="slide-left" startFrame={DETAIL_VIEW_START}>
                    <WordDetailScreen
                      word={{
                        target: 'Te quiero',
                        native: 'I love you',
                        pronunciation: 'teh kee-EH-roh',
                        type: 'phrase',
                      }}
                      isGift={true}
                      senderName="Partner"
                      exampleSentence={{
                        target: 'Te quiero mucho, mi amor.',
                        native: 'I love you so much, my love.',
                      }}
                      startFrame={DETAIL_VIEW_START}
                    />
                  </ScreenTransition>

                  {/* Sparkles when detail view appears */}
                  <SparkleBurst startFrame={DETAIL_VIEW_START + 5} x={20} y={30} count={5} color="#FFD700" />
                  <SparkleBurst startFrame={DETAIL_VIEW_START + 10} x={80} y={25} count={5} color={COLORS.accentPink} />
                </>
              )}
            </div>
          </PhoneWithRole>
        </AbsoluteFill>
      </CameraZoom>

      <BeatPulse startFrame={DETAIL_VIEW_START} color={COLORS.accentPink} intensity={0.4} />
    </AbsoluteFill>
  );
};
