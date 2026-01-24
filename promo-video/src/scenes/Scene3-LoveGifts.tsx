import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from 'remotion';
import { COLORS } from '../constants/colors';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { FlyingHeart } from '../components/FlyingHeart';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { PhoneWithRole, PhoneRoleTransition } from '../components/PhoneWithRole';
import { TapRipple, TapSequence } from '../components/TapRipple';
import { ScreenTransition } from '../components/ScreenTransition';
import { GiftComposerScreen, GiftSentConfirmation } from '../components/screens/GiftComposerScreen';
import { GiftNotification, GiftWordCard } from '../components/screens/GiftReceivedScreen';

// Camera path - no vertical panning (12s = 360 frames)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 360, zoom: 1, focusX: 50, focusY: 50 },
];

// Words to gift (Polish - matches voiceover)
const GIFT_WORDS = [
  { target: 'Tęsknię za tobą', native: 'I miss you' },
  { target: 'Jesteś moim skarbem', native: "You're my treasure" },
  { target: 'Kocham cię', native: 'I love you' },
];

// Scene phases (12s = 360 frames at 30fps)
const TUTOR_PHASE_START = 0;
const TUTOR_WORDS_APPEAR = 30;
const TUTOR_TAP_WORD_1 = 50;
const TUTOR_TAP_WORD_2 = 75;
const TUTOR_TAP_WORD_3 = 100;
const TUTOR_TAP_SEND = 130;
const SEND_CONFIRMATION_START = 145;
const TRANSITION_START = 190; // Extended from 170 for longer confirmation display (45 frames)
const STUDENT_PHASE_START = 210; // Adjusted for longer transition
const STUDENT_TAP_OPEN = 260;
const STUDENT_GIFT_CARD = 295;
const STUDENT_TAP_CONTINUE = 335;

export const Scene3LoveGifts: React.FC = () => {
  const frame = useCurrentFrame();

  // Tutor phase (0-180): Creating the gift
  const showTutor = frame < TRANSITION_START + 20;
  const showStudent = frame >= STUDENT_PHASE_START - 10;
  const showSendConfirmation = frame >= SEND_CONFIRMATION_START && frame < TRANSITION_START;

  // Transition animation
  const transitionProgress = interpolate(
    frame,
    [TRANSITION_START, STUDENT_PHASE_START],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Words appear progressively
  const wordsVisible = Math.floor(
    interpolate(frame, [TUTOR_WORDS_APPEAR, 120], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Student phases
  const studentFrame = frame - STUDENT_PHASE_START;
  const showGiftNotification = studentFrame >= 0 && studentFrame < 90;
  const showGiftCard = studentFrame >= 90;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* Camera follows the gift flow */}
      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingTop: 340,
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={14} />

          {/* Flying heart during transition */}
          <FlyingHeart startFrame={TRANSITION_START - 10} duration={45} />

          {/* Captions explaining the feature */}
          <Caption
            text="Send Love Gifts"
            subtext="Choose special words to teach your partner"
            startFrame={10}
            position="top"
          />
          <Caption
            text="They learn with love"
            subtext="Special badge shows it's a gift from you"
            startFrame={STUDENT_PHASE_START + 20}
            position="top"
          />

          {/* TUTOR'S PHONE - Creating the gift package */}
          {showTutor && (
            <div
              style={{
                position: 'absolute',
                transform: `translateX(${-transitionProgress * 600}px)`,
                opacity: 1 - transitionProgress,
              }}
            >
              <PhoneWithRole
                role="tutor"
                partnerName="Teacher"
                targetLanguage="Polish"
                scale={2.25}
                startFrame={0}
                glowIntensity={0.5}
              >
                <div style={{ position: 'relative', height: '100%' }}>
                  {/* Gift Composer Screen */}
                  <GiftComposerScreen
                    words={GIFT_WORDS}
                    wordsVisible={wordsVisible}
                    showSendButton={frame >= TUTOR_TAP_SEND - 10}
                    startFrame={TUTOR_WORDS_APPEAR}
                  />

                  {/* Tap ripples for word selection */}
                  <TapRipple x={50} y={38} startFrame={TUTOR_TAP_WORD_1} color={COLORS.accentPink} />
                  <TapRipple x={50} y={50} startFrame={TUTOR_TAP_WORD_2} color={COLORS.accentPink} />
                  <TapRipple x={50} y={62} startFrame={TUTOR_TAP_WORD_3} color={COLORS.accentPink} />

                  {/* Tap ripple on send button */}
                  <TapRipple x={50} y={88} startFrame={TUTOR_TAP_SEND} color={COLORS.teal} size={100} />

                  {/* Send Confirmation Modal */}
                  {showSendConfirmation && (
                    <GiftSentConfirmation
                      wordCount={3}
                      startFrame={SEND_CONFIRMATION_START}
                    />
                  )}
                </div>
              </PhoneWithRole>
            </div>
          )}

          {/* STUDENT'S PHONE - Receiving the gift */}
          {showStudent && (
            <div
              style={{
                position: 'absolute',
                transform: `translateX(${(1 - transitionProgress) * 600}px)`,
                opacity: transitionProgress,
              }}
            >
              <PhoneWithRole
                role="student"
                partnerName="Student"
                targetLanguage="Polish"
                scale={2.25}
                startFrame={STUDENT_PHASE_START}
                glowIntensity={0.5}
              >
                <div style={{ position: 'relative', height: '100%' }}>
                  {/* Gift Notification */}
                  {showGiftNotification && (
                    <>
                      <ScreenTransition type="modal" startFrame={STUDENT_PHASE_START}>
                        <GiftNotification
                          senderName="Partner"
                          wordCount={3}
                          startFrame={STUDENT_PHASE_START}
                        />
                      </ScreenTransition>
                      {/* Tap on Open Gift button */}
                      <TapRipple x={50} y={75} startFrame={STUDENT_TAP_OPEN} color={COLORS.accentPink} size={100} />
                    </>
                  )}

                  {/* Gift Word Card */}
                  {showGiftCard && (
                    <>
                      <ScreenTransition type="slide-up" startFrame={STUDENT_GIFT_CARD}>
                        <GiftWordCard
                          word={{
                            target: 'Tęsknię za tobą',
                            native: 'I miss you',
                            pronunciation: 'tensh-NYEH za TOH-bom',
                          }}
                          senderName="Partner"
                          currentIndex={0}
                          totalCount={3}
                          startFrame={STUDENT_GIFT_CARD}
                        />
                      </ScreenTransition>

                      {/* Sparkle bursts when card reveals */}
                      <SparkleBurst startFrame={STUDENT_GIFT_CARD + 10} x={20} y={40} count={6} color="#FFD700" />
                      <SparkleBurst startFrame={STUDENT_GIFT_CARD + 15} x={80} y={35} count={6} color={COLORS.accentPink} />
                      <SparkleBurst startFrame={STUDENT_GIFT_CARD + 20} x={50} y={70} count={5} color="#FFD700" />

                      {/* Tap on Continue button */}
                      <TapRipple x={50} y={85} startFrame={STUDENT_TAP_CONTINUE} color={COLORS.accentPink} />
                    </>
                  )}
                </div>
              </PhoneWithRole>
            </div>
          )}
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on gift reveal */}
      <BeatPulse startFrame={STUDENT_GIFT_CARD + 10} color={COLORS.accentPink} intensity={0.4} />
    </AbsoluteFill>
  );
};
