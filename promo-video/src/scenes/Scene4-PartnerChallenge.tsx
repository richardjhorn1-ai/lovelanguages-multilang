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

// Camera path - follows quiz creation and challenge (focus on TOP where content appears)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 25, zoom: 2.2, focusX: 50, focusY: 42 },        // Zoom into tutor phone - quiz header
  { frame: 80, zoom: 2.2, focusX: 50, focusY: 48 },        // Pan slightly as questions appear
  { frame: 130, zoom: 2.2, focusX: 50, focusY: 52 },       // Focus on send button (not too far down)
  { frame: 160, zoom: 1.8, focusX: 50, focusY: 50 },       // Pull back for transition
  { frame: 200, zoom: 2.2, focusX: 50, focusY: 42 },       // Zoom into student phone - challenge header
  { frame: 240, zoom: 2.2, focusX: 50, focusY: 48 },       // Focus on question card
  { frame: 280, zoom: 2.5, focusX: 50, focusY: 48 },       // Zoom into celebration
  { frame: 320, zoom: 2.2, focusX: 50, focusY: 48 },       // Hold on celebration
  { frame: 360, zoom: 1, focusX: 50, focusY: 50 },         // Zoom out
];

const QUIZ_WORDS = [
  { target: 'Te extraño', native: 'I miss you' },
  { target: 'Mi amor', native: 'My love' },
  { target: 'Bésame', native: 'Kiss me' },
];

// Scene phases (extended for 12s = 360 frames)
const TUTOR_PHASE_END = 180;
const TRANSITION_START = 170;
const STUDENT_PHASE_START = 190;

export const Scene4PartnerChallenge: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase transitions
  const showTutor = frame < TUTOR_PHASE_END;
  const showStudent = frame >= STUDENT_PHASE_START;

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

  // Celebration starts at studentFrame 90 (giving ~80 frames / 2.7s for celebration)
  const celebrationScale = spring({
    frame: studentFrame - 90,
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
          <Confetti startFrame={STUDENT_PHASE_START + 90} count={80} duration={120} />

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
        startFrame={STUDENT_PHASE_START + 20}
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
          <div style={{ padding: 16, height: '100%' }}>
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
                    fontSize: 18,
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
                    fontSize: 12,
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
                          fontSize: 13,
                          color: COLORS.textPrimary,
                          margin: 0,
                        }}
                      >
                        {word.native}
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 11,
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
                    fontSize: 11,
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
                    fontSize: 15,
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
                          fontSize: 12,
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
                          fontSize: 12,
                          color: COLORS.textMuted,
                          marginBottom: 8,
                        }}
                      >
                        Translate to Spanish
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 26,
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
                          fontSize: 18,
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
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 16,
                  }}
                >
                  {/* Sparkle bursts around celebration */}
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 90} x={15} y={25} count={8} color="#FFD700" />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 95} x={85} y={30} count={8} color={COLORS.accentPink} />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 100} x={50} y={75} count={6} color="#FFD700" />
                  <SparkleBurst startFrame={STUDENT_PHASE_START + 105} x={25} y={60} count={5} color={COLORS.accentPink} />

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
                    }}
                  >
                    <span style={{ fontSize: 56 }}>🎉</span>
                    <h2
                      style={{
                        fontFamily: FONTS.header,
                        fontSize: 28,
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
                        fontSize: 16,
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
                          fontSize: 22,
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
      <BeatPulse startFrame={STUDENT_PHASE_START + 90} color={COLORS.accentPink} intensity={0.6} />
    </AbsoluteFill>
  );
};
