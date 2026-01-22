import { AbsoluteFill, useCurrentFrame, spring, interpolate } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { PhoneFrame } from '../components/PhoneFrame';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';

// Camera path - follows three game modes (reduced panning, stay near center)
const CAMERA_PATH: CameraKeyframe[] = [
  // Game 1: Flashcards
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 25, zoom: 2.2, focusX: 50, focusY: 48 },        // Zoom into flashcard
  { frame: 75, zoom: 2.5, focusX: 50, focusY: 48 },        // Zoom in more for flip reveal
  { frame: 110, zoom: 2.2, focusX: 50, focusY: 48 },       // Hold on answer
  { frame: 130, zoom: 1.5, focusX: 50, focusY: 50 },       // Pull back for transition
  // Game 2: Multiple Choice
  { frame: 150, zoom: 2.2, focusX: 50, focusY: 45 },       // Zoom into question
  { frame: 200, zoom: 2.2, focusX: 50, focusY: 50 },       // Pan to options (reduced)
  { frame: 230, zoom: 2.4, focusX: 50, focusY: 48 },       // Focus on correct answer
  { frame: 270, zoom: 1.5, focusX: 50, focusY: 50 },       // Pull back for transition
  // Game 3: Type It
  { frame: 295, zoom: 2.2, focusX: 50, focusY: 45 },       // Zoom into question
  { frame: 340, zoom: 2.2, focusX: 50, focusY: 50 },       // Focus on input field (reduced)
  { frame: 390, zoom: 2.4, focusX: 50, focusY: 48 },       // Focus on correct feedback
  { frame: 420, zoom: 1, focusX: 50, focusY: 50 },         // Zoom out
];

// Game phases - 3 games cycling through (14s = 420 frames)
const GAME_1_END = 140; // Flashcards
const GAME_2_END = 280; // Multiple Choice
const GAME_3_END = 420; // Type It

export const Scene6Games: React.FC = () => {
  const frame = useCurrentFrame();

  // Current game index
  const currentGame = frame < GAME_1_END ? 0 : frame < GAME_2_END ? 1 : 2;

  // Phone animations
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Card flip animation for flashcard (slower)
  const flipProgress = interpolate(
    frame,
    [60, 90],
    [0, 180],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const isFlipped = flipProgress > 90;

  // Multiple choice selection (slower)
  const mcSelected = frame > GAME_1_END + 60 ? 1 : -1;
  const mcShowCorrect = frame > GAME_1_END + 80;

  // Type it animation (slower)
  const typeItFrame = frame - GAME_2_END;
  const typeItText = 'Te quiero';
  const typedChars = Math.floor(interpolate(typeItFrame, [40, 90], [0, typeItText.length], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  const showTypeItCorrect = typeItFrame > 100;

  // Game labels
  const gameLabels = ['Flashcards', 'Multiple Choice', 'Type It'];
  const gameEmojis = ['🎴', '✅', '⌨️'];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="wave" />

      {/* Camera follows the three game modes - flashcard, multiple choice, type it */}
      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={10} />

      {/* Captions for each game mode */}
      <Caption
        text="Practice with Flashcards"
        subtext="Quick practice, any time"
        startFrame={10}
        position="top"
      />
      <Caption
        text="Multiple Choice Quizzes"
        subtext="Put your learning to the test"
        startFrame={GAME_1_END + 10}
        position="top"
      />
      <Caption
        text="Type It Out"
        subtext="Practice spelling and recall"
        startFrame={GAME_2_END + 10}
        position="top"
      />

      {/* Phone with current game */}
      <div
        style={{
          transform: `scale(${Math.max(0, phoneScale)})`,
        }}
      >
        <PhoneFrame scale={1.4}>
          <div style={{ padding: 16, height: '100%' }}>
            {/* GAME 1: Flashcards */}
            {currentGame === 0 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: i === 0 ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i === 0 ? COLORS.accentPink : COLORS.accentBorder,
                      }}
                    />
                  ))}
                </div>

                {/* Flashcard */}
                <div
                  style={{
                    width: '100%',
                    height: 200,
                    perspective: 1000,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      position: 'relative',
                      transformStyle: 'preserve-3d',
                      transform: `rotateY(${flipProgress}deg)`,
                    }}
                  >
                    {/* Front - Question */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: COLORS.bgCard,
                        borderRadius: 24,
                        border: `2px solid ${COLORS.accentBorder}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backfaceVisibility: 'hidden',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
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
                        What does this mean?
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 28,
                          fontWeight: 700,
                          color: COLORS.accentPink,
                        }}
                      >
                        Te quiero
                      </p>
                    </div>

                    {/* Back - Answer */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#dcfce7',
                        borderRadius: 24,
                        border: `2px solid #10b981`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                      }}
                    >
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 24,
                          fontWeight: 700,
                          color: '#10b981',
                        }}
                      >
                        I love you ❤️
                      </p>
                    </div>
                  </div>
                </div>

                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 11,
                    color: COLORS.textMuted,
                    marginTop: 16,
                  }}
                >
                  {isFlipped ? 'Swipe to continue' : 'Tap to reveal'}
                </p>
              </div>
            )}

            {/* GAME 2: Multiple Choice */}
            {currentGame === 1 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Progress */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: i <= 1 ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i <= 1 ? COLORS.accentPink : COLORS.accentBorder,
                      }}
                    />
                  ))}
                </div>

                {/* Question */}
                <div
                  style={{
                    backgroundColor: COLORS.bgCard,
                    borderRadius: 20,
                    padding: 20,
                    textAlign: 'center',
                    border: `2px solid ${COLORS.accentBorder}`,
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 6,
                    }}
                  >
                    What is the translation of:
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 24,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                    }}
                  >
                    Mi corazón
                  </p>
                </div>

                {/* Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  {['My friend', 'My heart', 'My love', 'My life'].map((option, i) => {
                    const isSelected = mcSelected === i;
                    const isCorrect = i === 1;
                    const showResult = mcShowCorrect && (isSelected || isCorrect);

                    return (
                      <div
                        key={option}
                        style={{
                          padding: '14px 16px',
                          borderRadius: 14,
                          border: `2px solid ${
                            showResult
                              ? isCorrect
                                ? '#10b981'
                                : isSelected
                                ? '#ef4444'
                                : COLORS.accentBorder
                              : isSelected
                              ? COLORS.accentPink
                              : COLORS.accentBorder
                          }`,
                          backgroundColor: showResult
                            ? isCorrect
                              ? '#dcfce7'
                              : isSelected
                              ? '#fee2e2'
                              : COLORS.bgCard
                            : isSelected
                            ? COLORS.accentLight
                            : COLORS.bgCard,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            fontWeight: 500,
                            color: COLORS.textPrimary,
                          }}
                        >
                          {option}
                        </span>
                        {showResult && isCorrect && <span style={{ fontSize: 16 }}>✓</span>}
                        {showResult && isSelected && !isCorrect && <span style={{ fontSize: 16 }}>✗</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* GAME 3: Type It */}
            {currentGame === 2 && (
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Progress */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: i <= 2 ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: i <= 2 ? COLORS.accentPink : COLORS.accentBorder,
                      }}
                    />
                  ))}
                </div>

                {/* Question */}
                <div
                  style={{
                    backgroundColor: COLORS.bgCard,
                    borderRadius: 20,
                    padding: 20,
                    textAlign: 'center',
                    border: `2px solid ${COLORS.accentBorder}`,
                    width: '100%',
                    marginBottom: 20,
                  }}
                >
                  <p
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 11,
                      color: COLORS.textMuted,
                      marginBottom: 6,
                    }}
                  >
                    Type in Spanish:
                  </p>
                  <p
                    style={{
                      fontFamily: FONTS.header,
                      fontSize: 22,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                    }}
                  >
                    I love you
                  </p>
                </div>

                {/* Input field */}
                <div
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 14,
                    border: `2px solid ${showTypeItCorrect ? '#10b981' : COLORS.accentBorder}`,
                    backgroundColor: showTypeItCorrect ? '#dcfce7' : COLORS.bgCard,
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 18,
                      fontWeight: 500,
                      color: showTypeItCorrect ? '#10b981' : COLORS.textPrimary,
                    }}
                  >
                    {typeItText.slice(0, typedChars)}
                    {!showTypeItCorrect && <span style={{ opacity: 0.3 }}>|</span>}
                  </span>
                </div>

                {/* Correct feedback */}
                {showTypeItCorrect && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 16px',
                      backgroundColor: '#dcfce7',
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>✓</span>
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 14,
                        fontWeight: 600,
                        color: '#10b981',
                      }}
                    >
                      Perfect!
                    </span>
                  </div>
                )}

                {/* Keyboard hint */}
                {!showTypeItCorrect && (
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(10, 1fr)',
                      gap: 3,
                      width: '100%',
                    }}
                  >
                    {'QWERTYUIOP'.split('').map((key) => (
                      <div
                        key={key}
                        style={{
                          height: 28,
                          borderRadius: 4,
                          backgroundColor: COLORS.bgPrimary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 600,
                          color: COLORS.textSecondary,
                        }}
                      >
                        {key}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </PhoneFrame>
      </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse on card flip and correct answers */}
      <BeatPulse startFrame={75} color={COLORS.accentPink} intensity={0.3} />
      <BeatPulse startFrame={GAME_1_END + 80} color="#10b981" intensity={0.4} />
      <BeatPulse startFrame={GAME_2_END + 100} color="#10b981" intensity={0.4} />
    </AbsoluteFill>
  );
};
