import { AbsoluteFill, useCurrentFrame, spring, interpolate, Sequence } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { PhoneFrame } from '../components/PhoneFrame';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { Confetti } from '../components/Confetti';
import { SparkleBurst } from '../components/Sparkle';
import { FlyingHeart } from '../components/FlyingHeart';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';

// Camera path - smooth movements with gentle panning
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 40, zoom: 1, focusX: 50, focusY: 50 },          // Hold on caption
  { frame: 80, zoom: 1.9, focusX: 50, focusY: 38 },        // Zoom into tutor phone upper area
  { frame: 120, zoom: 1.9, focusX: 50, focusY: 42 },       // Gentle pan down as questions appear
  { frame: 150, zoom: 1.9, focusX: 50, focusY: 48 },       // Continue gentle pan to send button
  { frame: 180, zoom: 1.5, focusX: 50, focusY: 50 },       // Pull back for transition
  { frame: 220, zoom: 1.9, focusX: 50, focusY: 38 },       // Zoom to student phone upper area
  { frame: 260, zoom: 1.9, focusX: 50, focusY: 44 },       // Gentle pan to question card
  { frame: 300, zoom: 2.0, focusX: 50, focusY: 50 },       // Pan to celebration (center)
  { frame: 350, zoom: 1, focusX: 50, focusY: 50 },         // Smooth zoom out
];

const QUIZ_WORDS = [
  { target: 'Te extraño', native: 'I miss you' },
  { target: 'Mi amor', native: 'My love' },
  { target: 'Bésame', native: 'Kiss me' },
];

// Scene phases (extended for 12s = 360 frames)
const SEND_CONFIRMATION_START = 145;
const TUTOR_PHASE_END = 180;
const TRANSITION_START = 170;
const STUDENT_PHASE_START = 190;

export const Scene4PartnerChallenge: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase transitions
  const showTutor = frame < TUTOR_PHASE_END;
  const showStudent = frame >= STUDENT_PHASE_START;
  const showSendConfirmation = frame >= SEND_CONFIRMATION_START && frame < TRANSITION_START;

  const transitionProgress = interpolate(
    frame,
    [TRANSITION_START, STUDENT_PHASE_START],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tutor animations
  const tutorPhoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  const quizItemsVisible = Math.floor(
    interpolate(frame, [30, 120], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Student animations
  const studentPhoneScale = spring({
    frame: frame - STUDENT_PHASE_START,
    fps: FPS,
    config: { damping: 200 },
  });

  // Quiz progress on student side - faster quiz, longer celebration
  const studentFrame = frame - STUDENT_PHASE_START;
  const rawQuestion = interpolate(studentFrame, [20, 80], [0, 3], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const currentQuestion = Number.isFinite(rawQuestion) ? Math.floor(rawQuestion) : 0;
  const safeIndex = Math.max(0, Math.min(currentQuestion, QUIZ_WORDS.length - 1));
  const currentWord = QUIZ_WORDS[safeIndex] || QUIZ_WORDS[0];
  const showCelebration = currentQuestion >= 3;

  // Celebration starts when quiz completes (studentFrame 80)
  const celebrationScale = spring({
    frame: studentFrame - 80,
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

      {/* Camera follows the challenge flow - tutor creating, student solving, celebration */}
      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={12} />

          {/* Flying heart during transition */}
          <FlyingHeart startFrame={TRANSITION_START - 10} duration={45} />

          {/* Confetti when celebration appears */}
          <Confetti startFrame={STUDENT_PHASE_START + 80} count={80} duration={120} />

      {/* Captions explaining the feature */}
      <Caption
        text="Create Quiz Challenges"
        subtext="Test your partner on words they're learning"
        startFrame={10}
        position="top"
      />
      <Caption
        text="Challenge accepted!"
        subtext="Earn XP together when they get it right"
        startFrame={STUDENT_PHASE_START + 15}
        position="top"
      />

      {/* TUTOR'S PHONE - Creating the quiz */}
      <div
        style={{
          position: 'absolute',
          transform: `scale(${Math.max(0, tutorPhoneScale)}) translateX(${-transitionProgress * 600}px)`,
          opacity: 1 - transitionProgress,
        }}
      >
        <PhoneFrame scale={1.4}>
          <div style={{ padding: 16, height: '100%', position: 'relative' }}>
            {/* Modal-style card */}
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
                  🎯
                </div>
                <span
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 22,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                  }}
                >
                  Quiz Challenge
                </span>
              </div>

              {/* Quiz items */}
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textSecondary,
                    marginBottom: 10,
                  }}
                >
                  Questions for partner:
                </p>

                {QUIZ_WORDS.slice(0, quizItemsVisible).map((word, i) => (
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
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: COLORS.accentPink,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: FONTS.body,
                      }}
                    >
                      {i + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 15,
                          color: COLORS.textPrimary,
                          margin: 0,
                        }}
                      >
                        {word.native}
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 13,
                          color: COLORS.textMuted,
                          margin: 0,
                        }}
                      >
                        → Translate to Spanish
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* XP bonus info */}
              <div
                style={{
                  backgroundColor: COLORS.accentLight,
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>🏆</span>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 13,
                    color: COLORS.accentPink,
                    margin: 0,
                  }}
                >
                  Earn XP when your partner completes it!
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
                  🎯 Send Challenge
                </button>
              </Sequence>
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
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: COLORS.teal,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                    }}
                  >
                    <span style={{ fontSize: 32, color: 'white' }}>🎯</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 26,
                      fontWeight: 700,
                      color: COLORS.teal,
                      marginBottom: 8,
                    }}
                  >
                    Challenge Sent!
                  </h2>
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 16,
                      color: COLORS.textSecondary,
                    }}
                  >
                    3 questions sent to your partner
                  </p>
                </div>
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>

      {/* STUDENT'S PHONE - Taking the quiz */}
      {showStudent && (
        <div
          style={{
            position: 'absolute',
            transform: `scale(${Math.max(0, studentPhoneScale)}) translateX(${(1 - transitionProgress) * 600}px)`,
            opacity: transitionProgress,
          }}
        >
          <PhoneFrame scale={1.4}>
            <div style={{ padding: 16, height: '100%', position: 'relative' }}>
              {!showCelebration ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {/* Header badge */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: COLORS.accentLight,
                        borderRadius: 20,
                        padding: '8px 16px',
                        border: `1px solid ${COLORS.accentBorder}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          color: COLORS.accentPink,
                          fontWeight: 600,
                        }}
                      >
                        🎯 Challenge from Alex
                      </span>
                    </div>
                  </div>

                  {/* Progress dots */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 8,
                      marginBottom: 24,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: i <= currentQuestion ? 32 : 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: i <= currentQuestion ? COLORS.accentPink : COLORS.accentBorder,
                          transition: 'none',
                        }}
                      />
                    ))}
                  </div>

                  {/* Question card */}
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: COLORS.bgCard,
                        borderRadius: 24,
                        padding: 28,
                        width: '100%',
                        textAlign: 'center',
                        border: `2px solid ${COLORS.accentBorder}`,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          color: COLORS.textMuted,
                          marginBottom: 8,
                        }}
                      >
                        Translate to Spanish
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 30,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                        }}
                      >
                        {currentWord.native}
                      </p>
                    </div>

                    {/* Correct answer reveal */}
                    <div
                      style={{
                        marginTop: 20,
                        padding: '14px 24px',
                        backgroundColor: '#10b98120',
                        borderRadius: 16,
                        border: '2px solid #10b981',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 20,
                          color: '#10b981',
                          fontWeight: 600,
                        }}
                      >
                        ✓ {currentWord.target}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Celebration - Modal overlay style */
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: `rgba(0, 0, 0, ${Math.min(0.5, Math.max(0, celebrationScale) * 0.5)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  {/* Sparkle bursts around celebration */}
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 80} x={15} y={25} count={8} color="#FFD700" />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 85} x={85} y={30} count={8} color={COLORS.accentPink} />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 90} x={50} y={75} count={6} color="#FFD700" />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 95} x={25} y={60} count={5} color={COLORS.accentPink} />

                  {/* Modal card */}
                  <div
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 32,
                      padding: 28,
                      textAlign: 'center',
                      width: '100%',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      transform: `scale(${Math.max(0, celebrationScale)})`,
                      opacity: Math.max(0, celebrationScale),
                    }}
                  >
                    <span style={{ fontSize: 56 }}>🎉</span>
                    <h2
                      style={{
                        fontFamily: FONTS.header,
                        fontSize: 32,
                        fontWeight: 700,
                        color: COLORS.textPrimary,
                        marginTop: 16,
                      }}
                    >
                      Perfect Score!
                    </h2>
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 18,
                        color: COLORS.textSecondary,
                        marginTop: 6,
                      }}
                    >
                      3/3 correct
                    </p>

                    {/* XP earned */}
                    <div
                      style={{
                        marginTop: 24,
                        padding: '14px 28px',
                        backgroundColor: COLORS.accentLight,
                        borderRadius: 20,
                        border: `2px solid ${COLORS.accentPink}`,
                        display: 'inline-block',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 24,
                          fontWeight: 700,
                          color: COLORS.accentPink,
                        }}
                      >
                        +50 XP ✨
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PhoneFrame>
        </div>
      )}
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on celebration */}
      <BeatPulse startFrame={STUDENT_PHASE_START + 80} color={COLORS.accentPink} intensity={0.6} />
    </AbsoluteFill>
  );
};
