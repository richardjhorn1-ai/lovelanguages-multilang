import { AbsoluteFill, useCurrentFrame, spring, interpolate, Sequence } from 'remotion';
import { COLORS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { FPS } from '../constants/timing';
import { FloatingHearts } from '../components/FloatingHearts';
import { PhoneFrame } from '../components/PhoneFrame';
import { Caption } from '../components/Caption';
import { AnimatedGradient } from '../components/AnimatedGradient';
import { CameraZoom, CameraKeyframe } from '../components/CameraZoom';
import { BeatPulse } from '../components/BeatPulse';
import { SparkleBurst } from '../components/Sparkle';

// Camera path
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 40, zoom: 1, focusX: 50, focusY: 50 },
  { frame: 80, zoom: 1.8, focusX: 50, focusY: 40 },
  { frame: 200, zoom: 1.9, focusX: 50, focusY: 42 },
  { frame: 280, zoom: 2.0, focusX: 50, focusY: 45 },
  { frame: 380, zoom: 1, focusX: 50, focusY: 50 },
];

// Transcription lines appearing over time
const TRANSCRIPTION_LINES = [
  { text: 'Babcia opowiadała nam historię...', delay: 70 },
  { text: 'Kiedy byłam małą dziewczynką...', delay: 100 },
  { text: 'To było piękne dzieciństwo.', delay: 130 },
  { text: 'Pamiętam jak zbieraliśmy grzyby...', delay: 160 },
];

// New words detected
const NEW_WORDS = [
  { polish: 'babcia', english: 'grandma', delay: 0 },
  { polish: 'opowieść', english: 'story', delay: 8 },
  { polish: 'dzieciństwo', english: 'childhood', delay: 16 },
  { polish: 'grzyby', english: 'mushrooms', delay: 24 },
  { polish: 'pamiętam', english: 'I remember', delay: 32 },
];

// Phase timing
const RECORDING_END = 190;
const PROCESSING_START = 190;
const PROCESSING_END = 230;
const RESULTS_START = 230;

export const Scene9ListenMode: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone animation
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Recording phases
  const isRecording = frame < RECORDING_END;
  const isProcessing = frame >= PROCESSING_START && frame < PROCESSING_END;
  const showResults = frame >= RESULTS_START;

  // Waveform animation (only during recording)
  const waveformBars = Array.from({ length: 20 }, (_, i) => {
    const offset = i * 7;
    const height = isRecording
      ? 8 + Math.sin((frame + offset) * 0.3) * 12 + Math.random() * 4
      : 4;
    return height;
  });

  // Recording timer
  const recordingSeconds = Math.min(Math.floor(frame / 30), Math.floor(RECORDING_END / 30));
  const recordingTime = `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`;

  // Results modal animation
  const resultsSlide = spring({
    frame: frame - RESULTS_START,
    fps: FPS,
    config: { damping: 15, stiffness: 100 },
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

      <CameraZoom style="path" keyframes={CAMERA_PATH}>
        <AbsoluteFill
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Floating hearts background */}
          <FloatingHearts count={8} />

          {/* Caption */}
          <Caption
            text="Listen Mode"
            subtext="Capture real conversations around you"
            startFrame={10}
            position="top"
          />

          {/* Results caption */}
          {showResults && (
            <Caption
              text="Words Saved"
              subtext="Review and learn what you heard"
              startFrame={RESULTS_START + 40}
              position="top"
            />
          )}

          {/* Phone */}
          <div
            style={{
              transform: `scale(${Math.max(0, phoneScale)})`,
            }}
          >
            <PhoneFrame scale={1.4}>
              <div
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: COLORS.bgPrimary,
                  position: 'relative',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 16px',
                    backgroundColor: COLORS.bgCard,
                    borderBottom: `1px solid ${COLORS.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        backgroundColor: isRecording ? '#fee2e2' : COLORS.tealLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                      }}
                    >
                      {isRecording ? '🎙️' : '✓'}
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: FONTS.header,
                          fontSize: 16,
                          fontWeight: 700,
                          color: COLORS.textPrimary,
                          margin: 0,
                        }}
                      >
                        Listen Mode
                      </p>
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 12,
                          color: isRecording ? '#ef4444' : COLORS.teal,
                          margin: 0,
                          fontWeight: 600,
                        }}
                      >
                        {isRecording ? '● Recording' : isProcessing ? 'Processing...' : 'Complete'}
                      </p>
                    </div>
                  </div>

                  {/* Recording timer */}
                  {isRecording && (
                    <div
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fee2e2',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#ef4444',
                          opacity: frame % 30 > 15 ? 1 : 0.5,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          fontWeight: 600,
                          color: '#ef4444',
                        }}
                      >
                        {recordingTime}
                      </span>
                    </div>
                  )}
                </div>

                {/* Language detected badge */}
                <div
                  style={{
                    padding: '10px 16px',
                    backgroundColor: COLORS.accentLight,
                    borderBottom: `1px solid ${COLORS.accentBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 16 }}>🇵🇱</span>
                  <span
                    style={{
                      fontFamily: FONTS.body,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.textSecondary,
                    }}
                  >
                    Polish detected
                  </span>
                </div>

                {/* Waveform visualization */}
                {(isRecording || isProcessing) && (
                  <div
                    style={{
                      padding: '20px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 3,
                      height: 60,
                    }}
                  >
                    {waveformBars.map((height, i) => (
                      <div
                        key={i}
                        style={{
                          width: 4,
                          height: isProcessing ? 4 : height,
                          backgroundColor: isRecording ? COLORS.accentPink : COLORS.textMuted,
                          borderRadius: 2,
                          transition: 'height 0.1s ease',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Live transcription */}
                {!showResults && (
                  <div
                    style={{
                      flex: 1,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    <p
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        margin: 0,
                      }}
                    >
                      Live Transcription
                    </p>

                    {TRANSCRIPTION_LINES.map((line, i) => {
                      const lineOpacity = interpolate(
                        frame,
                        [line.delay, line.delay + 15],
                        [0, 1],
                        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                      );

                      if (lineOpacity <= 0) return null;

                      return (
                        <div
                          key={i}
                          style={{
                            opacity: lineOpacity,
                            padding: '12px 14px',
                            backgroundColor: COLORS.bgCard,
                            borderRadius: 12,
                            borderLeft: `3px solid ${COLORS.accentPink}`,
                          }}
                        >
                          <p
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: 15,
                              color: COLORS.textPrimary,
                              margin: 0,
                              lineHeight: 1.4,
                            }}
                          >
                            {line.text}
                          </p>
                        </div>
                      );
                    })}

                    {/* Processing indicator */}
                    {isProcessing && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          padding: 20,
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            border: `3px solid ${COLORS.accentBorder}`,
                            borderTopColor: COLORS.accentPink,
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                        <span
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: COLORS.textSecondary,
                          }}
                        >
                          Analyzing conversation...
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Stop button */}
                {isRecording && frame > 60 && (
                  <div style={{ padding: 16 }}>
                    <button
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: 16,
                        fontFamily: FONTS.body,
                        fontSize: 16,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      ⏹ Stop Recording
                    </button>
                  </div>
                )}

                {/* Results modal */}
                {showResults && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      display: 'flex',
                      alignItems: 'flex-end',
                      padding: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        backgroundColor: COLORS.bgCard,
                        borderRadius: '24px 24px 0 0',
                        padding: 20,
                        transform: `translateY(${(1 - Math.max(0, resultsSlide)) * 100}%)`,
                        maxHeight: '85%',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Modal header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          marginBottom: 16,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: '#dcfce7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                          }}
                        >
                          ✓
                        </div>
                        <div>
                          <p
                            style={{
                              fontFamily: FONTS.header,
                              fontSize: 20,
                              fontWeight: 700,
                              color: COLORS.textPrimary,
                              margin: 0,
                            }}
                          >
                            5 New Words Detected
                          </p>
                          <p
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: 13,
                              color: COLORS.textSecondary,
                              margin: 0,
                            }}
                          >
                            Saved to your Love Log
                          </p>
                        </div>
                      </div>

                      {/* Word list */}
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        {NEW_WORDS.map((word, i) => {
                          const wordOpacity = interpolate(
                            frame,
                            [RESULTS_START + 20 + word.delay, RESULTS_START + 30 + word.delay],
                            [0, 1],
                            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                          );

                          const wordScale = spring({
                            frame: frame - (RESULTS_START + 20 + word.delay),
                            fps: FPS,
                            config: { damping: 12, stiffness: 200 },
                          });

                          return (
                            <div
                              key={i}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '12px 14px',
                                backgroundColor: COLORS.bgPrimary,
                                borderRadius: 12,
                                border: `1px solid ${COLORS.accentBorder}`,
                                opacity: wordOpacity,
                                transform: `scale(${Math.max(0, wordScale)})`,
                              }}
                            >
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 8,
                                  backgroundColor: '#dcfce7',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 14,
                                  color: '#10b981',
                                }}
                              >
                                ✓
                              </div>
                              <div style={{ flex: 1 }}>
                                <p
                                  style={{
                                    fontFamily: FONTS.header,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: COLORS.textPrimary,
                                    margin: 0,
                                  }}
                                >
                                  {word.polish}
                                </p>
                                <p
                                  style={{
                                    fontFamily: FONTS.body,
                                    fontSize: 13,
                                    color: COLORS.textSecondary,
                                    margin: 0,
                                  }}
                                >
                                  {word.english}
                                </p>
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: COLORS.textMuted,
                                }}
                              >
                                +10 XP
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Practice button */}
                      <Sequence from={RESULTS_START + 80}>
                        <button
                          style={{
                            marginTop: 16,
                            width: '100%',
                            padding: '14px 20px',
                            backgroundColor: COLORS.accentPink,
                            color: 'white',
                            border: 'none',
                            borderRadius: 16,
                            fontFamily: FONTS.body,
                            fontSize: 16,
                            fontWeight: 600,
                          }}
                        >
                          Practice These Words
                        </button>
                      </Sequence>
                    </div>
                  </div>
                )}
              </div>
            </PhoneFrame>
          </div>

          {/* Sparkles when results appear */}
          <SparkleBurst startFrame={RESULTS_START + 10} x={30} y={45} count={6} color="#10b981" />
          <SparkleBurst startFrame={RESULTS_START + 15} x={70} y={40} count={6} color={COLORS.accentPink} />
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse when results appear */}
      <BeatPulse startFrame={RESULTS_START} color="#10b981" intensity={0.5} />
    </AbsoluteFill>
  );
};
