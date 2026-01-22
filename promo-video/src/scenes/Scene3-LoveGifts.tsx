import { AbsoluteFill, useCurrentFrame, spring, interpolate, Sequence } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { PhoneFrame } from '../components/PhoneFrame';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { FlyingHeart } from '../components/FlyingHeart';
import { SparkleBurst } from '../components/Sparkle';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';

// Camera path - smooth movements with good zoom and upper focus
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 40, zoom: 1, focusX: 50, focusY: 50 },          // Hold on caption
  { frame: 80, zoom: 1.9, focusX: 50, focusY: 38 },        // Zoom into tutor phone upper area
  { frame: 150, zoom: 1.9, focusX: 50, focusY: 38 },       // Hold while words appear
  { frame: 180, zoom: 1.5, focusX: 50, focusY: 45 },       // Pull back for flying heart
  { frame: 220, zoom: 1.9, focusX: 50, focusY: 38 },       // Zoom to student phone upper area
  { frame: 310, zoom: 2.0, focusX: 50, focusY: 38 },       // Zoom on gift card
  { frame: 350, zoom: 1, focusX: 50, focusY: 50 },         // Smooth zoom out
];

// Words to gift
const GIFT_WORDS = [
  { target: 'Te quiero', native: 'I love you' },
  { target: 'Mi corazón', native: 'My heart' },
  { target: 'Siempre', native: 'Always' },
];

// Scene phases (extended for 12s = 360 frames)
const SEND_CONFIRMATION_START = 145;
const TUTOR_PHASE_END = 180;
const TRANSITION_START = 170;
const STUDENT_PHASE_START = 190;

export const Scene3LoveGifts: React.FC = () => {
  const frame = useCurrentFrame();

  // Tutor phase (0-4s): Creating the gift
  const showTutor = frame < TUTOR_PHASE_END;
  const showStudent = frame >= STUDENT_PHASE_START;
  const showSendConfirmation = frame >= SEND_CONFIRMATION_START && frame < TRANSITION_START;

  // Transition animation
  const transitionProgress = interpolate(
    frame,
    [TRANSITION_START, STUDENT_PHASE_START],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tutor phone animations
  const tutorPhoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Words appear progressively (slower)
  const wordsVisible = Math.floor(
    interpolate(frame, [30, 120], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Student phone animations
  const studentPhoneScale = spring({
    frame: frame - STUDENT_PHASE_START,
    fps: FPS,
    config: { damping: 200 },
  });

  // Gift intro animation (extended timing)
  const giftIntroFrame = frame - STUDENT_PHASE_START;
  const showGiftIntro = giftIntroFrame >= 0 && giftIntroFrame < 90;
  const showGiftCard = giftIntroFrame >= 90;

  const giftBounce = interpolate(
    giftIntroFrame % 30,
    [0, 15, 30],
    [0, -15, 0]
  );

  const cardRevealScale = spring({
    frame: giftIntroFrame - 90,
    fps: FPS,
    config: { damping: 200 },
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

      {/* Camera follows the gift flow - tutor creating, flying heart, student receiving */}
      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
      <div
        style={{
          position: 'absolute',
          transform: `scale(${Math.max(0, tutorPhoneScale)}) translateX(${-transitionProgress * 600}px)`,
          opacity: 1 - transitionProgress,
        }}
      >
        <PhoneFrame scale={1.4}>
          <div style={{ padding: 16, height: '100%', position: 'relative' }}>
            {/* Modal-style card (matching actual app UI) */}
            <div
              style={{
                backgroundColor: COLORS.bgCard,
                borderRadius: 32,
                padding: 20,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              }}
            >
              {/* Header with icon */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    backgroundColor: COLORS.tealLight,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🎁
                </div>
                <span
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  Word Gift
                </span>
              </div>

              {/* Words list */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    marginBottom: 10,
                  }}
                >
                  Words to gift:
                </p>

                {GIFT_WORDS.slice(0, wordsVisible).map((word, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      backgroundColor: COLORS.accentLight,
                      borderRadius: 12,
                      marginBottom: 8,
                      border: `1px solid ${COLORS.accentBorder}`,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>💝</span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 16,
                          fontWeight: 600,
                          color: COLORS.accentPink,
                          margin: 0,
                        }}
                      >
                        {word.target}
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 13,
                          color: COLORS.textSecondary,
                          margin: 0,
                        }}
                      >
                        {word.native}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* XP bonus info */}
              <div
                style={{
                  backgroundColor: COLORS.tealLight,
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>✨</span>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.teal,
                    margin: 0,
                  }}
                >
                  +20 XP bonus when partner learns these!
                </p>
              </div>

              {/* Send button */}
              <Sequence from={130}>
                <button
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    backgroundColor: COLORS.accentPink,
                    color: 'white',
                    border: 'none',
                    borderRadius: 16,
                    fontFamily: FONTS.body,
                    fontSize: 17,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  💝 Send Word Gift
                </button>
              </Sequence>
            </div>
          </div>

          {/* Send Confirmation Modal */}
          {showSendConfirmation && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  backgroundColor: COLORS.bgCard,
                  borderRadius: 32,
                  padding: 32,
                  textAlign: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    background: `linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 32,
                    margin: '0 auto 16px',
                  }}
                >
                  ✓
                </div>
                <h2
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 26,
                    fontWeight: 700,
                    color: '#10b981',
                    margin: 0,
                  }}
                >
                  Gift Sent!
                </h2>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 16,
                    color: COLORS.textSecondary,
                    marginTop: 8,
                  }}
                >
                  3 words on their way to your partner
                </p>
              </div>
            </div>
          )}
        </PhoneFrame>
      </div>

      {/* STUDENT'S PHONE - Receiving the gift */}
      {showStudent && (
        <div
          style={{
            position: 'absolute',
            transform: `scale(${Math.max(0, studentPhoneScale)}) translateX(${(1 - transitionProgress) * 600}px)`,
            opacity: transitionProgress,
          }}
        >
          <PhoneFrame scale={1.4}>
            <div style={{ height: '100%', position: 'relative' }}>
              {/* Gift Intro Screen - Modal overlay style */}
              {showGiftIntro && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  {/* Modal card */}
                  <div
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 32,
                      padding: 24,
                      textAlign: 'center',
                      width: '100%',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        background: `linear-gradient(135deg, ${COLORS.accentLight} 0%, #fef3c7 100%)`,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 36,
                        transform: `translateY(${giftBounce}px)`,
                        boxShadow: '0 8px 24px rgba(255, 71, 97, 0.2)',
                        margin: '0 auto',
                      }}
                    >
                      🎁
                    </div>
                    <h2
                      style={{
                        fontFamily: FONTS.header,
                        fontSize: 26,
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        marginTop: 20,
                      }}
                    >
                      Alex sent you a gift!
                    </h2>
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 16,
                        color: COLORS.textSecondary,
                        marginTop: 6,
                      }}
                    >
                      3 new words to learn
                    </p>

                    {/* XP bonus badge */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: '8px 16px',
                        backgroundColor: COLORS.accentLight,
                        borderRadius: 20,
                        border: `1px solid ${COLORS.accentBorder}`,
                        display: 'inline-block',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          color: COLORS.accentPink,
                          fontWeight: 500,
                        }}
                      >
                        ✨ +30 XP bonus
                      </span>
                    </div>

                    <button
                      style={{
                        marginTop: 24,
                        padding: '14px 32px',
                        backgroundColor: COLORS.accentPink,
                        color: 'white',
                        border: 'none',
                        borderRadius: 14,
                        fontFamily: FONTS.body,
                        fontSize: 17,
                        fontWeight: 600,
                        display: 'block',
                        width: '100%',
                      }}
                    >
                      Open Gift
                    </button>
                  </div>
                </div>
              )}

              {/* Gift Card Learning */}
              {showGiftCard && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    transform: `scale(${Math.max(0, cardRevealScale)})`,
                    position: 'relative',
                  }}
                >
                  {/* Sparkle bursts when card reveals */}
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 90} x={20} y={40} count={6} color="#FFD700" />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 95} x={80} y={35} count={6} color={COLORS.accentPink} />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 100} x={50} y={70} count={5} color="#FFD700" />
                  {/* Progress indicator */}
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      marginBottom: 20,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: i === 0 ? COLORS.accentPink : COLORS.accentBorder,
                        }}
                      />
                    ))}
                  </div>

                  {/* Word card */}
                  <div
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 28,
                      padding: 28,
                      boxShadow: `0 12px 40px ${COLORS.accentPink}20`,
                      border: `2px solid ${COLORS.accentBorder}`,
                      textAlign: 'center',
                      width: '100%',
                    }}
                  >
                    <span style={{ fontSize: 40 }}>💕</span>
                    <p
                      style={{
                        fontFamily: FONTS.header,
                        fontSize: 36,
                        fontWeight: 700,
                        color: COLORS.accentPink,
                        marginTop: 12,
                      }}
                    >
                      Te quiero
                    </p>
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 16,
                        color: COLORS.textMuted,
                        marginTop: 6,
                      }}
                    >
                      (teh KEE-eh-roh)
                    </p>
                    <div
                      style={{
                        height: 1,
                        backgroundColor: COLORS.accentBorder,
                        margin: '16px 0',
                      }}
                    />
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 20,
                        color: COLORS.textPrimary,
                        fontWeight: 500,
                      }}
                    >
                      I love you
                    </p>

                    {/* From badge */}
                    <div
                      style={{
                        marginTop: 16,
                        padding: '6px 14px',
                        backgroundColor: COLORS.accentLight,
                        borderRadius: 16,
                        display: 'inline-block',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 13,
                          color: COLORS.accentPink,
                          fontWeight: 500,
                        }}
                      >
                        💝 From Alex
                      </span>
                    </div>
                  </div>

                  {/* Continue button */}
                  <button
                    style={{
                      marginTop: 20,
                      padding: '12px 28px',
                      backgroundColor: COLORS.accentPink,
                      color: 'white',
                      border: 'none',
                      borderRadius: 12,
                      fontFamily: FONTS.body,
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    Got it! →
                  </button>
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
      )}
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on gift reveal */}
      <BeatPulse startFrame={STUDENT_PHASE_START + 90} color={COLORS.accentPink} intensity={0.4} />
    </AbsoluteFill>
  );
};
