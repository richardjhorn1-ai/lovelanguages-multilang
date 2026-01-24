import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FloatingHearts } from '../components/FloatingHearts';
import { Caption } from '../components/Caption';
import { Confetti } from '../components/Confetti';
import { SparkleBurst } from '../components/Sparkle';
import { FlyingHeart } from '../components/FlyingHeart';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { PhoneWithRole } from '../components/PhoneWithRole';
import { TapRipple } from '../components/TapRipple';
import { ScreenTransition } from '../components/ScreenTransition';
import { ChallengeComposerScreen, ChallengeSentConfirmation } from '../components/screens/ChallengeComposerScreen';
import { ChallengePlayScreen, ChallengeCelebration } from '../components/screens/ChallengePlayScreen';

// Camera path - no vertical panning (12s = 360 frames)
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 360, zoom: 1, focusX: 50, focusY: 50 },
];

const QUIZ_WORDS = [
  { native: 'I miss you', target: 'Te extraño' },
  { native: 'My love', target: 'Mi amor' },
  { native: 'Kiss me', target: 'Bésame' },
];

// Scene phases (12s = 360 frames)
const TUTOR_QUESTIONS_APPEAR = 30;
const TUTOR_TAP_Q1 = 50;
const TUTOR_TAP_Q2 = 75;
const TUTOR_TAP_Q3 = 100;
const TUTOR_TAP_SEND = 130;
const SEND_CONFIRMATION_START = 145;
const TRANSITION_START = 190; // Extended from 170 for longer confirmation display (45 frames)
const STUDENT_PHASE_START = 210; // Adjusted for longer transition
const STUDENT_ANSWER_1 = 240;
const STUDENT_ANSWER_2 = 265;
const STUDENT_ANSWER_3 = 290;
const CELEBRATION_START = 315;

export const Scene4PartnerChallenge: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase transitions
  const showTutor = frame < TRANSITION_START + 20;
  const showStudent = frame >= STUDENT_PHASE_START - 10;
  const showSendConfirmation = frame >= SEND_CONFIRMATION_START && frame < TRANSITION_START;

  const transitionProgress = interpolate(
    frame,
    [TRANSITION_START, STUDENT_PHASE_START],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Tutor: Questions appear progressively
  const questionsVisible = Math.floor(
    interpolate(frame, [TUTOR_QUESTIONS_APPEAR, 120], [0, 3], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  // Student quiz progress
  const studentFrame = frame - STUDENT_PHASE_START;
  const rawQuestion = interpolate(studentFrame, [30, 100], [0, 3], {
    extrapolateRight: 'clamp',
    extrapolateLeft: 'clamp',
  });
  const currentQuestion = Number.isFinite(rawQuestion) ? Math.floor(rawQuestion) : 0;
  const safeIndex = Math.max(0, Math.min(currentQuestion, QUIZ_WORDS.length - 1));
  const currentWord = QUIZ_WORDS[safeIndex];
  const showCelebration = frame >= CELEBRATION_START;

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
          <FloatingHearts count={12} />
          <FlyingHeart startFrame={TRANSITION_START - 10} duration={45} />
          <Confetti startFrame={CELEBRATION_START} count={80} duration={120} />

          {/* Captions */}
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
                targetLanguage="Spanish"
                scale={2.25}
                startFrame={0}
                glowIntensity={0.5}
              >
                <div style={{ position: 'relative', height: '100%' }}>
                  <ChallengeComposerScreen
                    questions={QUIZ_WORDS.map(w => ({ native: w.native }))}
                    questionsVisible={questionsVisible}
                    showSendButton={frame >= TUTOR_TAP_SEND - 10}
                    targetLanguage="Spanish"
                    startFrame={TUTOR_QUESTIONS_APPEAR}
                  />

                  {/* Tap ripples for question creation */}
                  <TapRipple x={50} y={38} startFrame={TUTOR_TAP_Q1} color={COLORS.accentPink} />
                  <TapRipple x={50} y={50} startFrame={TUTOR_TAP_Q2} color={COLORS.accentPink} />
                  <TapRipple x={50} y={62} startFrame={TUTOR_TAP_Q3} color={COLORS.accentPink} />
                  <TapRipple x={50} y={88} startFrame={TUTOR_TAP_SEND} color={COLORS.teal} size={100} />

                  {showSendConfirmation && (
                    <ChallengeSentConfirmation
                      questionCount={3}
                      startFrame={SEND_CONFIRMATION_START}
                    />
                  )}
                </div>
              </PhoneWithRole>
            </div>
          )}

          {/* STUDENT'S PHONE - Taking the quiz */}
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
                targetLanguage="Spanish"
                scale={2.25}
                startFrame={STUDENT_PHASE_START}
                glowIntensity={0.5}
              >
                <div style={{ position: 'relative', height: '100%' }}>
                  {!showCelebration ? (
                    <>
                      <ChallengePlayScreen
                        senderName="Partner"
                        currentQuestion={{
                          native: currentWord.native,
                          answer: currentWord.target,
                        }}
                        questionIndex={safeIndex}
                        totalQuestions={3}
                        showAnswer={true}
                        startFrame={STUDENT_PHASE_START}
                      />

                      {/* Tap ripples for answering */}
                      <TapRipple x={50} y={70} startFrame={STUDENT_ANSWER_1} color="#10b981" />
                      <TapRipple x={50} y={70} startFrame={STUDENT_ANSWER_2} color="#10b981" />
                      <TapRipple x={50} y={70} startFrame={STUDENT_ANSWER_3} color="#10b981" />
                    </>
                  ) : (
                    <>
                      <ChallengeCelebration
                        correctCount={3}
                        totalCount={3}
                        xpEarned={50}
                        startFrame={CELEBRATION_START}
                      />

                      {/* Sparkle bursts around celebration */}
                      <SparkleBurst startFrame={CELEBRATION_START + 5} x={15} y={25} count={8} color="#FFD700" />
                      <SparkleBurst startFrame={CELEBRATION_START + 10} x={85} y={30} count={8} color={COLORS.accentPink} />
                      <SparkleBurst startFrame={CELEBRATION_START + 15} x={50} y={75} count={6} color="#FFD700" />
                      <SparkleBurst startFrame={CELEBRATION_START + 20} x={25} y={60} count={5} color={COLORS.accentPink} />
                    </>
                  )}
                </div>
              </PhoneWithRole>
            </div>
          )}
        </AbsoluteFill>
      </CameraZoom>

      <BeatPulse startFrame={CELEBRATION_START} color={COLORS.accentPink} intensity={0.6} />
    </AbsoluteFill>
  );
};
