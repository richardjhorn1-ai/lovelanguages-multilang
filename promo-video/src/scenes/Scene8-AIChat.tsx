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

// Camera path - smooth movements with good zoom and upper focus
const CAMERA_PATH: CameraKeyframe[] = [
  { frame: 0, zoom: 1, focusX: 50, focusY: 50 },           // Start normal
  { frame: 40, zoom: 1, focusX: 50, focusY: 50 },          // Hold on caption
  { frame: 80, zoom: 1.9, focusX: 50, focusY: 38 },        // Zoom into chat upper area
  { frame: 160, zoom: 2.0, focusX: 50, focusY: 38 },       // Zoom on highlight card
  { frame: 230, zoom: 1.9, focusX: 50, focusY: 38 },       // Hold
  { frame: 290, zoom: 1, focusX: 50, focusY: 50 },         // Smooth zoom out
];

// Chat messages appearing progressively (10s = 300 frames)
const MESSAGES = [
  { type: 'user', text: 'How do I say "I miss you" in Spanish?', delay: 40 },
  { type: 'ai', text: 'Based on your vocabulary, you already know this one! 🎉', delay: 100 },
  { type: 'ai-highlight', word: 'Te extraño', translation: 'I miss you', delay: 140 },
  { type: 'ai', text: "You learned this as a gift from Alex last week. Want to practice using it in a sentence?", delay: 200 },
];

// Context badge items
const CONTEXT_ITEMS = [
  { icon: '📚', label: '42 words learned', delay: 15 },
  { icon: '💝', label: '12 gifted words', delay: 22 },
  { icon: '🎯', label: 'Conversational 2', delay: 29 },
];

export const Scene8AIChat: React.FC = () => {
  const frame = useCurrentFrame();

  // Phone animation
  const phoneScale = spring({
    frame,
    fps: FPS,
    config: { damping: 200 },
  });

  // Typing indicator
  const showTyping = (messageDelay: number) => {
    const typingStart = messageDelay - 20;
    const typingEnd = messageDelay;
    return frame > typingStart && frame < typingEnd;
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bgPrimary,
        overflow: 'hidden',
      }}
    >
      {/* Animated gradient background */}
      <AnimatedGradient style="aurora" />

      {/* Camera follows the conversation - zooms in on messages as they appear */}
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
          <FloatingHearts count={10} />

      {/* Caption - relationship-aware messaging */}
      <Caption
        text="AI That Knows Your Journey"
        subtext="The AI knows what you've learned together"
        startFrame={10}
        position="top"
        style="highlight"
      />

      {/* Phone with chat */}
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
            }}
          >
            {/* Chat header */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: COLORS.bgCard,
                borderBottom: `1px solid ${COLORS.accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: COLORS.accentPink,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                }}
              >
                🤖
              </div>
              <div>
                <p
                  style={{
                    fontFamily: FONTS.header,
                    fontSize: 15,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    margin: 0,
                  }}
                >
                  Spanish Tutor
                </p>
                <p
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 12,
                    color: COLORS.teal,
                    margin: 0,
                  }}
                >
                  ● Online
                </p>
              </div>
            </div>

            {/* Context awareness badges */}
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: COLORS.accentLight,
                display: 'flex',
                gap: 8,
                borderBottom: `1px solid ${COLORS.accentBorder}`,
                flexWrap: 'wrap',
              }}
            >
              {CONTEXT_ITEMS.map((item, i) => {
                const badgeOpacity = interpolate(
                  frame,
                  [item.delay, item.delay + 10],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 12,
                      opacity: badgeOpacity,
                      border: `1px solid ${COLORS.accentBorder}`,
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{item.icon}</span>
                    <span
                      style={{
                        fontFamily: FONTS.body,
                        fontSize: 11,
                        fontWeight: 600,
                        color: COLORS.textSecondary,
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat messages */}
            <div
              style={{
                flex: 1,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                overflowY: 'auto',
              }}
            >
              {MESSAGES.map((msg, i) => {
                const messageOpacity = interpolate(
                  frame,
                  [msg.delay, msg.delay + 15],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                );

                const messageScale = spring({
                  frame: frame - msg.delay,
                  fps: FPS,
                  config: { damping: 200 },
                });

                if (messageOpacity <= 0) return null;

                // User message
                if (msg.type === 'user') {
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: 'flex-end',
                        maxWidth: '80%',
                        opacity: messageOpacity,
                        transform: `scale(${Math.max(0, messageScale)})`,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: COLORS.accentPink,
                          borderRadius: '16px 16px 4px 16px',
                          padding: '10px 14px',
                        }}
                      >
                        <p
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 14,
                            color: 'white',
                            margin: 0,
                          }}
                        >
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                }

                // AI highlight message (word card)
                if (msg.type === 'ai-highlight') {
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: 'flex-start',
                        maxWidth: '85%',
                        opacity: messageOpacity,
                        transform: `scale(${Math.max(0, messageScale)})`,
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: COLORS.bgCard,
                          borderRadius: 16,
                          padding: 14,
                          border: `2px solid ${COLORS.accentPink}`,
                          boxShadow: `0 4px 16px ${COLORS.accentPink}20`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>💝</span>
                          <span
                            style={{
                              fontFamily: FONTS.body,
                              fontSize: 11,
                              fontWeight: 700,
                              color: COLORS.accentPink,
                              textTransform: 'uppercase',
                            }}
                          >
                            From your Love Log
                          </span>
                        </div>
                        <p
                          style={{
                            fontFamily: FONTS.header,
                            fontSize: 26,
                            fontWeight: 700,
                            color: COLORS.accentPink,
                            margin: 0,
                          }}
                        >
                          {msg.word}
                        </p>
                        <p
                          style={{
                            fontFamily: FONTS.body,
                            fontSize: 15,
                            color: COLORS.textSecondary,
                            margin: '4px 0 0 0',
                          }}
                        >
                          {msg.translation}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Regular AI message
                return (
                  <div
                    key={i}
                    style={{
                      alignSelf: 'flex-start',
                      maxWidth: '80%',
                      display: 'flex',
                      gap: 8,
                      opacity: messageOpacity,
                      transform: `scale(${Math.max(0, messageScale)})`,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: COLORS.tealLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>
                    <div
                      style={{
                        backgroundColor: COLORS.bgCard,
                        borderRadius: '16px 16px 16px 4px',
                        padding: '10px 14px',
                        border: `1px solid ${COLORS.accentBorder}`,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: FONTS.body,
                          fontSize: 14,
                          color: COLORS.textPrimary,
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {showTyping(MESSAGES[1].delay) && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      backgroundColor: COLORS.tealLight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                    }}
                  >
                    🤖
                  </div>
                  <div
                    style={{
                      backgroundColor: COLORS.bgCard,
                      borderRadius: 16,
                      padding: '10px 14px',
                      border: `1px solid ${COLORS.accentBorder}`,
                      display: 'flex',
                      gap: 4,
                    }}
                  >
                    {[0, 1, 2].map((dot) => (
                      <div
                        key={dot}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: COLORS.textMuted,
                          opacity: ((frame + dot * 5) % 20) > 10 ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: 12,
                backgroundColor: COLORS.bgCard,
                borderTop: `1px solid ${COLORS.accentBorder}`,
                display: 'flex',
                gap: 10,
              }}
            >
              <div
                style={{
                  flex: 1,
                  backgroundColor: COLORS.bgPrimary,
                  borderRadius: 20,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.body,
                    fontSize: 14,
                    color: COLORS.textMuted,
                  }}
                >
                  Type a message...
                </span>
              </div>
              <button
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  backgroundColor: COLORS.accentPink,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 16 }}>🎤</span>
              </button>
            </div>
          </div>
        </PhoneFrame>
      </div>
        </AbsoluteFill>
      </CameraZoom>

      {/* Beat pulse when AI reveals the word */}
      <BeatPulse startFrame={140} color={COLORS.accentPink} intensity={0.5} />
    </AbsoluteFill>
  );
};
